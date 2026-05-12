import {
    IAccountDto,
    IAccountHistoryDto,
    IEscrowLockDto,
    IVestingLockDto,
    IStakingLockDto,
    IApplicationDto,
    IBlockDto,
    IBlockSignatureDto,
    IMicroblockDto,
    IOrganizationDto,
    IValidatorNodeDto,
} from "./interface.dto";
import { ApiProperty } from "@nestjs/swagger";

export class EscrowLockResponseDto implements IEscrowLockDto {
    @ApiProperty() amount: number;
    @ApiProperty() escrowIdentifier: string;
    @ApiProperty() fundEmitterAccountId: string;
    @ApiProperty() transferAuthorizerAccountId: string;
    @ApiProperty() startTimestamp: number;
    @ApiProperty() durationDays: number;
}

export class VestingLockResponseDto implements IVestingLockDto {
    @ApiProperty() amount: number;
    @ApiProperty() initialVestedAmountInAtomics: number;
    @ApiProperty() cliffStartTimestamp: number;
    @ApiProperty() cliffDurationDays: number;
    @ApiProperty() vestingDurationDays: number;
}

export class StakingLockResponseDto implements IStakingLockDto {
    @ApiProperty() amount: number;
    @ApiProperty() validatorNodeId: string;
    @ApiProperty() plannedUnlockAmountInAtomics: number;
    @ApiProperty() plannedUnlockTimestamp: number;
    @ApiProperty() slashed: boolean;
    @ApiProperty() plannedSlashingAmountInAtomics: number;
    @ApiProperty() plannedSlashingTimestamp: number;
}

export class AccountResponseDto implements IAccountDto {
    @ApiProperty() id: string;
    @ApiProperty() height: number;
    @ApiProperty() balance: number;

    @ApiProperty({ type: [EscrowLockResponseDto] })
    escrowLocks: EscrowLockResponseDto[];
    @ApiProperty({ type: [VestingLockResponseDto] })
    vestingLocks: VestingLockResponseDto[];
    @ApiProperty({ type: [StakingLockResponseDto] })
    stakingLocks: StakingLockResponseDto[];
}

export class AccountHistoryResponseDto implements IAccountHistoryDto {
    @ApiProperty() accountId: string;
    @ApiProperty() height: number;
    @ApiProperty() type: number;
    @ApiProperty() timestamp: number;
    @ApiProperty() linkedAccountId: string;
    @ApiProperty() amount: number;
    @ApiProperty() chainReference: string;
}

export class ApplicationResponseDto implements IApplicationDto {
    @ApiProperty() virtualBlockchainId: string;
    @ApiProperty() organizationId: string;
    @ApiProperty() name: string;
    @ApiProperty() logoUrl: string;
    @ApiProperty() homepageUrl: string;
    @ApiProperty() description: string;
}

export class BlockSignatureResponseDto implements IBlockSignatureDto {
    @ApiProperty() height: number;
    @ApiProperty() blockIdFlag: number;
    @ApiProperty() validatorAddress: string;
    @ApiProperty() milliseconds: number;
    @ApiProperty() nanoseconds: number;
    @ApiProperty() signature: string;
}

export class BlockResponseDto implements IBlockDto {
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

    @ApiProperty({ type: [BlockSignatureResponseDto] })
    signatures: BlockSignatureResponseDto[];
}

export class MicroblockResponseDto implements IMicroblockDto {
    @ApiProperty() hash: string;
    @ApiProperty() blockHeight: number;
    @ApiProperty() virtualBlockchainId: string;
    @ApiProperty() type: number;
    @ApiProperty() height: number;
}

export class OrganizationResponseDto implements IOrganizationDto {
    @ApiProperty() virtualBlockchainId: string;
    @ApiProperty() accountId: string;
    @ApiProperty() name: string;
    @ApiProperty() city: string;
    @ApiProperty() countryCode: string;
    @ApiProperty() website: string;
}

export class ValidatorNodeResponseDto implements IValidatorNodeDto {
    @ApiProperty() virtualBlockchainId: string;
    @ApiProperty() organizationId: string;
    @ApiProperty() cometPublicKeyType: string;
    @ApiProperty() cometPublicKey: string;
    @ApiProperty() address: string;
    @ApiProperty() rpcEndpoint: string;
}
