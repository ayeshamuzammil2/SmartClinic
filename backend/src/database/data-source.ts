import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'smartclinic',
  password: process.env.DB_PASSWORD || 'smartclinic',
  database: process.env.DB_NAME || 'smartclinic',
  entities: [path.join(__dirname, '../entities/*.entity.{ts,js}')],
  migrations: [path.join(__dirname, 'migrations/*.{ts,js}')],
  synchronize: false,
  logging: false,
});
