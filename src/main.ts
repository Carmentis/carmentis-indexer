import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from "@nestjs/common";

async function bootstrap() {
	const loggr = new Logger();
	const app = await NestFactory.create(AppModule);
	const port = process.env.PORT ?? 3000;
	loggr.log(`Listening at port ${port}`);
	await app.listen(port);
}
bootstrap();
