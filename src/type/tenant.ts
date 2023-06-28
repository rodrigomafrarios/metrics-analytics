import { FromEnum } from "./from-enum";

export enum TenantTierEnum {
  FREE = "free",
  STANDARD = "standard",
  PREMIUM = "premium"
}

export type TenantTierType = FromEnum<typeof TenantTierEnum>;
