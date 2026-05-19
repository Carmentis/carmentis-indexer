import {
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

    async getBlocks(parameters: BlocksQuery = {}) {
        const res = (await this.query(
            "blocks",
            parameters,
        )) as BlockListResponse;
        return res;
    }

    async getMicroblocks(parameters: MicroblocksQuery = {}) {
        const res = (await this.query(
            "microblocks",
            parameters,
        )) as MicroblockListResponse;
        return res;
    }

    async getOrganizations(parameters: OrganizationsQuery = {}) {
        const res = (await this.query(
            "organizations",
            parameters,
        )) as OrganizationListResponse;
        return res;
    }

    async getApplications(parameters: ApplicationsQuery = {}) {
        const res = (await this.query(
            "applications",
            parameters,
        )) as ApplicationListResponse;
        return res;
    }

    async getValidatorNodes(parameters: ValidatorNodesQuery = {}) {
        const res = (await this.query(
            "validator-nodes",
            parameters,
        )) as ValidatorNodeListResponse;
        return res;
    }

    async getAccounts(parameters: AccountsQuery = {}) {
        const res = (await this.query(
            "accounts",
            parameters,
        )) as AccountListResponse;
        return res;
    }

    async getAccountHistory(parameters: AccountHistoryQuery = {}) {
        const res = (await this.query(
            "account-history",
            parameters,
        )) as AccountHistoryListResponse;
        return res;
    }

    async getVotingPower(parameters: VotingPowersQuery = {}) {
        const res = (await this.query(
            "voting-powers",
            parameters,
        )) as VotingPowerListResponse;
        return res;
    }

    private async query(
        type: string,
        parameters: AnyQuery,
    ): Promise<unknown> {
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
