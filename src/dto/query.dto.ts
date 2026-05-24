import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional } from "class-validator";
import { Type } from "class-transformer";
import {
    SortOrder,
    BlockSort,
    MicroblockSort,
    AccountHistorySort,
    VotingPowerSort,
    ChainQuery,
    GasPriceQuery,
    AccountsQuery,
    AccountHistoryQuery,
    BlocksQuery,
    MicroblocksQuery,
    OrganizationsQuery,
    ApplicationsQuery,
    ValidatorNodesQuery,
    VirtualBlockchainsQuery,
    VotingPowersQuery,
} from "./query-interface.dto";

const SORT_DESCRIPTION = "Field on which the sort is applied";

class ListDto {
    @ApiPropertyOptional({
        description: "Sort order",
        default: SortOrder.ASC,
        enum: SortOrder,
    })
    @IsOptional()
    @Type(() => String)
    @IsEnum(SortOrder)
    order?: SortOrder;

    @ApiPropertyOptional({
        description: "Limit number of results",
        example: 10,
    })
    @IsOptional()
    @Type(() => Number)
    limit?: number;
}

export class GetChainQueryDto {
}

export class GetGasPriceQueryDto implements GasPriceQuery {
    @ApiPropertyOptional({
        description: "Minimum block height (inclusive)",
        example: 100,
    })
    @IsOptional()
    @Type(() => Number)
    height_gte?: number;

    @ApiPropertyOptional({
        description: "Maximum block height (inclusive)",
        example: 200,
    })
    @IsOptional()
    @Type(() => Number)
    height_lte?: number;
}

export class GetBlocksQueryDto extends ListDto implements BlocksQuery {
    @ApiPropertyOptional({
        description: SORT_DESCRIPTION,
        enum: BlockSort,
    })
    @IsOptional()
    @IsEnum(BlockSort)
    sort?: BlockSort;

    @ApiPropertyOptional({
        description: "Exact block height. Cannot be used in conjunction with height_gte or height_lte.",
        example: 123,
    })
    @IsOptional()
    @Type(() => Number)
    height?: number;

    @ApiPropertyOptional({
        description: "Minimum block height (inclusive)",
        example: 100,
    })
    @IsOptional()
    @Type(() => Number)
    height_gte?: number;

    @ApiPropertyOptional({
        description: "Maximum block height (inclusive)",
        example: 200,
    })
    @IsOptional()
    @Type(() => Number)
    height_lte?: number;

    @ApiPropertyOptional({
        description: "Minimum timestamp in seconds (inclusive)",
        example: 1780272000,
    })
    @IsOptional()
    @Type(() => Number)
    timestamp_gte?: number;

    @ApiPropertyOptional({
        description: "Maximum timestamp in seconds (inclusive)",
        example: 1782777600,
    })
    @IsOptional()
    @Type(() => Number)
    timestamp_lte?: number;
}

export class GetMicroblocksQueryDto extends ListDto implements MicroblocksQuery {
    @ApiPropertyOptional({
        description: SORT_DESCRIPTION,
        enum: MicroblockSort,
    })
    @IsOptional()
    @IsEnum(MicroblockSort)
    sort?: MicroblockSort;

    @ApiPropertyOptional({
        description: "Block hash",
        example: "511d98d94eac50e6bd5df8dad285c90c309c55a57bdf9db8c57d0ec931c7c57a",
    })
    @IsOptional()
    @Type(() => String)
    hash?: string;

    @ApiPropertyOptional({
        description: "Block height",
        example: 100,
    })
    @IsOptional()
    @Type(() => Number)
    block_height?: number;

    @ApiPropertyOptional({
        description: "Virtual blockchain ID",
        example: "c4807cb71556c183ad79880be6c2732ae8b82089bbb27845f4452f27222900bc",
    })
    @IsOptional()
    @Type(() => Number)
    vb_id?: string;

    @ApiPropertyOptional({
        description: "Flag to include the microblock content in the response",
    })
    @IsOptional()
    @Type(() => Boolean)
    include_content?: boolean;
}

export class GetAccountsQueryDto extends ListDto implements AccountsQuery {
    @ApiPropertyOptional({
        description: "Account ID",
        example: "511d98d94eac50e6bd5df8dad285c90c309c55a57bdf9db8c57d0ec931c7c57a",
    })
    @IsOptional()
    @Type(() => String)
    id?: string;

    @ApiPropertyOptional({
        description: "Minimum balance in CMTS (inclusive)",
        example: 1000,
    })
    @IsOptional()
    @Type(() => Number)
    balance_gte?: number;

    @ApiPropertyOptional({
        description: "Maximum balance in CMTS (inclusive)",
        example: 2000,
    })
    @IsOptional()
    @Type(() => Number)
    balance_lte?: number;

    @ApiPropertyOptional({
        description: "Filter accounts with at least one escrow lock",
    })
    @IsOptional()
    @Type(() => Boolean)
    with_escrow?: boolean;

    @ApiPropertyOptional({
        description: "Filter accounts with at least one vesting lock",
    })
    @IsOptional()
    @Type(() => Boolean)
    with_vesting?: boolean;

    @ApiPropertyOptional({
        description: "Filter accounts with at least one staking lock",
    })
    @IsOptional()
    @Type(() => Boolean)
    with_staking?: boolean;
}

export class GetAccountHistoryQueryDto extends ListDto implements AccountHistoryQuery {
    @ApiPropertyOptional({
        description: SORT_DESCRIPTION,
        enum: AccountHistorySort,
    })
    @IsOptional()
    @IsEnum(AccountHistorySort)
    sort?: AccountHistorySort;

