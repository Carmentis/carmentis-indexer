import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SyncService } from './sync.service';
import { CometbftApiService } from './cometbft-api.service';
import { StateCommitService } from './state-commit.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  BlockEntity,
  MicroblockEntity,
  VirtualBlockchainEntity,
} from './entities/virtual-blockchain.entity';

const entities = [BlockEntity, MicroblockEntity, VirtualBlockchainEntity];
@Module({
  imports: [
    TypeOrmModule.forFeature(entities),
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'db.sqlite',
      entities: entities,
      synchronize: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService, SyncService, CometbftApiService, StateCommitService],
})
export class AppModule {}
