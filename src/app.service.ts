import {
    Injectable,
    BadRequestException,
    InternalServerErrorException,
} from "@nestjs/common";
import { ChainEntity } from "./entities/chain.entity";
import { BlockEntity, BlockSignatureEntity } from "./entities/block.entity";
import { MicroblockEntity } from "./entities/microblock.entity";
import { MicroblockStatsEntity } from "./entities/microblock-stats.entity";
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
import { ValidatorStatsEntity } from "./entities/validator-stats.entity";
import { VirtualBlockchainEntity } from "./entities/virtual-blockchain.entity";
import { VotingPowerEntity } from "./entities/voting-power.entity";
import {
    Root,
    ChainResponse,
    GasPriceResponse,
    Search,
    SearchListResponse,
    Block,
    BlockListResponse,
    Microblock,
    MicroblockListResponse,
    MicroblockProofResponse,
    MicroblockCount,
    MicroblockStatsResponse,
    Account,
    AccountListResponse,
    AccountHistory,
    AccountHistoryListResponse,
    AccountProofResponse,
    Organization,
    OrganizationListResponse,
    Application,
    ApplicationListResponse,
    ValidatorNode,
    ValidatorNodeListResponse,
    ValidatorStatsResponse,
    NodeStatusResponse,
    VirtualBlockchain,
    VirtualBlockchainListResponse,
    VotingPower,
    VotingPowerListResponse,
} from "./dto/response-interface.dto";
import { SearchObjectType } from "./dto/query-interface.dto";
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
    GetVirtualBlockchainsQueryDto,
    GetVotingPowersQueryDto,
    GetNodeStatusQueryDto,
} from "./dto/query.dto";
import {
    FindOptionsWhere,
    MoreThanOrEqual,
    LessThanOrEqual,
    Between,
} from "typeorm";
import { MicroblockStorageService } from "./microblock-storage.service";
import { QueryService } from "./query.service";
import { SearchService } from "./search.service";
import { CometbftApiService } from "./cometbft-api.service";
import { NodeStatusService } from "./node-status.service";
import {
    N_VIRTUAL_BLOCKCHAINS,
    BalanceAvailability,
    type Lock,
    LockType,
    Utils,
    BlockchainUtils
} from "@cmts-dev/carmentis-sdk-core";

const MAX_LIMIT = 100;

@Injectable()
export class AppService {
    constructor(
        private readonly microblockStorageService: MicroblockStorageService,
        private readonly queryService: QueryService,
        private readonly searchService: SearchService,
        private readonly cometbft: CometbftApiService,
        private readonly nodeStatusService: NodeStatusService,
    ) {}

    getRoot() {
        const response: Root = {
            name: 'Carmentis Indexer API',
            swagger: '/swagger',
            openapi: '/swagger-json',
            currentNode: this.cometbft.getCurrentNodeUrl(),
        };
        return response;
    }

    async getChain(query: GetChainQueryDto) {
        const chain = await ChainEntity.findOneBy({ id: 1 });
        if (chain === null) {
            throw new InternalServerErrorException(`object 'chain' not found`);
        }
        const height = (await BlockEntity.maximum("height", {})) || 0;
        const objectCounts =
            await this.queryService.getVirtualBlockchainCounts();
        const response: ChainResponse = {
            version: chain.version,
            network: chain.network,
            earliestBlockHash: chain.earliestBlockHash,
            height,
            objectCounts,
        };
        return response;
    }

    async getGasPrice(query: GetGasPriceQueryDto) {
        const { height_gte, height_lte } = query;

        const where: FindOptionsWhere<MicroblockEntity> = {};

        const heightRange = this.range(height_gte, height_lte);
        if (heightRange !== null) {
            where.blockHeight = heightRange;
        }

        const res: GasPriceResponse | undefined =
            await MicroblockEntity.createQueryBuilder("microblock")
                .select("MIN(microblock.gasPrice)", "min")
                .addSelect("MAX(microblock.gasPrice)", "max")
                .addSelect("AVG(microblock.gasPrice)", "average")
                .addSelect("COUNT(*)", "microblocks")
                .where(where)
                .getRawOne();
        if (res === undefined) {
            throw new InternalServerErrorException(
                `unable to retrieve gas price data`,
            );
        }
        const gasPrice: GasPriceResponse = res;
        return gasPrice;
    }

