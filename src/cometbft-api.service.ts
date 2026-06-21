import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { Comet38Client } from "@cosmjs/tendermint-rpc";
import type {
    CommitResponse,
    StatusResponse,
    ValidatorsResponse,
    GenesisResponse,
    Validator,
} from "./cometbft/cometbft-types";
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
    AccountProofAbciResponse,
    MicroblockProofAbciResponse,
    Utils,
    AccountProofAbciResponseSchema,
    MicroblockProofAbciResponseSchema,
} from "@cmts-dev/carmentis-sdk-core";

type RpcErrorData = {
    code?: number;
    message?: string;
    data?: string;
};

export interface BlockData {
    commit: CommitResponse | null;
    appVbRadixHash: Uint8Array;
    appTokenRadixHash: Uint8Array;
    appStorageHash: Uint8Array;
    size: number;
    microblockCount: number;
}

const MAX_NODES = 4;

@Injectable()
export class CometbftApiService implements OnModuleInit {
    private readonly nodeUrls: string[] = [];
    private nodeIndex: number;
    private readonly logger = new Logger();

    constructor() {
        for (let n = 0; n < MAX_NODES; n++) {
            this.nodeUrls[n] = process.env[`NODE${n + 1}_URL`] ?? "";
        }
        this.nodeIndex = this.nodeUrls.findIndex((url) => url !== "");
        if (this.nodeIndex === -1) {
            throw new Error(`At least one NODEx_URL should be specified`);
        }
    }

    getCurrentNodeUrl() {
        return this.nodeUrls[this.nodeIndex];
    }

    changeNode() {
        const currentNodeIndex = this.nodeIndex;
        do {
            this.nodeIndex = (this.nodeIndex + 1) % MAX_NODES;
        } while(this.getCurrentNodeUrl() === "");
        if (this.nodeIndex !== currentNodeIndex) {
            this.logger.log(`switching to node '${this.getCurrentNodeUrl()}'`);
        }
    }

    async onModuleInit() {}

    private async getClient() {
        return await Comet38Client.connect(this.getCurrentNodeUrl());
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
            appVbRadixHash: parsedResponse.applicationStateHashes.vbRadixHash,
            appTokenRadixHash: parsedResponse.applicationStateHashes.tokenRadixHash,
            appStorageHash: parsedResponse.applicationStateHashes.storageHash,
            size: parsedResponse.size,
            microblockCount: parsedResponse.microblockCount,
        };
        return blockData;
    }

    async getRawBlockContentAtHeight(
        height: number,
        partIndex: number,
    ): Promise<RawBlockContentAbciResponse> {
        const request: AbciRequest = {
            requestType: AbciRequestType.GET_RAW_BLOCK_CONTENT,
            height,
            partIndex,
        };
        const abciResponse = await this.abciQuery(request);
        if (abciResponse.responseType !== AbciResponseType.RAW_BLOCK_CONTENT) {
            throw new Error(`failed to fetch block content`);
        }
        v.parse(RawBlockContentAbciResponseSchema, abciResponse);
        return abciResponse as RawBlockContentAbciResponse;
    }

    async getBlockModifiedAccountsAtHeight(
        height: number,
    ): Promise<BlockModifiedAccountsAbciResponse> {
        const request: AbciRequest = {
            requestType: AbciRequestType.GET_BLOCK_MODIFIED_ACCOUNTS,
            height,
        };
        const abciResponse = await this.abciQuery(request);
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
        const request: AbciRequest = {
            requestType: AbciRequestType.GET_ACCOUNT_UPDATES,
            list: requestedAccountUpdates,
        };
        const abciResponse = await this.abciQuery(request);
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
            console.log(error);
            return null;
        }
    }

    async getGenesis(): Promise<GenesisResponse | null> {
        const client = await this.getClient();
        try {
            return await client.genesis();
        } catch (error) {
            console.log(error);
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

    async getMicroblockProof(
        hash: string,
    ): Promise<MicroblockProofAbciResponse> {
        const request: AbciRequest = {
            requestType: AbciRequestType.GET_MICROBLOCK_PROOF,
            hash: Utils.binaryFromHexa(hash),
        };
        const abciResponse = await this.abciQuery(request);
        if (abciResponse.responseType !== AbciResponseType.MICROBLOCK_PROOF) {
            throw new Error(`failed to fetch proof`);
        }
        v.parse(MicroblockProofAbciResponseSchema, abciResponse);
        return abciResponse as MicroblockProofAbciResponse;
    }

    async getAccountProof(
        accountId: string,
    ): Promise<AccountProofAbciResponse> {
        const request: AbciRequest = {
            requestType: AbciRequestType.GET_ACCOUNT_PROOF,
            accountId: Utils.binaryFromHexa(accountId),
        };
        const abciResponse = await this.abciQuery(request);
        if (abciResponse.responseType !== AbciResponseType.ACCOUNT_PROOF) {
            throw new Error(`failed to fetch proof`);
        }
        v.parse(AccountProofAbciResponseSchema, abciResponse);
        return abciResponse as AccountProofAbciResponse;
    }

    private async abciQuery(request: AbciRequest) {
        const client = await this.getClient();
        const serializedRequest = AbciQueryEncoder.encodeAbciRequest(request);
        const abciQuery = {
            path: "/carmentis",
            data: serializedRequest,
        };
        const response = await client.abciQuery(abciQuery);
        const abciResponse = AbciQueryEncoder.decodeAbciResponse(
            response.value,
        );
        return abciResponse;
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
