import { dynamodb, firehose, iam, s3 } from "../src/core";

const createTable = async () => {
  return dynamodb.createTable({
    TableName: process.env.GLOBAL_TABLE as string,
    AttributeDefinitions: [
      { "AttributeName": "PK", "AttributeType": "S" },
      { "AttributeName": "SK", "AttributeType": "S" },
      { "AttributeName": "GSI2PK", "AttributeType": "S" },
      { "AttributeName": "GSI2SK", "AttributeType": "S" }
    ],
    KeySchema: [
      { "AttributeName": "PK", "KeyType": "HASH" },
      { "AttributeName": "SK", "KeyType": "RANGE" }
    ],
    GlobalSecondaryIndexes: [
      {
        "IndexName": "GSI2",
        "KeySchema": [
          { "AttributeName": "GSI2PK", "KeyType": "HASH" },
          { "AttributeName": "GSI2SK", "KeyType": "RANGE" }
        ],
        "Projection": {
          "ProjectionType": "ALL"
        }
      }
    ],
    BillingMode: "PAY_PER_REQUEST",
  }).promise();
};

const createBucket = async () => {
  const buckets = await s3.listBuckets().promise();
  
  if (buckets.Buckets?.find((item) => item.Name === process.env.METRICS_BUCKET)) {
    return;
  }

  return s3.createBucket({
    Bucket: process.env.METRICS_BUCKET as string,
    CreateBucketConfiguration: {
      LocationConstraint: ""
    }
  }).promise();
};

const createFirehose = async () => {
  const role = await iam.createRole({
    RoleName: "put-records-on-s3-bucket-test",
    AssumeRolePolicyDocument: `{
        {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Action": [
                  "s3:AbortMultipartUpload",
                  "s3:GetBucketLocation",
                  "s3:GetObject",
                  "s3:ListBucket",
                  "s3:ListBucketMultipartUploads",
                  "s3:PutObject"
              ],
              "Resource": "*"
            }
          ]
        }
      }`
  }).promise();

  return firehose
    .createDeliveryStream({
      DeliveryStreamName: process.env.FIREHOSE_DELIVERY_STREAM as string,
      DeliveryStreamType: "DirectPut",
      S3DestinationConfiguration: {
        RoleARN: role.Role.Arn,
        BucketARN: `arn:aws:s3:::${process.env.METRICS_BUCKET as string}`
      }
    }).promise();
};

const up = async (): Promise<void> => {
  try {
    await createBucket();
    await Promise.allSettled([
      createTable(),
      createFirehose()
    ]);
  } catch (error) {
    console.log("\x1b[31m Error attempting to create resources", JSON.stringify(error, null, 2));
  }
};

export default up;