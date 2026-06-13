import { BaseEntity, Column, Entity, PrimaryColumn } from "typeorm";

@Entity()
export class MicroblockStatsEntity extends BaseEntity {
    @PrimaryColumn()
    hourBucketTimestamp: number;
    @PrimaryColumn()
    vbType: number;
    @PrimaryColumn()
    isGenesis: boolean;

    @Column()
    counter: number;
}
