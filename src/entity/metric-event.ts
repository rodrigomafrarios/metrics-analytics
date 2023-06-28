import { Tenant } from "./tenant";
import { MetricCategoryType, MetricEventMetadata, MetricEventType } from "../type";

export class MetricEvent {
  constructor(
    private readonly tenant: Tenant,
    private readonly metric: unknown,
    private readonly type: MetricEventType,
    private readonly category: MetricCategoryType,
    private readonly metadata: MetricEventMetadata,
    private readonly createdAt: string
  ) { }
  
  get data() {
    return JSON.stringify({
      tenant: this.tenant,
      metric: this.metric,
      type: this.type,
      category: this.category,
      metadata: this.metadata,
      createdAt: this.createdAt
    });
  }
}