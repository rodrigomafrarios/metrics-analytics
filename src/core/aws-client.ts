import { Credentials, DynamoDB, Firehose, IAM, Kinesis, S3 } from "aws-sdk";

const params = process.env.LOCALSTACK_ENDPOINT
  ? {
    endpoint: process.env.LOCALSTACK_ENDPOINT,
    credentials: new Credentials("000000000000", "na")
  } : {};

export const dynamodb = new DynamoDB(params);

export const ddbDocument = new DynamoDB.DocumentClient(params);

export const firehose = new Firehose(params);

export const kinesis = new Kinesis(params);

export const s3 = new S3({
  ...params,
  s3ForcePathStyle: true,
});

export const iam = new IAM(params);