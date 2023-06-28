#!/usr/bin/env node
import "source-map-support/register";

import * as cdk from "aws-cdk-lib";

import { SaasPublishMetricStack } from "../infrastructure/lib/saas-publish-metric-stack";
import { SaasMetricsAnalyticsStack } from "../infrastructure/lib/saas-metrics-analytics-stack";
import {
  getMetricsAnalyticsStackProps, getPublishMetricsStackProps
} from "../infrastructure/config";

const app = new cdk.App();

const metricsAnalyticsStackProps = getMetricsAnalyticsStackProps({
  env: { account: app.account, region: app.region },
});

const { globalTable, tenantInsightsMetricsBucket } = new SaasMetricsAnalyticsStack(app, "SaasMetricsAnalyticsStack", metricsAnalyticsStackProps);

const publishMetricsStackProps = getPublishMetricsStackProps({
  globalTable,
  firehoseDestinationBucket: tenantInsightsMetricsBucket,
  env: { account: app.account, region: app.region },
});

new SaasPublishMetricStack(app, "SaasPublishMetricStack", publishMetricsStackProps);

