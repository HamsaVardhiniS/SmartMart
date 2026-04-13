#!/bin/bash
# LocalStack S3 initialization — runs automatically when LocalStack is ready

echo "Creating S3 buckets in LocalStack..."

awslocal s3 mb s3://smartmart-invoices --region us-east-1

awslocal s3api put-bucket-cors \
  --bucket smartmart-invoices \
  --cors-configuration '{
    "CORSRules": [{
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST"],
      "AllowedHeaders": ["*"]
    }]
  }'

echo "S3 bucket 'smartmart-invoices' created successfully."
awslocal s3 ls