    @ApiPropertyOptional({
        description: "Account ID",
        example: "511d98d94eac50e6bd5df8dad285c90c309c55a57bdf9db8c57d0ec931c7c57a",
    })
    @IsOptional()
    @Type(() => String)
    account_id?: string;

    @ApiPropertyOptional({
        description: "Linked account ID",
        example: "c4807cb71556c183ad79880be6c2732ae8b82089bbb27845f4452f27222900bc",
    })
    @IsOptional()
    @Type(() => String)
    linked_account_id?: string;

    @ApiPropertyOptional({
        description: "Operation type",
        example: 1,
    })
    @IsOptional()
    @Type(() => Number)
    type?: number;

    @ApiPropertyOptional({
        description: "Exact history height. Cannot be used in conjunction with height_gte or height_lte.",
        example: 23,
    })
    @IsOptional()
    @Type(() => Number)
    height?: number;

    @ApiPropertyOptional({
        description: "Minimum history height (inclusive)",
        example: 10,
    })
    @IsOptional()
    @Type(() => Number)
    height_gte?: number;

    @ApiPropertyOptional({
        description: "Maximum history height (inclusive)",
        example: 20,
    })
    @IsOptional()
    @Type(() => Number)
    height_lte?: number;

    @ApiPropertyOptional({
        description: "Minimum timestamp in seconds (inclusive)",
        example: 1780272000,
    })
    @IsOptional()
    @Type(() => Number)
    timestamp_gte?: number;

    @ApiPropertyOptional({
        description: "Maximum timestamp in seconds (inclusive)",
        example: 1782777600,
    })
    @IsOptional()
    @Type(() => Number)
    timestamp_lte?: number;
}

export class GetOrganizationsQueryDto extends ListDto implements OrganizationsQuery {
    @ApiPropertyOptional({
        description: "Virtual blockchain ID",
        example: "511d98d94eac50e6bd5df8dad285c90c309c55a57bdf9db8c57d0ec931c7c57a",
    })
    @IsOptional()
    @Type(() => String)
    vb_id?: string;

    @ApiPropertyOptional({
        description: "Account ID",
        example: "c4807cb71556c183ad79880be6c2732ae8b82089bbb27845f4452f27222900bc",
    })
    @IsOptional()
    @Type(() => String)
    account_id?: string;

    @ApiPropertyOptional({
        description: "Organization name",
        example: "Carmentis SAS",
    })
    @IsOptional()
    @Type(() => String)
    name?: string;
}

export class GetApplicationsQueryDto extends ListDto implements ApplicationsQuery {
    @ApiPropertyOptional({
        description: "Virtual blockchain ID",
        example: "511d98d94eac50e6bd5df8dad285c90c309c55a57bdf9db8c57d0ec931c7c57a",
    })
    @IsOptional()
    @Type(() => String)
    vb_id?: string;

    @ApiPropertyOptional({
        description: "Organization virtual blockchain ID",
        example: "c4807cb71556c183ad79880be6c2732ae8b82089bbb27845f4452f27222900bc",
    })
    @IsOptional()
    @Type(() => String)
    organization_id?: string;

    @ApiPropertyOptional({
        description: "Application name",
        example: "FileSign",
    })
    @IsOptional()
    @Type(() => String)
    name?: string;
}

export class GetVirtualBlockchainsQueryDto extends ListDto implements VirtualBlockchainsQuery {
    @ApiPropertyOptional({
        description: "Virtual blockchain ID",
        example: "511d98d94eac50e6bd5df8dad285c90c309c55a57bdf9db8c57d0ec931c7c57a",
    })
    @IsOptional()
    @Type(() => String)
    vb_id?: string;

    @ApiPropertyOptional({
        description: "Type",
        example: 1,
    })
    @IsOptional()
    @Type(() => Number)
    type?: number;
}

export class GetValidatorNodesQueryDto extends ListDto implements ValidatorNodesQuery {
    @ApiPropertyOptional({
        description: "Virtual blockchain ID",
        example: "511d98d94eac50e6bd5df8dad285c90c309c55a57bdf9db8c57d0ec931c7c57a",
    })
    @IsOptional()
    @Type(() => String)
    vb_id?: string;

    @ApiPropertyOptional({
        description: "Organization virtual blockchain ID",
        example: "c4807cb71556c183ad79880be6c2732ae8b82089bbb27845f4452f27222900bc",
    })
    @IsOptional()
    @Type(() => String)
    organization_id?: string;

    @ApiPropertyOptional({
        description: "Comet public key",
        example: "Ia1q/tjhdo3tkO+nkFMa77v/4YFWYB3duC0n0fZ+S9M=",
    })
    @IsOptional()
    @Type(() => String)
    public_key?: string;

    @ApiPropertyOptional({
        description: "Node address",
        example: "C5F1A9EEA5451BC797DE6CAA8C17765B824E7F85",
    })
    @IsOptional()
    @Type(() => String)
    address?: string;
}

export class GetVotingPowersQueryDto extends ListDto implements VotingPowersQuery {
    @ApiPropertyOptional({
        description: SORT_DESCRIPTION,
        enum: VotingPowerSort,
    })
    @IsOptional()
    @IsEnum(VotingPowerSort)
    sort?: VotingPowerSort;

    @ApiPropertyOptional({
        description: "Node virtual blockchain ID",
        example: "511d98d94eac50e6bd5df8dad285c90c309c55a57bdf9db8c57d0ec931c7c57a",
    })
    @IsOptional()
    @Type(() => String)
    node_id?: string;
}
