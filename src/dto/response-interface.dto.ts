export interface BaseListResponse<T> {
    items: T[];
    hasMore: boolean;
}

export class Root {
    name: string;
    swagger: string;
    openapi: string;
    currentNode: string;
}

export interface ObjectCount {
    type: number;
    count: number;
}

export interface Chain {
    version: string;
    network: string;
    earliestBlockHash: string;
    height: number;
    objectCounts: ObjectCount[];
}

export type ChainResponse = Chain;

export interface GasPrice {
    min: number;
    max: number;
    average: number;
    microblocks: number;
}

export type GasPriceResponse = GasPrice;

export interface Search {
    type: string;
    id: string;
    matchedFieldName: string;
    matchedFieldValue: string;
}

export type SearchListResponse = BaseListResponse<Search>;

export interface EscrowLock {
    amount: number;
    escrowIdentifier: string;
    fundEmitterAccountId: string;
    transferAuthorizerAccountId: string;
    startTimestamp: number;
    durationDays: number;
}

export interface VestingLock {
    amount: number;
    initialVestedAmountInAtomics: number;
    cliffStartTimestamp: number;
    cliffDurationDays: number;
    vestingDurationDays: number;
}

export interface StakingLock {
    amount: number;
    validatorNodeId: string;
    plannedUnlockAmountInAtomics: number;
    plannedUnlockTimestamp: number;
    slashed: boolean;
    plannedSlashingAmountInAtomics: number;
    plannedSlashingTimestamp: number;
}

export interface Account {
    id: string;
    publicKey: string;
    height: number;
    balance: number;
    spendable: number;
    lockedInStaking: number;
    lockedInVesting: number;
    lockedInEscrows: number;
    escrowLocks: EscrowLock[];
    vestingLocks: VestingLock[];
    stakingLocks: StakingLock[];
}

export type AccountListResponse = BaseListResponse<Account>;

export interface AccountHistory {
    accountId: string;
    height: number;
    type: number;
    timestamp: number;
    linkedAccountId: string;
    amount: number;
    newBalance: number;
    chainReference: string;
    publicReference: string;
    privateReference: string;
}

export type AccountHistoryListResponse = BaseListResponse<AccountHistory>;

export interface Application {
    virtualBlockchainId: string;
    organizationId: string;
    name: string;
    logoUrl: string;
    homepageUrl: string;
    description: string;
}

export type ApplicationListResponse = BaseListResponse<Application>;

export interface BlockSignature {
    height: number;
    blockIdFlag: number;
    validatorAddress: string;
    milliseconds: number;
    nanoseconds: number;
    signature: string;
}

export interface Block {
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
    appVbRadixHash: string;
    appTokenRadixHash: string;
    appStorageHash: string;
    appHash: string;
    lastResultsHash: string;
    evidenceHash: string;
    proposerAddress: string;
    signatures: BlockSignature[];
    microblocks: number;
    feesInAtomics: number;
}

export type BlockListResponse = BaseListResponse<Block>;

export interface Microblock {
    hash: string;
    blockHeight: number;
    virtualBlockchainId: string;
    type: number;
    height: number;
    size: number;
    gas: number;
    gasPrice: number;
    content?: string;
}

export type MicroblockListResponse = BaseListResponse<Microblock>;

export interface MicroblockProof {
    block: {
        height: number,
        vbRadixHash: string,
        tokenRadixHash: string,
        storageHash: string,
        appHash: string,
    }
    microblock: {
        virtualBlockchainId: string,
        height: number,
        hash: string,
    },
    virtualBlockchain: {
        serializedState: string,
        merkleWitnesses: string[],
        radixProof: string[],
    },
}

export type MicroblockProofResponse = MicroblockProof;

export interface MicroblockCount {
    vbType: number;
    isGenesis: boolean;
    count: number;
}

export interface MicroblockStats {
    stats: MicroblockCount[];
}

export type MicroblockStatsResponse = MicroblockStats;

export interface AccountProof {
    block: {
        height: number,
        vbRadixHash: string,
        tokenRadixHash: string,
        storageHash: string,
        appHash: string,
    }
    account: {
        virtualBlockchainId: string,
        serializedState: string,
        radixProof: string[],
    },
}

export type AccountProofResponse = AccountProof;

export interface Organization {
    virtualBlockchainId: string;
    accountId: string;
    name: string;
    city: string;
    countryCode: string;
    website: string;
}

export type OrganizationListResponse = BaseListResponse<Organization>;

export enum NodeStatusEnum {
    Unknown = "UNKNOWN",
    Ok = "OK",
    Sync = "SYNC",
    Down = "DOWN",
    Bad = "BAD",
}

export interface ValidatorNode {
    virtualBlockchainId: string;
    organizationId: string;
    cometPublicKeyType: string;
    cometPublicKey: string;
    address: string;
    rpcEndpoint: string;
    currentVotingPower: number;
    status: NodeStatusEnum;
    statusTimestamp: number;
    moniker: string;
}

export type ValidatorNodeListResponse = BaseListResponse<ValidatorNode>;

export interface ValidatorStatsCount {
    nodeId: string;
    proposedBlocks: number;
    signedBlocks: number;
}

export interface ValidatorStats {
    stats: ValidatorStatsCount[];
}

export type ValidatorStatsResponse = ValidatorStats;

export interface NodeStatus {
    nodeId: string;
    status: NodeStatusEnum;
    statusTimestamp: number;
    moniker: string;
    latency: number;
    txInMempool: number;
    height: number;
}

export type NodeStatusResponse = NodeStatus;

export interface VirtualBlockchain {
    virtualBlockchainId: string;
    height: number;
    type: number;
    creationTimestamp: number;
    modificationTimestamp: number;
    expirationTimestamp: number;
    lastMicroblockHash: string;
}

export type VirtualBlockchainListResponse = BaseListResponse<VirtualBlockchain>;

export interface VotingPower {
    nodeId: string;
    height: number;
    timestamp: number;
    votingPower: number;
}

export type VotingPowerListResponse = BaseListResponse<VotingPower>;

export interface NodePeriodReward {
    startTime: number
    endTime: number
    votingPower: number
    uptimeHours: number
    downtimeHours: number
    rewardInAtomics: number
}

export interface NodeReward {
    accruedRewardInAtomics: number
    paidRewardInAtomics: number
    unpaidRewardInAtomics: number
    periods: NodePeriodReward[]
}

export type NodeRewardResponse = NodeReward;
