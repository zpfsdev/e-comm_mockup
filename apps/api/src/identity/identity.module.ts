import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService, ConfigModule } from '@nestjs/config';

// Auth
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { JwtStrategy } from './auth/strategies/jwt.strategy';

// Users
import { UsersController } from './users/users.controller';
import { UsersService } from './users/users.service';

// Admin
import { AdminController } from './admin/admin.controller';
import { AdminService } from './admin/admin.service';

// Addresses
import { AddressesController } from './users/addresses.controller';
import { AddressesService } from './users/addresses.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '7d' } as any,
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController, UsersController, AdminController, AddressesController],
  providers: [
    AuthService,
    JwtStrategy,
    UsersService,
    AdminService,
    AddressesService,
  ],
  exports: [AuthService, UsersService, AddressesService],
})
export class IdentityModule {}

