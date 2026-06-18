import { VirtualBlockchainType as VBType } from "@cmts-dev/carmentis-sdk-core";

export enum SortOrder {
    ASC = "ASC",
    DESC = "DESC",
}

export enum BlockSort {
    HEIGHT = "height",
}

export enum MicroblockSort {
    HEIGHT = "height",
    BLOCK_HEIGHT = "blockHeight",
}

export enum AccountSort {
    BALANCE = "balance",
}

export enum AccountHistorySort {
    HEIGHT = "height",
    TIMESTAMP = "timestamp",
}

export enum VirtualBlockchainSort {
    CREATION_TIMESTAMP = "creationTimestamp",
    MODIFICATION_TIMESTAMP = "modificationTimestamp",
    EXPIRATION_TIMESTAMP = "expirationTimestamp",
}
export enum VotingPowerSort {
    HEIGHT = "height",
}

export enum SearchObjectType {
    ALL = "all",
    ACCOUNT = "account",
    APPLICATION = "application",
    BLOCK = "block",
    MICROBLOCK = "microblock",
    ORGANIZATION = "organization",
    NODE = "node",
    VIRTUAL_BLOCKCHAIN = "vb",
}

export enum VirtualBlockchainType {
    PROTOCOL = VBType.PROTOCOL_VIRTUAL_BLOCKCHAIN,
    ACCOUNT = VBType.ACCOUNT_VIRTUAL_BLOCKCHAIN,
    NODE = VBType.NODE_VIRTUAL_BLOCKCHAIN,
    ORGANIZATION = VBType.ORGANIZATION_VIRTUAL_BLOCKCHAIN,
    APPLICATION = VBType.APPLICATION_VIRTUAL_BLOCKCHAIN,
    APPLICATION_LEDGER = VBType.APP_LEDGER_VIRTUAL_BLOCKCHAIN,
}

export interface BaseQuery {
    order?: SortOrder;
    limit?: number;
}

export interface GasPriceQuery {
    height_gte?: number;
    height_lte?: number;
}

export interface SearchQuery extends BaseQuery {
    q: string;
    type?: string;
}

export interface AccountsQuery extends BaseQuery {
    sort?: AccountSort;
    public_key?: string;
    id?: string;
    balance_gte?: number;
    balance_lte?: number;
    with_escrow?: boolean;
    with_vesting?: boolean;
    with_staking?: boolean;
}

export interface BlocksQuery extends BaseQuery {
    sort?: BlockSort;
    height?: number;
    height_gte?: number;
    height_lte?: number;
    timestamp_gte?: number;
    timestamp_lte?: number;
}

export interface MicroblocksQuery extends BaseQuery {
    sort?: MicroblockSort;
    hash?: string;
    block_height?: number;
    vb_id?: string;
    include_content?: boolean;
}

export interface AccountHistoryQuery extends BaseQuery {
    sort?: AccountHistorySort;
    account_id?: string;
    linked_account_id?: string;
    type?: number;
    height?: number;
    height_gte?: number;
    height_lte?: number;
    timestamp_gte?: number;
    timestamp_lte?: number;
}

export interface OrganizationsQuery extends BaseQuery {
    vb_id?: string;
    account_id?: string;
    name?: string;
}

export interface ApplicationsQuery extends BaseQuery {
    vb_id?: string;
    organization_id?: string;
    name?: string;
}

export interface ValidatorNodesQuery extends BaseQuery {
    vb_id?: string;
    organization_id?: string;
    public_key?: string;
    address?: string;
    is_validator?: boolean;
}

export interface VirtualBlockchainsQuery extends BaseQuery {
    vb_id?: string;
    type?: number;
}

export interface VotingPowersQuery extends BaseQuery {
    sort?: VotingPowerSort;
    node_id?: string;
}

export interface NodeStatusQuery {
    node_id: string;
}

export interface MicroblockProofQuery {
    hash: string;
}

export interface AccountProofQuery {
    account_id: string;
}

export interface MicroblockStatsQuery extends BaseQuery {
    vb_type?: VirtualBlockchainType;
    is_genesis?: boolean;
    timestamp_gte?: number;
    timestamp_lte?: number;
}

export interface ValidatorStatsQuery extends BaseQuery {
    node_id?: string;
    timestamp_gte?: number;
    timestamp_lte?: number;
}
