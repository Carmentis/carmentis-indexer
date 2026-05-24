export const SortOrder = {
    ASC: "ASC",
    DESC: "DESC",
} as const;
export type SortOrder = typeof SortOrder[keyof typeof SortOrder];

export const BlockSort = {
    HEIGHT: "height",
} as const;
export type BlockSort = typeof BlockSort[keyof typeof BlockSort];

export const AccountHistorySort = {
    HEIGHT: "height",
} as const;
export type AccountHistorySort = typeof AccountHistorySort[keyof typeof AccountHistorySort];

export const VotingPowerSort = {
    HEIGHT: "height",
} as const;
export type VotingPowerSort = typeof VotingPowerSort[keyof typeof VotingPowerSort];

export const MicroblockSort = {
    BLOCK_HEIGHT: "blockHeight",
} as const;
export type MicroblockSort = typeof MicroblockSort[keyof typeof MicroblockSort];

export interface BaseQuery {
    order?: SortOrder;
    limit?: number;
}

export type AnyQuery =
    ChainQuery |
    GasPriceQuery |
    AccountsQuery |
    BlocksQuery |
    MicroblocksQuery |
    AccountHistoryQuery |
    OrganizationsQuery |
    ApplicationsQuery |
    ValidatorNodesQuery |
    VotingPowersQuery;

export type ChainQuery = Record<string, never>;

export interface GasPriceQuery {
    height_gte?: number;
    height_lte?: number;
}

export interface AccountsQuery extends BaseQuery {
    height?: number;
    height_gte?: number;
    height_lte?: number;
    timestamp_gte?: number;
    timestamp_lte?: number;
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
}

export interface VirtualBlockchainsQuery extends BaseQuery {
    vb_id?: string;
    type?: number;
}

export interface VotingPowersQuery extends BaseQuery {
    sort?: VotingPowerSort;
    node_id?: string;
}
