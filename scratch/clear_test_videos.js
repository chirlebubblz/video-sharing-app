const { PrismaClient } = require('@prisma/client');

const dbUrl = 'postgresql://postgres.bdjzxlwpodiwqihvtnes:Chirlecakes123@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl,
    },
  },
});

async function main() {
  try {
    const deleted = await prisma.video.deleteMany({});
    console.log(`✅ Cleared ${deleted.count} old test videos from Supabase DB! Library is now 100% fresh & empty.`);
    process.exit(0);
  } catch (err) {
    console.error('Clear error:', err);
    process.exit(1);
  }
}

main();
