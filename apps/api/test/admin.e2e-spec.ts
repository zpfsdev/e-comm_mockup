import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Admin e2e', () => {
  let app: INestApplication;
  let httpServer: unknown;

  let adminAccessToken: string;
  let customerAccessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    httpServer = app.getHttpServer();

    const adminLogin = await request(httpServer as any)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@artistryx.test',
        password: 'TestPass1!',
      })
      .expect(200);
    adminAccessToken = adminLogin.body.accessToken;

    const customerLogin = await request(httpServer as any)
      .post('/api/v1/auth/login')
      .send({
        email: 'testcustomer@artistryx.test',
        password: 'TestPass1!',
      })
      .expect(200);
    customerAccessToken = customerLogin.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Admin guards', () => {
    it('rejects unauthenticated access to /admin/stats', async () => {
      await request(httpServer as any).get('/api/v1/admin/stats').expect(401);
    });

    it('rejects non-admin user with 403', async () => {
      await request(httpServer as any)
        .get('/api/v1/admin/stats')
        .set('Authorization', `Bearer ${customerAccessToken}`)
        .expect(403);
    });
  });

  describe('Admin stats and users', () => {
    it('returns platform stats for admin', async () => {
      const res = await request(httpServer as any)
        .get('/api/v1/admin/stats')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(res.body).toEqual(
        expect.objectContaining({
          totalUsers: expect.any(Number),
          totalSellers: expect.any(Number),
          totalOrders: expect.any(Number),
          totalRevenue: expect.any(Number),
        }),
      );
    });

    it('returns paginated users list with expected shape', async () => {
      const res = await request(httpServer as any)
        .get('/api/v1/admin/users?page=1&limit=10')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(res.body).toEqual(
        expect.objectContaining({
          users: expect.any(Array),
          total: expect.any(Number),
          page: 1,
          limit: expect.any(Number),
          totalPages: expect.any(Number),
        }),
      );

      if (res.body.users.length > 0) {
        const user = res.body.users[0];
        expect(user).toEqual(
          expect.objectContaining({
            id: expect.any(Number),
            email: expect.any(String),
            status: expect.any(String),
            userRoles: expect.any(Array),
          }),
        );
      }
    });
  });

  describe('Admin user status updates', () => {
    it('allows admin to deactivate and reactivate a user', async () => {
      const usersRes = await request(httpServer as any)
        .get('/api/v1/admin/users?limit=50')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      const target = usersRes.body.users.find(
        (u: { email: string }) => u.email === 'testcustomer2@artistryx.test',
      );
      expect(target).toBeDefined();

      const userId = target.id;

      const deactivateRes = await request(httpServer as any)
        .patch(`/api/v1/admin/users/${userId}/status`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ status: 'Inactive' })
        .expect(200);

      expect(deactivateRes.body).toEqual(
        expect.objectContaining({
          id: userId,
          status: 'Inactive',
        }),
      );

      const reactivateRes = await request(httpServer as any)
        .patch(`/api/v1/admin/users/${userId}/status`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ status: 'Active' })
        .expect(200);

      expect(reactivateRes.body).toEqual(
        expect.objectContaining({
          id: userId,
          status: 'Active',
        }),
      );
    });
  });
});