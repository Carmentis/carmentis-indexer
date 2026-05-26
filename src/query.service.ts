import { Injectable } from "@nestjs/common";
import { VotingPowerEntity } from "./entities/voting-power.entity";
import { VirtualBlockchainEntity } from "./entities/virtual-blockchain.entity";
import { ObjectCount } from "./dto/response-interface.dto";

@Injectable()
export class QueryService {
    async getCurrentVotingPowers() {
        const rows = await VotingPowerEntity.createQueryBuilder("vp")
            .innerJoin(
                (qb) =>
                    qb
                        .subQuery()
                        .select("sub.nodeId", "nodeId")
                        .addSelect("MAX(sub.height)", "maxHeight")
                        .from(VotingPowerEntity, "sub")
                        .groupBy("sub.nodeId"),
                "latest",
                "vp.nodeId = latest.nodeId AND vp.height = latest.maxHeight",
            )
            .getMany();
        return rows;
    }

    async getVirtualBlockchainCounts() {
        const rows: ObjectCount[] =
            await VirtualBlockchainEntity.createQueryBuilder("e")
                .select("e.type", "type")
                .addSelect("COUNT(*)", "count")
                .groupBy("e.type")
                .getRawMany();
        return rows;
    }
}
