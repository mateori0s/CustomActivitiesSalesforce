import "reflect-metadata"
import { DataSource } from "typeorm"
import { Message } from "./entities/message.entity";

export const dataSource = new DataSource({
  type: "postgres",
  host: "dpg-cgvea0ks3fvmvqd37kig-a.oregon-postgres.render.com",
  port: 5432,
  username: "claro",
  password: "1PhTpIunQRWEZOTzJh522fPxqmVebKpP",
  database: "bella_dati_db",
  entities: [Message],
  migrations: [],
  subscribers: [],
  ssl: { rejectUnauthorized: false },
});
