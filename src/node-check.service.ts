import { Injectable } from "@nestjs/common";
import { ValidatorNodeEntity } from "./entities/validator-node.entity";
import { NodeStatusEnum } from "./dto/response-interface.dto";

const CACHE_LIFESPAN = 30 * 1000;
const MAX_FETCH_DELAY = 3 * 1000;

interface NodeStatusAnswer {
    status: NodeStatusEnum
    timestamp: number
    expired: boolean
}

interface NodeCacheEntry {
    status: NodeStatusEnum
    timestamp: number
}

@Injectable()
export class NodeCheckService {
    private readonly cache: Map<string, NodeCacheEntry> = new Map;
    private readonly pendingChecks = new Map<string, Promise<NodeCacheEntry>>();

    async getLastNodeStatus(id: string): Promise<NodeStatusAnswer> {
        return this.getNodeStatus(id, false);
    }

    async getCurrentNodeStatus(id: string): Promise<NodeStatusAnswer> {
        return this.getNodeStatus(id, true);
    }

    private async getNodeStatus(id: string, update = false): Promise<NodeStatusAnswer> {
        const currentStatus = this.cache.get(id) || { status: NodeStatusEnum.Unknown, timestamp: 0 };
        if (Date.now() <= currentStatus.timestamp + CACHE_LIFESPAN) {
            return { ...currentStatus, expired: false };
        }
        if (!update) {
            return { ...currentStatus, expired: true };
        }

        let pending = this.pendingChecks.get(id);

        if (!pending) {
            pending = this.checkNode(id)
                .then(status => {
                    const cacheEntry = {
                        status,
                        timestamp: Date.now()
                    };
                    this.cache.set(id, cacheEntry);
                    return cacheEntry;
                })
                .finally(() => {
                    this.pendingChecks.delete(id);
                });

            this.pendingChecks.set(id, pending);
        }

        const status = await pending;
        return { ...status, expired: false };
    }

    async checkNode(id: string): Promise<NodeStatusEnum> {
        try {
            const node = await ValidatorNodeEntity.findOne({
                where: { virtualBlockchainId: id }
            });
            if (node === null) {
                return NodeStatusEnum.Bad;
            }
            const url = node.rpcEndpoint.replace(/\/*$/, "");
            const res = await fetch(`${url}/status`, {
                signal: AbortSignal.timeout(MAX_FETCH_DELAY)
            });

            if (!res.ok) {
                return NodeStatusEnum.Down;
            }

            const json = await res.json();
            const info = json?.result?.node_info;
            const catchingUp = json?.result?.sync_info?.catching_up;

            if (!info) {
                return NodeStatusEnum.Bad;
            }
            return catchingUp ? NodeStatusEnum.Sync : NodeStatusEnum.Ok;

        } catch (e) {
            return NodeStatusEnum.Down;
        }
    }
}
