import { Injectable, Logger } from "@nestjs/common";
import { ValidatorNodeEntity } from "./entities/validator-node.entity";
import { NodeStatusEnum } from "./dto/response-interface.dto";

const MIN_REFRESH_DELAY = 1 * 1000;
const MAX_FETCH_DELAY = 3 * 1000;

interface NodeStatus {
    moniker: string
    txInMempool: number
    height: number
    latency: number
    status: NodeStatusEnum
    statusTimestamp: number
}

@Injectable()
export class NodeStatusService {
    private readonly logger = new Logger();
    private readonly cache: Map<string, NodeStatus> = new Map;
    private readonly pendingUpdates = new Map<string, Promise<NodeStatus>>();

    static getBlankStatus(): NodeStatus {
        return {
            moniker: "(unknown)",
            txInMempool: 0,
            height: 0,
            latency: 0,
            status: NodeStatusEnum.Unknown,
            statusTimestamp: 0,
        };
    }

    async getLastNodeStatus(id: string): Promise<NodeStatus> {
        return this.getNodeStatus(id, false);
    }

    async getCurrentNodeStatus(id: string): Promise<NodeStatus> {
        return this.getNodeStatus(id, true);
    }

    async updateAll() {
        const list = await ValidatorNodeEntity.find();
        this.logger.log(`updating status of ${list.length} node(s)`);
        let index = 1;

        for (const node of list) {
            const status = await this.updateNodeStatus(
                node.virtualBlockchainId,
            );
            this.cache.set(node.virtualBlockchainId, status);
            this.logger.log(`node ${index} of ${list.length}: ${status.status} (${status.moniker})`);
            index++;
        }
    }

    private async getNodeStatus(id: string, update = false): Promise<NodeStatus> {
        const lastNodeStatus = this.cache.get(id) || NodeStatusService.getBlankStatus();

        if (!update || Date.now() <= lastNodeStatus.statusTimestamp + MIN_REFRESH_DELAY) {
            return lastNodeStatus;
        }

        let pending = this.pendingUpdates.get(id);

        if (!pending) {
            pending = this.updateNodeStatus(id, lastNodeStatus)
                .then((nodeStatus) => {
                    nodeStatus.statusTimestamp = Date.now();
                    this.cache.set(id, nodeStatus);
                    return nodeStatus;
                })
                .finally(() => {
                    this.pendingUpdates.delete(id);
                });

            this.pendingUpdates.set(id, pending);
        }

        return pending;
    }

    async updateNodeStatus(id: string, nodeStatus: NodeStatus = NodeStatusService.getBlankStatus()): Promise<NodeStatus> {
        const node = await ValidatorNodeEntity.findOne({
            where: { virtualBlockchainId: id }
        });
        if (node === null) {
            return nodeStatus;
        }

        try {
            const url = node.rpcEndpoint.replace(/\/*$/, "");
            const ts0 = performance.now();
            const statusRes = await fetch(`${url}/status`, {
                signal: AbortSignal.timeout(MAX_FETCH_DELAY)
            });
            const latency0 = performance.now() - ts0;

            if (!statusRes.ok) {
                nodeStatus.status = NodeStatusEnum.Down;
                return nodeStatus;
            }

            const statusJson = await statusRes.json();
            const nodeInfo = statusJson?.result?.node_info;

            if (!nodeInfo) {
                nodeStatus.status = NodeStatusEnum.Bad;
                return nodeStatus;
            }

            nodeStatus.moniker = nodeInfo?.moniker;
            nodeStatus.height = statusJson?.result?.sync_info?.latest_block_height;

            const catchingUp = statusJson?.result?.sync_info?.catching_up;
            nodeStatus.status = catchingUp ? NodeStatusEnum.Sync : NodeStatusEnum.Ok;

            const ts1 = performance.now();
            const unconfirmedTxRes = await fetch(`${url}/unconfirmed_txs`, {
                signal: AbortSignal.timeout(MAX_FETCH_DELAY)
            });
            const latency1 = performance.now() - ts1;
            nodeStatus.latency = Math.round((latency0 + latency1) / 2);

            const unconfirmedTxJson = await unconfirmedTxRes.json();
            nodeStatus.txInMempool = unconfirmedTxJson?.result?.n_txs;

            return nodeStatus;

        } catch (e) {
            nodeStatus.status = NodeStatusEnum.Down;
            return nodeStatus;
        }
    }
}
