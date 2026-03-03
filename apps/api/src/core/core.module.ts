import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  providers: [
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    /** JwtAuthGuard MUST be registered before RolesGuard so request.user
     *  is populated by the JWT strategy before role checks run. */
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class CoreModule {}
