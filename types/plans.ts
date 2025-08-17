export const BILLING_CYCLES = ['MONTHLY', 'QUARTERLY', 'YEARLY'] as const;
export type BillingCycle = (typeof BILLING_CYCLES)[number];

export const CURRENCIES = ['MXN', 'USD', 'EUR', 'CAD'] as const;
export type Currency = (typeof CURRENCIES)[number];

export interface Plan {
  id: string
  name: string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string

  versions?: PlanVersion[]
  // subscriptions?: any
}

export interface PlanVersion {
  id: string
  planId: string
  price: string
  currency: Currency
  billingCycle: BillingCycle
  features?: unknown
  isActive: boolean
  daysTurnAround: number
  aiGenerated: boolean
  humanSupport: boolean
  effectiveAt: string
  expiresAt?: string
}
