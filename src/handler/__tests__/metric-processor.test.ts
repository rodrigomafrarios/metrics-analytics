import { MetricRecordData } from "@type";
import { metricProcessorEventMock } from "@testUtils";

import { metricProcessor } from "../metric-processor";

describe("metricProcessor - handler", () => {
  it("should enrich payload with partition keys", async () => {
    // given
    const event = metricProcessorEventMock();
    // when
    const response = await metricProcessor(event);
    
    const createdAt = new Date(event.records[0].approximateArrivalTimestamp);
    
    const year = createdAt.getUTCFullYear();
    const month = createdAt.getUTCMonth();
    const day = createdAt.getUTCDate();
    const hour = createdAt.getUTCHours();

    const decodedData = JSON.parse(
      Buffer.from(event.records[0].data, "base64").toString("utf-8")
    ) as unknown as MetricRecordData;

    // then
    expect(response).toMatchObject({
      records: [{
        recordId: event.records[0].recordId,
        result: "Ok",
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
      }]
    });
  });
});