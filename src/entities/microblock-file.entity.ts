import {
    BaseEntity,
    Column,
    Entity,
    PrimaryColumn,
} from "typeorm";

@Entity()
export class MicroblockFileEntity extends BaseEntity {
    @PrimaryColumn()
    id: number;

    @Column()
    minHeight: number;
    @Column()
    maxHeight: number;
    @Column()
    size: number;
}
