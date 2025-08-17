import type { CompanySize } from '~~/types/customers'
import type { Address } from '~~/types/address'

export const BUSINESS_CATEGORIES = [
  "COMMERCE",
  "SERVICES",
  "INDUSTRY",
  "RESTAURANT",
  "TECHNOLOGY",
  "HEALTH",
  "EDUCATION",
  "OTHER"
] as const
export type BusinessCategory = (typeof BUSINESS_CATEGORIES)[number]

export enum WorkingDayType {
  WORKING_DAY = "WORKING_DAY",
  REST_DAY = "REST_DAY",
  HALF_DAY = "HALF_DAY"
}

export enum WorkingScheduleType {
  FULL_TIME = "FULL_TIME",
  SPLIT_TIME = "SPLIT_TIME",
  FLEXIBLE = "FLEXIBLE"
}

export interface BusinessProfile {
  id: string
  businessName: string
  legalName?: string
  ownerName?: string
  taxId?: string
  phone?: string
  email?: string
  category: string
  customCategory?: string
  size?: CompanySize
  website?: string
  description?: string
  productsServices?: string
  yearEstablished?: number
  slogan?: string
  missionStatement?: string
  primaryColor?: string
  secondaryColor?: string
  accentColor?: any
  additionalColors?: unknown
  createdAt: string
  updatedAt: string
  addresses: Address[]
}
