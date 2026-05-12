import { Controller, Get, Query } from "@nestjs/common";
import {
    GetBlocksQueryDto,
    GetMicroblocksQueryDto,
    GetAccountsQueryDto,
    GetAccountHistoryQueryDto,
    GetOrganizationsQueryDto,
    GetApplicationsQueryDto,
    GetValidatorNodesQueryDto,
} from "./dto/query.dto";
import {
    BlockResponseDto,
    MicroblockResponseDto,
    AccountResponseDto,
    AccountHistoryResponseDto,
    OrganizationResponseDto,
    ApplicationResponseDto,
    ValidatorNodeResponseDto,
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
    @ApiOkResponse({ type: BlockResponseDto })
    async getBlocks(@Query() query: GetBlocksQueryDto) {
        return this.appService.getBlocks(query);
    }

    @Get("/microblocks")
    @ApiOkResponse({ type: MicroblockResponseDto })
    async getMicroblocks(@Query() query: GetMicroblocksQueryDto) {
        return this.appService.getMicroblocks(query);
    }

    @Get("/accounts")
    @ApiOkResponse({ type: AccountResponseDto })
    async getAccounts(@Query() query: GetAccountsQueryDto) {
        return this.appService.getAccounts(query);
    }

    @Get("/account-history")
    @ApiOkResponse({ type: AccountHistoryResponseDto })
    async getAccountHistory(@Query() query: GetAccountHistoryQueryDto) {
        return this.appService.getAccountHistory(query);
    }

    @Get("/organizations")
    @ApiOkResponse({ type: OrganizationResponseDto })
    async getOrganizations(@Query() query: GetOrganizationsQueryDto) {
        return this.appService.getOrganizations(query);
    }

    @Get("/applications")
    @ApiOkResponse({ type: ApplicationResponseDto })
    async getApplications(@Query() query: GetApplicationsQueryDto) {
        return this.appService.getApplications(query);
    }

    @Get("/validator-nodes")
    @ApiOkResponse({ type: ValidatorNodeResponseDto })
    async getValidatorNodes(@Query() query: GetValidatorNodesQueryDto) {
        return this.appService.getValidatorNodes(query);
    }
}
