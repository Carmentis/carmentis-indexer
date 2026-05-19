import { VotingPowerEntity } from "./entities/voting-power.entity";

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
}
