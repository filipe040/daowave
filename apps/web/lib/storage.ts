/**
 * Storage service for S3-compatible storage
 * Handles file uploads, presigned URLs, and file management
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { config } from "./config";

let s3Client: S3Client | null = null;

/**
 * Initialize S3 client
 */
export function getS3Client(): S3Client | null {
  if (!config.storage.enabled) {
    return null;
  }

  if (!s3Client) {
    s3Client = new S3Client({
      endpoint: config.storage.endpoint,
      region: "us-east-1", // Default region, adjust if needed
      credentials: {
        accessKeyId: config.storage.accessKey!,
        secretAccessKey: config.storage.secretKey!,
      },
      forcePathStyle: true, // Required for MinIO and some S3-compatible services
    });
  }

  return s3Client;
}

/**
 * Upload a file to storage
 */
export async function uploadFile(
  key: string,
  body: Buffer | string,
  contentType?: string
): Promise<string> {
  const client = getS3Client();
  if (!client) {
    throw new Error("Storage is not configured");
  }

  const command = new PutObjectCommand({
    Bucket: config.storage.bucket!,
    Key: key,
    Body: body,
    ContentType: contentType,
    // Make files private by default
    ACL: "private",
  });

  await client.send(command);

  // Return the file URL (or presigned URL if needed)
  return `${config.storage.endpoint}/${config.storage.bucket}/${key}`;
}

/**
 * Get a presigned URL for downloading a file
 * @param key - File key/path
 * @param expiresIn - URL expiration time in seconds (default: 1 hour)
 */
export async function getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
  const client = getS3Client();
  if (!client) {
    throw new Error("Storage is not configured");
  }

  const command = new GetObjectCommand({
    Bucket: config.storage.bucket!,
    Key: key,
  });

  const url = await getSignedUrl(client, command, { expiresIn });
  return url;
}

/**
 * Delete a file from storage
 */
export async function deleteFile(key: string): Promise<void> {
  const client = getS3Client();
  if (!client) {
    throw new Error("Storage is not configured");
  }

  const command = new DeleteObjectCommand({
    Bucket: config.storage.bucket!,
    Key: key,
  });

  await client.send(command);
}

/**
 * Generate a file key/path for organizing files
 */
export function generateFileKey(
  prefix: string,
  filename: string,
  userId?: string
): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");

  if (userId) {
    return `${prefix}/${userId}/${timestamp}-${random}-${sanitizedFilename}`;
  }

  return `${prefix}/${timestamp}-${random}-${sanitizedFilename}`;
}

/**
 * Upload a PDF ticket
 */
export async function uploadTicketPDF(
  ticketId: string,
  pdfBuffer: Buffer
): Promise<string> {
  const key = generateFileKey("tickets", `${ticketId}.pdf`);
  return uploadFile(key, pdfBuffer, "application/pdf");
}

/**
 * Get presigned URL for ticket PDF
 */
export async function getTicketPDFUrl(ticketId: string, expiresIn: number = 3600): Promise<string> {
  const key = `tickets/${ticketId}.pdf`;
  return getPresignedUrl(key, expiresIn);
}

