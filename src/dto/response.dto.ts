import {
    Root,
    ObjectCount,
    Chain,
    GasPrice,
    Search,
    Account,
    AccountHistory,
    AccountProof,
    EscrowLock,
    VestingLock,
    StakingLock,
    Application,
    Block,
    BlockSignature,
    Microblock,
    MicroblockProof,
    MicroblockStats,
    Organization,
    NodeStatusEnum,
    NodeStatus,
    ValidatorNode,
    ValidatorStats,
    VirtualBlockchain,
    VotingPower,
    NodeReward,
} from "./response-interface.dto";

import { IsEnum } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class RootResponseDto implements Root {
    @ApiProperty() name: string;
    @ApiProperty() swagger: string;
    @ApiProperty() openapi: string;
    @ApiProperty() currentNode: string;
}

export class ObjectCountDto implements ObjectCount {
    @ApiProperty() type: number;
    @ApiProperty() count: number;
}

export class ChainResponseDto implements Chain {
    @ApiProperty() version: string;
    @ApiProperty() network: string;
    @ApiProperty() earliestBlockHash: string;
    @ApiProperty() height: number;
    @ApiProperty({ type: () => ObjectCountDto, isArray: true })
    objectCounts: ObjectCountDto[];
}

export class GasPriceResponseDto implements GasPrice {
    @ApiProperty() min: number;
    @ApiProperty() max: number;
    @ApiProperty() average: number;
    @ApiProperty() microblocks: number;
}

export class SearchDto implements Search {
    @ApiProperty() type: string;
    @ApiProperty() id: string;
    @ApiProperty() matchedFieldName: string;
    @ApiProperty() matchedFieldValue: string;
}

export class SearchListResponseDto {
    @ApiProperty({ type: () => SearchDto, isArray: true })
    items: SearchDto[];
    @ApiProperty()
    hasMore: boolean;
}

export class EscrowLockDto implements EscrowLock {
    @ApiProperty() amount: number;
    @ApiProperty() escrowIdentifier: string;
    @ApiProperty() fundEmitterAccountId: string;
    @ApiProperty() transferAuthorizerAccountId: string;
    @ApiProperty() startTimestamp: number;
    @ApiProperty() durationDays: number;
}

export class VestingLockDto implements VestingLock {
    @ApiProperty() amount: number;
    @ApiProperty() initialVestedAmountInAtomics: number;
    @ApiProperty() cliffStartTimestamp: number;
    @ApiProperty() cliffDurationDays: number;
    @ApiProperty() vestingDurationDays: number;
}

export class StakingLockDto implements StakingLock {
    @ApiProperty() amount: number;
    @ApiProperty() validatorNodeId: string;
    @ApiProperty() plannedUnlockAmountInAtomics: number;
    @ApiProperty() plannedUnlockTimestamp: number;
    @ApiProperty() slashed: boolean;
    @ApiProperty() plannedSlashingAmountInAtomics: number;
    @ApiProperty() plannedSlashingTimestamp: number;
}

export class AccountDto implements Account {
    @ApiProperty() id: string;
    @ApiProperty() publicKey: string;
    @ApiProperty() height: number;
    @ApiProperty() balance: number;
    @ApiProperty() spendable: number;
    @ApiProperty() lockedInStaking: number;
    @ApiProperty() lockedInVesting: number;
    @ApiProperty() lockedInEscrows: number;

    @ApiProperty({ type: [StakingLockDto] })
    stakingLocks: StakingLockDto[];
    @ApiProperty({ type: [VestingLockDto] })
    vestingLocks: VestingLockDto[];
    @ApiProperty({ type: [EscrowLockDto] })
    escrowLocks: EscrowLockDto[];
}

export class AccountListResponseDto {
    @ApiProperty({ type: () => AccountDto, isArray: true })
    items: AccountDto[];
    @ApiProperty()
    hasMore: boolean;
}

export class AccountHistoryDto implements AccountHistory {
    @ApiProperty() accountId: string;
    @ApiProperty() height: number;
    @ApiProperty() type: number;
    @ApiProperty() timestamp: number;
    @ApiProperty() linkedAccountId: string;
    @ApiProperty() amount: number;
    @ApiProperty() newBalance: number;
    @ApiProperty({
        description: "Base64 representation of the CBOR-encoded chain reference.",
    })
    chainReference: string;
    @ApiProperty() publicReference: string;
    @ApiProperty() privateReference: string;
}

export class AccountHistoryListResponseDto {
    @ApiProperty({ type: () => AccountHistoryDto, isArray: true })
    items: AccountHistoryDto[];
    @ApiProperty()
    hasMore: boolean;
}

