import { Injectable, Logger } from "@nestjs/common";
import {
    Microblock,
    AccountUpdatesAbciResponse,
    VirtualBlockchainType,
    Utils,
    BlockchainUtils,
    Section,
    SectionType,
    Lock,
    LockType,
    EscrowParameters,
    VestingParameters,
    NodeStakingParameters,
    EncoderFactory,
    CometBFTPublicKeyConverter,
    CryptoSchemeFactory,
    CryptoEncoderFactory,
} from "@cmts-dev/carmentis-sdk-core";
import { BlockEntity, BlockSignatureEntity } from "./entities/block.entity";
import { ValidatorNodeEntity } from "./entities/validator-node.entity";
import { OrganizationEntity } from "./entities/organization.entity";
import { ApplicationEntity } from "./entities/application.entity";
import { VirtualBlockchainEntity } from "./entities/virtual-blockchain.entity";
import {
    AccountEntity,
    AccountHistoryEntity,
    EscrowLockEntity,
    VestingLockEntity,
    StakingLockEntity,
} from "./entities/account.entity";
import { MicroblockEntity } from "./entities/microblock.entity";
import { MicroblockStatsEntity } from "./entities/microblock-stats.entity";
import { ValidatorStatsEntity } from "./entities/validator-stats.entity";
import { BlockData } from "./cometbft-api.service";
import { MicroblockStorageService } from "./microblock-storage.service";
import { NodeStatusService } from "./node-status.service";
import { CometbftApiService } from "./cometbft-api.service";
import { DeepPartial, EntityManager } from 'typeorm';

@Injectable()
export class StateCommitService {
    private readonly logger = new Logger();

    constructor(
        private readonly microblockStorageService: MicroblockStorageService,
        private readonly nodeStatusService: NodeStatusService,
        private readonly cometbft: CometbftApiService,
    ) {}

    static getHourBucketTimestamp(date: Date) {
        return Date.UTC(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate(),
            date.getUTCHours(),
        );
    }

    async commitBlock(
        manager: EntityManager,
        height: number,
        block: BlockData,
    ) {
        this.logger.log(`Committing block ${height}`);
        const commitData = block.commit;

        if (commitData == null) {
            if (height !== 1) {
                throw new Error(`block.commit is null and this is not the genesis block`);
            }
            const nullHash = Utils.binaryToHexa(Utils.getNullHash());
            const genesis = await this.cometbft.getGenesis();

            await manager.save(BlockEntity, {
                height: 1,
                hash: nullHash,
                blockVersion: 0,
                appVersion: 0,
                chainId: "",
                milliseconds: genesis?.genesisTime?.getTime() ?? 0,
                nanoseconds: 0,
                partsTotal: 0,
                partsHash: nullHash,
                lastCommitHash: nullHash,
                dataHash: nullHash,
                validatorsHash: nullHash,
                nextValidatorsHash: nullHash,
                consensusHash: nullHash,
                appVbRadixHash: nullHash,
                appTokenRadixHash: nullHash,
                appStorageHash: nullHash,
                appHash: nullHash,
                lastResultsHash: nullHash,
                evidenceHash: nullHash,
                proposerAddress: nullHash,
                microblocks: 0,
                feesInAtomics: 0,
            });
        } else {
            const { header, commit } = commitData;

            await manager.save(BlockEntity, {
                height,
                hash: Utils.binaryToHexa(commit.blockId.hash),
                blockVersion: header.version.block,
                appVersion: header.version.app,
                chainId: header.chainId,
                milliseconds: header.time.getTime(),
                nanoseconds: header.time.nanoseconds || 0,
                partsTotal: commit.blockId.parts.total,
                partsHash: Utils.binaryToHexa(commit.blockId.parts.hash),
                lastCommitHash: Utils.binaryToHexa(header.lastCommitHash),
                dataHash: Utils.binaryToHexa(header.dataHash),
                validatorsHash: Utils.binaryToHexa(header.validatorsHash),
                nextValidatorsHash: Utils.binaryToHexa(
                    header.nextValidatorsHash,
                ),
                consensusHash: Utils.binaryToHexa(header.consensusHash),
                appVbRadixHash: Utils.binaryToHexa(block.appVbRadixHash),
                appTokenRadixHash: Utils.binaryToHexa(block.appTokenRadixHash),
                appStorageHash: Utils.binaryToHexa(block.appStorageHash),
                appHash: Utils.binaryToHexa(header.appHash),
                lastResultsHash: Utils.binaryToHexa(header.lastResultsHash),
                evidenceHash: Utils.binaryToHexa(header.evidenceHash),
                proposerAddress: Utils.binaryToHexa(header.proposerAddress),
                microblocks: 0,
                feesInAtomics: 0,
            });

            const date = new Date(header.time.getTime());
            await this.updateValidatorStats(manager, date, 'proposedBlocks', header.proposerAddress);

            let index = 0;
            for (const sig of commit.signatures) {
                await manager.save(BlockSignatureEntity, {
                    height,
                    index,
                    blockIdFlag: sig.blockIdFlag,
                    validatorAddress: Utils.binaryToHexa(
                        sig?.validatorAddress ?? Utils.getNullHash(),
                    ),
                    milliseconds: sig?.timestamp?.getTime() ?? 0,
                    nanoseconds: sig?.timestamp?.nanoseconds ?? 0,
                    signature: Utils.binaryToHexa(
                        sig?.signature ?? Utils.getNullHash(),
                    ),
                });
                // BLOCK_ID_FLAG_COMMIT
                if (sig.blockIdFlag === 2) {
                    await this.updateValidatorStats(manager, date, 'signedBlocks', sig?.validatorAddress);
                }
                index++;
            }
        }
    }

