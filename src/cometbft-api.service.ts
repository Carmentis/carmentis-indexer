import { Injectable, OnModuleInit } from '@nestjs/common';
import { Tendermint37Client } from '@cosmjs/tendermint-rpc';

@Injectable()
export class CometbftApiService implements OnModuleInit {

  private readonly nodeUrl: string;
  private client: Tendermint37Client;
  constructor() {
    this.nodeUrl = process.env.NODE_URL || 'https://node1.server1.devnet.carmentis.io';
  }

  async onModuleInit() {
    this.client = await Tendermint37Client.connect(this.nodeUrl);
  }

  async getBlockAtHeight(height: number) {
    const client = await Tendermint37Client.connect(this.nodeUrl);
    return await client.block(height);
  }

  async getLatestBlock() {
    const client = await Tendermint37Client.connect(this.nodeUrl);
    const status = await client.status();
    return status.syncInfo.latestBlockHeight;
  }
}