import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import type { PoolConfig } from 'mariadb';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private static createPoolConfigFromDatabaseUrl(
    databaseUrl: string,
  ): PoolConfig {
    let url: URL;
    try {
      url = new URL(databaseUrl);
    } catch {
      throw new Error('Invalid DATABASE_URL for Prisma MariaDB adapter.');
    }

    const host = url.hostname || 'localhost';
    const port = url.port ? Number(url.port) : 3306;
    const user = url.username ? decodeURIComponent(url.username) : 'root';
    const password = url.password
      ? decodeURIComponent(url.password)
      : undefined;
    const database = url.pathname ? url.pathname.replace(/^\//, '') : undefined;

    const config: PoolConfig = {
      host,
      port,
      user,
    };
    if (password !== undefined) {
      config.password = password;
    }
    if (database) {
      config.database = database;
    }
    return config;
  }

  constructor() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error(
        'DATABASE_URL environment variable is required for PrismaClient.',
      );
    }

    const poolConfig = PrismaService.createPoolConfigFromDatabaseUrl(
      databaseUrl,
    );
    const adapter = new PrismaMariaDb(poolConfig);

    super({
      adapter,
      log:
        process.env.NODE_ENV === 'production'
          ? ['warn', 'error']
          : ['query', 'warn', 'error'],
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
