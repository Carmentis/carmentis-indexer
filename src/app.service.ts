import { Injectable, BadRequestException } from "@nestjs/common";
import { BlockEntity, BlockSignatureEntity } from "./entities/block.entity";
import { MicroblockEntity } from "./entities/microblock.entity";
import {
    AccountEntity,
    AccountHistoryEntity,
    EscrowLockEntity,
    VestingLockEntity,
    StakingLockEntity,
} from "./entities/account.entity";
import { OrganizationEntity } from "./entities/organization.entity";
import { ApplicationEntity } from "./entities/application.entity";
import { ValidatorNodeEntity } from "./entities/validator-node.entity";
import { VotingPowerEntity } from "./entities/voting-power.entity";
import {
    Block,
    BlockListResponse,
    Microblock,
    MicroblockListResponse,
    Account,
    AccountListResponse,
    AccountHistory,
    AccountHistoryListResponse,
    Organization,
    OrganizationListResponse,
    Application,
    ApplicationListResponse,
    ValidatorNode,
    ValidatorNodeListResponse,
    VotingPower,
    VotingPowerListResponse,
} from "./dto/response-interface.dto";
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
    FindOptionsWhere,
    MoreThanOrEqual,
    LessThanOrEqual,
    Between,
} from "typeorm";
import { MicroblockStorageService } from "./microblock-storage.service";

const MAX_LIMIT = 100;

@Injectable()
export class AppService {
    getHello(): string {
        return "Hello World!";
    }

    async getBlocks(query: GetBlocksQueryDto) {
        const {
            height,
            height_gte,
            height_lte,
            timestamp_gte,
            timestamp_lte,
            sort,
            order,
            limit,
        } = query;

        const where: FindOptionsWhere<BlockEntity> = {};

        this.checkSortConsistency(!!sort, !!order);

        const heightRange = this.range(height_gte, height_lte);
        if (height !== undefined) {
            if (heightRange !== null) {
                throw new BadRequestException(
                    "'height_gte'/'height_lte' cannot be used in conjunction with 'height'",
                );
            }
            where.height = height;
        }
        if (heightRange !== null) {
            where.height = heightRange;
        }

        const timestampRange = this.range(timestamp_gte, timestamp_lte);
        if (timestampRange !== null) {
            where.milliseconds = timestampRange;
        }

        const take = this.take(limit);
        const entities = await BlockEntity.find({
            where,
            order: sort ? { [sort]: order } : undefined,
            take,
        });
        const hasMore = this.hasMore(entities, take);
        const items: Block[] = [];
        for (const e of entities) {
            const signatures = await BlockSignatureEntity.find({
                where: { height: e.height },
            });
            const block: Block = { ...e, signatures };
            items.push(block);
        }
        const response: BlockListResponse = { items, hasMore };
        return response;
    }

    async getMicroblocks(query: GetMicroblocksQueryDto) {
        const {
            hash,
            block_height,
            vb_id,
            include_content,
            sort,
            order,
            limit,
        } = query;

        const where: FindOptionsWhere<MicroblockEntity> = {};

        this.checkSortConsistency(!!sort, !!order);

        if (hash !== undefined) {
            where.hash = hash;
        }
        if (block_height !== undefined) {
            where.blockHeight = block_height;
        }
        if (vb_id !== undefined) {
            where.virtualBlockchainId = vb_id;
        }

        const take = this.take(limit);
        const entities = await MicroblockEntity.find({
            where,
            order: sort ? { [sort]: order } : undefined,
            take,
        });
        const hasMore = this.hasMore(entities, take);
        const storageService = new MicroblockStorageService();
        const items: Microblock[] = [];
        for (const e of entities) {
            const microblock: Microblock = { ...e };
            if (include_content) {
                const rawContent = await storageService.loadMicroblock(e.hash);
                microblock.content = rawContent.toString("base64");
            }
            items.push(microblock);
        }
        const response: MicroblockListResponse = { items, hasMore };
        return response;
    }

    async getAccounts(query: GetAccountsQueryDto) {
        const {
            id,
            balance_gte,
            balance_lte,
            order,
            limit,
        } = query;

        const where: FindOptionsWhere<AccountEntity> = {};

        if (id !== undefined) {
            where.id = id;
        }

        const balanceRange = this.range(balance_gte, balance_lte);
        if (balanceRange !== null) {
            where.balance = balanceRange;
        }

        const take = this.take(limit);
        const entities = await AccountEntity.find({
            where,
            take,
        });
        const hasMore = this.hasMore(entities, take);
        const items: Account[] = [];
        for (const e of entities) {
            const escrowLocks = await EscrowLockEntity.find({
                where: { accountId: e.id },
            });
            const vestingLocks = await VestingLockEntity.find({
                where: { accountId: e.id },
            });
            const stakingLocks = await StakingLockEntity.find({
                where: { accountId: e.id },
            });
            const account: Account = {
                ...e,
                escrowLocks,
                vestingLocks,
                stakingLocks,
            };
            items.push(account);
        }
        const response: AccountListResponse = { items, hasMore };
        return response;
    }