    async commitBlockMicroblocksAndFees(
        manager: EntityManager,
        height: number,
        microblocks: number,
        feesInAtomics: number,
    ) {
        this.logger.log(`Updating block ${height} with microblocks=${microblocks} and fees=${feesInAtomics}`);

        await manager.save(BlockEntity, {
            height,
            microblocks,
            feesInAtomics,
        });
    }

    async updateValidatorStats(manager: EntityManager, date: Date, stat: string, nodeAddress: Uint8Array | undefined) {
        if (nodeAddress === undefined) {
            return;
        }
        const record = await manager.find(ValidatorNodeEntity, { where: { address: Utils.binaryToHexa(nodeAddress) }});
        if (record.length !== 1) {
            return;
        }
        const hourBucketTimestamp = StateCommitService.getHourBucketTimestamp(date);
        const where = { hourBucketTimestamp, nodeId: record[0].virtualBlockchainId };
        const existing = await manager.findOneBy(ValidatorStatsEntity, where);

        if (!existing) {
            await manager.save(ValidatorStatsEntity, { ...where, signedBlocks: 0, proposedBlocks: 0 });
        }
        await manager.increment(ValidatorStatsEntity, where, stat, 1);
    }

    async commitAccountUpdates(
        manager: EntityManager,
        accountUpdates: AccountUpdatesAbciResponse,
    ) {
        this.logger.log(
            `Committing ${accountUpdates.list.length} account updates`,
        );
        for (const update of accountUpdates.list) {
            // 1) save AccountEntity
            const accountId = Utils.binaryToHexa(update.accountHash);
            const lastHistoryHash = Utils.binaryToHexa(
                update.currentState.lastHistoryHash,
            );
            await manager.save(AccountEntity, {
                id: accountId,
                height: update.currentState.height,
                balance: update.currentState.balance,
                lastHistoryHash,
            });
            // 2) save AccountHistoryEntity
            for (const historyUpdate of update.historyUpdate) {
                const encodedChainReference = BlockchainUtils.encodeChainReference(historyUpdate.chainReference);
                const chainReference = Buffer.from(encodedChainReference).toString("base64");

                await manager.save(AccountHistoryEntity, {
                    accountId,
                    height: historyUpdate.height,
                    type: historyUpdate.type,
                    timestamp: historyUpdate.timestamp,
                    linkedAccountId: Utils.binaryToHexa(
                        historyUpdate.linkedAccount,
                    ),
                    amount: historyUpdate.amount,
                    chainReference,
                    publicReference: historyUpdate.publicReference,
                    privateReference: historyUpdate.privateReference,
                });
            }
            // 3) save EscrowLockEntity, VestingLockEntity, StakingLockEntity
            await manager.delete(EscrowLockEntity, { accountId });
            await manager.delete(VestingLockEntity, { accountId });
            await manager.delete(StakingLockEntity, { accountId });
            for (const lock of update.currentState.locks as Lock[]) {
                switch (lock.type) {
                    case LockType.Escrow: {
                        await this.commitEscrowLock(
                            manager,
                            accountId,
                            lock.lockedAmountInAtomics,
                            lock.parameters,
                        );
                        break;
                    }
                    case LockType.Vesting: {
                        await this.commitVestingLock(
                            manager,
                            accountId,
                            lock.lockedAmountInAtomics,
                            lock.parameters,
                        );
                        break;
                    }
                    case LockType.NodeStaking: {
                        await this.commitStakingLock(
                            manager,
                            accountId,
                            lock.lockedAmountInAtomics,
                            lock.parameters,
                        );
                        break;
                    }
                }
            }
        }
    }

