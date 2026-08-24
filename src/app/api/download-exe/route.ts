import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
  try {
    // Check if built .exe exists in dist or public
    const distExePath = path.join(process.cwd(), 'dist', 'DefinitelyNotLoom Studio Setup 0.1.0.exe');
    const publicExePath = path.join(process.cwd(), 'public', 'DefinitelyNotLoom-Setup.exe');

    let targetPath = fs.existsSync(publicExePath) ? publicExePath : fs.existsSync(distExePath) ? distExePath : null;

    if (targetPath) {
      const fileBuffer = fs.readFileSync(targetPath);
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.microsoft.portable-executable',
          'Content-Disposition': 'attachment; filename="DefinitelyNotLoom-Setup.exe"',
        },
      });
    }

    // Fallback: Redirect to GitHub Releases or latest binary assets
    return NextResponse.redirect('https://github.com/chirlebubblz/video-sharing-app/releases');
  } catch (err) {
    console.error('Error serving desktop exe:', err);
    return NextResponse.json({ error: 'Desktop app installer not available' }, { status: 500 });
  }
}
