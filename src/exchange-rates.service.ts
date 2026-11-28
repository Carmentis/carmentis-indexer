import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ExchangeRateEntity } from "./entities/exchange-rate.entity";

const DEFAULT_REFRESH_DELAY = 5 * 60 * 1000;
const TARGET_CURRENCIES = [ "USD" ];

@Injectable()
export class ExchangeRatesService implements OnModuleInit {
    private readonly logger = new Logger();
    private apiKey: string;
    private refreshDelay: number;

    constructor(
    ) {
        this.apiKey = process.env['TWELVE_DATA_API_KEY'] ?? "";
        const delay = process.env['EXCHANGE_RATES_REFRESH_DELAY'];
        this.refreshDelay = (delay ? parseInt(delay, 10) * 1000 : DEFAULT_REFRESH_DELAY);
    }

    async onModuleInit() {
        if (this.apiKey !== "") {
            this.refreshExchangeRates();
        }
    }

    private async refreshExchangeRates() {
        for (const targetCurrency of TARGET_CURRENCIES) {
            await this.refreshExchangeRate("EUR", targetCurrency);
        }
        setTimeout(
            () => this.refreshExchangeRates(),
            this.refreshDelay
        );
    }

    private async refreshExchangeRate(sourceCurrency: string, targetCurrency: string) {
        const url = `https://api.twelvedata.com/exchange_rate?symbol=${sourceCurrency}/${targetCurrency}&apikey=${this.apiKey}`;
        fetch(url).then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }
            return response.json();
        })
        .then(async (data) => {
            const { rate: exchangeRate, timestamp: retrievedAtInSeconds } = data;
            await ExchangeRateEntity.save({
                sourceCurrency,
                targetCurrency,
                exchangeRate,
                retrievedAtInSeconds,
            });
        })
        .catch((error) => {
            this.logger.error("twelvedata.com API request failure:", error);
        });
    }
}
