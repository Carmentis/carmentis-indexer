import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { RequestedAccountUpdate, Utils } from "@cmts-dev/carmentis-sdk-core";
import { CometbftApiService } from "./cometbft-api.service";
import { StateCommitService } from "./state-commit.service";
import { ChainEntity } from "./entities/chain.entity";
import { BlockEntity } from "./entities/block.entity";

@Injectable()
export class SyncService implements OnModuleInit {
    private readonly logger = new Logger();

    constructor(
        private readonly cometbft: CometbftApiService,
        private readonly stateCommitService: StateCommitService,
    ) {}

    async onModuleInit() {
        await this.synchronize();
    }

    async synchronize() {
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
            await this.syncBlock(height);
        }
        setTimeout(this.synchronize.bind(this), 1000);
    }

    async syncBlock(height: number) {
        this.logger.log(`Fetching block ${height}`);
        const blockData = await this.cometbft.getBlockAtHeight(height);
        if (blockData !== null) {
            await this.stateCommitService.commitBlock(height, blockData);
            const blockModifiedAccounts =
                await this.cometbft.getBlockModifiedAccountsAtHeight(height);
            const modifiedAccounts = blockModifiedAccounts.modifiedAccounts;
            await this.syncModifiedAccounts(modifiedAccounts);
            await this.syncMicroblocks(height);
        }
    }

    async syncModifiedAccounts(modifiedAccounts: Uint8Array[]) {
        this.logger.log(
            `Fetching ${modifiedAccounts.length} modified accounts`,
        );
        const requestedAccountUpdates: RequestedAccountUpdate[] = [];
        for (const modifiedAccount of modifiedAccounts) {
            requestedAccountUpdates.push({
                accountHash: modifiedAccount,
                lastKnownHistoryHash: new Uint8Array(32),
            });
        }
        const accountUpdates = await this.cometbft.getAccountUpdates(
            requestedAccountUpdates,
        );
        await this.stateCommitService.commitAccountUpdates(accountUpdates);
    }

    async syncMicroblocks(height: number) {
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
            console.log(Utils.jsonPrettify(serializedMicroblocks));
            for (const serializedMicroblock of serializedMicroblocks) {
                await this.stateCommitService.commitMicroblock(
                    height,
                    serializedMicroblock,
                );
            }
            if (partIndex >= blockContent.numberOfParts - 1) {
                break;
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
        const knownHeight = lastKnownBlock.length == 0 ? 0 : lastKnownBlock[0].height;

        // get the actual chain status from the node
        const actualStatus = await this.cometbft.getChainStatus();
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
                    `If so, please delete 'db.sqlite' and restart the indexer.`
                );
            }
        }
        return { knownHeight, latestBlockHeight };
    }
}
