import { MetricCategoryType, MetricEventMetadata } from "../type/metric";
import { Metric, Tenant } from "../entity";

export type ServiceMetricReceivedEventDetail = {
  tenantId: Tenant["id"]
  category: MetricCategoryType
  metric: InstanceType<typeof Metric>
  metadata: MetricEventMetadata
}


export interface ServiceMetricReceivedEvent {
  "detail-type": string
}

export interface ServiceaMetricReceivedEvent extends ServiceMetricReceivedEvent {
  "detail-type": "serviceA.metric.received"
}

export interface ServicebMetricReceivedEvent extends ServiceMetricReceivedEvent {
  "detail-type": "serviceB.metric.received"
}

export interface ServicecMetricReceivedEvent extends ServiceMetricReceivedEvent {
  "detail-type": "serviceC.metric.received"
}