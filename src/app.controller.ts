import {
    Controller,
    Get,
    Query,
    ServiceUnavailableException,
} from "@nestjs/common";
import {
    GetChainQueryDto,
    GetGasPriceQueryDto,
    SearchQueryDto,
    GetBlocksQueryDto,
    GetMicroblocksQueryDto,
    GetMicroblockProofQueryDto,
    GetMicroblockStatsQueryDto,
    GetAccountsQueryDto,
    GetAccountHistoryQueryDto,
    GetAccountProofQueryDto,
    GetOrganizationsQueryDto,
    GetApplicationsQueryDto,
    GetValidatorNodesQueryDto,
    GetValidatorStatsQueryDto,
    GetNodeStatusQueryDto,
    GetVirtualBlockchainsQueryDto,
    GetVotingPowersQueryDto,
} from "./dto/query.dto";
import {
    GasPriceResponseDto,
    ChainResponseDto,
    SearchListResponseDto,
    BlockListResponseDto,
    MicroblockListResponseDto,
    MicroblockProofResponseDto,
    MicroblockStatsResponseDto,
    AccountListResponseDto,
    AccountHistoryListResponseDto,
    AccountProofResponseDto,
    OrganizationListResponseDto,
    ApplicationListResponseDto,
    ValidatorNodeListResponseDto,
    ValidatorStatsResponseDto,
    NodeStatusResponseDto,
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

    @Get("/search")
    @ApiOkResponse({ type: SearchListResponseDto })
    async search(@Query() query: SearchQueryDto) {
        this.checkApiAvaibilityOrFail();
        return this.appService.search(query);
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

    @Get("/microblock-proof")
    @ApiOkResponse({ type: MicroblockProofResponseDto })
    async getMicroblockProof(@Query() query: GetMicroblockProofQueryDto) {
        this.checkApiAvaibilityOrFail();
        return this.appService.getMicroblockProof(query);
    }

    @Get("/microblock-stats")
    @ApiOkResponse({ type: MicroblockStatsResponseDto })
    async getMicroblockStats(@Query() query: GetMicroblockStatsQueryDto) {
        this.checkApiAvaibilityOrFail();
        return this.appService.getMicroblockStats(query);
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

    @Get("/account-proof")
    @ApiOkResponse({ type: AccountProofResponseDto })
    async getAccountProof(@Query() query: GetAccountProofQueryDto) {
        this.checkApiAvaibilityOrFail();
        return this.appService.getAccountProof(query);
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

    @Get("/validator-stats")
    @ApiOkResponse({ type: ValidatorStatsResponseDto })
    async getValidatorStats(@Query() query: GetValidatorStatsQueryDto) {
        this.checkApiAvaibilityOrFail();
        return this.appService.getValidatorStats(query);
    }

    @Get("/node-status")
    @ApiOkResponse({ type: NodeStatusResponseDto })
    async getNodeStatus(@Query() query: GetNodeStatusQueryDto) {
        this.checkApiAvaibilityOrFail();
        return this.appService.getNodeStatus(query);
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
        const { dbHeight, chainHeight, synchronized } =
            this.syncState.getStatus();
        if (!synchronized) {
            throw new ServiceUnavailableException(
                `the indexer is not synchronized (height ${dbHeight} / ${chainHeight})`,
            );
        }
    }
}
