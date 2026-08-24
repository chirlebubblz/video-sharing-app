import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || process.env.R2_BUCKET_NAME;
const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID;
const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY;
const S3_ENDPOINT = process.env.S3_ENDPOINT || (process.env.R2_ACCOUNT_ID ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : undefined);
const S3_PUBLIC_DOMAIN = process.env.S3_PUBLIC_DOMAIN || process.env.R2_PUBLIC_DOMAIN;

let s3Client: S3Client | null = null;

if (S3_ACCESS_KEY_ID && S3_SECRET_ACCESS_KEY && S3_BUCKET_NAME) {
  s3Client = new S3Client({
    region: 'auto',
    endpoint: S3_ENDPOINT,
    credentials: {
      accessKeyId: S3_ACCESS_KEY_ID,
      secretAccessKey: S3_SECRET_ACCESS_KEY,
    },
  });
}

export async function uploadVideoToStorage(buffer: Buffer, filename: string): Promise<string> {
  // Option 1: Cloudflare R2 / AWS S3 Storage if credentials provided
  if (s3Client && S3_BUCKET_NAME) {
    try {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: S3_BUCKET_NAME,
          Key: `videos/${filename}`,
          Body: buffer,
          ContentType: 'video/webm',
        })
      );

      if (S3_PUBLIC_DOMAIN) {
        return `${S3_PUBLIC_DOMAIN}/videos/${filename}`;
      }
      return `${S3_ENDPOINT}/${S3_BUCKET_NAME}/videos/${filename}`;
    } catch (err) {
      console.warn('Cloud storage upload warning, falling back to local file storage:', err);
    }
  }

  // Option 2: Local File Storage (Fallback for local dev & desktop servers)
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const filePath = path.join(uploadsDir, filename);
  fs.writeFileSync(filePath, buffer);

  return `/uploads/${filename}`;
}
