import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const compression = require('compression') as () => ReturnType<
  typeof import('compression')
>;
import helmet from 'helmet';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const cookieParser = require('cookie-parser') as () => ReturnType<
  typeof import('cookie-parser')
>;
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const nodeEnv = configService.get<string>(
    'NODE_ENV',
    process.env.NODE_ENV ?? 'development',
  );
  const isProd = nodeEnv === 'production';

  // ── Security headers ────────────────────────────────────────────────────────
  // Helmet sets safe defaults: X-Frame-Options, X-Content-Type-Options,
  // Strict-Transport-Security, Referrer-Policy, etc.
  // Content-Security-Policy is relaxed only in non-production for the Swagger UI.
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: isProd ? ["'self'"] : ["'self'", "'unsafe-inline'"],
          styleSrc: isProd ? ["'self'"] : ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'", 'https:', 'data:'],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
      crossOriginEmbedderPolicy: false, // allows Swagger UI to load
    }),
  );

  // ── Cookies ───────────────────────────────────────────────────────────────────
  app.use(cookieParser());

  // ── Gzip compression ────────────────────────────────────────────────────────
  // Reduces response payload for large product lists and Swagger JSON.
  app.use(compression());

  // ── Global prefix ───────────────────────────────────────────────────────────
  app.setGlobalPrefix('api/v1');

  // ── Validation ──────────────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ── CORS ────────────────────────────────────────────────────────────────────
  app.enableCors({
    origin: configService.get<string>('FRONTEND_URL', 'http://localhost:3000'),
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'Accept', 'X-CSRF-Token'],
  });

  // ── Swagger (development only) ───────────────────────────────────────────────
  if (!isProd) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Artistryx API')
      .setDescription(
        'E-Commerce platform for early childhood learning products',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
    Logger.log(
      `Swagger docs at http://localhost:${configService.get<number>('PORT', 3001)}/api/docs`,
      'Bootstrap',
    );
  }

  const port = configService.get<number>('PORT', 3001);
  await app.listen(port);
  Logger.log(
    `Artistryx API running on http://localhost:${port}/api/v1`,
    'Bootstrap',
  );
}

bootstrap().catch((err) => {
  Logger.error('Failed to bootstrap application', err, 'Bootstrap');
  process.exitCode = 1;
});
