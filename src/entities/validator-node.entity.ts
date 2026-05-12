import { BaseEntity, Column, Entity, PrimaryColumn } from "typeorm";

@Entity()
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
}
