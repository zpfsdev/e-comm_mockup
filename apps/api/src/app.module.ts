import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { HealthController } from './health/health.controller';
import { CoreModule } from './core/core.module';
import { PrismaModule } from './prisma/prisma.module';

import { IdentityModule } from './identity/identity.module';
import { CatalogModule } from './catalog/catalog.module';
import { SalesModule } from './sales/sales.module';
import { LocationsModule } from './locations/locations.module';

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

    // rate limiting
    ThrottlerModule.forRoot([
      { name: 'global', ttl: 60_000, limit: 600 },
      { name: 'auth', ttl: 60_000, limit: 100 },
    ]),

    PrismaModule,
    CoreModule,
    IdentityModule,
    CatalogModule,
    SalesModule,
    LocationsModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
