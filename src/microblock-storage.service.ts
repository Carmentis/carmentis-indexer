import { Injectable, Logger } from "@nestjs/common";
import { mkdir, open, FileHandle } from "node:fs/promises";
import * as path from "path";

// 4 GB
const MAX_MICROBLOCK_FILE_SIZE = 4 * 1024 ** 3;

@Injectable()
export class MicroblockStorageService {
    private readonly logger = new Logger();
    private handle: FileHandle | null = null;
    private fileId: number;
    private isNewFile: boolean;
    private pointer: number;

    static getMaxMicroblockFileSize() {
        return MAX_MICROBLOCK_FILE_SIZE;
    }

    async beginUpdate(fileId: number, offset: number) {
        if (this.handle !== null) {
            throw new Error(`attempt to begin a microblock file update before the previous one was closed`);
        }
        this.fileId = fileId;
        const filePath = this.getPath(fileId);
        this.isNewFile = false;

        try {
            this.handle = await open(filePath, 'r+');
        } catch (err) {
            if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
                this.logger.log(`creating file '${filePath}'`);
                const parentDir = path.dirname(filePath);
                await mkdir(parentDir, { recursive: true });
                this.handle = await open(filePath, 'w+');
                this.isNewFile = true;
            } else {
                throw err;
            }
        }

        const stats = await this.handle.stat();
        const fileSize = stats.size;
        if (offset > fileSize) {
            throw new Error(`PANIC - file '${filePath}' is shorter than expected`);
        }
        if (offset < fileSize) {
            this.logger.warn(`file '${filePath}' is larger than expected (shutdown during batch processing)`);
        }
        this.pointer = offset;
    }

    async closeUpdate() {
        if (this.handle === null) {
            throw new Error(`attempt to close a microblock file that had not been opened`);
        }
        await this.handle.sync();
        await this.handle.close();

        if (this.isNewFile) {
            // fsync of parent directory, to persist the new file entry
            const filePath = this.getPath(this.fileId);
            const parentDir = path.dirname(filePath);
            const dirHandle = await open(parentDir, 'r');
            try {
                await dirHandle.sync();
            } catch (error) {
                this.logger.warn(`failed to fsync directory '${parentDir}' (this is expected on Windows)`);
            } finally {
                await dirHandle.close();
            }
        }

        // 'this.handle' must be reset to allow another beginUpdate()
        this.handle = null;
        // these other properties are reset for sake of consistency only
        this.fileId = 0;
        this.pointer = 0;
        this.isNewFile = false;
    }

    getFileId() {
        return this.fileId;
    }

    getPointer() {
        return this.pointer;
    }

    async writeMicroblock(data: Uint8Array) {
        if (this.handle === null) {
            throw new Error(`attempt to write a microblock while no microblock file is open`);
        }
        const offset = this.pointer;
        const size = data.length;
        await this.handle.write(data, 0, size, offset);
        this.pointer += size;
        return { fileId: this.fileId, offset, size };
    }

    async readMicroblock(fileId: number, offset: number, size: number) {
        const filePath = this.getPath(fileId);
        const handle = await open(filePath, 'r');
        const dataBuffer = new Uint8Array(size);
        try {
            const rd = await handle.read(dataBuffer, 0, size, offset);
            if (rd.bytesRead < size) {
                throw new Error(`encountered end of file while reading microblock file ${filePath}`);
            }
        } finally {
            await handle.close();
        }
        return dataBuffer;
    }

    private getPath(id: number) {
        return `data/microblocks/${id.toString(10).padStart(4, '0')}.bin`;
    }
}
