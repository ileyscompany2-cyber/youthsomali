import "server-only";

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomBytes, randomUUID } from "node:crypto";
import { execute } from "@/lib/db";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const allowedTypes = new Map([
  ["image/jpeg", { extension: "jpg", signature: (data: Buffer) => data.length > 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff }],
  ["image/png", { extension: "png", signature: (data: Buffer) => data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) }],
  ["image/webp", { extension: "webp", signature: (data: Buffer) => data.length >= 12 && data.toString("ascii", 0, 4) === "RIFF" && data.toString("ascii", 8, 12) === "WEBP" }],
  ["application/pdf", { extension: "pdf", signature: (data: Buffer) => data.length >= 5 && data.toString("ascii", 0, 5) === "%PDF-" }],
]);

function getClient(): S3Client {
  const { S3_ENDPOINT, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_FORCE_PATH_STYLE } = process.env;
  if (!S3_ENDPOINT || !S3_REGION || !S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY) {
    throw new Error("Object storage is not configured. Set the S3_ENDPOINT, S3_REGION, S3_ACCESS_KEY_ID, and S3_SECRET_ACCESS_KEY environment variables.");
  }
  return new S3Client({
    endpoint: S3_ENDPOINT,
    region: S3_REGION,
    forcePathStyle: S3_FORCE_PATH_STYLE === "true",
    credentials: { accessKeyId: S3_ACCESS_KEY_ID, secretAccessKey: S3_SECRET_ACCESS_KEY },
  });
}

export async function uploadMedia(file: File, kind: "image" | "document"): Promise<{ id: string; url: string; key: string }> {
  if (file.size < 1 || file.size > MAX_UPLOAD_BYTES) throw new RangeError("Media files must be smaller than 5 MB.");
  const format = allowedTypes.get(file.type);
  if (!format || (kind === "image" && !file.type.startsWith("image/")) || (kind === "document" && file.type !== "application/pdf")) {
    throw new TypeError(kind === "image" ? "Only JPEG, PNG, and WebP images are accepted." : "Only PDF documents are accepted.");
  }
  const body = Buffer.from(await file.arrayBuffer());
  if (!format.signature(body)) throw new TypeError("The uploaded image file does not match its declared type.");

  const bucket = process.env.S3_BUCKET;
  const mediaBaseUrl = process.env.NEXT_PUBLIC_MEDIA_BASE_URL;
  if (!bucket || !mediaBaseUrl) throw new Error("Object storage is not fully configured. Set S3_BUCKET and NEXT_PUBLIC_MEDIA_BASE_URL.");

  const key = `ypp-media/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${format.extension}`;
  await getClient().send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentLength: body.length,
    ContentType: file.type,
    CacheControl: "public, max-age=31536000, immutable",
  }));
  const url = `${mediaBaseUrl.replace(/\/+$/, "")}/${key}`;
  const id = randomBytes(15).toString("base64url");
  await execute(
    "INSERT INTO MediaAsset (id, storageKey, publicUrl, originalName, mimeType, sizeBytes) VALUES (?, ?, ?, ?, ?, ?)",
    [id, key, url, file.name.slice(0, 255), file.type, body.length],
  );
  return { id, url, key };
}
