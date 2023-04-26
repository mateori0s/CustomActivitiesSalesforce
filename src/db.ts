import { DataSource } from "typeorm"

export const AppDataSource = new DataSource({
    type: "postgres",
    host: "dpg-ch4j2q4s3fvjtidamtkg-a",
    port: 5432,
    username: "mateorios",
    password: "ZgJsuPvYrZd5WLG5Jb0CixdYyemwJZgv",
    database: "broker_test",
    synchronize: true,
    logging: true,
    entities: [Post, Category],
    subscribers: [],
    migrations: [],
})