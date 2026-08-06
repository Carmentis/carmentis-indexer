import {
    BaseEntity,
    Column,
    Entity,
    PrimaryColumn,
    Index,
} from "typeorm";

@Entity()
@Index(["virtualBlockchainId", "tag", "height"])
@Index(["tag", "virtualBlockchainType", "height"])
export class CustomSectionEntity extends BaseEntity {
    @PrimaryColumn()
    microblockHash: string;
    @PrimaryColumn()
    sectionIndex: number;

    @Column()
    virtualBlockchainId: string;
    @Column()
    virtualBlockchainType: number;
    @Column()
    tag: string;
    @Column()
    height: number;
}
