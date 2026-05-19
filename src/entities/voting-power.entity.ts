import { BaseEntity, Column, Entity, PrimaryColumn } from "typeorm";

@Entity()
export class VotingPowerEntity extends BaseEntity {
    @PrimaryColumn()
    nodeId: string;
    @PrimaryColumn()
    height: number;

    @Column()
    timestamp: number;
    @Column()
    votingPower: number;
}
