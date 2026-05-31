import { Injectable } from "@nestjs/common";
import { Search } from "./dto/response-interface.dto";
import { AccountEntity } from "./entities/account.entity";
import { ApplicationEntity } from "./entities/application.entity";
import { BlockEntity } from "./entities/block.entity";
import { MicroblockEntity } from "./entities/microblock.entity";
import { OrganizationEntity } from "./entities/organization.entity";
import { ValidatorNodeEntity } from "./entities/validator-node.entity";
import { VirtualBlockchainEntity } from "./entities/virtual-blockchain.entity";
import { SearchObjectType } from "./dto/query-interface.dto";

@Injectable()
export class SearchService {
    static isInteger(str: string) {
        return /^(0|[1-9][0-9]*)$/.test(str);
    }

    static isHexa(str: string, length: number) {
        return new RegExp(`^[0-9A-Z]{${length}}$`, "i").test(str);
    }

    async searchAccounts(q: string, items: Search[], limit: number) {
        if (SearchService.isHexa(q, 64)) {
            const item = await AccountEntity.findOne({
                where: { id: q },
            });
            if (item !== null) {
                items.push({
                    type: SearchObjectType.ACCOUNT,
                    id: item.id,
                    matchedFieldName: "id",
                    matchedFieldValue: item.id,
                });
            }
        }
    }

    async searchApplications(q: string, items: Search[], limit: number) {
        const res = await ApplicationEntity.createQueryBuilder("e")
            .where("e.name LIKE :q", {
                q: `%${q}%`,
            })
            .getMany();
        for (const item of res) {
            items.push({
                type: SearchObjectType.APPLICATION,
                id: item.virtualBlockchainId,
                matchedFieldName: "name",
                matchedFieldValue: item.name,
            });
        }
        if (SearchService.isHexa(q, 64)) {
            const item = await ApplicationEntity.findOne({
                where: { virtualBlockchainId: q },
            });
            if (item !== null) {
                items.push({
                    type: SearchObjectType.APPLICATION,
                    id: item.virtualBlockchainId,
                    matchedFieldName: "virtualBlockchainId",
                    matchedFieldValue: item.virtualBlockchainId,
                });
            }
        }
    }

    async searchBlocks(q: string, items: Search[], limit: number) {
        if (SearchService.isInteger(q)) {
            const item = await BlockEntity.findOne({
                where: { height: parseInt(q, 10) },
            });
            if (item !== null) {
                items.push({
                    type: SearchObjectType.BLOCK,
                    id: item.height.toString(),
                    matchedFieldName: "height",
                    matchedFieldValue: item.height.toString(),
                });
            }
        }
        if (SearchService.isHexa(q, 64)) {
            const item = await BlockEntity.findOne({
                where: { hash: q },
            });
            if (item !== null) {
                items.push({
                    type: SearchObjectType.BLOCK,
                    id: item.height.toString(),
                    matchedFieldName: "hash",
                    matchedFieldValue: item.hash,
                });
            }
        }
    }

    async searchMicroblocks(q: string, items: Search[], limit: number) {
        if (SearchService.isHexa(q, 64)) {
            const item = await MicroblockEntity.findOne({
                where: { hash: q },
            });
            if (item !== null) {
                items.push({
                    type: SearchObjectType.MICROBLOCK,
                    id: item.hash,
                    matchedFieldName: "hash",
                    matchedFieldValue: item.hash,
                });
            }
        }
    }

    async searchNodes(q: string, items: Search[], limit: number) {
        if (SearchService.isHexa(q, 64)) {
            const item = await ValidatorNodeEntity.findOne({
                where: { virtualBlockchainId: q },
            });
            if (item !== null) {
                items.push({
                    type: SearchObjectType.NODE,
                    id: item.virtualBlockchainId,
                    matchedFieldName: "virtualBlockchainId",
                    matchedFieldValue: item.virtualBlockchainId,
                });
            }
        }
    }

    async searchOrganizations(q: string, items: Search[], limit: number) {
        const res = await OrganizationEntity.createQueryBuilder("e")
            .where("e.name LIKE :q", {
                q: `%${q}%`,
            })
            .getMany();
        for (const item of res) {
            items.push({
                type: SearchObjectType.ORGANIZATION,
                id: item.virtualBlockchainId,
                matchedFieldName: "name",
                matchedFieldValue: item.name,
            });
        }
        if (SearchService.isHexa(q, 64)) {
            const item = await OrganizationEntity.findOne({
                where: { virtualBlockchainId: q },
            });
            if (item !== null) {
                items.push({
                    type: SearchObjectType.ORGANIZATION,
                    id: item.virtualBlockchainId,
                    matchedFieldName: "virtualBlockchainId",
                    matchedFieldValue: item.virtualBlockchainId,
                });
            }
        }
    }

    async searchVirtualBlockchains(q: string, items: Search[], limit: number) {
        if (SearchService.isHexa(q, 64)) {
            const item = await VirtualBlockchainEntity.findOne({
                where: { virtualBlockchainId: q },
            });
            if (item !== null) {
                items.push({
                    type: SearchObjectType.VIRTUAL_BLOCKCHAIN,
                    id: item.virtualBlockchainId,
                    matchedFieldName: "virtualBlockchainId",
                    matchedFieldValue: item.virtualBlockchainId,
                });
            }
        }
    }
}
