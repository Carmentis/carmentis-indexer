import { Injectable, Logger } from '@nestjs/common';
import { Microblock } from '@cmts-dev/carmentis-sdk/server';
import { BlockEntity } from './entities/virtual-blockchain.entity';

@Injectable()
export class StateCommitService {
	private readonly logger = new Logger();

	async commitBlock(blockHeight: number, appHash: string) {
		this.logger.log(
			`Committing block ${blockHeight} with appHash ${appHash}`,
		);
		await BlockEntity.save({ height: blockHeight, appHash });
	}

	async commitMicroblockToState(microblock: Microblock) {
		// TODO: commit microblock to state
	}
}
