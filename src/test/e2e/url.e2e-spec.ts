import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AppModule } from "app.module";
import { env } from "config/env";

describe("URL (e2e)", () => {
    let app: INestApplication;

    beforeAll(async () => {
        env.DB_PORT = 5433;

        const module = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = module.createNestApplication();
        await app.init();
    });
})