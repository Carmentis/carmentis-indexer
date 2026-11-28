import { BaseEntity, Column, Entity, PrimaryColumn } from "typeorm";

@Entity()
export class ExchangeRateEntity extends BaseEntity {
    @PrimaryColumn()
    sourceCurrency: string;
    @PrimaryColumn()
    targetCurrency: string;

    @Column({ type: 'double precision' })
    exchangeRate: number;
    @Column()
    retrievedAtInSeconds: number;
}