    async commitEscrowLock(
        manager: EntityManager,
        accountId: string,
        amount: number,
        params: EscrowParameters,
    ) {
        await manager.save(EscrowLockEntity, {
            accountId,
            amount,
            escrowIdentifier: Utils.binaryToHexa(params.escrowIdentifier),
            fundEmitterAccountId: Utils.binaryToHexa(
                params.fundEmitterAccountId,
            ),
            transferAuthorizerAccountId: Utils.binaryToHexa(
                params.transferAuthorizerAccountId,
            ),
            startTimestamp: params.startTimestamp,
            durationDays: params.durationDays,
        });
    }

    async commitVestingLock(
        manager: EntityManager,
        accountId: string,
        amount: number,
        params: VestingParameters,
    ) {
        await manager.save(VestingLockEntity, {
            accountId,
            amount,
            initialVestedAmountInAtomics: params.initialVestedAmountInAtomics,
            cliffStartTimestamp: params.cliffStartTimestamp,
            cliffDurationDays: params.vestingDurationDays,
            vestingDurationDays: params.vestingDurationDays,
        });
    }

    async commitStakingLock(
        manager: EntityManager,
        accountId: string,
        amount: number,
        params: NodeStakingParameters,
    ) {
        await manager.save(StakingLockEntity, {
            accountId,
            amount,
            validatorNodeId: Utils.binaryToHexa(params.validatorNodeId),
            plannedUnlockAmountInAtomics: params.plannedUnlockAmountInAtomics,
            plannedUnlockTimestamp: params.plannedSlashingTimestamp,
            slashed: params.slashed,
            plannedSlashingAmountInAtomics: params.plannedUnlockAmountInAtomics,
            plannedSlashingTimestamp: params.plannedSlashingTimestamp,
        });
    }

    async commitMicroblock(
        manager: EntityManager,
        blockHeight: number,
        serializedMicroblock: Uint8Array,
    ) {
        const microblock = Microblock.loadFromSerializedMicroblock(serializedMicroblock);
        const header = microblock.getHeader();
        const gas = microblock.getGas();
        const gasPrice = microblock.getGasPrice().getAmountAsAtomic();
        const feesInAtomics = gas * gasPrice;
        const sections = microblock.getAllSections();
        const hash = Utils.binaryToHexa(microblock.getHash().toBytes());
        const type: VirtualBlockchainType = header.microblockType;
        const timestamp = microblock.getTimestamp();
        const height = header.height;
        let virtualBlockchainId: string;

        if (height == 1) {
            virtualBlockchainId = hash;
        } else {
            const previousHash = Utils.binaryToHexa(header.previousHash);
            const previousMicroblock = await manager.findOneBy(
                MicroblockEntity,
                {
                    hash: previousHash,
                },
            );
            if (previousMicroblock === null) {
                throw new Error(
                    `unable to find previous microblock ${previousHash} of ${hash}`,
                );
            }
            virtualBlockchainId = previousMicroblock.virtualBlockchainId;
        }
        await manager.save(MicroblockEntity, {
            hash,
            blockHeight,
            virtualBlockchainId,
            type,
            height,
            size: serializedMicroblock.length,
            gas,
            gasPrice,
        });
        await this.microblockStorageService.saveMicroblock(
            hash,
            serializedMicroblock,
        );

        switch (type) {
            case VirtualBlockchainType.ACCOUNT_VIRTUAL_BLOCKCHAIN: {
                await this.saveAccount(manager, virtualBlockchainId, sections);
                break;
            }
            case VirtualBlockchainType.NODE_VIRTUAL_BLOCKCHAIN: {
                await this.saveValidatorNode(
                    manager,
                    virtualBlockchainId,
                    sections,
                );
                break;
            }
            case VirtualBlockchainType.ORGANIZATION_VIRTUAL_BLOCKCHAIN: {
                await this.saveOrganization(
                    manager,
                    virtualBlockchainId,
                    sections,
                );
                break;
            }
            case VirtualBlockchainType.APPLICATION_VIRTUAL_BLOCKCHAIN: {
                await this.saveApplication(
                    manager,
                    virtualBlockchainId,
                    sections,
                );
                break;
            }
        }

        await this.updateMicroblockStats(manager, microblock);

        if (height == 1) {
            const expirationDay =
                (header.previousHash[1] << 24) |
                (header.previousHash[2] << 16) |
                (header.previousHash[3] << 8) |
                header.previousHash[4];

            await manager.save(VirtualBlockchainEntity, {
                virtualBlockchainId,
                type,
                height,
                creationTimestamp: timestamp,
                modificationTimestamp: timestamp,
                expirationTimestamp: expirationDay,
                lastMicroblockHash: hash,
            });
        } else {
            await manager.update(
                VirtualBlockchainEntity,
                {
                    virtualBlockchainId,
                },
                {
                    height,
                    modificationTimestamp: timestamp,
                    lastMicroblockHash: hash,
                },
            );
        }
        return feesInAtomics;
    }

