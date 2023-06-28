import { Construct } from "constructs";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Effect, PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { CfnWorkspace } from "aws-cdk-lib/aws-grafana";
import { CfnDatabase, CfnTable } from "aws-cdk-lib/aws-glue";
import { ITable, Table } from "aws-cdk-lib/aws-dynamodb";
import { CfnWorkGroup } from "aws-cdk-lib/aws-athena";
import { CfnOutput, RemovalPolicy, Stack } from "aws-cdk-lib";

import { SaasMetricsAnalyticsStackProps } from "../type/stack-props";

export class SaasMetricsAnalyticsStack extends Stack {

  readonly globalTable: ITable;
  readonly tenantInsightsMetricsBucket: Bucket;
  readonly tenantMetricsDatabase: CfnDatabase;

  constructor(scope: Construct, id: string, props: SaasMetricsAnalyticsStackProps) {
    super(scope, id, props);

    const {
      tenantInsightsMetricsBucketProps,
      tenantMetricsDatabaseName,
      athenaWorkgroupName,
      grafanaWorkspace,
      glueTables
    } = props;

    /**
     * Single Table Design
     */

    const globalTableSecret = Secret.fromSecretNameV2(this, "globalTableSecret", "saas-global-table-name");

    this.globalTable = Table.fromTableName(this, "globalTable", globalTableSecret.secretValue.unsafeUnwrap() as unknown as string);

    /**
     * Bucket which stores all metrics
     */

    this.tenantInsightsMetricsBucket = new Bucket(this, "tenantInsightsMetrics", {
      removalPolicy: RemovalPolicy.DESTROY,
      versioned: true,
      ...tenantInsightsMetricsBucketProps
    });

    /**
     * Glue database used as data source for Athena
     */
    this.tenantMetricsDatabase = new CfnDatabase(this, "tenantMetrics", {
      catalogId: this.account,
      databaseInput: {
        name: tenantMetricsDatabaseName
      }
    });

    const tableNames = [];

    for (const table of glueTables) {
      
      /**
       * Glue table used as data source for Athena
       */
      tableNames.push(`arn:aws:glue:${this.region}:${this.account}:table/${tenantMetricsDatabaseName}/${table.name}`);

      new CfnTable(this, `tenantInsightsTable-${table.name}`, {
        catalogId: this.account,
        databaseName: tenantMetricsDatabaseName,
        tableInput: {
          name: table.name,
          parameters: {
            "EXTERNAL": "TRUE",
            "parquet.compression": "GZIP"
          },
          storageDescriptor: {
            location: `s3://${this.tenantInsightsMetricsBucket.bucketName}/${table.name}/`,
            inputFormat: "org.apache.hadoop.mapred.TextInputFormat",
            outputFormat: "org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat",
            compressed: true,
            storedAsSubDirectories: true,
            columns: table.columns,
            serdeInfo: {
              name: "tenantInsightsStream",
              serializationLibrary: "org.openx.data.jsonserde.JsonSerDe",
            },
            parameters: {
              "serialization.format": 1
            }
          },
          tableType: "EXTERNAL_TABLE"
        }
      }).addDependency(this.tenantMetricsDatabase);
    }

    /**
     * Athena Workgroup Configuration with output location (required for Grafana Connection Details)
     */
    new CfnWorkGroup(this, "AthenaWorkgroup", {
      name: athenaWorkgroupName,
      recursiveDeleteOption: true,
      workGroupConfiguration: {
        publishCloudWatchMetricsEnabled: false,
        enforceWorkGroupConfiguration: true,
        resultConfiguration: {
          outputLocation: `s3://${this.tenantInsightsMetricsBucket.bucketName}/query_output/`,
          encryptionConfiguration: {
            encryptionOption: "SSE_S3",
          },
        },
      },
    });

    const grafanaRole = new Role(this, "grafanaRole", {
      assumedBy: new ServicePrincipal("grafana.amazonaws.com")
    });

    const assumeRolePolicyStatement = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ["sts:AssumeRole"],
      resources: [
        `arn:aws:grafana:${this.region}:${this.account}:*`,
        `arn:aws:athena:${this.region}:${this.account}:*`,
        `arn:aws:glue:${this.region}:${this.account}:database/${tenantMetricsDatabaseName}`,
        `arn:aws:glue:${this.region}:${this.account}:catalog`,
        ...tableNames,
        `${this.tenantInsightsMetricsBucket.bucketArn}*`
      ]
    });
    
    grafanaRole.addToPolicy(assumeRolePolicyStatement);
    grafanaRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          "glue:GetDatabase",
          "glue:GetDatabases",
          "glue:GetTable",
          "glue:GetTables",
          "glue:GetPartition",
          "glue:GetPartitions",
          "glue:BatchGetPartition"
        ],
        resources: [
          `arn:aws:glue:${this.region}:${this.account}:database/${tenantMetricsDatabaseName}`,
          `arn:aws:glue:${this.region}:${this.account}:catalog`,
          ...tableNames,
        ]
      })
    );
    
    grafanaRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          "athena:GetDatabase",
          "athena:GetDataCatalog",
          "athena:GetTableMetadata",
          "athena:ListDatabases",
          "athena:ListDataCatalogs",
          "athena:ListTableMetadata",
          "athena:ListWorkGroups",
          "athena:GetQueryExecution",
          "athena:GetQueryResults",
          "athena:GetWorkGroup",
          "athena:StartQueryExecution",
          "athena:StopQueryExecution"
        ],
        resources: [
          `arn:aws:athena:${this.region}:${this.account}:*`
        ]
      })
    );

    grafanaRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          "s3:GetBucketLocation",
          "s3:GetObject",
          "s3:ListBucket",
          "s3:ListBucketMultipartUploads",
          "s3:ListMultipartUploadParts",
          "s3:AbortMultipartUpload",
          "s3:CreateBucket",
          "s3:PutObject",
          "s3:PutBucketPublicAccessBlock",
        ],
        resources: [
          `arn:aws:s3:::${this.tenantInsightsMetricsBucket.bucketName}*`,
        ]
      })
    );
    
    /**
     * Managed Grafana Workspace UI
     */
    const workspace = new CfnWorkspace(this, "managedGrafanaWorkspace", {
      name: grafanaWorkspace.name,
      accountAccessType: "CURRENT_ACCOUNT",
      authenticationProviders: ["SAML"],
      permissionType: "SERVICE_MANAGED",
      roleArn: grafanaRole.roleArn,
      dataSources: ["ATHENA"],
      samlConfiguration: {
        roleValues: {
          admin: ["Admin"]
        },
        assertionAttributes: {
          name: "displayName",
          email: "mail",
          role: "role"
        },
        idpMetadata: {
          xml: grafanaWorkspace.idpMetadata.xml,
        },
        loginValidityDuration: grafanaWorkspace.loginValidityDuration
      }
    });

    new CfnOutput(this, "globalname", {
      value: this.globalTable.tableName,
    });

    new CfnOutput(this, "tenantInsightsMetricsBucket", {
      value: this.tenantInsightsMetricsBucket.bucketArn
    });

    new CfnOutput(this, "managedGrafanaWorkspaceEndpoint", {
      value: workspace.attrEndpoint
    });
  }
}
