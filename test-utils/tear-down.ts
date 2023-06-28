import { dynamodb, firehose, iam, s3 } from "../src/core";

export const clearBucket = async (s3: AWS.S3) => {
  const objects = await s3
    .listObjectsV2({
      Bucket: process.env.METRICS_BUCKET as string
    }).promise();

  const tasks = [];

  if (objects.Contents?.length) {
    for (let i = 0; i < objects.Contents.length; i++) {
      tasks.push(
        s3.deleteObject({
          Bucket: process.env.METRICS_BUCKET as string,
          Key: objects.Contents[i].Key as string,
        }).promise()
      );
    }
  }

  return Promise.allSettled(tasks);
};

const down = async (): Promise<void> => {
  try {
    await Promise.all([
      dynamodb
        .deleteTable({ TableName: process.env.GLOBAL_TABLE as string })
        .promise(),
      firehose
        .deleteDeliveryStream({
          DeliveryStreamName: process.env.FIREHOSE_DELIVERY_STREAM as string,
        }).promise(),
      iam.deleteRole({
        RoleName: "put-records-on-s3-bucket-test"
      }).promise(),
      
    ]);

    await clearBucket(s3);

    await s3.deleteBucket({ Bucket: process.env.METRICS_BUCKET as string }).promise();

  } catch (error) {
    console.log("\x1b[31m Error attempting to delete resources", JSON.stringify(error, null, 2));
  }
};

export default down;