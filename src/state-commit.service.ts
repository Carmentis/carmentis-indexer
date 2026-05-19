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
} from "@cmts-dev/carmentis-sdk-core";
import { BlockEntity, BlockSignatureEntity } from "./entities/block.entity";
import { ValidatorNodeEntity } from "./entities/validator-node.entity";
import { OrganizationEntity } from "./entities/organization.entity";
import { ApplicationEntity } from "./entities/application.entity";
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
import { DeepPartial } from "typeorm";

@Injectable()
export class StateCommitService {
    private readonly logger = new Logger();

    async commitBlock(height: number, block: BlockData) {
        this.logger.log(`Committing block ${height}`);
        const commitData = block.commit;

        if (commitData == null) {
            const nullHash = Utils.binaryToHexa(Utils.getNullHash());

            await BlockEntity.save({
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

            await BlockEntity.save({
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
                nextValidatorsHash: Utils.binaryToHexa(header.nextValidatorsHash),
                consensusHash: Utils.binaryToHexa(header.consensusHash),
                appHash: Utils.binaryToHexa(header.appHash),
                lastResultsHash: Utils.binaryToHexa(header.lastResultsHash),
                evidenceHash: Utils.binaryToHexa(header.evidenceHash),
                proposerAddress: Utils.binaryToHexa(header.proposerAddress),
            });

            for (const sig of commit.signatures) {
                await BlockSignatureEntity.save({
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

    async commitAccountUpdates(accountUpdates: AccountUpdatesAbciResponse) {
        this.logger.log(
            `Committing ${accountUpdates.list.length} account updates`,
        );
        for (const update of accountUpdates.list) {
            // 1) save AccountEntity
            const accountId = Utils.binaryToHexa(update.accountHash);
            await AccountEntity.save({
                id: accountId,
                height: update.currentState.height,
                balance: update.currentState.balance,
            });
            // 2) save AccountHistoryEntity
            for (const historyUpdate of update.historyUpdate) {
                await AccountHistoryEntity.save({
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
            await EscrowLockEntity.delete({ accountId });
            await VestingLockEntity.delete({ accountId });
            await StakingLockEntity.delete({ accountId });
            for (const lock of update.currentState.locks as Lock[]) {
                switch (lock.type) {
                    case LockType.Escrow: {
                        await this.commitEscrowLock(
                            accountId,
                            lock.lockedAmountInAtomics,
                            lock.parameters,
                        );
                        break;
                    }
                    case LockType.Vesting: {
                        await this.commitVestingLock(
                            accountId,
                            lock.lockedAmountInAtomics,
                            lock.parameters,
                        );
                        break;
                    }
                    case LockType.NodeStaking: {
                        await this.commitStakingLock(
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

    async commitEscrowLock(accountId: string, amount: number, params: EscrowParameters) {
        await EscrowLockEntity.save({
            accountId,
            amount,
            escrowIdentifier: Utils.binaryToHexa(
                params.escrowIdentifier,
            ),
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

    async commitVestingLock(accountId: string, amount: number, params: VestingParameters) {
        await VestingLockEntity.save({
            accountId,
            amount,
            initialVestedAmountInAtomics: params.initialVestedAmountInAtomics,
            cliffStartTimestamp: params.cliffStartTimestamp,
            cliffDurationDays: params.vestingDurationDays,
            vestingDurationDays: params.vestingDurationDays,
        });
    }

    async commitStakingLock(accountId: string, amount: number, params: NodeStakingParameters) {
        await StakingLockEntity.save({
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
        blockHeight: number,
        serializedMicroblock: Uint8Array,
    ) {
        const microblock = Microblock.loadFromSerializedMicroblock(serializedMicroblock);
        const header = microblock.getHeader();
        const sections = microblock.getAllSections();
        const hash = Utils.binaryToHexa(microblock.getHash().toBytes());
        const type: VirtualBlockchainType = header.microblockType;
        const height = header.height;
        let virtualBlockchainId: string;

        if (height == 1) {
            virtualBlockchainId = hash;
        } else {
            const previousHash = Utils.binaryToHexa(header.previousHash);
            const previousMicroblock = await MicroblockEntity.findOneBy({
                hash: previousHash,
            });
            if (previousMicroblock === null) {
                throw new Error(
                    `unable to find previous microblock ${previousHash} of ${hash}`,
                );
            }
            virtualBlockchainId = previousMicroblock.virtualBlockchainId;
        }
        await MicroblockEntity.save({
            hash,
            blockHeight,
            virtualBlockchainId,
            type,
            height,
            size: serializedMicroblock.length,
        });
        const storageService = new MicroblockStorageService();
        await storageService.saveMicroblock(
            hash,
            serializedMicroblock,
        );

        switch (type) {
            case VirtualBlockchainType.NODE_VIRTUAL_BLOCKCHAIN: {
                await this.saveValidatorNode(virtualBlockchainId, sections);
                break;
            }
            case VirtualBlockchainType.ORGANIZATION_VIRTUAL_BLOCKCHAIN: {
                await this.saveOrganization(virtualBlockchainId, sections);
                break;
            }
            case VirtualBlockchainType.APPLICATION_VIRTUAL_BLOCKCHAIN: {
                await this.saveApplication(virtualBlockchainId, sections);
                break;
            }
        }
    }

    private async saveValidatorNode(
        virtualBlockchainId: string,
        sections: Section[],
    ) {
        const record: DeepPartial<ValidatorNodeEntity> = { virtualBlockchainId };
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
            await ValidatorNodeEntity.save(record);
        }
    }

    private async saveOrganization(
        virtualBlockchainId: string,
        sections: Section[],
    ) {
        const record: DeepPartial<OrganizationEntity> = { virtualBlockchainId };
        for (const section of sections) {
            switch (section.type) {
                case SectionType.ORG_CREATION: {
                    record.accountId = Utils.binaryToHexa(
                        section.accountId,
                    );
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
            await OrganizationEntity.save(record);
        }
    }

    private async saveApplication(
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
            await ApplicationEntity.save(record);
        }
    }
}
