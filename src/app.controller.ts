import { Controller, Get, Param } from "@nestjs/common";
import { AppService } from './app.service';
import { BlockEntity } from "./entities/virtual-blockchain.entity";

@Controller('/api/v1')
export class AppController {
	constructor(private readonly appService: AppService) {}

	@Get()
	getHello(): string {
		return this.appService.getHello();
	}

	@Get("/block/:height")
	getBlock(@Param('height') height: number) {
		return BlockEntity.findOneBy({
			height
		});
	}
}