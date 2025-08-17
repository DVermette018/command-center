import { z } from 'zod'
import { COMPANY_SIZES, CUSTOMER_STATUSES } from '~~/types/customers'
import { businessSchema } from '~~/dto/business'
import { createAddressSchema } from '~~/dto/address'

export type CreateCustomerSchema = z.output<typeof createCustomerSchema>
export type UpdateCustomerSchema = z.output<typeof updateCustomerSchema>

export const customerStatusEnum = z.enum(CUSTOMER_STATUSES)


export const userSchema = z.object({
  id: z.string(),
  email: z.string().email('Invalid email address').optional(),
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  role: z.string().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional()
})

export const customerContactSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  position: z.string().optional(),
  department: z.string().optional(),
  isPrimary: z.boolean().default(false),
  user: userSchema.optional()
})

export const createCustomerSchema = z.object({
  business: z.object({
    businessName: z.string().min(1, 'Business name is required'),
    legalName: z.string().min(2, 'Legal name must be at least 2 character long').optional(),
    ownerName: z.string().min(2, 'Owner name must be at least 2 characters long'),
    taxId: z.string().min(5, 'Tax ID is too short').max(20, 'Tax ID is too long').optional(),
    phone: z.string().optional(),
    email: z.string().email('Invalid email address').optional(),
    website: z.string().url('Invalid website URL').optional(),

    category: z.string(),
    size: z.enum(COMPANY_SIZES).optional(),
    customCategory: z.string().optional(),
    yearEstablished: z.number().optional(),
    address: createAddressSchema,

    slogan: z.string().optional(),
    missionStatement: z.string().optional(),
    primaryColor: z.string().optional(),
    secondaryColor: z.string().optional(),
    accentColor: z.string().optional(),
    additionalColors: z.string().optional()
  }),
  contact: z.object({
    id: z.string(),
    customerId: z.string(),
    position: z.string().optional(),
    department: z.string().optional(),
    isPrimary: z.boolean().default(false),
    email: z.string(),
    firstName: z.string(),
    lastName: z.string(),
  }),
  source: z.string().optional(),
  status: z.enum(CUSTOMER_STATUSES)
})

export const updateCustomerSchema = createCustomerSchema.partial().extend({
  id: z.string().min(1, 'Customer ID is required')
})

// -- Output Schemas --
export const customerDTOSchema = z.object({
  id: z.string(),
  source: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  status: customerStatusEnum,
  contacts: z.array(customerContactSchema).optional(),
  businessProfile: businessSchema.optional(),
})
export type CustomerDTO = z.infer<typeof customerDTOSchema>;
