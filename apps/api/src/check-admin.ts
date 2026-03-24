import { PrismaClient, RoleName } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function checkAdmin() {
  const user = await prisma.user.findUnique({
    where: { email: 'admin@artistryx.test' },
    include: { userRoles: { include: { role: true } } }
  });

  if (!user) {
    console.log('ADMIN USER NOT FOUND');
    return;
  }

  const roleNames = user.userRoles.map(ur => ur.role.roleName);
  console.log('USER:', {
    id: user.id,
    email: user.email,
    roles: roleNames
  });

  const isValid = await bcrypt.compare('password123', user.password);
  console.log('PASSWORD VALID:', isValid);
}

checkAdmin().finally(() => prisma.$disconnect());
