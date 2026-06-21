import {
    BaseEntity,
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
    Index,
} from "typeorm";
import { AccountEntity } from "./account.entity";

@Entity()
@Index(["accountId"])
@Index(["name"])
export class OrganizationEntity extends BaseEntity {
    @PrimaryColumn()
    virtualBlockchainId: string;

    @Column()
    accountId: string;
    @Column()
    name: string;
    @Column()
    city: string;
    @Column()
    countryCode: string;
    @Column()
    website: string;

    @ManyToOne(() => AccountEntity, { onDelete: "RESTRICT" })
    @JoinColumn({ name: "accountId", referencedColumnName: "id" })
    account: AccountEntity;
}
