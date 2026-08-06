import { Injectable } from "@nestjs/common";
import { CustomSectionEntity } from "./entities/custom-section.entity";
import { MicroblockEntity } from "./entities/microblock.entity";
import { MicroblockStorageService } from "./microblock-storage.service";
import { Microblock, SectionType, VirtualBlockchainType, JsonData } from "@cmts-dev/carmentis-sdk-core";
import { OrganizationCertificate } from "./dto/response-interface.dto"

const CERTIFICATE_TAG = "__cert__";
const CERTIFICATE_JWT_TAG = "__jwt__";

interface CustomSection {
    microblockHash: string
    microblockHeight: number
    sectionIndex: number
    content: JsonData
}

@Injectable()
export class VirtualBlockchainService {
    constructor(
        private readonly microblockStorageService: MicroblockStorageService,
    ) {}

    async getCustomSections(virtualBlockchainId: string, tag: string, expectedVbType?: number) {
        const entities = await CustomSectionEntity.find({
            where: { virtualBlockchainId, tag },
            order: { height: "ASC", sectionIndex: "ASC" },
        });
        const items: CustomSection[] = [];
        for (const e of entities) {
            if (expectedVbType !== undefined && e.virtualBlockchainType !== expectedVbType) {
                throw new Error(`invalid virtual blockchain type (expected ${expectedVbType}, got ${e.virtualBlockchainType})`);
            }
            const microblockHash = e.microblockHash;
            const mbEntity = await MicroblockEntity.findOne({ where: { hash: microblockHash }});
            if (mbEntity === null) {
                throw new Error(`internal error: microblock not found`);
            }
            const { fileId, fileOffset, size } = mbEntity;
            const rawContent = await this.microblockStorageService.readMicroblock(
                fileId, fileOffset, size
            );
            const mb = Microblock.loadFromSerializedMicroblock(rawContent);
            const sections = mb.getAllSections();
            const section = sections[e.sectionIndex];

            if (
                section === undefined ||
                section.type !== SectionType.CUSTOM ||
                section[tag] === undefined
            ) {
                throw new Error(`internal error: microblock section not found or invalid`);
            }
            const content = section[tag] as JsonData;
            items.push({
                microblockHash,
                microblockHeight: e.height,
                sectionIndex: e.sectionIndex,
                content,
            });
        }
        return items;
    }

    async getOrganizationCertificates(orgId: string) {
        const items = await this.getCustomSections(
            orgId,
            CERTIFICATE_TAG,
            VirtualBlockchainType.ORGANIZATION_VIRTUAL_BLOCKCHAIN
        );
        const certificates: OrganizationCertificate[] = [];
        for (const item of items) {
            const jwt = item.content?.[CERTIFICATE_JWT_TAG];
            if (jwt !== undefined) {
                certificates.push({
                    microblockHash: item.microblockHash,
                    microblockHeight: item.microblockHeight,
                    sectionIndex: item.sectionIndex,
                    jwt,
                });
            }
        }
        return certificates;
    }
}
