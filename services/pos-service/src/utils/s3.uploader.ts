import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: process.env.AWS_REGION
});

export const uploadInvoice = async (invoice: any, transactionId: number) => {

  const key = `invoices/invoice-${transactionId}.json`;

  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    Body: JSON.stringify(invoice),
    ContentType: "application/json"
  });

  await s3.send(command);

  return `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${key}`;

};