    async search(query: SearchQueryDto) {
        const { q, type, order, limit: providedLimit } = query;
        const limit = providedLimit === undefined ? MAX_LIMIT : Math.min(MAX_LIMIT, providedLimit);
        const items: Search[] = [];

        if (type == SearchObjectType.ACCOUNT || type == SearchObjectType.ALL) {
            await this.searchService.searchAccounts(q, items, limit);
        }
        if (
            type == SearchObjectType.APPLICATION ||
            type == SearchObjectType.ALL
        ) {
            await this.searchService.searchApplications(q, items, limit);
        }
        if (type == SearchObjectType.BLOCK || type == SearchObjectType.ALL) {
            await this.searchService.searchBlocks(q, items, limit);
        }
        if (
            type == SearchObjectType.MICROBLOCK ||
            type == SearchObjectType.ALL
        ) {
            await this.searchService.searchMicroblocks(q, items, limit);
        }
        if (type == SearchObjectType.NODE || type == SearchObjectType.ALL) {
            await this.searchService.searchNodes(q, items, limit);
        }
        if (
            type == SearchObjectType.ORGANIZATION ||
            type == SearchObjectType.ALL
        ) {
            await this.searchService.searchOrganizations(q, items, limit);
        }
        if (
            type == SearchObjectType.VIRTUAL_BLOCKCHAIN ||
            type == SearchObjectType.ALL
        ) {
            await this.searchService.searchVirtualBlockchains(q, items, limit);
        }
        const hasMore = items.length > limit;
        const response: SearchListResponse = { items, hasMore };
        return response;
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
        const items: Block[] = [];
        for (const e of entities) {
            const signatures = await BlockSignatureEntity.find({
                where: { height: e.height },
            });
            const block: Block = { ...e, signatures };
            items.push(block);
        }
        const hasMore = this.hasMore(items, take);
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
        const items: Microblock[] = [];
        for (const e of entities) {
            const microblock: Microblock = { ...e };
            if (include_content) {
                const rawContent =
                    await this.microblockStorageService.loadMicroblock(e.hash);
                microblock.content = rawContent.toString("base64");
            }
            items.push(microblock);
        }
        const hasMore = this.hasMore(items, take);
        const response: MicroblockListResponse = { items, hasMore };
        return response;
    }

