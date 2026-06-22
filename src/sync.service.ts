import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { RequestedAccountUpdate, Utils } from "@cmts-dev/carmentis-sdk-core";
import { CometbftApiService } from "./cometbft-api.service";
import { StateCommitService } from "./state-commit.service";
import { NodeStatusService } from "./node-status.service";
import { QueryService } from "./query.service";
import { ChainEntity } from "./entities/chain.entity";
import { BlockEntity } from "./entities/block.entity";
import { ValidatorNodeEntity } from "./entities/validator-node.entity";
import { VotingPowerEntity } from "./entities/voting-power.entity";
import { SyncStateService } from "./sync-state.service";
import { AccountEntity } from "./entities/account.entity";
import { DataSource, EntityManager } from "typeorm";

const HEALTHY_SYNC_DELAY = 1000;
const DEGRADED_SYNC_DELAY = 10000;

@Injectable()
export class SyncService implements OnModuleInit {
    private readonly logger = new Logger();
    private syncDelay = HEALTHY_SYNC_DELAY;

    constructor(
        private readonly cometbft: CometbftApiService,
        private readonly stateCommitService: StateCommitService,
        private readonly syncState: SyncStateService,
        private readonly queryService: QueryService,
        private readonly nodeStatusService: NodeStatusService,
        private readonly dataSource: DataSource,
    ) {}

    async onModuleInit() {
        await this.nodeStatusService.updateAll();
        this.scheduleNextSynchronization();
    }

    scheduleNextSynchronization() {
        setTimeout(
            () =>
                this.synchronize()
                    .then(() => {
                        if (this.syncDelay !== HEALTHY_SYNC_DELAY) {
                            this.logger.log(`Switching to healthy sync delay (${HEALTHY_SYNC_DELAY}ms)`);
                            this.syncDelay = HEALTHY_SYNC_DELAY;
                        }
                    })
                    .catch((err) => {
                        this.logger.error(`Synchronization error: ${err}`);
                        if (this.syncDelay !== DEGRADED_SYNC_DELAY) {
                            this.logger.warn(`Switching to degraded sync delay (${DEGRADED_SYNC_DELAY}ms)`);
                            this.syncDelay = DEGRADED_SYNC_DELAY;
                        }
                        this.cometbft.changeNode();
                    }),
            this.syncDelay,
        );
    }

    async synchronize() {
        try {
            this.logger.log(`Starting sync process`);

            const { knownHeight, latestBlockHeight } = await this.getSyncStatus();
            this.logger.log(
                `Known height = ${knownHeight}, latest block height = ${latestBlockHeight}`,
            );

            for (
                let height = knownHeight + 1;
                height <= latestBlockHeight;
                height++
            ) {
                await this.dataSource.transaction(async (manager) => {
                    await this.syncBlock(manager, height);
                });
                this.syncState.setHeights(height, latestBlockHeight);
            }
        } finally {
            this.scheduleNextSynchronization();
        }
    }

    async syncBlock(manager: EntityManager, height: number) {
        this.logger.log(`Fetching block ${height}`);
        const blockData = await this.cometbft.getBlockAtHeight(height);
        if (blockData !== null) {
            await this.stateCommitService.commitBlock(
                manager,
                height,
                blockData,
            );
            const blockModifiedAccounts =
                await this.cometbft.getBlockModifiedAccountsAtHeight(height);
            const modifiedAccounts = blockModifiedAccounts.modifiedAccounts;
            await this.syncModifiedAccounts(manager, modifiedAccounts);
            await this.syncMicroblocks(manager, height);
            await this.syncVotingPowers(
                manager,
                height,
                blockData.commit?.header.time.getTime() ?? 0,
            );
        }
    }

    async syncModifiedAccounts(
        manager: EntityManager,
        modifiedAccounts: Uint8Array[],
    ) {
        this.logger.log(
            `Fetching ${modifiedAccounts.length} modified accounts`,
        );
        const requestedAccountUpdates: RequestedAccountUpdate[] = [];
        for (const modifiedAccount of modifiedAccounts) {
            let lastKnownHistoryHash = new Uint8Array(32);
            const account = await manager.findOne(AccountEntity, {
                where: { id: Utils.binaryToHexa(modifiedAccount) },
            });
            if (account !== null && account.lastHistoryHash !== "") {
                lastKnownHistoryHash = Utils.binaryFromHexa(
                    account.lastHistoryHash,
                );
            }
            requestedAccountUpdates.push({
                accountHash: modifiedAccount,
                lastKnownHistoryHash,
            });
        }
        const accountUpdates = await this.cometbft.getAccountUpdates(
            requestedAccountUpdates,
        );
        await this.stateCommitService.commitAccountUpdates(
            manager,
            accountUpdates,
        );
    }

