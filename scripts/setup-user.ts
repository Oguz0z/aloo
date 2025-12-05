/**
 * Setup script to create the first admin user
 * Run with: npm run setup:user
 */

import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import bcrypt from 'bcrypt';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('\n🚀 ALOO User Setup\n');

  // Get user input
  const email = await question('Email: ');
  const name = await question('Name: ');
  const password = await question('Password: ');

  if (!email || !password) {
    console.error('❌ Email and password are required');
    process.exit(1);
  }

  // Check DATABASE_URL
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not set. Make sure .env file exists.');
    process.exit(1);
  }

  console.log('\n📡 Connecting to database...');

  // Extract file path from SQLite URL
  const filePath = databaseUrl.replace('file:', '');
  const adapter = new PrismaBetterSqlite3({ url: filePath });
  const prisma = new PrismaClient({ adapter });

  try {
    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.log(`⚠️  User ${email} already exists`);
      const update = await question('Update password? (y/n): ');
      if (update.toLowerCase() === 'y') {
        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.user.update({
          where: { email },
          data: { password: hashedPassword },
        });
        console.log('✅ Password updated successfully!');
      }
    } else {
      // Create new user
      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.user.create({
        data: {
          email,
          name: name || email.split('@')[0],
          password: hashedPassword,
          createdAt: new Date(),
        },
      });
      console.log(`✅ User ${email} created successfully!`);
    }

    console.log('\n🎉 Setup complete! You can now login at http://localhost:3000\n');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

main();
