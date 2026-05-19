import { Controller, Get, Query } from "@nestjs/common";
import {
    GetBlocksQueryDto,
    GetMicroblocksQueryDto,
    GetAccountsQueryDto,
    GetAccountHistoryQueryDto,
    GetOrganizationsQueryDto,
    GetApplicationsQueryDto,
    GetValidatorNodesQueryDto,
    GetVotingPowersQueryDto,
} from "./dto/query.dto";
import {
    BlockListResponseDto,
    MicroblockListResponseDto,
    AccountListResponseDto,
    AccountHistoryListResponseDto,
    OrganizationListResponseDto,
    ApplicationListResponseDto,
    ValidatorNodeListResponseDto,
    VotingPowerListResponseDto,
} from "./dto/response.dto";
import { AppService } from "./app.service";
import { ApiOkResponse } from "@nestjs/swagger";

@Controller("/api/v1")
export class AppController {
    constructor(private readonly appService: AppService) {}

    @Get()
    getHello(): string {
        return this.appService.getHello();
    }

    @Get("/blocks")
    @ApiOkResponse({ type: BlockListResponseDto })
    async getBlocks(@Query() query: GetBlocksQueryDto) {
        return this.appService.getBlocks(query);
    }

    @Get("/microblocks")
    @ApiOkResponse({ type: MicroblockListResponseDto })
    async getMicroblocks(@Query() query: GetMicroblocksQueryDto) {
        return this.appService.getMicroblocks(query);
    }

    @Get("/accounts")
    @ApiOkResponse({ type: AccountListResponseDto })
    async getAccounts(@Query() query: GetAccountsQueryDto) {
        return this.appService.getAccounts(query);
    }

    @Get("/account-history")
    @ApiOkResponse({ type: AccountHistoryListResponseDto })
    async getAccountHistory(@Query() query: GetAccountHistoryQueryDto) {
        return this.appService.getAccountHistory(query);
    }

    @Get("/organizations")
    @ApiOkResponse({ type: OrganizationListResponseDto })
    async getOrganizations(@Query() query: GetOrganizationsQueryDto) {
        return this.appService.getOrganizations(query);
    }

    @Get("/applications")
    @ApiOkResponse({ type: ApplicationListResponseDto })
    async getApplications(@Query() query: GetApplicationsQueryDto) {
        return this.appService.getApplications(query);
    }

    @Get("/validator-nodes")
    @ApiOkResponse({ type: ValidatorNodeListResponseDto })
    async getValidatorNodes(@Query() query: GetValidatorNodesQueryDto) {
        return this.appService.getValidatorNodes(query);
    }

    @Get("/voting-powers")
    @ApiOkResponse({ type: VotingPowerListResponseDto })
    async getVotingPowers(@Query() query: GetVotingPowersQueryDto) {
        return this.appService.getVotingPowers(query);
    }
}
