import { Controller, Get, Query, ServiceUnavailableException } from "@nestjs/common";
import {
    GetChainQueryDto,
    GetGasPriceQueryDto,
    GetBlocksQueryDto,
    GetMicroblocksQueryDto,
    GetAccountsQueryDto,
    GetAccountHistoryQueryDto,
    GetOrganizationsQueryDto,
    GetApplicationsQueryDto,
    GetValidatorNodesQueryDto,
    GetVirtualBlockchainsQueryDto,
    GetVotingPowersQueryDto,
} from "./dto/query.dto";
import {
    GasPriceResponseDto,
    ChainResponseDto,
    BlockListResponseDto,
    MicroblockListResponseDto,
    AccountListResponseDto,
    AccountHistoryListResponseDto,
    OrganizationListResponseDto,
    ApplicationListResponseDto,
    ValidatorNodeListResponseDto,
    VirtualBlockchainListResponseDto,
    VotingPowerListResponseDto,
} from "./dto/response.dto";
import { AppService } from "./app.service";
import { ApiOkResponse } from "@nestjs/swagger";
import { SyncStateService } from "./sync-state.service";

@Controller("/api/v1")
export class AppController {
    constructor(
        private readonly appService: AppService,
        private readonly syncState: SyncStateService,
    ) {}

    @Get()
    getRoot(): string {
        return this.appService.getRoot();
    }

    @Get("/chain")
    @ApiOkResponse({ type: ChainResponseDto })
    async getChain(@Query() query: GetChainQueryDto) {
        this.checkApiAvaibilityOrFail();
        return this.appService.getChain(query);
    }

    @Get("/gas-price")
    @ApiOkResponse({ type: GasPriceResponseDto })
    async getGasPrice(@Query() query: GetGasPriceQueryDto) {
        this.checkApiAvaibilityOrFail();
        return this.appService.getGasPrice(query);
    }

    @Get("/blocks")
    @ApiOkResponse({ type: BlockListResponseDto })
    async getBlocks(@Query() query: GetBlocksQueryDto) {
        this.checkApiAvaibilityOrFail();
        return this.appService.getBlocks(query);
    }

    @Get("/microblocks")
    @ApiOkResponse({ type: MicroblockListResponseDto })
    async getMicroblocks(@Query() query: GetMicroblocksQueryDto) {
        this.checkApiAvaibilityOrFail();
        return this.appService.getMicroblocks(query);
    }

    @Get("/accounts")
    @ApiOkResponse({ type: AccountListResponseDto })
    async getAccounts(@Query() query: GetAccountsQueryDto) {
        this.checkApiAvaibilityOrFail();
        return this.appService.getAccounts(query);
    }

    @Get("/account-history")
    @ApiOkResponse({ type: AccountHistoryListResponseDto })
    async getAccountHistory(@Query() query: GetAccountHistoryQueryDto) {
        this.checkApiAvaibilityOrFail();
        return this.appService.getAccountHistory(query);
    }

    @Get("/organizations")
    @ApiOkResponse({ type: OrganizationListResponseDto })
    async getOrganizations(@Query() query: GetOrganizationsQueryDto) {
        this.checkApiAvaibilityOrFail();
        return this.appService.getOrganizations(query);
    }

    @Get("/applications")
    @ApiOkResponse({ type: ApplicationListResponseDto })
    async getApplications(@Query() query: GetApplicationsQueryDto) {
        this.checkApiAvaibilityOrFail();
        return this.appService.getApplications(query);
    }

    @Get("/validator-nodes")
    @ApiOkResponse({ type: ValidatorNodeListResponseDto })
    async getValidatorNodes(@Query() query: GetValidatorNodesQueryDto) {
        this.checkApiAvaibilityOrFail();
        return this.appService.getValidatorNodes(query);
    }

    @Get("/virtual-blockchains")
    @ApiOkResponse({ type: VirtualBlockchainListResponseDto })
    async getVirtualBlockchains(@Query() query: GetVirtualBlockchainsQueryDto) {
        this.checkApiAvaibilityOrFail();
        return this.appService.getVirtualBlockchains(query);
    }

    @Get("/voting-powers")
    @ApiOkResponse({ type: VotingPowerListResponseDto })
    async getVotingPowers(@Query() query: GetVotingPowersQueryDto) {
        this.checkApiAvaibilityOrFail();
        return this.appService.getVotingPowers(query);
    }

    checkApiAvaibilityOrFail() {
        const { dbHeight, chainHeight, synchronized } = this.syncState.getStatus();
        if (!synchronized) {
            throw new ServiceUnavailableException(
                `the indexer is not synchronized (height ${dbHeight} / ${chainHeight})`
            );
        }
    }
}
