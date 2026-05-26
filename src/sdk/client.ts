import {
    ChainQuery,
    GasPriceQuery,
    AccountsQuery,
    BlocksQuery,
    MicroblocksQuery,
    AccountHistoryQuery,
    OrganizationsQuery,
    ApplicationsQuery,
    ValidatorNodesQuery,
    VotingPowersQuery,
    AnyQuery,
} from "../dto/query-interface.dto";
import {
    ChainResponse,
    GasPriceResponse,
    AccountListResponse,
    AccountHistoryListResponse,
    BlockListResponse,
    MicroblockListResponse,
    OrganizationListResponse,
    ApplicationListResponse,
    ValidatorNodeListResponse,
    VotingPowerListResponse,
} from "../dto/response-interface.dto";

export class Indexer {
    private readonly endpoint: string;

    constructor(endpoint: string) {
        this.endpoint = endpoint;
    }

    async getChain(parameters: ChainQuery) {
        return (await this.query("chain", parameters)) as ChainResponse;
    }

    async getGasPrice(parameters: GasPriceQuery) {
        return (await this.query("gas-price", parameters)) as GasPriceResponse;
    }

    async getBlocks(parameters: BlocksQuery = {}) {
        return (await this.query("blocks", parameters)) as BlockListResponse;
    }

    async getMicroblocks(parameters: MicroblocksQuery = {}) {
        return (await this.query(
            "microblocks",
            parameters,
        )) as MicroblockListResponse;
    }

    async getOrganizations(parameters: OrganizationsQuery = {}) {
        return (await this.query(
            "organizations",
            parameters,
        )) as OrganizationListResponse;
    }

    async getApplications(parameters: ApplicationsQuery = {}) {
        return (await this.query(
            "applications",
            parameters,
        )) as ApplicationListResponse;
    }

    async getValidatorNodes(parameters: ValidatorNodesQuery = {}) {
        return (await this.query(
            "validator-nodes",
            parameters,
        )) as ValidatorNodeListResponse;
    }

    async getAccounts(parameters: AccountsQuery = {}) {
        return (await this.query(
            "accounts",
            parameters,
        )) as AccountListResponse;
    }

    async getAccountHistory(parameters: AccountHistoryQuery = {}) {
        return (await this.query(
            "account-history",
            parameters,
        )) as AccountHistoryListResponse;
    }

    async getVotingPower(parameters: VotingPowersQuery = {}) {
        return (await this.query(
            "voting-powers",
            parameters,
        )) as VotingPowerListResponse;
    }

    private async query(type: string, parameters: AnyQuery): Promise<unknown> {
        const url = new URL(`${this.endpoint}/api/v1/${type}`);
        for (const [key, value] of Object.entries(parameters)) {
            url.searchParams.set(key, String(value));
        }
        const response = await fetch(url);

        if (!response.ok) {
            const text = await response.text();
            throw new Error(
                `HTTP ${response.status} ${response.statusText}: ${text}`,
            );
        }
        return response.json();
    }
}
