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
  console.log('Testing connection to Supabase PostgreSQL at aws-0-ap-northeast-2.pooler.supabase.com:6543...');
  try {
    const result = await prisma.$queryRaw`SELECT NOW(), current_database(), current_user`;
    console.log('✅ Connected successfully to Supabase DB!');
    console.log('QueryResult:', result);

    console.log('\nCreating database tables if not present...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Video" (
        "id" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "description" TEXT,
        "videoUrl" TEXT NOT NULL,
        "duration" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "viewsCount" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "summary" TEXT,
        "actionItems" TEXT,
        "chapters" TEXT,
        CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Transcript" (
        "id" TEXT NOT NULL,
        "videoId" TEXT NOT NULL,
        "start" DOUBLE PRECISION NOT NULL,
        "end" DOUBLE PRECISION NOT NULL,
        "text" TEXT NOT NULL,
        "isFiller" BOOLEAN NOT NULL DEFAULT false,
        CONSTRAINT "Transcript_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "Transcript_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Comment" (
        "id" TEXT NOT NULL,
        "videoId" TEXT NOT NULL,
        "author" TEXT NOT NULL DEFAULT 'Anonymous Viewer',
        "text" TEXT NOT NULL,
        "timestamp" DOUBLE PRECISION NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Comment_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "Comment_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    console.log('🎉 ALL TABLES ("Video", "Transcript", "Comment") CREATED SUCCESSFULLY ON SUPABASE!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Connection error:', err.message);
    process.exit(1);
  }
}

main();
