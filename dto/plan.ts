import { BILLING_CYCLES, CURRENCIES } from '~~/types/plans'
import { z } from 'zod'

export const createPlanSchema = z.object({
  name: z.string().min(1, 'Plan name is required'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  price: z.number().nonnegative('Price must be a non-negative number'),
  currency: z.enum(CURRENCIES),
  features: z.array(z.string()).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
})

export const createPlanVersionSchema = z.object({
  planId: z.string().min(1, 'Plan ID is required'),
  price: z.number().nonnegative('Price must be a non-negative number'),
  currency: z.string().length(3, 'Currency code must be exactly 3 characters'),
  billingCycle: z.enum(BILLING_CYCLES),
  features: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
  daysTurnAround: z.number().int().nonnegative('Days turn around must be a non-negative integer').default(0),
  aiGenerated: z.boolean().default(false),
  humanSupport: z.boolean().default(false),
  effectiveAt: z.string().optional(),
  expiresAt: z.string().optional()
})

export const updatePlanSchema = createPlanSchema.partial().extend({
  id: z.string().min(1, 'Customer ID is required')
})

export type CreatePlanSchema = z.output<typeof createPlanSchema>

// -- Output Schemas --
export const apiPlanVersionSchema = z.object({
  id: z.string(),
  planId: z.string(),
  price: z.string(),
  currency: z.enum(CURRENCIES),
  billingCycle: z.enum(BILLING_CYCLES),
  features: z.any().optional(),
  isActive: z.boolean(),
  daysTurnAround: z.number(),
  aiGenerated: z.boolean(),
  humanSupport: z.boolean(),
  effectiveAt: z.string(),
  expiresAt: z.string().optional(),
})

export const apiPlanSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  versions: z.array(apiPlanVersionSchema).optional(),
})

export type PlanDTO = z.infer<typeof apiPlanSchema>
