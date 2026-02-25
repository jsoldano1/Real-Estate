import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  const property = await prisma.property.upsert({
    where: { id: 'home-property' },
    update: {},
    create: { id: 'home-property', name: 'Home', notes: 'Default seeded property.' }
  });

  const email = process.env.SEED_OWNER_EMAIL || 'owner@example.com';
  const password = process.env.SEED_OWNER_PASSWORD || 'ChangeMe123!';

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      name: 'Owner Admin',
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role: Role.OWNER
    }
  });

  const sampleVendors = [
    { name: 'North HVAC Co', trade: 'HVAC' },
    { name: 'BluePipe Plumbing', trade: 'Plumbing' },
    { name: 'Sparkline Electric', trade: 'Electrical' }
  ];

  for (const vendor of sampleVendors) {
    await prisma.vendor.upsert({
      where: { magicUploadToken: `${vendor.name.toLowerCase().replace(/\s+/g, '-')}-seed-token` },
      update: {},
      create: {
        propertyId: property.id,
        name: vendor.name,
        trade: vendor.trade,
        magicUploadToken: `${vendor.name.toLowerCase().replace(/\s+/g, '-')}-seed-token`
      }
    });
  }

  console.log('Seed complete');
  console.log(`Owner login: ${email} / ${password}`);
  console.log(`Example magic link token: ${randomUUID()}`);
}

main().finally(() => prisma.$disconnect());