    async syncMicroblocks(manager: EntityManager, height: number) {
        for (let partIndex = 0; ; partIndex++) {
            const blockContent = await this.cometbft.getRawBlockContentAtHeight(
                height,
                partIndex,
            );
            const serializedMicroblocks = blockContent.serializedMicroblocks;
            const count = serializedMicroblocks.length;
            const pNdx = partIndex + 1;
            const nParts = blockContent.numberOfParts;
            this.logger.log(
                `Fetched ${count} microblock(s) for block ${height} (part ${pNdx} of ${nParts})`,
            );
            for (const serializedMicroblock of serializedMicroblocks) {
                await this.stateCommitService.commitMicroblock(
                    manager,
                    height,
                    serializedMicroblock,
                );
            }
            if (partIndex >= blockContent.numberOfParts - 1) {
                break;
            }
        }
    }

    async syncVotingPowers(
        manager: EntityManager,
        height: number,
        blockTimestamp: number,
    ) {
        // get the known voting powers from the DB
        const votingPowers = await this.queryService.getCurrentVotingPowers();

        // get the validators at the requested height from Comet
        const validators = await this.cometbft.getValidators(height);
        const definedValidators = new Set();

        // update the DB according to the list of validators returned by Comet
        for (const validator of validators) {
            const address = Utils.binaryToHexa(validator.address);
            const votingPower = Number(validator.votingPower);
            const node = await manager.findOne(ValidatorNodeEntity, {
                where: { address },
            });
            if (node === null) {
                this.logger.warn(`node with address '${address}' not found`);
                continue;
            }
            const nodeId = node.virtualBlockchainId;
            definedValidators.add(nodeId);
            const previousVotingPower = votingPowers.find(
                (vp) => vp.nodeId === nodeId,
            );
            if (
                previousVotingPower === undefined ||
                previousVotingPower.votingPower !== votingPower
            ) {
                this.logger.log(
                    `setting voting power of node ${nodeId} to ${votingPower}`,
                );
                await manager.save(ValidatorNodeEntity, {
                    virtualBlockchainId: nodeId,
                    currentVotingPower: votingPower,
                });
                await manager.save(VotingPowerEntity, {
                    nodeId,
                    height,
                    timestamp: blockTimestamp,
                    votingPower,
                });
            }
        }

        // update former known validators which are not in the list returned by Comet anymore
        // but still have a voting power greater than 0 in the DB
        for (const vp of votingPowers) {
            if (!definedValidators.has(vp.nodeId) && vp.votingPower !== 0) {
                this.logger.log(
                    `setting voting power of node ${vp.nodeId} to 0`,
                );
                await manager.save(VotingPowerEntity, {
                    nodeId: vp.nodeId,
                    height,
                    timestamp: blockTimestamp,
                    votingPower: 0,
                });
            }
        }
    }

    async getSyncStatus() {
        // get the current known status of the chain
        const knownStatus = await ChainEntity.findOneBy({ id: 1 });

        // get the known height
        const lastKnownBlock = await BlockEntity.find({
            order: {
                height: "DESC",
            },
            take: 1,
        });
        const knownHeight =
            lastKnownBlock.length == 0 ? 0 : lastKnownBlock[0].height;

        // get the actual chain status from the node
        const actualStatus = await this.cometbft.getChainStatus();
        if (actualStatus === null) {
            throw new Error(`Cannot get the chain status`);
        }
        const rawEarliestBlockHash = actualStatus.syncInfo.earliestBlockHash;
        if (rawEarliestBlockHash === undefined) {
            throw new Error(`Cannot get the earliest block hash`);
        }
        const earliestBlockHash = Utils.binaryToHexa(rawEarliestBlockHash);
        const latestBlockHeight = actualStatus.syncInfo.latestBlockHeight;

        if (knownStatus === null) {
            await ChainEntity.save({
                id: 1,
                earliestBlockHash,
                network: actualStatus.nodeInfo.network,
                version: actualStatus.nodeInfo.version,
            });
        } else {
            if (earliestBlockHash !== knownStatus.earliestBlockHash) {
                throw new Error(
                    `Earliest block hash mismatch detected. Was the chain reset?\n` +
                        `If so, please delete 'db.sqlite' and restart the indexer.`,
                );
            }
        }
        return { knownHeight, latestBlockHeight };
    }
}
