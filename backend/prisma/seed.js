const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('marjane2026', 10);

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@marjane.ma' },
    update: {},
    create: {
      email: 'demo@marjane.ma',
      password: hashedPassword,
      name: 'Soufiane baba',
      phone: '+212 600-000000',
      wallet: {
        create: {
          balance: 15480.50,
          currency: 'MAD'
        }
      }
    }
  });

  console.log('--- Demo Account Created ---');
  console.log('Email: demo@marjane.ma');
  console.log('Password: marjane2026');
  console.log('MFA Code: 123456');
  console.log('---------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
