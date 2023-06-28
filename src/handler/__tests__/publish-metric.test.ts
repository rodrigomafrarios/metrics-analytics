import { clearBucket, metadataStub, metricStub, tenantGenerator, tenantStub } from "@testUtils";
import { publishMetric } from "@handler";
import { ArgumentError, NotFoundError } from "@error";
import { s3 } from "@core";

describe("publishMetric - handler", () => {
  beforeEach(async () => {
    await clearBucket(s3);
  });

  it("should throw an error if event details not valid - ArgumentError", async () => {
    // given
    const metric = metricStub();
    const metadata = metadataStub();

    // when/then
    await expect(publishMetric({
      "detail-type": "serviceA.metric.received",
      detail: {
        tenantId: "",
        category: "sales",
        metric,
        metadata
      }
    } as never)).rejects.toThrowError(ArgumentError);
  });

  it("should throw an error if tenant not found - NotFoundError", async () => {
    const tenant = tenantStub();

    // given
    const metric = metricStub();
    const metadata = metadataStub();

    // when/then
    await expect(publishMetric({
      "detail-type": "serviceA.metric.received",
      detail: {
        tenantId: tenant.id,
        category: "sales",
        metric,
        metadata
      }
    } as never)).rejects.toThrowError(NotFoundError);
  });

  it("should publish metric to kinesis", async () => {
    // given
    const tenants = await tenantGenerator();
    const tenant = tenantStub(tenants[0]);

    const metric = metricStub();
    const metadata = metadataStub();

    // when
    await publishMetric({
      "detail-type": "serviceA.metric.received",
      detail: {
        tenantId: tenant.id,
        category: "sales",
        metric,
        metadata
      }
    } as never);

    const objects = await s3.listObjectsV2({
      Bucket: process.env.METRICS_BUCKET as string
    }).promise();
    
    // then
    expect(objects.Contents?.length).toBe(1);
  });
});

