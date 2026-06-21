import {
    BaseEntity,
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
    Index,
} from "typeorm";
import { BlockEntity } from "./block.entity";

@Entity()
@Index(["blockHeight"])
@Index(["virtualBlockchainId", "height"])
export class MicroblockEntity extends BaseEntity {
    @PrimaryColumn()
    hash: string;

    @Column()
    blockHeight: number;
    @Column()
    virtualBlockchainId: string;
    @Column()
    type: number;
    @Column()
    height: number;
    @Column()
    size: number;
    @Column()
    gas: number;
    @Column()
    gasPrice: number;

    @ManyToOne(() => BlockEntity, { onDelete: "RESTRICT" })
    @JoinColumn({ name: "blockHeight", referencedColumnName: "height" })
    block: BlockEntity;
}
