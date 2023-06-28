import Joi, { ObjectSchema } from "@hapi/joi";

interface PublishMetricSchema extends ObjectSchema {
  tenantId: string
  metric: {
    id: string
    name: string
    value: number
    type: string
    unit: string
  }
  metadata: {
    service: string
    domain: string
    route: string
    requestId: string
  }
}

export const publishMetricSchema = <PublishMetricSchema>Joi.object({
  tenantId: Joi.string().guid({ version: "uuidv4" }).required(),
  category: Joi.string().valid("sales", "tenant_usage", "service_usage").required(),
  metric: Joi.any().optional(),
  metadata: Joi.object({
    service: Joi.string().required(),
    domain: Joi.string().required(),
    route: Joi.string().required(),
    requestId: Joi.string().optional()
  }).required()
});