import { EventBridgeEvent } from "aws-lambda";

import { MetricEventEnum } from "@type";
import {
  ServiceaMetricReceivedEvent, ServicebMetricReceivedEvent, ServicecMetricReceivedEvent,
  ServiceMetricReceivedEventDetail
} from "@interface";
import { ArgumentError, NotFoundError } from "@error";
import { MetricEvent, Tenant } from "@entity";
import { firehose } from "@core";

import { publishMetricSchema } from "../validation";

/**
 * @param event serviceA.metric.received (OR)
 * @param event serviceB.metric.received (OR)
 * @param event serviceC.metric.received
 * 
 * @description It deliveries the MetricEvent to Firehose stream
 */
export const publishMetric = async (
  event:
    EventBridgeEvent<
      ServiceaMetricReceivedEvent["detail-type"],
      ServiceMetricReceivedEventDetail
    >
  | EventBridgeEvent<
      ServicebMetricReceivedEvent["detail-type"],
      ServiceMetricReceivedEventDetail
    >
  | EventBridgeEvent<
      ServicecMetricReceivedEvent["detail-type"],
      ServiceMetricReceivedEventDetail
    >
): Promise<void> => {

  const { detail } = event;
  
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { error } = publishMetricSchema.validate(detail);
  if (error) {
    console.error(error);
    throw new ArgumentError();
  }
    
  const tenant = <Tenant>await Tenant.getById(detail.tenantId);
  if (!tenant) {
    throw new NotFoundError("Tenant not found");
  }
    
  const metricEvent = new MetricEvent(
    tenant,
    detail.metric,
    MetricEventEnum.APPLICATION,
    detail.category,
    detail.metadata,
    new Date().toISOString()
  );

  await firehose.putRecord({
    DeliveryStreamName: process.env.FIREHOSE_DELIVERY_STREAM as string,
    Record: {
      Data: metricEvent.data,
    }
  }).promise();
};
