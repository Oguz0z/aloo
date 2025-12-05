import { PrismaClient } from './src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

async function importLeads() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    // Get the new user
    const user = await prisma.user.findUnique({
      where: { email: 'test@test.de' }
    });

    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('User ID:', user.id);

    // Check for existing leads
    const existingLeads = await prisma.lead.findMany();
    console.log('Existing leads in DB:', existingLeads.length);

    if (existingLeads.length > 0) {
      // Update all leads to belong to the new user
      const updated = await prisma.lead.updateMany({
        data: { userId: user.id }
      });
      console.log('Updated', updated.count, 'leads to belong to user');
    } else {
      console.log('No existing leads found in database');
    }

    // Check final count
    const userLeads = await prisma.lead.findMany({
      where: { userId: user.id }
    });
    console.log('Leads now belonging to user:', userLeads.length);

  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

importLeads().catch(console.error);
