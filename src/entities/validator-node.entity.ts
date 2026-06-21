import {
    BaseEntity,
    Column,
    Entity,
    PrimaryColumn,
    Index,
} from "typeorm";

@Entity()
@Index(["organizationId"])
@Index(["cometPublicKey"])
@Index(["address"])
export class ValidatorNodeEntity extends BaseEntity {
    @PrimaryColumn()
    virtualBlockchainId: string;

    @Column()
    organizationId: string;
    @Column()
    cometPublicKeyType: string;
    @Column()
    cometPublicKey: string;
    @Column()
    address: string;
    @Column()
    rpcEndpoint: string;
    @Column({ default: 0 })
    currentVotingPower: number;
}
