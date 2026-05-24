import { Injectable } from "@nestjs/common";

const MAX_HEIGHT_DIFFERENCE = 5;

@Injectable()
export class SyncStateService {
    private dbHeight: number = 0;
    private chainHeight: number = 0;
    private initialized = false;

    setHeights(dbHeight: number, chainHeight: number) {
        this.dbHeight = dbHeight;
        this.chainHeight = chainHeight;
        this.initialized = true;
    }

    getStatus() {
        const synchronized =
            this.initialized &&
            this.dbHeight >= this.chainHeight - MAX_HEIGHT_DIFFERENCE;
        return {
            dbHeight: this.dbHeight,
            chainHeight: this.chainHeight,
            synchronized,
        };
    }
}
