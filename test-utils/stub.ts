import { MetricEnum, MetricEventMetadata, MetricUnitEnum, TenantTierEnum } from "@type";
import { faker } from "@faker-js/faker";
import { Metric, Tenant } from "@entity";
import { ddbDocument as dynamodb } from "@core";

export const pickOneTenantTier = () => {
  const tiers = Object.values(TenantTierEnum);
  return tiers[Math.floor(Math.random() * tiers.length)];
};

export const tenantStub = (data?: Partial<Tenant>): Tenant => {
  const id = data?.id ?? faker.string.uuid();
  const name = data?.name ?? faker.company.name();
  const tier = data?.tier ?? pickOneTenantTier();

  return {
    PK: data?.PK ?? `TENANT#${id}`,
    SK: data?.SK ?? `TENANT#${id}`,
    GSI2PK: data?.GSI2PK ?? `TENANT#TIER#${tier}`,
    GSI2SK: data?.GSI2SK ?? `TENANT#${name}`,
    id,
    name,
    tier,
    createdAt: data?.createdAt ?? new Date().toISOString(),
    ...data,
  };
};

export const metricStub = (data?: Partial<Metric>): Metric => {
  const id = data?.id ?? faker.string.uuid();
  
  return {
    id,
    name: data?.name ?? faker.internet.httpMethod(),
    value: data?.value ?? faker.number.float(),
    type: data?.type ?? MetricEnum.COUNT,
    unit: data?.unit ?? MetricUnitEnum.PERCENTAGE,
    ...data
  };
};

export const metadataStub = (): MetricEventMetadata => ({
  service: faker.internet.domainName(),
  domain: faker.internet.domainName(),
  route: faker.internet.url(),
  requestId: faker.string.uuid(),
});

export const tenantGenerator = async (): Promise<Tenant[]> => {
  try {
    const transactions = [];
    const tenants = [];
    for (let i = 0; i <= 4; i++) {
      const tenant = tenantStub();
      tenants.push(tenant);
      transactions.push({
        Put: {
          TableName: process.env.GLOBAL_TABLE as string,
          Item: tenant
        }
      });
    }
    
    await dynamodb
      .transactWrite({
        TransactItems: transactions
      })
      .promise();
    
    return tenants;
  } catch (error) {
    console.log("\x1b[31m Error attempting to create tenants");
    throw error;
  }
};