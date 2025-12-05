import path from 'node:path';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import bcrypt from 'bcrypt';

// Use absolute path to database
const dbPath = path.join(process.cwd(), 'data', 'aloo.db');
const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter });

async function main() {
  // eslint-disable-next-line no-console
  console.info('Seeding database...');

  // Create default admin user
  const adminEmail = 'admin@aloo.com';
  const adminPassword = 'admin';

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    // eslint-disable-next-line no-console
    console.info('Admin user already exists, skipping...');
  } else {
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: 'Admin',
        inviteToken: null,
        createdAt: new Date(),
      },
    });

    // eslint-disable-next-line no-console
    console.info(`Created admin user: ${adminEmail}`);
  }

  // eslint-disable-next-line no-console
  console.info('Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
