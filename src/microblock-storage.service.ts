import { Injectable } from "@nestjs/common";
import { mkdir, writeFile, readFile } from "fs/promises";

@Injectable()
export class MicroblockStorageService {
    async saveMicroblock(hash: string, data: Uint8Array) {
        const path = this.getPath(hash);
        await mkdir(path, { recursive: true });
        await writeFile(path + `/${hash}.bin`, data);
    }

    async loadMicroblock(hash: string) {
        const path = this.getPath(hash);
        return await readFile(path + `/${hash}.bin`);
    }

    private getPath(hash: string) {
        return `data/microblocks/${hash.slice(0, 2)}/${hash.slice(2, 4)}`;
    }
}
