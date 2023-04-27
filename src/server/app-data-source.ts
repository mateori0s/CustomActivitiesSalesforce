import "reflect-metadata"
import { DataSource } from "typeorm"
import { Message } from "./entities/message.entity";

export const dataSource = new DataSource({
  type: "postgres",
  host: process.env.DATABASE_HOST,
  port: 5432,
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: [Message],
  migrations: [],
  subscribers: [],
  ssl: true,
});
