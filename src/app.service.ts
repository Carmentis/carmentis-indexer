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
import {
    IBlockDto,
    IMicroblockDto,
    IAccountDto,
    IAccountHistoryDto,
    IOrganizationDto,
    IApplicationDto,
    IValidatorNodeDto,
} from "./dto/interface.dto";
import {
    GetBlocksQueryDto,
    GetMicroblocksQueryDto,
    GetAccountsQueryDto,
    GetAccountHistoryQueryDto,
    GetOrganizationsQueryDto,
    GetApplicationsQueryDto,
    GetValidatorNodesQueryDto,
} from "./dto/query.dto";
import { FindOptionsWhere, MoreThanOrEqual, LessThanOrEqual, Between } from "typeorm";

const MAX_LIMIT = 50;

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
            where.milliseconds = timestampRange;
        }

        const entities = await BlockEntity.find({
            where,
            order: sort ? { [sort]: order } : undefined,
            take: this.limit(limit),
        });
        const res: IBlockDto[] = [];
        for (const e of entities) {
            const signatures = await BlockSignatureEntity.find({
                where: { height: e.height },
            });
            const block: IBlockDto = { ...e, signatures };
            res.push(block);
        }
        return res;
    }

    async getMicroblocks(query: GetMicroblocksQueryDto) {
        const {
            hash,
            block_height,
            vb_id,
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

        const entities = await MicroblockEntity.find({
            where,
            order: sort ? { [sort]: order } : undefined,
            take: this.limit(limit),
        });
        return entities.map((e) => {
            const microblock: IMicroblockDto = { ...e };
            return microblock;
        });
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

        const entities = await AccountEntity.find({
            where,
            take: this.limit(limit),
        });
        const res: IAccountDto[] = [];
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
            const account: IAccountDto = {
                ...e,
                escrowLocks,
                vestingLocks,
                stakingLocks,
            };
            res.push(account);
        }
        return res;
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

        const entities= await AccountHistoryEntity.find({
            where,
            order: sort ? { [sort]: order } : undefined,
            take: this.limit(limit),
        });
        return entities.map((e) => {
            const accountHistory: IAccountHistoryDto = { ...e };
            return accountHistory;
        });
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

        const entities = await OrganizationEntity.find({
            where,
            take: this.limit(limit),
        });
        return entities.map((e) => {
            const organization: IOrganizationDto = { ...e };
            return organization;
        });
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

        const entities = await ApplicationEntity.find({
            where,
            take: this.limit(limit),
        });
        return entities.map((e) => {
            const application: IApplicationDto = { ...e };
            return application;
        });
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

        const entities = await ValidatorNodeEntity.find({
            where,
            take: this.limit(limit),
        });
        return entities.map((e) => {
            const validatorNode: IValidatorNodeDto = { ...e };
            return validatorNode;
        });
    }

    private range(gte: number|undefined, lte: number|undefined) {
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

    private limit(limit: number|undefined) {
        return limit === undefined ? MAX_LIMIT : Math.min(MAX_LIMIT, limit);
    }
}
