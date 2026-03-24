import { SetMetadata } from '@nestjs/common';
import { RoleName } from '@prisma/client';

export const ROLES_KEY = 'roles';

/** Attach required roles to a route handler. */
export const Roles = (...roles: RoleName[]) => SetMetadata(ROLES_KEY, roles);