    async getAccounts(query: GetAccountsQueryDto) {
        const {
            id,
            balance_gte,
            balance_lte,
            with_escrow,
            with_staking,
            with_vesting,
            sort,
            order,
            limit,
            public_key,
        } = query;

        const where: FindOptionsWhere<AccountEntity> = {};

        this.checkSortConsistency(!!sort, !!order);

        if (id !== undefined) {
            where.id = id;
        }

        if (public_key !== undefined) {
            where.publicKey = public_key;
        }

        const balanceRange = this.range(balance_gte, balance_lte);
        if (balanceRange !== null) {
            where.balance = balanceRange;
        }

        const take = this.take(limit);
        const entities = await AccountEntity.find({
            where,
            order: sort ? { [sort]: order } : undefined,
            take,
        });
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
            if (
                (!with_staking || stakingLocks.length > 0) &&
                (!with_vesting || vestingLocks.length > 0) &&
                (!with_escrow || escrowLocks.length > 0)
            ) {
                const balance = this.getAccountBalanceAvaibility(
                    e.balance,
                    stakingLocks,
                    vestingLocks,
                    escrowLocks,
                );
                const breakdown = balance.getBreakdown();
                const account: Account = {
                    ...e,
                    spendable: breakdown.spendable,
                    lockedInStaking: breakdown.staked,
                    lockedInVesting: breakdown.vested,
                    lockedInEscrows: breakdown.escrowed,
                    stakingLocks,
                    vestingLocks,
                    escrowLocks,
                };
                items.push(account);
            }
        }
        const hasMore = this.hasMore(items, take);
        const response: AccountListResponse = { items, hasMore };
        return response;
    }

    getAccountBalanceAvaibility(
        balance: number,
        stakingLocks: StakingLockEntity[],
        vestingLocks: VestingLockEntity[],
        escrowLocks: EscrowLockEntity[],
    ) {
        const locks: Lock[] = []
        for (const lock of stakingLocks) {
            locks.push({
                type: LockType.NodeStaking,
                lockedAmountInAtomics: lock.amount,
                parameters: {
                    validatorNodeId: Utils.binaryFromHexa(lock.validatorNodeId),
                    plannedUnlockAmountInAtomics: lock.plannedSlashingAmountInAtomics,
                    plannedUnlockTimestamp: lock.plannedUnlockTimestamp,
                    slashed: lock.slashed,
                    plannedSlashingAmountInAtomics: lock.plannedUnlockAmountInAtomics,
                    plannedSlashingTimestamp: lock.plannedUnlockTimestamp,
                }
            });
        }
        for (const lock of vestingLocks) {
            locks.push({
                type: LockType.Vesting,
                lockedAmountInAtomics: lock.amount,
                parameters: {
                    initialVestedAmountInAtomics: lock.initialVestedAmountInAtomics,
                    cliffStartTimestamp: lock.cliffStartTimestamp,
                    cliffDurationDays: lock.cliffDurationDays,
                    vestingDurationDays: lock.vestingDurationDays,
                }
            });
        }
        for (const lock of escrowLocks) {
            locks.push({
                type: LockType.Escrow,
                lockedAmountInAtomics: lock.amount,
                parameters: {
                    escrowIdentifier: Utils.binaryFromHexa(lock.escrowIdentifier),
                    fundEmitterAccountId: Utils.binaryFromHexa(lock.fundEmitterAccountId),
                    transferAuthorizerAccountId: Utils.binaryFromHexa(lock.transferAuthorizerAccountId),
                    startTimestamp: lock.startTimestamp,
                    durationDays: lock.durationDays,
                }
            });
        }
        return new BalanceAvailability(balance, locks);
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
            where.timestamp = timestampRange;
        }

        const take = this.take(limit);
        const entities = await AccountHistoryEntity.find({
            where,
            order: sort ? { [sort]: order } : undefined,
            take,
        });
        const items = entities.map((e) => {
            const accountHistory: AccountHistory = { ...e };
            return accountHistory;
        });
        const hasMore = this.hasMore(items, take);
        const response: AccountHistoryListResponse = { items, hasMore };
        return response;
    }

    async getOrganizations(query: GetOrganizationsQueryDto) {
        const { vb_id, account_id, name, order, limit } = query;

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
        const items = entities.map((e) => {
            const organization: Organization = { ...e };
            return organization;
        });
        const hasMore = this.hasMore(items, take);
        const response: OrganizationListResponse = { items, hasMore };
        return response;
    }

    async getApplications(query: GetApplicationsQueryDto) {
        const { vb_id, organization_id, name, order, limit } = query;

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
        const items = entities.map((e) => {
            const application: Application = { ...e };
            return application;
        });
        const hasMore = this.hasMore(items, take);
        const response: ApplicationListResponse = { items, hasMore };
        return response;
    }

    async getValidatorNodes(query: GetValidatorNodesQueryDto) {
        const { vb_id, organization_id, public_key, address, is_validator, order, limit } =
            query;

        const where: FindOptionsWhere<ValidatorNodeEntity> = {};

        if (vb_id !== undefined) {
            where.virtualBlockchainId = vb_id;
        }
        if (organization_id !== undefined) {
            where.organizationId = organization_id;
        }
        if (public_key !== undefined) {
            where.cometPublicKey = public_key.replace(/=*$/, "");
        }
        if (address !== undefined) {
            where.address = address;
        }
        if (is_validator) {
            where.currentVotingPower = MoreThanOrEqual(1);
        }

        const take = this.take(limit);
        const entities = await ValidatorNodeEntity.find({
            where,
            take,
        });
        const items: ValidatorNode[] = [];
        for (const e of entities) {
            const status = await this.nodeStatusService.getLastNodeStatus(e.virtualBlockchainId);
            const validatorNode: ValidatorNode = {
                ...e,
                status: status.status,
                statusTimestamp: status.statusTimestamp,
                moniker: status.moniker,
            };
            items.push(validatorNode);
        }
        const hasMore = this.hasMore(items, take);
        const response: ValidatorNodeListResponse = { items, hasMore };
        return response;
    }

    async getNodeStatus(query: GetNodeStatusQueryDto) {
        const { node_id } = query;
        const status = await this.nodeStatusService.getCurrentNodeStatus(node_id);
        const response: NodeStatusResponse = {
            nodeId: node_id,
            ...status
        }
        return response;
    }

    async getVirtualBlockchains(query: GetVirtualBlockchainsQueryDto) {
        const { vb_id, type, sort, order, limit } = query;

        const where: FindOptionsWhere<VirtualBlockchainEntity> = {};

        if (vb_id !== undefined) {
            where.virtualBlockchainId = vb_id;
        }
        if (type !== undefined) {
            where.type = type;
        }

        const take = this.take(limit);
        const entities = await VirtualBlockchainEntity.find({
            where,
            order: sort ? { [sort]: order } : undefined,
            take,
        });
        const items = entities.map((e) => {
            const virtualBlockchain: VirtualBlockchain = { ...e };
            return virtualBlockchain;
        });
        const hasMore = this.hasMore(items, take);
        const response: VirtualBlockchainListResponse = { items, hasMore };
        return response;
    }

    async getVotingPowers(query: GetVotingPowersQueryDto) {
        const { node_id, sort, order, limit } = query;

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
        const items = entities.map((e) => {
            const votingPower: VotingPower = { ...e };
            return votingPower;
        });
        const hasMore = this.hasMore(items, take);
        const response: VotingPowerListResponse = { items, hasMore };
        return response;
    }

    async getMicroblockProof(query: GetMicroblockProofQueryDto) {
        const { hash } = query;
        const { proof } = await this.cometbft.getMicroblockProof(hash);
        const { block, microblock, virtualBlockchain } = proof;
        const encodedState = BlockchainUtils.encodeVirtualBlockchainState(virtualBlockchain.state);
        const serializedState = Buffer.from(encodedState).toString("base64");
        const merkleWitnesses = virtualBlockchain.merkleWitnesses.map((bin) =>
            Utils.binaryToHexa(bin)
        );
        const radixProof = virtualBlockchain.radixProof.map((bin) =>
            Utils.binaryToHexa(bin)
        );
        const response: MicroblockProofResponse = {
            block: {
                height: block.height,
                vbRadixHash: Utils.binaryToHexa(block.vbRadixHash),
                tokenRadixHash: Utils.binaryToHexa(block.tokenRadixHash),
                storageHash: Utils.binaryToHexa(block.storageHash),
                appHash: Utils.binaryToHexa(block.appHash),
            },
            microblock: {
                virtualBlockchainId: Utils.binaryToHexa(microblock.virtualBlockchainId),
                height: microblock.height,
                hash: Utils.binaryToHexa(microblock.hash),
            },
            virtualBlockchain: {
                serializedState,
                merkleWitnesses,
                radixProof,
            },
        };
        return response;
    }

    async getAccountProof(query: GetAccountProofQueryDto) {
        const { account_id: accountId } = query;
        const { proof } = await this.cometbft.getAccountProof(accountId);
        const { block, account } = proof;
        const encodedState = BlockchainUtils.encodeAccountState(account.state);
        const serializedState = Buffer.from(encodedState).toString("base64");
        const radixProof = account.radixProof.map((bin) =>
            Utils.binaryToHexa(bin)
        );
        const response: AccountProofResponse = {
            block: {
                height: block.height,
                vbRadixHash: Utils.binaryToHexa(block.vbRadixHash),
                tokenRadixHash: Utils.binaryToHexa(block.tokenRadixHash),
                storageHash: Utils.binaryToHexa(block.storageHash),
                appHash: Utils.binaryToHexa(block.appHash),
            },
            account: {
                virtualBlockchainId: Utils.binaryToHexa(account.virtualBlockchainId),
                serializedState,
                radixProof,
            },
        };
        return response;
    }

    async getMicroblockStats(query: GetMicroblockStatsQueryDto) {
        const {
            vb_type,
            is_genesis,
            timestamp_gte,
            timestamp_lte,
        } = query;

        const where: FindOptionsWhere<MicroblockStatsEntity> = {};

        if (vb_type !== undefined) {
            where.vbType = vb_type;
        }
        if (is_genesis !== undefined) {
            where.isGenesis = is_genesis;
        }

        const timestampRange = this.range(timestamp_gte, timestamp_lte);
        if (timestampRange !== null) {
            where.hourBucketTimestamp = timestampRange;
        }

        const rows = await MicroblockStatsEntity.createQueryBuilder('stats')
            .select('stats.vbType', 'vbType')
            .addSelect('stats.isGenesis', 'isGenesis')
            .addSelect('SUM(stats.counter)', 'count')
            .groupBy('stats.vbType')
            .addGroupBy('stats.isGenesis')
            .where(where)
            .getRawMany();

        // To make client processing more straightforward, we construct a response that includes
        // all combinations, including those not returned by the query.
        const stats: MicroblockCount[] = [];

        for (let vbType = 0; vbType < N_VIRTUAL_BLOCKCHAINS; vbType++) {
            for (const isGenesis of [ true, false ]) {
                const row = rows.find((r) => r.vbType === vbType && !!r.isGenesis === isGenesis);
                stats.push({
                    vbType,
                    isGenesis,
                    count: row?.count || 0
                });
            }
        }
        const response: MicroblockStatsResponse = { stats };
        return response;
    }

    async getValidatorStats(query: GetValidatorStatsQueryDto) {
        const {
            node_id,
            timestamp_gte,
            timestamp_lte,
        } = query;

        const where: FindOptionsWhere<ValidatorStatsEntity> = {};

        if (node_id !== undefined) {
            where.nodeId = node_id;
        }

        const timestampRange = this.range(timestamp_gte, timestamp_lte);
        if (timestampRange !== null) {
            where.hourBucketTimestamp = timestampRange;
        }

        const stats = await ValidatorStatsEntity.createQueryBuilder('stats')
            .select('stats.nodeId', 'nodeId')
            .addSelect('SUM(stats.proposedBlocks)', 'proposedBlocks')
            .addSelect('SUM(stats.signedBlocks)', 'signedBlocks')
            .groupBy('stats.nodeId')
            .where(where)
            .getRawMany();

        const response: ValidatorStatsResponse = { stats };
        return response;
    }

    private range(gte: number | undefined, lte: number | undefined) {
        if (gte !== undefined && lte !== undefined) {
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
            (limit === undefined ? MAX_LIMIT : Math.min(MAX_LIMIT, limit)) + 1
        );
    }

    private hasMore(items: unknown[], take: number) {
        if (items.length > take - 1) {
            items.pop();
            return true;
        }
        return false;
    }
}
