import {
    BaseEntity,
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
} from "typeorm";

@Entity()
export class BlockEntity extends BaseEntity {
    @PrimaryColumn()
    height: number;

    @Column()
    // from commit.blockId.hash
    hash: string;
    @Column()
    blockVersion: number;
    @Column()
    appVersion: number;
    @Column()
    chainId: string;
    @Column()
    milliseconds: number;
    @Column()
    nanoseconds: number;
    @Column()
    // from commit.blockId.parts.total
    partsTotal: number;
    @Column()
    // from commit.blockId.parts.hash
    partsHash: string;
    @Column()
    lastCommitHash: string;
    @Column()
    dataHash: string;
    @Column()
    validatorsHash: string;
    @Column()
    nextValidatorsHash: string;
    @Column()
    consensusHash: string;
    @Column()
    appHash: string;
    @Column()
    lastResultsHash: string;
    @Column()
    evidenceHash: string;
    @Column()
    proposerAddress: string;
}

@Entity()
export class BlockSignatureEntity extends BaseEntity {
    @PrimaryColumn()
    height: number;

    @Column()
    blockIdFlag: number;
    @Column()
    validatorAddress: string;
    @Column()
    milliseconds: number;
    @Column()
    nanoseconds: number;
    @Column()
    signature: string;

    @ManyToOne(() => BlockEntity, { onDelete: "RESTRICT" })
    @JoinColumn({ name: "height", referencedColumnName: "height" })
    account: BlockEntity;
}
