import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { NextResponse } from 'next/server';

// Server-side R2 Client setup
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

export async function POST(req: Request) {
  try {
    const { filename, contentType, fileSize, isThumbnail } = await req.json();

    // 1. Server-Side Safety Validation (Golden Manifesto Cons Mitigation)
    if (contentType !== 'image/webp') {
      return NextResponse.json(
        { error: 'Invalid content type. Only WebP format is allowed.' },
        { status: 400 }
      );
    }

    const limit = isThumbnail ? 15 * 1024 : 60 * 1024; // Capped at ~15KB and ~60KB
    if (fileSize > limit) {
      return NextResponse.json(
        { error: `File size exceeds safety limit (${limit / 1024}KB). Client compression required.` },
        { status: 400 }
      );
    }

    // 2. Developer Fallback Mode (Saves Vercel deployment blockers)
    if (process.env.R2_ACCESS_KEY_ID === 'dummy_access_key_id' || !process.env.R2_ACCESS_KEY_ID) {
      // Mock developer mode - return a fake URL that clients will recognize and fall back to local Base64
      return NextResponse.json({
        uploadUrl: 'mock://local-upload',
        publicUrl: 'mock_developer_base64_fallback'
      });
    }

    // 3. Generate Cloudflare R2 Presigned PUT Url
    const key = `uploads/${isThumbnail ? 'thumb_' : 'full_'}${Date.now()}_${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });
    const publicDomain = process.env.R2_PUBLIC_DOMAIN || `https://${process.env.R2_BUCKET_NAME}.r2.cloudflarestorage.com`;
    const publicUrl = `${publicDomain}/${key}`;

    return NextResponse.json({ uploadUrl, publicUrl });
  } catch (err: any) {
    console.error('Error generating pre-signed R2 URL:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
