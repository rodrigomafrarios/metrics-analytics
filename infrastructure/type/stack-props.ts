import { BlockPublicAccess, Bucket, BucketEncryption, LifecycleRule } from "aws-cdk-lib/aws-s3";
import { IKey } from "aws-cdk-lib/aws-kms";
import { ITable } from "aws-cdk-lib/aws-dynamodb";
import { StackProps } from "aws-cdk-lib";

export type GlueTableColumn = {
  name: string
  type: "string" | "int" | "double" | "timestamp"
}

export type GlueTable = {
  name: string
  columns: GlueTableColumn[]
}

export interface SaasMetricsAnalyticsStackProps extends StackProps {
  tenantInsightsMetricsBucketProps: {
    lifecycleRules?: LifecycleRule[]
    blockPublicAccess: BlockPublicAccess  
    encryptionKey?: IKey
    encryption?: BucketEncryption // see BucketProps definition
    enforceSSL: boolean
  }
  tenantMetricsDatabaseName: string
  grafanaWorkspace: {
    name: string
    idpMetadata: {
      xml: string
    }
    loginValidityDuration: number
  }
  athenaWorkgroupName: string
  glueTables: GlueTable[]
}

export interface SaasPublishMetricsStackProps extends StackProps {
  serviceSources: string[]
  globalTable: ITable
  deliveryStreamName: string
  publishMetricHandlerProps: {
    name: string
    entry: string
  }
  firehoseDestinationBucket: Bucket
  isStreamDeliverdEncrypted: boolean
}
