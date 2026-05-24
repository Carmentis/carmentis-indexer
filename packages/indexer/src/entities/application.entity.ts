import { BaseEntity, Column, Entity, PrimaryColumn } from "typeorm";

@Entity()
export class ApplicationEntity extends BaseEntity {
    @PrimaryColumn()
    virtualBlockchainId: string;

    @Column()
    organizationId: string;
    @Column()
    name: string;
    @Column()
    logoUrl: string;
    @Column()
    homepageUrl: string;
    @Column()
    description: string;
}
