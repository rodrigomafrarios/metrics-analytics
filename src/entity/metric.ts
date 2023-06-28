import { MetricType, MetricUnitType } from "../type";

export class Metric {
  constructor(
    readonly id: string,
    readonly name: string,
    readonly value: number,
    readonly type: MetricType,
    readonly unit: MetricUnitType
  ) {}
}
