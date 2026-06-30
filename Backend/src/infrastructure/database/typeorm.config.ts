import 'reflect-metadata';
import { DataSource } from 'typeorm';
import databaseConfig from '../../config/database.config';

const database = databaseConfig();

export default new DataSource({
  type: 'postgres',
  host: database.host,
  port: database.port,
  username: database.username,
  password: database.password,
  database: database.name,
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/infrastructure/database/migrations/*.ts'],
  synchronize: false,
});
