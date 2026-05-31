import {
    ObjectCount,
    Chain,
    GasPrice,
    Search,
    Account,
    AccountHistory,
    EscrowLock,
    VestingLock,
    StakingLock,
    Application,
    Block,
    BlockSignature,
    Microblock,
    Organization,
    ValidatorNode,
    VirtualBlockchain,
    VotingPower,
} from "./response-interface.dto";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

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

    @ApiProperty({ type: [EscrowLockDto] })
    escrowLocks: EscrowLockDto[];
    @ApiProperty({ type: [VestingLockDto] })
    vestingLocks: VestingLockDto[];
    @ApiProperty({ type: [StakingLockDto] })
    stakingLocks: StakingLockDto[];
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
    @ApiProperty() chainReference: string;
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
    @ApiProperty() appHash: string;
    @ApiProperty() lastResultsHash: string;
    @ApiProperty() evidenceHash: string;
    @ApiProperty() proposerAddress: string;

    @ApiProperty({ type: [BlockSignatureDto] })
    signatures: BlockSignatureDto[];
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
        description: "Returned only if include_content=true",
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
}

export class ValidatorNodeListResponseDto {
    @ApiProperty({ type: () => ValidatorNodeDto, isArray: true })
    items: ValidatorNodeDto[];
    @ApiProperty()
    hasMore: boolean;
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
