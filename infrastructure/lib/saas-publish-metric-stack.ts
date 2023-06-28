import path from "path";
import { Construct } from "constructs";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { Key } from "aws-cdk-lib/aws-kms";
import * as firehose from "aws-cdk-lib/aws-kinesisfirehose";
import { Effect, PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";
import { EventBus, Rule } from "aws-cdk-lib/aws-events";
import { CfnOutput, RemovalPolicy, Stack } from "aws-cdk-lib";

import { SaasPublishMetricsStackProps } from "../type/stack-props";

export class SaasPublishMetricStack extends Stack {
  constructor(scope: Construct, id: string, props: SaasPublishMetricsStackProps) {
    super(scope, id, props);

    const {
      serviceSources,
      globalTable,
      deliveryStreamName,
      publishMetricHandlerProps,
      firehoseDestinationBucket,
      isStreamDeliverdEncrypted
    } = props;

    const s3DeliveryRole = new Role(this, "s3DeliveryRole", {
      assumedBy: new ServicePrincipal("firehose.amazonaws.com"),
    });

    s3DeliveryRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          "s3:AbortMultipartUpload",
          "s3:GetBucketLocation",
          "s3:GetObject",
          "s3:ListBucket",
          "s3:ListBucketMultipartUploads",
          "s3:PutObject"
        ],
        resources: [
          `${firehoseDestinationBucket.bucketArn}`,
          `${firehoseDestinationBucket.bucketArn}/*`
        ],
      })
    );

    // TODO: add glue actions

    const s3DeliveryPolicyStatement = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
      ],
      resources: [`arn:aws:logs:${this.region}:${this.account}:log-group:/aws/kinesisfirehose/${deliveryStreamName}:*`]
    });

    s3DeliveryRole.addToPolicy(s3DeliveryPolicyStatement);

    firehoseDestinationBucket.grantWrite(s3DeliveryRole);

    /**
     * (Optional) Data Encryption
     * @description This block requires that the data encryption transit/rest is turned on using isStreamDeliverdEncrypted (boolean).
     * - KMS Key
     * - Encryption Configuration for Firehose DeliveryStream
     * - Policy Statement granting access to KMS specific key 
     */
    const kinesisDeliveryStreamKey = isStreamDeliverdEncrypted ? new Key(this, "KinesisDeliveryStreamKey", {
      enableKeyRotation: true,
      enabled: true,
      alias: "kinesis-delivery-stream-key",
      removalPolicy: RemovalPolicy.DESTROY,
    }) : undefined;
    
    const encryptionConfiguration =
      kinesisDeliveryStreamKey ? {
        encryptionConfiguration: {
          kmsEncryptionConfig: {
            awskmsKeyArn: kinesisDeliveryStreamKey.keyArn
          }
        }
      } : undefined;
    
    const deliveryStreamEncryptionConfigurationInput = kinesisDeliveryStreamKey ? {
      deliveryStreamEncryptionConfigurationInput: {
        keyType: "CUSTOMER_MANAGED_CMK",
        keyArn: kinesisDeliveryStreamKey.keyArn
      }
    } : undefined;
    
    if (isStreamDeliverdEncrypted && kinesisDeliveryStreamKey) {
      const s3DeliveryPolicyStatement = new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ],
        resources: [
          `${kinesisDeliveryStreamKey.keyArn}`,
          `${kinesisDeliveryStreamKey.keyArn}*`
        ],
      });

      s3DeliveryPolicyStatement.addCondition("StringEquals", {
        "kms:ViaService": `s3.${this.region}.amazonaws.com`
      });

      s3DeliveryPolicyStatement.addCondition("StringLike", {
        "kms:EncryptionContext:aws:s3:arn": `${firehoseDestinationBucket.bucketArn}*`
      });

      s3DeliveryRole.addToPolicy(s3DeliveryPolicyStatement);
    }
    /**
     * (Optional) Data Encryption - End block
     */

    const metricProcessorHandler = new NodejsFunction(this, "MetricProcessor", {
      entry: path.join(
        __dirname, "../../src/handler/metric-processor.ts"
      ),
      handler: "metricProcessor",
      runtime: Runtime.NODEJS_18_X,
    });

    s3DeliveryRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["lambda:invokeFunction"],
        resources: [metricProcessorHandler.functionArn]
      })
    );
    
    const firehoseDeliveryStream = new firehose.CfnDeliveryStream(
      this,
      "kinesisBucketDeliveryStream",
      {
        deliveryStreamName,
        deliveryStreamType: "DirectPut",
        ...deliveryStreamEncryptionConfigurationInput,
        extendedS3DestinationConfiguration: {
          dynamicPartitioningConfiguration: {
            enabled: true,
          },
          processingConfiguration: {
            enabled: true,
            processors: [
              {
                type: "Lambda",
                parameters: [{
                  parameterName: "LambdaArn",
                  parameterValue: metricProcessorHandler.functionArn
                }]
              },
            ]
          },
          bufferingHints: {
            intervalInSeconds: 60
          },
          cloudWatchLoggingOptions: {
            enabled: true,
            logGroupName: `/aws/kinesisfirehose/${deliveryStreamName}`,
            logStreamName: "DestinationDelivery"
          },
          prefix: "!{partitionKeyFromLambda:category}/!{partitionKeyFromLambda:tenantId}/!{partitionKeyFromLambda:year}/!{partitionKeyFromLambda:month}/!{partitionKeyFromLambda:day}/{partitionKeyFromLambda:hour}",
          errorOutputPrefix: "delivery_error/",
          ...encryptionConfiguration,
          compressionFormat: "GZIP",
          bucketArn: firehoseDestinationBucket.bucketArn,
          roleArn: s3DeliveryRole.roleArn,
        },
      }
    );

    const publishMetricsRole = new Role(this, "publishMetricsRole", {
      assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
    });

    publishMetricsRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          "firehose:DeleteDeliveryStream",
          "firehose:PutRecord",
          "firehose:PutRecordBatch",
          "firehose:UpdateDestination",
          "kinesis:DescribeStream",
          "kinesis:GetShardIterator",
          "kinesis:GetRecords",
          "kinesis:PutRecords",
        ],
        resources: [firehoseDeliveryStream.attrArn]
      })
    );

    publishMetricsRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
        ],
        resources: [`arn:aws:logs:${this.region}:${this.account}:log-group:/aws/lambda/SaasPublishMetricStack-PublishMetric*`]
      })
    );

    const publishMetricHandler = new NodejsFunction(this, "PublishMetric", {
      entry: publishMetricHandlerProps.entry,
      handler: publishMetricHandlerProps.name,
      runtime: Runtime.NODEJS_18_X,
      role: publishMetricsRole,
      environment: {
        GLOBAL_TABLE: globalTable.tableName,
        FIREHOSE_DELIVERY_STREAM: firehoseDeliveryStream.deliveryStreamName as string
      }
    });

    const eventBus = new EventBus(this, "eventBusMetricsSource");
    
    new Rule(this, "eventBusMetricsSourceRule", {
      enabled: true,
      eventPattern: {
        source: serviceSources
      },
      targets: [new LambdaFunction(publishMetricHandler)],
      eventBus
    });

    globalTable.grantReadWriteData(publishMetricHandler);

    new CfnOutput(this, "firehoseDeliveryStreamArn", {
      value: firehoseDeliveryStream.attrArn,
    });

    new CfnOutput(this, "firehoseDeliveryStreamName", {
      value: firehoseDeliveryStream.deliveryStreamName as string
    });

    new CfnOutput(this, "kinesisDeliveryStreamKeyArn", {
      value: kinesisDeliveryStreamKey?.keyArn ?? "No ARN"
    });
  }
}