export class ApplicationDto implements Application {
    @ApiProperty() virtualBlockchainId: string;
    @ApiProperty() organizationId: string;
    @ApiProperty() name: string;
    @ApiProperty() logoUrl: string;
    @ApiProperty() homepageUrl: string;
    @ApiProperty() description: string;
}

export class ApplicationListResponseDto {
    @ApiProperty({ type: () => ApplicationDto, isArray: true })
    items: ApplicationDto[];
    @ApiProperty()
    hasMore: boolean;
}

export class BlockSignatureDto implements BlockSignature {
    @ApiProperty() height: number;
    @ApiProperty() blockIdFlag: number;
    @ApiProperty() validatorAddress: string;
    @ApiProperty() milliseconds: number;
    @ApiProperty() nanoseconds: number;
    @ApiProperty() signature: string;
}

export class BlockDto implements Block {
    @ApiProperty() height: number;
    @ApiProperty() hash: string;
    @ApiProperty() blockVersion: number;
    @ApiProperty() appVersion: number;
    @ApiProperty() chainId: string;
    @ApiProperty() milliseconds: number;
    @ApiProperty() nanoseconds: number;
    @ApiProperty() partsTotal: number;
    @ApiProperty() partsHash: string;
    @ApiProperty() lastCommitHash: string;
    @ApiProperty() dataHash: string;
    @ApiProperty() validatorsHash: string;
    @ApiProperty() nextValidatorsHash: string;
    @ApiProperty() consensusHash: string;
    @ApiProperty() appVbRadixHash: string;
    @ApiProperty() appTokenRadixHash: string;
    @ApiProperty() appStorageHash: string;
    @ApiProperty() appHash: string;
    @ApiProperty() lastResultsHash: string;
    @ApiProperty() evidenceHash: string;
    @ApiProperty() proposerAddress: string;
    @ApiProperty({ type: [BlockSignatureDto] })
    signatures: BlockSignatureDto[];
    @ApiProperty() microblocks: number;
    @ApiProperty() feesInAtomics: number;
}

export class BlockListResponseDto {
    @ApiProperty({ type: () => BlockDto, isArray: true })
    items: BlockDto[];
    @ApiProperty()
    hasMore: boolean;
}

export class MicroblockDto implements Microblock {
    @ApiProperty() hash: string;
    @ApiProperty() blockHeight: number;
    @ApiProperty() virtualBlockchainId: string;
    @ApiProperty() type: number;
    @ApiProperty() height: number;
    @ApiProperty() size: number;
    @ApiProperty() gas: number;

    @ApiProperty({
        description: "Expressed in atomics",
    })
    gasPrice: number;

    @ApiProperty()
    @ApiPropertyOptional({
        description: "Base64 representation of the microblock content. Returned only if include_content was set to true.",
    })
    content?: string;
}

export class MicroblockListResponseDto {
    @ApiProperty({ type: () => MicroblockDto, isArray: true })
    items: MicroblockDto[];
    @ApiProperty()
    hasMore: boolean;
}

export class OrganizationDto implements Organization {
    @ApiProperty() virtualBlockchainId: string;
    @ApiProperty() accountId: string;
    @ApiProperty() name: string;
    @ApiProperty() city: string;
    @ApiProperty() countryCode: string;
    @ApiProperty() website: string;
}

export class OrganizationListResponseDto {
    @ApiProperty({ type: () => OrganizationDto, isArray: true })
    items: OrganizationDto[];
    @ApiProperty()
    hasMore: boolean;
}

export class ValidatorNodeDto implements ValidatorNode {
    @ApiProperty() virtualBlockchainId: string;
    @ApiProperty() organizationId: string;
    @ApiProperty() cometPublicKeyType: string;
    @ApiProperty() cometPublicKey: string;
    @ApiProperty() address: string;
    @ApiProperty() rpcEndpoint: string;
    @ApiProperty() currentVotingPower: number;
    @ApiProperty({
        enum: NodeStatusEnum
    })
    @IsEnum(NodeStatusEnum)
    status: NodeStatusEnum;
    @ApiProperty() statusTimestamp: number;
    @ApiProperty() moniker: string;
}

export class ValidatorNodeListResponseDto {
    @ApiProperty({ type: () => ValidatorNodeDto, isArray: true })
    items: ValidatorNodeDto[];
    @ApiProperty()
    hasMore: boolean;
}

export class NodeStatusResponseDto implements NodeStatus {
    @ApiProperty() nodeId: string;
    @ApiProperty({
        enum: NodeStatusEnum
    })
    @IsEnum(NodeStatusEnum)
    status: NodeStatusEnum;
    @ApiProperty() statusTimestamp: number;
    @ApiProperty() moniker: string;
    @ApiProperty() latency: number;
    @ApiProperty() txInMempool: number;
    @ApiProperty() height: number;
}

