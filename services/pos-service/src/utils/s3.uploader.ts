import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const isLocalStack = !!process.env.AWS_ENDPOINT_URL;

const s3 = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "test",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "test",
  },
  ...(isLocalStack && {
    endpoint: process.env.AWS_ENDPOINT_URL,
    forcePathStyle: true, // required for LocalStack S3
  }),
});

export const uploadInvoice = async (invoice: any, transactionId: number) => {

  const key = `invoices/invoice-${transactionId}.json`;
  const bucket = process.env.S3_BUCKET!;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: JSON.stringify(invoice),
    ContentType: "application/json"
  });

  await s3.send(command);

  // Return LocalStack URL or real S3 URL depending on environment
  if (isLocalStack) {
    return `${process.env.AWS_ENDPOINT_URL}/${bucket}/${key}`;
  }
  return `https://${bucket}.s3.amazonaws.com/${key}`;

};