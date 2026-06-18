import { BaseEntity, Column, Entity, PrimaryColumn } from "typeorm";

@Entity()
export class ValidatorStatsEntity extends BaseEntity {
    @PrimaryColumn()
    hourBucketTimestamp: number;
    @PrimaryColumn()
    nodeId: string;

    @Column()
    proposedBlocks: number;
    @Column()
    signedBlocks: number;
}
