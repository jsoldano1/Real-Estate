import { randomUUID } from 'crypto';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const bucket = process.env.S3_BUCKET;
const endpoint = process.env.S3_ENDPOINT;

const client = bucket
  ? new S3Client({
      region: process.env.S3_REGION || 'auto',
      endpoint,
      forcePathStyle: !!endpoint,
      credentials: process.env.S3_ACCESS_KEY_ID
        ? {
            accessKeyId: process.env.S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || ''
          }
        : undefined
    })
  : null;

export async function uploadFile(file: File) {
  const key = `${new Date().toISOString().slice(0, 10)}/${randomUUID()}-${file.name}`;
  if (!client || !bucket) {
    return { key };
  }

  const arrayBuffer = await file.arrayBuffer();
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: Buffer.from(arrayBuffer),
      ContentType: file.type
    })
  );
  return { key };
}

export async function getSignedDocumentUrl(storageKey: string) {
  if (!client || !bucket) return null;
  return getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: storageKey }), { expiresIn: 60 * 10 });
}