export class VirtualBlockchainDto implements VirtualBlockchain {
    @ApiProperty() virtualBlockchainId: string;
    @ApiProperty() height: number;
    @ApiProperty() type: number;
    @ApiProperty() creationTimestamp: number;
    @ApiProperty() modificationTimestamp: number;
    @ApiProperty() expirationTimestamp: number;
    @ApiProperty() lastMicroblockHash: string;
}

export class VirtualBlockchainListResponseDto {
    @ApiProperty({ type: () => VirtualBlockchainDto, isArray: true })
    items: VirtualBlockchainDto[];
    @ApiProperty()
    hasMore: boolean;
}

export class VotingPowerDto implements VotingPower {
    @ApiProperty() nodeId: string;
    @ApiProperty() height: number;
    @ApiProperty() timestamp: number;
    @ApiProperty() votingPower: number;
}

export class VotingPowerListResponseDto {
    @ApiProperty({ type: () => VotingPowerDto, isArray: true })
    items: VotingPowerDto[];
    @ApiProperty()
    hasMore: boolean;
}

export class ProofBlockDto {
    @ApiProperty() height: number;
    @ApiProperty() vbRadixHash: string;
    @ApiProperty() tokenRadixHash: string;
    @ApiProperty() storageHash: string;
    @ApiProperty() appHash: string;
}

export class MicroblockProofMicroblockDto {
    @ApiProperty() virtualBlockchainId: string;
    @ApiProperty() height: number;
    @ApiProperty() hash: string;
}

export class MicroblockProofVirtualBlockchainDto {
    @ApiProperty() serializedState: string;
    @ApiProperty() merkleWitnesses: string[];
    @ApiProperty() radixProof: string[];
}

export class MicroblockProofWrapperDto {
    @ApiProperty({ type: () => ProofBlockDto })
    block: ProofBlockDto;
    @ApiProperty({ type: () => MicroblockProofMicroblockDto })
    microblock: MicroblockProofMicroblockDto;
    @ApiProperty({ type: () => MicroblockProofVirtualBlockchainDto })
    virtualBlockchain: MicroblockProofVirtualBlockchainDto;
}

export class MicroblockProofResponseDto implements MicroblockProof {
    @ApiProperty() nodeUrl: string;
    @ApiProperty({ type: () => MicroblockProofWrapperDto })
    proof: MicroblockProofWrapperDto;
}

export class AccountProofAccountDto {
    @ApiProperty() virtualBlockchainId: string;
    @ApiProperty() serializedState: string;
    @ApiProperty() radixProof: string[];
}

export class AccountProofWrapperDto {
    @ApiProperty({ type: () => ProofBlockDto })
    block: ProofBlockDto;
    @ApiProperty({ type: () => MicroblockProofVirtualBlockchainDto })
    account: AccountProofAccountDto;
}

export class AccountProofResponseDto implements AccountProof {
    @ApiProperty() nodeUrl: string;
    @ApiProperty({ type: () => AccountProofWrapperDto })
    proof: AccountProofWrapperDto;
}

export class MicroblockCountDto {
    @ApiProperty() vbType: number;
    @ApiProperty() isGenesis: boolean;
    @ApiProperty() count: number;
}

export class MicroblockStatsResponseDto implements MicroblockStats {
    @ApiProperty({ type: () => MicroblockCountDto, isArray: true })
    stats: MicroblockCountDto[];
}

export class ValidatorStatsCountDto {
    @ApiProperty() nodeId: string;
    @ApiProperty() proposedBlocks: number;
    @ApiProperty() signedBlocks: number;
}

export class ValidatorStatsResponseDto implements ValidatorStats {
    @ApiProperty({ type: () => ValidatorStatsCountDto, isArray: true })
    stats: ValidatorStatsCountDto[];
}

export class NodePeriodRewardDto {
    @ApiProperty() startTime: number
    @ApiProperty() endTime: number
    @ApiProperty() votingPower: number
    @ApiProperty() uptimeHours: number
    @ApiProperty() downtimeHours: number
    @ApiProperty() rewardInAtomics: number
}

export class NodeRewardResponseDto implements NodeReward {
    @ApiProperty() accruedRewardInAtomics: number
    @ApiProperty() paidRewardInAtomics: number
    @ApiProperty() unpaidRewardInAtomics: number
    @ApiProperty({ type: () => NodePeriodRewardDto, isArray: true })
    periods: NodePeriodRewardDto[];
}
