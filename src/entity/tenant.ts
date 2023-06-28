import { TenantTierType } from "../type";
import { ddbDocument as dynamodb } from "../core/aws-client";

export class Tenant {
  constructor(
    readonly id: string,
    readonly name: string,
    readonly tier: TenantTierType,
    readonly createdAt: string,
  ) { }

  get PK() {
    return `TENANT#${this.id}`;
  }

  get SK() {
    return `TENANT#${this.id}`;
  }

  get GSI2PK() {
    return `TENANT#TIER#${this.tier}`;
  }

  get GSI2SK() {
    return `TENANT#${this.name}`;
  }
  
  static async getById(id: string): Promise<Tenant | undefined> {
    const response = await dynamodb
      .query({
        TableName: process.env.GLOBAL_TABLE as string,
        KeyConditionExpression: "PK = :pk and SK = :sk",
        ExpressionAttributeValues: {
          ":pk": `TENANT#${id}`,
          ":sk": `TENANT#${id}`,
        },
        Limit: 1,
      })
      .promise();
    
    if (response.Items?.length) {
      return new Tenant(
        response.Items[0].id as string,
        response.Items[0].name as string,
        response.Items[0].tier as TenantTierType,
        response.Items[0].createdAt as string
      );
    }
    
    return undefined;
  }
}
