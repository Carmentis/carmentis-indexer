export interface IEscrowLockDto {
    amount: number;
    escrowIdentifier: string;
    fundEmitterAccountId: string;
    transferAuthorizerAccountId: string;
    startTimestamp: number;
    durationDays: number;
}

export interface IVestingLockDto {
    amount: number;
    initialVestedAmountInAtomics: number;
    cliffStartTimestamp: number;
    cliffDurationDays: number;
    vestingDurationDays: number;
}

export interface IStakingLockDto {
    amount: number;
    validatorNodeId: string;
    plannedUnlockAmountInAtomics: number;
    plannedUnlockTimestamp: number;
    slashed: boolean;
    plannedSlashingAmountInAtomics: number;
    plannedSlashingTimestamp: number;
}

export interface IAccountDto {
    id: string;
    height: number;
    balance: number;
    escrowLocks: IEscrowLockDto[];
    vestingLocks: IVestingLockDto[];
    stakingLocks: IStakingLockDto[];
}

export interface IAccountHistoryDto {
    accountId: string;
    height: number;
    type: number;
    timestamp: number;
    linkedAccountId: string;
    amount: number;
    chainReference: string;
}

export interface IApplicationDto {
    virtualBlockchainId: string;
    organizationId: string;
    name: string;
    logoUrl: string;
    homepageUrl: string;
    description: string;
}

export interface IBlockSignatureDto {
    height: number;
    blockIdFlag: number;
    validatorAddress: string;
    milliseconds: number;
    nanoseconds: number;
    signature: string;
}

export interface IBlockDto {
    height: number;
    hash: string;
    blockVersion: number;
    appVersion: number;
    chainId: string;
    milliseconds: number;
    nanoseconds: number;
    partsTotal: number;
    partsHash: string;
    lastCommitHash: string;
    dataHash: string;
    validatorsHash: string;
    nextValidatorsHash: string;
    consensusHash: string;
    appHash: string;
    lastResultsHash: string;
    evidenceHash: string;
    proposerAddress: string;
    signatures: IBlockSignatureDto[];
}

export interface IMicroblockDto {
    hash: string;
    blockHeight: number;
    virtualBlockchainId: string;
    type: number;
    height: number;
}

export interface IOrganizationDto {
    virtualBlockchainId: string;
    accountId: string;
    name: string;
    city: string;
    countryCode: string;
    website: string;
}

export interface IValidatorNodeDto {
    virtualBlockchainId: string;
    organizationId: string;
    cometPublicKeyType: string;
    cometPublicKey: string;
    address: string;
    rpcEndpoint: string;
}
