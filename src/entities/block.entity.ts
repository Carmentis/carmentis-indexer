import {
    BaseEntity,
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
    Index,
} from "typeorm";

@Entity()
@Index(["milliseconds"])
export class BlockEntity extends BaseEntity {
    @PrimaryColumn()
    height: number;

    @Column()
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
    partsTotal: number;
    @Column()
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
    appVbRadixHash: string;
    @Column()
    appTokenRadixHash: string;
    @Column()
    appStorageHash: string;
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
    @PrimaryColumn()
    index: number;

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
