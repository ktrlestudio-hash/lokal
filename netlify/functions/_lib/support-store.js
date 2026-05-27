import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const LOCAL_FILE = join('/tmp', 'lokal-support.json');
const DATA_KEY   = 'data/support-chats.json';
const BUCKET     = process.env.R2_BUCKET_NAME;

function isR2Configured() {
  return !!(process.env.CF_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET_NAME);
}

function getClient() {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY },
  });
}

export async function readSupportChats() {
  if (isR2Configured()) {
    try {
      const res = await getClient().send(new GetObjectCommand({ Bucket: BUCKET, Key: DATA_KEY }));
      return JSON.parse(await res.Body.transformToString());
    } catch (err) {
      if (err.Code === 'NoSuchKey' || err.name === 'NoSuchKey') return [];
      throw err;
    }
  }
  if (!existsSync(LOCAL_FILE)) return [];
  return JSON.parse(readFileSync(LOCAL_FILE, 'utf8'));
}

export async function writeSupportChats(data) {
  if (isR2Configured()) {
    await getClient().send(new PutObjectCommand({
      Bucket: BUCKET, Key: DATA_KEY,
      Body: JSON.stringify(data, null, 2), ContentType: 'application/json',
    }));
  } else {
    writeFileSync(LOCAL_FILE, JSON.stringify(data, null, 2), 'utf8');
  }
}
