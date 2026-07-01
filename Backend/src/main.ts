import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { addGraphqlOpenApiDocs } from './openapi/graphql-openapi';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Qik Accounts Ledger Service')
    .setDescription('GraphQL API documentation for the Qik Accounts Ledger Service.')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = addGraphqlOpenApiDocs(SwaggerModule.createDocument(app, swaggerConfig));
  SwaggerModule.setup('docs', app, document);

  const port = configService.get<number>('app.port', 3000);
  await app.listen(port);
}

bootstrap();
