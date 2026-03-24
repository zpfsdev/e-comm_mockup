import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('App e2e', () => {
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

  describe('auth flow', () => {
    it('registers, logs in, and returns /auth/me', async () => {
      const email = `e2e-${Date.now()}@example.com`;
      const password = 'P@ssw0rd123';

      const registerRes = await request(httpServer as any)
        .post('/auth/register')
        .send({
          firstName: 'E2E',
          middleName: null,
          lastName: 'User',
          username: `e2e-user-${Date.now()}`,
          email,
          password,
          dateOfBirth: '2000-01-01',
          contactNumber: '09171234567',
        })
        .expect(201);

      const accessToken: string = registerRes.body.accessToken;
      expect(typeof accessToken).toBe('string');

      const meRes = await request(httpServer as any)
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(meRes.body.email).toBe(email);

      const loginRes = await request(httpServer as any)
        .post('/auth/login')
        .send({ email, password })
        .expect(200);

      expect(typeof loginRes.body.accessToken).toBe('string');
      expect(loginRes.body.user.email).toBe(email);
    });
  });
});
