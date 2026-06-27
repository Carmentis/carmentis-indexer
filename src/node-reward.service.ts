import { Injectable, Logger } from "@nestjs/common"
import { VotingPowerEntity } from "./entities/voting-power.entity"
import { ValidatorStatsEntity } from "./entities/validator-stats.entity"
import { AccountHistoryEntity } from "./entities/account.entity"
import { NodePeriodReward, NodeReward } from "./dto/response-interface.dto"
import { BK_SENT_PAYMENT, CMTSToken } from "@cmts-dev/carmentis-sdk-core";
import { ValidatorNodeEntity } from "./entities/validator-node.entity"
import { OrganizationEntity } from "./entities/organization.entity"
import { GetNodeRewardQueryDto } from "./dto/query.dto"

const REWARD_RATE_PER_YEAR = 0.10;
const MS_IN_HOUR = 60 * 60 * 1000;
const MS_IN_YEAR = 365 * 24 * MS_IN_HOUR;
const REWARD_RATE_PER_MS = REWARD_RATE_PER_YEAR / MS_IN_YEAR;

@Injectable()
export class NodeRewardService {
    private readonly logger = new Logger();

    private static roundTimestampToHour(ts: number) {
        const date = new Date(ts);
        const roundedDate = Date.UTC(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate(),
            date.getUTCHours(),
        );
        return roundedDate;
    }

    async getNodeReward(query: GetNodeRewardQueryDto): Promise<NodeReward> {
        const nodeId = query.node_id;
        const payerAccountId = query.payer_account_id;
        const startTime = query.start_time;
        const endTime = query.end_time;

        const accruedRewardToDate = await this.getAccruedRewardToDate(nodeId, startTime, endTime);
        const paidRewardInAtomics = await this.getPaidRewardToDate(nodeId, payerAccountId);
        const accruedRewardInAtomics = accruedRewardToDate.reduce((total, r) => total + r.rewardInAtomics, 0);
        const unpaidRewardInAtomics = accruedRewardInAtomics - paidRewardInAtomics;

        const nodeReward: NodeReward = {
            accruedRewardInAtomics,
            paidRewardInAtomics,
            unpaidRewardInAtomics,
            periods: accruedRewardToDate,
        };
        return nodeReward;
    }

    private async getAccruedRewardToDate(nodeId: string, startTime: number, endTime: number): Promise<NodePeriodReward[]> {
        const votingPowers = await VotingPowerEntity.find({
            where: { nodeId },
            order: { height: "ASC" },
        });
        let lastHour = NodeRewardService.roundTimestampToHour(startTime);
        let votingPower = 0;
        const list: NodePeriodReward[] = [];

        // compute accrued amount updates at each voting power update
        for (const vp of votingPowers) {
            const endHour = NodeRewardService.roundTimestampToHour(vp.timestamp);
            list.push(await this.getAccruedRewardForPeriod(nodeId, votingPower, lastHour, endHour));
            lastHour = Math.max(lastHour, endHour);
            votingPower = vp.votingPower;
        }
        // add accrued amount from the last voting power update to now
        list.push(await this.getAccruedRewardForPeriod(nodeId, votingPower, lastHour, endTime));
        return list;
    }

    private async getAccruedRewardForPeriod(nodeId: string, votingPower: number, startTime: number, endTime: number): Promise<NodePeriodReward> {
        let rewardInAtomics = 0;
        let downtimeHours = 0;
        let uptimeHours = 0;
        for (let ts = startTime; ts < endTime; ts += MS_IN_HOUR) {
            const stats = await ValidatorStatsEntity.findOne({
                where: {
                    nodeId,
                    hourBucketTimestamp: ts,
                }
            });
            const proposedBlocks = stats?.proposedBlocks ?? 0;
            if (proposedBlocks > 0) {
                const delta = Math.min(ts + MS_IN_HOUR, endTime) - ts;
                const cmtsAsAtomics = CMTSToken.createCMTS(1).getAmountAsAtomic();
                rewardInAtomics += delta * REWARD_RATE_PER_MS * votingPower * cmtsAsAtomics;
                uptimeHours++;
            }
            else {
                downtimeHours++;
            }
        }
        const nodePeriodReward: NodePeriodReward = {
            startTime,
            endTime,
            votingPower,
            uptimeHours,
            downtimeHours,
            rewardInAtomics,
        };
        return nodePeriodReward;
    }

    private async getPaidRewardToDate(nodeId: string, payerAccountId: string): Promise<number> {
        const node = await ValidatorNodeEntity.findOne({
            where: { virtualBlockchainId: nodeId },
        });
        if (node === null) {
            throw new Error(`Node '${nodeId}' not found`);
        }
        const organization = await OrganizationEntity.findOne({
            where: { virtualBlockchainId: node.organizationId },
        });
        if (organization === null) {
            throw new Error(`Organization '${node.organizationId}' of node '${nodeId}' not found`);
        }
        const nodeAccountId = organization.accountId;
        const history = await AccountHistoryEntity.createQueryBuilder("h")
            .where("h.accountId = :payerAccountId", { payerAccountId })
            .andWhere("h.linkedAccountId = :nodeAccountId", { nodeAccountId })
            .andWhere("h.type = :type", { type: BK_SENT_PAYMENT })
            .andWhere("h.publicReference like :reference", { reference: `%${nodeId}%`})
            .orderBy("h.height", "ASC")
            .getMany();

        let paidAmountInAtomics = 0;
        for (const record of history) {
            paidAmountInAtomics += record.amount;
        }
        return paidAmountInAtomics;
    }
}
