import { BaseEntity, Column, Entity, PrimaryColumn } from "typeorm";

@Entity()
export class VirtualBlockchainEntity extends BaseEntity {
    @PrimaryColumn()
    virtualBlockchainId: string;

    @Column()
    type: number;
}
