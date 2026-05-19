import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { SyncService } from "./sync.service";
import { CometbftApiService } from "./cometbft-api.service";
import { StateCommitService } from "./state-commit.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { VirtualBlockchainEntity } from "./entities/virtual-blockchain.entity";
import {
    AccountEntity,
    AccountHistoryEntity,
    EscrowLockEntity,
    VestingLockEntity,
    StakingLockEntity,
} from "./entities/account.entity";
import { ApplicationEntity } from "./entities/application.entity";
import { BlockEntity, BlockSignatureEntity } from "./entities/block.entity";
import { ChainEntity } from "./entities/chain.entity";
import { MicroblockEntity } from "./entities/microblock.entity";
import { OrganizationEntity } from "./entities/organization.entity";
import { ValidatorNodeEntity } from "./entities/validator-node.entity";
import { VotingPowerEntity } from "./entities/voting-power.entity";

const entities = [
    AccountEntity,
    AccountHistoryEntity,
    EscrowLockEntity,
    VestingLockEntity,
    StakingLockEntity,
    ApplicationEntity,
    BlockEntity,
    BlockSignatureEntity,
    ChainEntity,
    MicroblockEntity,
    OrganizationEntity,
    ValidatorNodeEntity,
    VirtualBlockchainEntity,
    VotingPowerEntity,
];

@Module({
    imports: [
        TypeOrmModule.forFeature(entities),
        TypeOrmModule.forRoot({
            type: "better-sqlite3",
            database: "db.sqlite",
            entities: entities,
            synchronize: true,
        }),
    ],
    controllers: [AppController],
    providers: [
        AppService,
        SyncService,
        CometbftApiService,
        StateCommitService,
    ],
})
export class AppModule {}
