import { Tenant } from "@entity";

import { FromEnum } from "./from-enum";

export enum MetricEnum {
  STORAGE = "storage",
  TIME = "time",
  MONEY = "money",
  COUNT = "count"
}

export enum MetricUnitEnum {
  TIME = "MS",
  PERCENTAGE = "%",
  STORAGE = "MB",
  MONEY = "$"
}

export enum MetricEventEnum {
  APPLICATION = "application",
  SYSTEM = "system"
}

export enum MetricCategoryEnum {
  SALES = "sales",
  TENANT_USAGE = "tenant_usage",
  SERVICE_USAGE = "service_usage"
}

export type MetricEventType = FromEnum<typeof MetricEventEnum>
export type MetricUnitType = FromEnum<typeof MetricUnitEnum>
export type MetricType = FromEnum<typeof MetricEnum>
export type MetricCategoryType = FromEnum<typeof MetricCategoryEnum>

export type MetricEventMetadata = {
  service: string
  domain: string
  route: string
  requestId: string
}

export type MetricRecordData = {
  tenant: Tenant;
  category: MetricCategoryType;
  metric: unknown
  metadata: MetricEventMetadata
}
