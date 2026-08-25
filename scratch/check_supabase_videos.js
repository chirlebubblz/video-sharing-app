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
    const videos = await prisma.video.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { transcripts: true, comments: true },
        },
      },
    });

    console.log('====================================================');
    console.log(`📊 SUPABASE DATABASE CONTENT REPORT (${videos.length} TOTAL VIDEOS)`);
    console.log('====================================================\n');

    if (videos.length === 0) {
      console.log('ℹ️ No videos recorded yet in Supabase. Record your first video using the Chrome Extension!');
    } else {
      videos.forEach((v, index) => {
        console.log(`[Video #${index + 1}] ID: ${v.id}`);
        console.log(`  • Title: "${v.title}"`);
        console.log(`  • Duration: ${v.duration}s | Views: ${v.viewsCount}`);
        console.log(`  • Video URL: ${v.videoUrl}`);
        console.log(`  • Transcripts: ${v._count.transcripts} segments | Comments: ${v._count.comments}`);
        console.log(`  • Created At: ${v.createdAt.toISOString()}\n`);
      });
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Check error:', err.message);
    process.exit(1);
  }
}

main();
