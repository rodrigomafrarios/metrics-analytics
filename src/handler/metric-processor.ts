import { FirehoseTransformationEvent } from "aws-lambda";

import { MetricRecordData } from "@type";

/**
 * @param event FirehoseTransformationEvent
 * @description It enriches with partition keys for dynamic partitioning
 * @description A custom processor is necessary in case of data encryption. https://docs.aws.amazon.com/firehose/latest/dev/dynamic-partitioning.html
 * @async no await, async but required.
 */

export const metricProcessor = async (event: FirehoseTransformationEvent) => {
  const { records } = event;

  const decodedRecords = [];
  const createdAt = event.records.length
    ? new Date(event.records[0].approximateArrivalTimestamp)
    : new Date();

  for (const record of records) {

    const decodedData = JSON.parse(
      Buffer.from(record.data, "base64").toString("utf-8")
    ) as unknown as MetricRecordData;

    const year = createdAt.getUTCFullYear();
    const month = createdAt.getUTCMonth();
    const day = createdAt.getUTCDate();
    const hour = createdAt.getUTCHours();

    decodedRecords.push({
      recordId: record.recordId,
      result: "Ok",
      data: Buffer.from(JSON.stringify(decodedData.metric)).toString("base64"),
      metadata: {
        partitionKeys: {
          category: decodedData.category,
          tenantId: decodedData.tenant.id,
          year,
          month,
          day,
          hour
        }
      }
    });
  }

  return {
    records: decodedRecords
  };
};