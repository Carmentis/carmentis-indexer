import {
    BaseEntity,
    Column,
    Entity,
    PrimaryColumn,
    ManyToOne,
    JoinColumn,
    PrimaryGeneratedColumn,
} from "typeorm";

@Entity()
export class AccountEntity extends BaseEntity {
    @PrimaryColumn()
    id: string;
    @Column()
    height: number;
    @Column()
    balance: number;
}

@Entity()
export class AccountHistoryEntity extends BaseEntity {
    @PrimaryColumn()
    accountId: string;
    @PrimaryColumn()
    height: number;
    @Column()
    type: number;
    @Column()
    timestamp: number;
    @Column()
    linkedAccountId: string;
    @Column()
    amount: number;
    @Column()
    chainReference: string;
    @Column()
    publicReference: string;
    @Column()
    privateReference: string;

    @ManyToOne(() => AccountEntity, { onDelete: "RESTRICT" })
    @JoinColumn({ name: "accountId", referencedColumnName: "id" })
    account: AccountEntity;
}

@Entity()
export class EscrowLockEntity extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;
    @Column()
    accountId: string;
    @Column()
    amount: number;
    @Column()
    escrowIdentifier: string;
    @Column()
    fundEmitterAccountId: string;
    @Column()
    transferAuthorizerAccountId: string;
    @Column()
    startTimestamp: number;
    @Column()
    durationDays: number;

    @ManyToOne(() => AccountEntity, { onDelete: "RESTRICT" })
    @JoinColumn({ name: "accountId", referencedColumnName: "id" })
    account: AccountEntity;
}

@Entity()
export class VestingLockEntity extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;
    @Column()
    accountId: string;
    @Column()
    amount: number;
    @Column()
    initialVestedAmountInAtomics: number;
    @Column()
    cliffStartTimestamp: number;
    @Column()
    cliffDurationDays: number;
    @Column()
    vestingDurationDays: number;

    @ManyToOne(() => AccountEntity, { onDelete: "RESTRICT" })
    @JoinColumn({ name: "accountId", referencedColumnName: "id" })
    account: AccountEntity;
}

@Entity()
export class StakingLockEntity extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;
    @Column()
    accountId: string;
    @Column()
    amount: number;
    @Column()
    validatorNodeId: string;
    @Column()
    plannedUnlockAmountInAtomics: number;
    @Column()
    plannedUnlockTimestamp: number;
    @Column()
    slashed: boolean;
    @Column()
    plannedSlashingAmountInAtomics: number;
    @Column()
    plannedSlashingTimestamp: number;

    @ManyToOne(() => AccountEntity, { onDelete: "RESTRICT" })
    @JoinColumn({ name: "accountId", referencedColumnName: "id" })
    account: AccountEntity;
}
