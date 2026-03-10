import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AdminModule } from './admin/admin.module';
import { HealthController } from './health/health.controller';
import { AuthModule } from './auth/auth.module';
import { CartModule } from './cart/cart.module';
import { CategoriesModule } from './categories/categories.module';
import { CoreModule } from './core/core.module';
import { OrdersModule } from './orders/orders.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';
import { ReviewsModule } from './reviews/reviews.module';
import { SellersModule } from './sellers/sellers.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate(config: Record<string, string | undefined>) {
        const required = [
          'DATABASE_URL',
          'JWT_SECRET',
          'REFRESH_TOKEN_SECRET',
          'CSRF_SECRET',
          'FRONTEND_URL',
        ] as const;
        const missing = required.filter((key) => !config[key]);
        if (missing.length > 0) {
          throw new Error(
            `Application startup failed: missing required environment variables: ${missing.join(', ')}`,
          );
        }
        return config;
      },
    }),

    // ── Rate limiting ─────────────────────────────────────────────────────────
    // Two tiers: a generous global limit and a tight auth-endpoint limit.
    // Auth routes override with the 'auth' throttler via @Throttle({ auth: {} }).
    ThrottlerModule.forRoot([
      {
        name: 'global',
        ttl: 60_000, // 1 minute window
        limit: 120, // 120 req / minute per IP (covers normal browsing)
      },
      {
        name: 'auth',
        ttl: 60_000,
        limit: 10, // 10 req / minute per IP (brute-force protection on login)
      },
    ]),

    PrismaModule,
    CoreModule,
    AuthModule,
    UsersModule,
    SellersModule,
    ProductsModule,
    CategoriesModule,
    CartModule,
    OrdersModule,
    ReviewsModule,
    AdminModule,
  ],
  controllers: [HealthController],
  providers: [
    // Apply the global rate limit to every route by default.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
