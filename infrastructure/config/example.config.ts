/* eslint-disable @typescript-eslint/no-unused-vars */
import path from "path";
import fs from "fs";
import { BlockPublicAccess, Bucket } from "aws-cdk-lib/aws-s3";
import { Table } from "aws-cdk-lib/aws-dynamodb";

import { SaasMetricsAnalyticsStackProps, SaasPublishMetricsStackProps } from "../type/stack-props";

const XML = fs.readFileSync(path.join(__dirname, "./saml-metadata.xml"), "utf-8");

const metricsAnalyticsStackProps = {
  tenantInsightsMetricsBucketProps: { blockPublicAccess: BlockPublicAccess.BLOCK_ALL, enforceSSL: true },
  tenantMetricsDatabaseName: "saas-tenant-metrics-cdk",
  grafanaWorkspace: {
    name: "saas_athena_workgroup_cdk",
    idpMetadata: {
      xml: XML
    },
    loginValidityDuration: 1440
  },
  athenaWorkgroupName: "saas-metrics-insights-workgroup",
  glueTables: [
    {
      name: "tenant_usage",
      columns: [
        {
          name: "tenant-name",
          type: "string"
        },
        {
          name: "tenant-id",
          type: "string"
        },
        {
          name: "tier",
          type: "string"
        },
        {
          name: "price",
          type: "int"
        },
        {
          name: "months_subscribred",
          type: "int"
        },
        {
          name: "cancled",
          type: "int"
        },
        {
          name: "cost",
          type: "double"
        },
        {
          name: "resource",
          type: "string"
        },
        {
          name: "metric-name",
          type: "string"
        },
        {
          name: "value",
          type: "int"
        },
        {
          name: "unit",
          type: "string"
        },
        {
          name: "int",
          type: "timestamp"
        }
      ]
    },
    {
      name: "services_usage",
      columns: [
        {
          name: "tenant-id",
          type: "string"
        },
        {
          name: "tier",
          type: "string"
        },
        {
          name: "service",
          type: "string"
        },
        {
          name: "url",
          type: "string"
        },
        {
          name: "metric-date",
          type: "int"
        },
        {
          name: "tenant-name",
          type: "string"
        }
      ]
    },
    {
      name: "sales",
      columns: [
        {
          name: "month",
          type: "int"
        },
        {
          name: "year",
          type: "int"
        },
        {
          name: "starting-mrr",
          type: "int"
        },
        {
          name: "new-biz-mrr",
          type: "int"
        },
        {
          name: "expansion-mrr-prev-month",
          type: "int"
        },
        {
          name: "expansion-mrr-current-month",
          type: "int"
        },
        {
          name: "contraction-mrr",
          type: "int"
        },
        {
          name: "churned-mrr",
          type: "int"
        },
        {
          name: "ending-mrr",
          type: "int"
        },
        {
          name: "starting-customers",
          type: "int"
        },
        {
          name: "new-customers",
          type: "int"
        },
        {
          name: "churned-customers",
          type: "int"
        },
        {
          name: "ending-customers",
          type: "int"
        },
        {
          name: "sales-marketing-expenses",
          type: "int"
        },
        {
          name: "gross-margin",
          type: "double"
        }
      ]
    }
  ],
} satisfies SaasMetricsAnalyticsStackProps;


const publishMetricsStackProps = {
  serviceSources: ["serviceA.metric", "serviceB.metric", "serviceC.metric"],
  deliveryStreamName: "saas-metrics-analytics-delivery-stream",
  globalTable: {} as Table,
  firehoseDestinationBucket: {} as Bucket,
  publishMetricHandlerProps: {
    name: "publishMetric",
    entry: path.join(
      __dirname,
      "../../src/handler/publish-metric.ts"
    ) 
  },
  isStreamDeliverdEncrypted: false
} satisfies SaasPublishMetricsStackProps;