    async getAccountHistory(query: GetAccountHistoryQueryDto) {
        const {
            account_id,
            linked_account_id,
            type,
            height,
            height_gte,
            height_lte,
            timestamp_gte,
            timestamp_lte,
            sort,
            order,
            limit,
        } = query;

        const where: FindOptionsWhere<AccountHistoryEntity> = {};

        this.checkSortConsistency(!!sort, !!order);

        if (account_id !== undefined) {
            where.accountId = account_id;
        }
        if (linked_account_id !== undefined) {
            where.linkedAccountId = linked_account_id;
        }
        if (type !== undefined) {
            where.type = type;
        }

        const heightRange = this.range(height_gte, height_lte);
        if (height !== undefined) {
            if (heightRange !== null) {
                throw new BadRequestException(
                    "'height_gte'/'height_lte' cannot be used in conjunction with 'height'"
                );
            }
            where.height = height;
        }
        if (heightRange !== null) {
            where.height = heightRange;
        }

        const timestampRange = this.range(timestamp_gte, timestamp_lte);
        if (timestampRange !== null) {
            where.timestamp = timestampRange;
        }

        const take = this.take(limit);
        const entities= await AccountHistoryEntity.find({
            where,
            order: sort ? { [sort]: order } : undefined,
            take,
        });
        const hasMore = this.hasMore(entities, take);
        const items = entities.map((e) => {
            const accountHistory: AccountHistory = { ...e };
            return accountHistory;
        });
        const response: AccountHistoryListResponse = { items, hasMore };
        return response;
    }

    async getOrganizations(query: GetOrganizationsQueryDto) {
        const {
            vb_id,
            account_id,
            name,
            order,
            limit,
        } = query;

        const where: FindOptionsWhere<OrganizationEntity> = {};

        if (vb_id !== undefined) {
            where.virtualBlockchainId = vb_id;
        }
        if (account_id !== undefined) {
            where.accountId = account_id;
        }
        if (name !== undefined) {
            where.name = name;
        }

        const take = this.take(limit);
        const entities = await OrganizationEntity.find({
            where,
            take,
        });
        const hasMore = this.hasMore(entities, take);
        const items = entities.map((e) => {
            const organization: Organization = { ...e };
            return organization;
        });
        const response: OrganizationListResponse = { items, hasMore };
        return response;
    }

    async getApplications(query: GetApplicationsQueryDto) {
        const {
            vb_id,
            organization_id,
            name,
            order,
            limit,
        } = query;

        const where: FindOptionsWhere<ApplicationEntity> = {};

        if (vb_id !== undefined) {
            where.virtualBlockchainId = vb_id;
        }
        if (organization_id !== undefined) {
            where.organizationId = organization_id;
        }
        if (name !== undefined) {
            where.name = name;
        }

        const take = this.take(limit);
        const entities = await ApplicationEntity.find({
            where,
            take,
        });
        const hasMore = this.hasMore(entities, take);
        const items = entities.map((e) => {
            const application: Application = { ...e };
            return application;
        });
        const response: ApplicationListResponse = { items, hasMore };
        return response;
    }

    async getValidatorNodes(query: GetValidatorNodesQueryDto) {
        const {
            vb_id,
            organization_id,
            public_key,
            address,
            order,
            limit,
        } = query;

        const where: FindOptionsWhere<ValidatorNodeEntity> = {};

        if (vb_id !== undefined) {
            where.virtualBlockchainId = vb_id;
        }
        if (organization_id !== undefined) {
            where.organizationId = organization_id;
        }
        if (public_key !== undefined) {
            where.cometPublicKey = public_key;
        }
        if (address !== undefined) {
            where.address = address;
        }

        const take = this.take(limit);
        const entities = await ValidatorNodeEntity.find({
            where,
            take,
        });
        const hasMore = this.hasMore(entities, take);
        const items = entities.map((e) => {
            const validatorNode: ValidatorNode = { ...e };
            return validatorNode;
        });
        const response: ValidatorNodeListResponse = { items, hasMore };
        return response;
    }

    async getVotingPowers(query: GetVotingPowersQueryDto) {
        const {
            node_id,
            sort,
            order,
            limit,
        } = query;

        const where: FindOptionsWhere<VotingPowerEntity> = {};

        this.checkSortConsistency(!!sort, !!order);

        if (node_id !== undefined) {
            where.nodeId = node_id;
        }

        const take = this.take(limit);
        const entities = await VotingPowerEntity.find({
            where,
            order: sort ? { [sort]: order } : undefined,
            take,
        });
        const hasMore = this.hasMore(entities, take);
        const items = entities.map((e) => {
            const votingPower: VotingPower = { ...e };
            return votingPower;
        });
        const response: VotingPowerListResponse = { items, hasMore };
        return response;
    }

    private range(gte: number | undefined, lte: number | undefined) {
        if (
            gte !== undefined &&
            lte !== undefined
        ) {
            return Between(gte, lte);
        }
        if (gte !== undefined) {
            return MoreThanOrEqual(gte);
        }
        if (lte !== undefined) {
            return LessThanOrEqual(lte);
        }
        return null;
    }

    private checkSortConsistency(hasSort: boolean, hasOrder: boolean) {
        if (hasOrder && !hasSort) {
            throw new BadRequestException(`'order' without 'sort'`);
        }
    }

    private take(limit: number | undefined) {
        return (
            limit === undefined
                ? MAX_LIMIT
                : Math.min(MAX_LIMIT, limit)
        ) + 1;
    }

    private hasMore(entities: unknown[], take: number) {
        if (entities.length > take - 1) {
            entities.pop();
            return true;
        }
        return false;
    }
}