    private async saveAccount(
        manager: EntityManager,
        virtualBlockchainId: string,
        sections: Section[],
    ) {
        const record: DeepPartial<AccountEntity> = {
            id: virtualBlockchainId,
        };
        for (const section of sections) {
            switch (section.type) {
                case SectionType.ACCOUNT_PUBLIC_KEY: {
                    const factory = new CryptoSchemeFactory();
                    const pk = await factory.createPublicSignatureKey(
                        section.schemeId,
                        section.publicKey,
                    );
                    const encoder =
                        CryptoEncoderFactory.defaultStringSignatureEncoder();
                    record.publicKey = await encoder.encodePublicKey(pk);
                    break;
                }
            }
        }
        if (Object.keys(record).length > 1) {
            await manager.save(AccountEntity, record);
        }
    }

    private async updateMicroblockStats(manager: EntityManager, microblock: Microblock) {
        const header = microblock.getHeader();
        const isGenesis = header.height === 1;
        const vbType: VirtualBlockchainType = header.microblockType;
        const date = microblock.getTimestampAsDate();
        const hourBucketTimestamp = StateCommitService.getHourBucketTimestamp(date);
        const where = { hourBucketTimestamp, vbType, isGenesis };
        const existing = await manager.findOneBy(MicroblockStatsEntity, where);

        if (existing) {
            await manager.increment(MicroblockStatsEntity, where, 'counter', 1);
        } else {
            await manager.save(MicroblockStatsEntity, { ...where, counter: 1 });
        }
    }

    private async saveValidatorNode(
        manager: EntityManager,
        virtualBlockchainId: string,
        sections: Section[],
    ) {
        const record: DeepPartial<ValidatorNodeEntity> = {
            virtualBlockchainId,
        };
        for (const section of sections) {
            switch (section.type) {
                case SectionType.VN_CREATION: {
                    record.organizationId = Utils.binaryToHexa(
                        section.organizationId,
                    );
                    break;
                }
                case SectionType.VN_COMETBFT_PUBLIC_KEY_DECLARATION: {
                    record.cometPublicKeyType = section.cometPublicKeyType;
                    record.cometPublicKey = section.cometPublicKey.replace(/=*$/, "");
                    const b64 = EncoderFactory.bytesToBase64Encoder();
                    const rawAddress =
                        CometBFTPublicKeyConverter.convertRawPublicKeyIntoAddress(
                            b64.decode(section.cometPublicKey),
                        );
                    record.address = Utils.binaryToHexa(rawAddress);
                    break;
                }
                case SectionType.VN_RPC_ENDPOINT: {
                    record.rpcEndpoint = section.rpcEndpoint;
                    break;
                }
            }
        }
        if (Object.keys(record).length > 1) {
            await manager.save(ValidatorNodeEntity, record);
        }
        await this.nodeStatusService.getCurrentNodeStatus(virtualBlockchainId);
    }

    private async saveOrganization(
        manager: EntityManager,
        virtualBlockchainId: string,
        sections: Section[],
    ) {
        const record: DeepPartial<OrganizationEntity> = { virtualBlockchainId };
        for (const section of sections) {
            switch (section.type) {
                case SectionType.ORG_CREATION: {
                    record.accountId = Utils.binaryToHexa(section.accountId);
                    break;
                }
                case SectionType.ORG_DESCRIPTION: {
                    record.name = section.name;
                    record.city = section.city;
                    record.countryCode = section.countryCode;
                    record.website = section.website;
                    break;
                }
            }
        }
        if (Object.keys(record).length > 1) {
            await manager.save(OrganizationEntity, record);
        }
    }

    private async saveApplication(
        manager: EntityManager,
        virtualBlockchainId: string,
        sections: Section[],
    ) {
        const record: DeepPartial<ApplicationEntity> = { virtualBlockchainId };
        for (const section of sections) {
            switch (section.type) {
                case SectionType.APP_CREATION: {
                    record.organizationId = Utils.binaryToHexa(
                        section.organizationId,
                    );
                    break;
                }
                case SectionType.APP_DESCRIPTION: {
                    record.name = section.name;
                    record.logoUrl = section.logoUrl;
                    record.homepageUrl = section.homepageUrl;
                    record.description = section.description;
                    break;
                }
            }
        }
        if (Object.keys(record).length > 1) {
            await manager.save(ApplicationEntity, record);
        }
    }
}
