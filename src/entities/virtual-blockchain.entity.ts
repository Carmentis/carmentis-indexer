import {
    BaseEntity,
    Column,
    Entity,
    PrimaryColumn,
    Index,
} from "typeorm";

@Entity()
@Index(["creationTimestamp"])
@Index(["modificationTimestamp"])
@Index(["expirationTimestamp"])
export class VirtualBlockchainEntity extends BaseEntity {
    @PrimaryColumn()
    virtualBlockchainId: string;

    @Column()
    type: number;
    @Column()
    height: number;
    @Column()
    creationTimestamp: number;
    @Column()
    modificationTimestamp: number;
    @Column()
    expirationTimestamp: number;
    @Column()
    lastMicroblockHash: string;
}
