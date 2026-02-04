import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class VirtualBlockchainEntity extends BaseEntity {
	@PrimaryColumn()
	vbId: string;
}

@Entity()
export class BlockEntity extends BaseEntity {
	@PrimaryColumn()
	height: number;

	@Column()
	appHash: string;
}

@Entity()
export class MicroblockEntity extends BaseEntity {
	@PrimaryColumn()
	hash: string;
}
