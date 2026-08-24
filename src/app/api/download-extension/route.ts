import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

export async function GET(req: NextRequest) {
  try {
    const extensionDir = path.join(process.cwd(), 'chrome-extension');
    const zip = new JSZip();

    const files = fs.readdirSync(extensionDir);
    for (const file of files) {
      const filePath = path.join(extensionDir, file);
      const stat = fs.statSync(filePath);
      if (stat.isFile()) {
        const content = fs.readFileSync(filePath);
        zip.file(file, content);
      }
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="DefinitelyNotLoom-Chrome-Extension.zip"',
      },
    });
  } catch (err) {
    console.error('Error serving extension zip:', err);
    return NextResponse.json({ error: 'Failed to generate extension zip' }, { status: 500 });
  }
}
