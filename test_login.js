const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function test() {
  const prisma = new PrismaClient();
  try {
    const user = await prisma.adminUser.findUnique({
      where: { username: 'superadmin@smartmart.com' },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true }
            }
          }
        }
      }
    });
    console.log('User found:', !!user);
    if (user) {
      console.log('User active:', user.is_active);
      const valid = await bcrypt.compare('password123', user.password_hash);
      console.log('Password valid:', valid);
      console.log('Hash in DB:', user.password_hash);
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

test();