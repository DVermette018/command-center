import type { BusinessProfile } from '~~/types/business'
import type { User } from '~~/types/user'

export const CUSTOMER_STATUSES = ['LEAD', 'PROSPECT', 'ACTIVE', 'INACTIVE', 'CHURNED'] as const
export type CustomerStatus = typeof CUSTOMER_STATUSES[number]

export const COMPANY_SIZES = ['MICRO', 'SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE'] as const
export type CompanySize = typeof COMPANY_SIZES[number]

export interface Customer {
  id: string
  source: string | null
  createdAt: string
  updatedAt: string
  status: CustomerStatus
  contacts?: CustomerContact[]
  businessProfile?: BusinessProfile
}

export interface CustomerContact {
  id: string
  customerId: string
  position: string | null
  department: string | null
  isPrimary: boolean
  user: User | null
}
