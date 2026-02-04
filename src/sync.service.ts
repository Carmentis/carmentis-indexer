import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
	EncoderFactory,
	Microblock,
	ProviderFactory,
} from '@cmts-dev/carmentis-sdk/server';
import { CometbftApiService } from './cometbft-api.service';
import { StateCommitService } from './state-commit.service';

@Injectable()
export class SyncService implements OnModuleInit {
	private readonly logger = new Logger();
	constructor(
		private readonly cometbft: CometbftApiService,
		private readonly stateCommitService: StateCommitService,
	) {}

	async onModuleInit() {
		const nodeUrl =
			process.env.NODE_URL || 'https://node1.server1.devnet.carmentis.io';
		const provider =
			ProviderFactory.createInMemoryProviderWithExternalProvider(nodeUrl);

		// get the latest block
		this.logger.log('Starting sync process');
		const latestBlock = await this.cometbft.getLatestBlock();
		for (let index = 1; index <= latestBlock; index++) {
			// fetch the block
			this.logger.log(`Fetching block ${index}`);
			const blockResponse = await this.cometbft.getBlockAtHeight(index);

			// commit block information
			const encoder = EncoderFactory.bytesToHexEncoder();
			const block = blockResponse.block;
			const blockHeight = block.header.height;
			const appHashAtBlockHeight = encoder.encode(block.header.appHash);
			await this.stateCommitService.commitBlock(
				blockHeight,
				appHashAtBlockHeight,
			);

			// parse every transaction in the block
			const txs = blockResponse.block.txs;
			for (const tx of txs) {
				this.logger.log(`Parsing tx`);
				const mb = Microblock.loadFromSerializedMicroblock(tx);

				this.logger.log(`Apply mb ${mb.getHash().encode()} to state`);
				await this.stateCommitService.commitMicroblockToState(mb);
			}
		}
	}
}
