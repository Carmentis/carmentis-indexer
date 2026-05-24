import { BaseEntity, Column, Entity, PrimaryColumn } from "typeorm";

@Entity()
export class ChainEntity extends BaseEntity {
    @PrimaryColumn()
    id: number;

    @Column()
    version: string;
    @Column()
    network: string;
    @Column()
    earliestBlockHash: string;
}
