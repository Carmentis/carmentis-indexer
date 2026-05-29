import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { Comet38Client } from "@cosmjs/tendermint-rpc";
import type {
    CommitResponse,
    StatusResponse,
    ValidatorsResponse,
    Validator,
} from "@cosmjs/tendermint-rpc/build/comet38";
import * as v from "valibot";
import {
    AbciQueryEncoder,
    AbciRequest,
    AbciRequestType,
    AbciResponseType,
    BlockInformationAbciResponseSchema,
    BlockInformationAbciResponse,
    RawBlockContentAbciResponseSchema,
    RawBlockContentAbciResponse,
    BlockModifiedAccountsAbciResponseSchema,
    BlockModifiedAccountsAbciResponse,
    RequestedAccountUpdate,
    AccountUpdatesAbciResponseSchema,
    AccountUpdatesAbciResponse,
} from "@cmts-dev/carmentis-sdk-core";

type RpcErrorData = {
    code?: number;
    message?: string;
    data?: string;
};

export interface BlockData {
    commit: CommitResponse | null;
    size: number;
    microblockCount: number;
}

@Injectable()
export class CometbftApiService implements OnModuleInit {
    private readonly logger = new Logger();
    private readonly nodeUrl: string;

    constructor() {
        this.nodeUrl =
            process.env.NODE_URL || "https://node1.server1.devnet.carmentis.io";
    }

    async onModuleInit() {}

    async getClient() {
        return Comet38Client.connect(this.nodeUrl);
    }

    async getBlockAtHeight(height: number): Promise<BlockData | null> {
        // we use the 'commit' method instead of 'block' which would also send all
        // the block transactions and may exceed the maximum size of a Go GRPC query
        const client = await this.getClient();
        let commitData: CommitResponse | null;
        try {
            commitData = await client.commit(height);
        } catch (error) {
            if (CometbftApiService.isInvalidHeightError(error)) {
                this.logger.warn(
                    `commit data not available for block at height ${height}`,
                );
                commitData = null;
            } else {
                throw error;
            }
        }
        const request: AbciRequest = {
            requestType: AbciRequestType.GET_BLOCK_INFORMATION,
            height,
        };
        const serializedRequest = AbciQueryEncoder.encodeAbciRequest(request);
        const abciQuery = {
            path: "/carmentis",
            data: serializedRequest,
        };
        const response = await client.abciQuery(abciQuery);
        const abciResponse = AbciQueryEncoder.decodeAbciResponse(
            response.value,
        );
        if (abciResponse.responseType !== AbciResponseType.BLOCK_INFORMATION) {
            this.logger.warn(`failed to fetch block information`);
            return null;
        }
        v.parse(BlockInformationAbciResponseSchema, abciResponse);
        const parsedResponse = abciResponse as BlockInformationAbciResponse;
        const blockData = {
            commit: commitData,
            size: parsedResponse.size,
            microblockCount: parsedResponse.microblockCount,
        };
        return blockData;
    }

    async getRawBlockContentAtHeight(
        height: number,
        partIndex: number,
    ): Promise<RawBlockContentAbciResponse> {
        const client = await this.getClient();
        const request: AbciRequest = {
            requestType: AbciRequestType.GET_RAW_BLOCK_CONTENT,
            height,
            partIndex,
        };
        const serializedRequest = AbciQueryEncoder.encodeAbciRequest(request);
        const abciQuery = {
            path: "/carmentis",
            data: serializedRequest,
        };
        const response = await client.abciQuery(abciQuery);
        const abciResponse = AbciQueryEncoder.decodeAbciResponse(
            response.value,
        );
        if (abciResponse.responseType !== AbciResponseType.RAW_BLOCK_CONTENT) {
            throw new Error(`failed to fetch block content`);
        }
        v.parse(RawBlockContentAbciResponseSchema, abciResponse);
        return abciResponse as RawBlockContentAbciResponse;
    }

    async getBlockModifiedAccountsAtHeight(
        height: number,
    ): Promise<BlockModifiedAccountsAbciResponse> {
        const client = await this.getClient();
        const request: AbciRequest = {
            requestType: AbciRequestType.GET_BLOCK_MODIFIED_ACCOUNTS,
            height,
        };
        const serializedRequest = AbciQueryEncoder.encodeAbciRequest(request);
        const abciQuery = {
            path: "/carmentis",
            data: serializedRequest,
        };
        const response = await client.abciQuery(abciQuery);
        const abciResponse = AbciQueryEncoder.decodeAbciResponse(
            response.value,
        );
        if (
            abciResponse.responseType !==
            AbciResponseType.BLOCK_MODIFIED_ACCOUNTS
        ) {
            throw new Error(`failed to fetch modified accounts`);
        }
        v.parse(BlockModifiedAccountsAbciResponseSchema, abciResponse);
        return abciResponse as BlockModifiedAccountsAbciResponse;
    }

    async getAccountUpdates(
        requestedAccountUpdates: RequestedAccountUpdate[],
    ): Promise<AccountUpdatesAbciResponse> {
        const client = await this.getClient();
        const request: AbciRequest = {
            requestType: AbciRequestType.GET_ACCOUNT_UPDATES,
            list: requestedAccountUpdates,
        };
        const serializedRequest = AbciQueryEncoder.encodeAbciRequest(request);
        const abciQuery = {
            path: "/carmentis",
            data: serializedRequest,
        };
        const response = await client.abciQuery(abciQuery);
        const abciResponse = AbciQueryEncoder.decodeAbciResponse(
            response.value,
        );
        if (abciResponse.responseType !== AbciResponseType.ACCOUNT_UPDATES) {
            throw new Error(`failed to fetch account updates`);
        }
        v.parse(AccountUpdatesAbciResponseSchema, abciResponse);
        return abciResponse as AccountUpdatesAbciResponse;
    }

    async getChainStatus(): Promise<StatusResponse | null> {
        const client = await this.getClient();
        try {
            return await client.status();
        } catch (error) {
            return null;
        }
    }

    async getValidators(height: number): Promise<readonly Validator[]> {
        const client = await this.getClient();
        try {
            const validators: ValidatorsResponse = await client.validators({
                height,
            });
            return validators.validators;
        } catch (error) {
            if (CometbftApiService.isInvalidHeightError(error)) {
                this.logger.warn(
                    `validators not available for block at height ${height}`,
                );
                return [];
            }
            throw error;
        }
    }

    private static isRpcError(error: unknown): error is { message: string } {
        return (
            typeof error === "object" &&
            error !== null &&
            "message" in error &&
            typeof (error as any).message === "string"
        );
    }

    private static parseRpcErrorMessage(error: unknown): RpcErrorData | null {
        if (!CometbftApiService.isRpcError(error)) {
            return null;
        }
        try {
            return JSON.parse(error.message);
        } catch {
            return null;
        }
    }

    private static isInvalidHeightError(error: any) {
        const parsed = CometbftApiService.parseRpcErrorMessage(error);
        return (
            parsed &&
            parsed.code === -32603 &&
            typeof parsed.data === "string" &&
            parsed.data.includes("lowest height")
        );
    }
}
