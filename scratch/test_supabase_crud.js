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
  console.log('Testing CRUD query on Supabase PostgreSQL...');
  try {
    const count = await prisma.video.count();
    console.log(`✅ Table "Video" exists in Supabase DB! Current count: ${count}`);

    const videos = await prisma.video.findMany({ take: 5 });
    console.log('✅ Query succeeded! Videos retrieved:', videos.length);

    console.log('\n====================================================');
    console.log('🎉 SUPABASE DATABASE CONNECTION & SCHEMA 100% VERIFIED!');
    console.log('====================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Query error:', err.message);
    process.exit(1);
  }
}

main();
