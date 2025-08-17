import { z } from 'zod'
import { ADDRESS_TYPES } from '~~/types/address'

export const createAddressSchema = z.object({
  type: z.enum(ADDRESS_TYPES).default('BUSINESS'),
  street: z.string().min(1, 'Street is required'),
  street2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string(),
  country: z.string().min(2, 'Country is required'),
  isPrimary: z.boolean().default(false),
  reference: z.string().optional(),
  coordinates: z
    .object({
      lat: z.number(),
      lng: z.number()
    })
    .optional()
})

export const addressSchema = createAddressSchema.extend({
  id: z.string().min(1, 'Address ID is required'),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional()
})
