import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { Logger, ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

async function bootstrap() {
    const logger = new Logger();
    const app = await NestFactory.create(AppModule);

    app.enableCors();

    // Set up the swagger
    const swaggerCustomOptions = {
        customSiteTitle: "Carmentis Indexer",
    };

    const config = new DocumentBuilder()
        .setTitle("Carmentis indexer API")
        .setDescription("Documentation for the Carmentis indexer API.")
        .setVersion("1.0")
        .addApiKey(
            {
                type: "apiKey",
                name: "Authorization",
                in: "header",
            },
            "api-key",
        )
        .build();

    const documentFactory = () => SwaggerModule.createDocument(app, config);
    const swaggerPath = "swagger";
    logger.log(`Swagger Path: /${swaggerPath}`);
    SwaggerModule.setup(
        swaggerPath,
        app,
        documentFactory,
        swaggerCustomOptions,
    );

    app.useGlobalPipes(new ValidationPipe({ transform: true }));

    const port = process.env.PORT ?? 3000;
    logger.log(`Listening at port ${port}`);
    await app.listen(port);
}

bootstrap();
