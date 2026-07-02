import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { INestApplication, Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import { HealthModule } from '../src/health/health.module';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      autoSchemaFile: true,
      driver: ApolloDriver,
    }),
    HealthModule,
  ],
})
class TestAppModule {}

describe('GraphQL health (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('serves the health query through the GraphQL HTTP endpoint', async () => {
    await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          query Health {
            health
          }
        `,
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual({
          data: {
            health: 'ok',
          },
        });
      });
  });
});
