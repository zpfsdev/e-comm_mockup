import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('API contracts', () => {
  let app: INestApplication;
  let httpServer: unknown;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    httpServer = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/products contract', () => {
    it('returns paginated product list shape expected by frontend', async () => {
      const res = await request(httpServer as any)
        .get('/products?limit=12&offset=0')
        .expect(200);

      expect(res.body).toEqual(
        expect.objectContaining({
          products: expect.any(Array),
          total: expect.any(Number),
          page: expect.any(Number),
          limit: expect.any(Number),
          totalPages: expect.any(Number),
        }),
      );

      if (res.body.products.length > 0) {
        const product = res.body.products[0];
        expect(product).toEqual(
          expect.objectContaining({
            id: expect.any(Number),
            name: expect.any(String),
            price: expect.anything(),
          }),
        );
      }
    });
  });
});
