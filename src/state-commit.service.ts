import { Injectable, Logger } from "@nestjs/common";
import {
    Microblock,
    AccountUpdatesAbciResponse,
    VirtualBlockchainType,
    Utils,
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
import { BlockData } from "./cometbft-api.service";
import { MicroblockStorageService } from "./microblock-storage.service";
import { DeepPartial, EntityManager } from "typeorm";

@Injectable()
export class StateCommitService {
    private readonly logger = new Logger();

    constructor(
        private readonly microblockStorageService: MicroblockStorageService,
    ) {}

    async commitBlock(
        manager: EntityManager,
        height: number,
        block: BlockData,
    ) {
        this.logger.log(`Committing block ${height}`);
        const commitData = block.commit;

        if (commitData == null) {
            const nullHash = Utils.binaryToHexa(Utils.getNullHash());

            await manager.save(BlockEntity, {
                height: height,
                hash: nullHash,
                blockVersion: 0,
                appVersion: 0,
                chainId: "",
                milliseconds: 0,
                nanoseconds: 0,
                partsTotal: 0,
                partsHash: nullHash,
                lastCommitHash: nullHash,
                dataHash: nullHash,
                validatorsHash: nullHash,
                nextValidatorsHash: nullHash,
                consensusHash: nullHash,
                appHash: nullHash,
                lastResultsHash: nullHash,
                evidenceHash: nullHash,
                proposerAddress: nullHash,
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
                appHash: Utils.binaryToHexa(header.appHash),
                lastResultsHash: Utils.binaryToHexa(header.lastResultsHash),
                evidenceHash: Utils.binaryToHexa(header.evidenceHash),
                proposerAddress: Utils.binaryToHexa(header.proposerAddress),
            });

            for (const sig of commit.signatures) {
                await manager.save(BlockSignatureEntity, {
                    height,
                    blockIdFlag: sig.blockIdFlag,
                    validatorAddress: Utils.binaryToHexa(
                        sig.validatorAddress || Utils.getNullHash(),
                    ),
                    milliseconds: sig.timestamp ? sig.timestamp.getTime() : 0,
                    nanoseconds: sig.timestamp
                        ? sig.timestamp.nanoseconds || 0
                        : 0,
                    signature: Utils.binaryToHexa(
                        sig.signature || Utils.getNullHash(),
                    ),
                });
            }
        }
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
                await manager.save(AccountHistoryEntity, {
                    accountId,
                    height: historyUpdate.height,
                    type: historyUpdate.type,
                    timestamp: historyUpdate.timestamp,
                    linkedAccountId: Utils.binaryToHexa(
                        historyUpdate.linkedAccount,
                    ),
                    amount: historyUpdate.amount,
                    chainReference: Utils.binaryToHexa(
                        historyUpdate.chainReference,
                    ),
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
        const microblock =
            Microblock.loadFromSerializedMicroblock(serializedMicroblock);
        const header = microblock.getHeader();
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
            gas: microblock.getGas(),
            gasPrice: microblock.getGasPrice().getAmountAsAtomic(),
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

        if (height == 1) {
            await manager.save(VirtualBlockchainEntity, {
                virtualBlockchainId,
                type,
                height,
                creationTimestamp: timestamp,
                modificationTimestamp: timestamp,
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
                    record.cometPublicKey = section.cometPublicKey;
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
