import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AppModule } from "../../app.module";
import request from 'supertest';
import { env } from "config/env";

describe("Users (e2e)", () => {
    let app: INestApplication;

    beforeAll(async () => {
        env.DB_PORT = 5433;

        const module = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = module.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    it("/POST users", async () => {
        const res = await request(app.getHttpServer())
            .post("/users")
            .send({ mail: "caio@mail.com" })
            .expect(201);

        expect(res.body.mail).toBe("caio@mail.com");
    });

    it("doesn't allow duplicating mail", async () => {
        await request(app.getHttpServer())
            .post("/users")
            .send({ mail: "caio1@mail.com" });

        await request(app.getHttpServer())
            .post("/users")
            .send({ mail: "caio1@mail.com" })
            .expect(409);
    });
});