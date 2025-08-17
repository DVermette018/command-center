// schemas/business.ts
import { z } from 'zod'
import { BUSINESS_CATEGORIES } from '~~/types/business'
import { createAddressSchema } from '~~/dto/address'
import { COMPANY_SIZES } from '~~/types/customers'

// ==================== ENUMS ====================
export const socialPlatformEnum = z.enum([
  'FACEBOOK',
  'INSTAGRAM',
  'TWITTER',
  'LINKEDIN',
  'TIKTOK',
  'YOUTUBE',
  'WHATSAPP',
  'OTHER'
])

export const dayOfWeekEnum = z.enum([
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY'
])

export const addressTypeEnum = z.enum([
  'BUSINESS',
  'BILLING',
  'SHIPPING',
  'OTHER'
])

// ==================== SUB-SCHEMAS ====================

// Address Schema
export const addressSchema = z.object({
  type: addressTypeEnum.default('BUSINESS'),
  isPrimary: z.boolean().default(false),
  street: z.string().min(1, 'Street is required'),
  street2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().min(1, 'Zip code is required'),
  country: z.string().default('US'),
  reference: z.string().optional(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number()
  }).optional()
})

const businessScheduleShape = z.object({
  dayOfWeek: dayOfWeekEnum,
  openTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)').optional(),
  closeTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)').optional(),
  isClosed: z.boolean().default(false),
  breakStart: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)').optional(),
  breakEnd: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)').optional()
})

// Business Schedule Schema
export const businessScheduleSchema = businessScheduleShape
  .refine(
    (data) => data.isClosed || (data.openTime && data.closeTime),
    { message: 'Open and close times are required when not closed' }
  )
  .refine(
    (data) => !(data.breakStart && !data.breakEnd) && !(data.breakEnd && !data.breakStart),
    { message: 'Both break start and end times are required' }
  )

export const socialMediaProfileShape = z.object({
  platform: socialPlatformEnum,
  url: z.string().url('Invalid URL format').optional(),
  username: z.string().optional(),
  isActive: z.boolean().default(true)
})

// Social Media Profile Schema
export const socialMediaProfileSchema = socialMediaProfileShape
  .refine(
    (data) => data.url || data.username,
    { message: 'Either URL or username is required' }
  )

// Brand Colors Schema
export const brandColorsSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color').optional(),
  secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color').optional(),
  accentColors: z.string().optional(), // Single color stored as string in DB
  additionalColors: z.array(
    z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color')
  ).optional() // This will be stored as JSON
})

// ==================== MAIN SCHEMAS ====================

// Create Business Profile Schema
export const createBusinessProfileSchema = z.object({
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
})


// Update Business Profile Schema (all fields optional except id)
export const updateBusinessProfileSchema = z.object({
  id: z.string().cuid('Invalid business profile ID'),

  // Identity fields
  businessName: z.string().min(1).max(255).optional(),
  legalName: z.string().max(255).optional(),
  ownerName: z.string().min(1).max(255).optional(),
  taxId: z.string().max(50).optional(),
  phone: z.string().min(10).max(20).optional(),
  email: z.string().email('Invalid email format').max(255).optional(),

  // Business Details
  category: z.enum(BUSINESS_CATEGORIES).optional(),
  customCategory: z.string().max(100).optional(),
  description: z.string().max(5000).optional(),
  productsServices: z.string().max(5000).optional(),
  yearEstablished: z.number().int().min(1800).max(new Date().getFullYear()).optional(),

  // Branding
  slogan: z.string().max(255).optional(),
  missionStatement: z.string().max(5000).optional(),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color').optional(),
  secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color').optional(),
  accentColors: z.string().optional(),
  additionalColors: z.array(
    z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color')
  ).optional(),

  // Related entities updates
  addresses: z.array(addressSchema).optional(),
  schedules: z.array(businessScheduleSchema).optional(),
  socialMedia: z.array(socialMediaProfileSchema).optional()
})

// ==================== TYPE EXPORTS ====================
export type CreateBusinessProfileDTO = z.infer<typeof createBusinessProfileSchema>

export const businessSchema = z.object({
  businessName: z.string().min(1, 'Business name is required'),
  legalName: z.string().min(2, 'Legal name must be at least 2 character long').optional(),
  ownerName: z.string().optional(),
  taxId: z.string().min(5, 'Tax ID is too short').max(20, 'Tax ID is too long').optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').optional(),
  website: z.string().url('Invalid website URL').optional(),

  category: z.string(),
  size: z.enum(COMPANY_SIZES).optional(),
  customCategory: z.string().optional(),
  yearEstablished: z.number().optional(),
  description: z.string().max(5000).optional(),
  productsServices: z.string().max(5000).optional(),

  slogan: z.string().optional(),
  missionStatement: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  accentColor: z.string().optional(),
  additionalColors: z.any().optional(),

  addresses: z.array(addressSchema).optional()
})
export type BusinessDTO = z.infer<typeof businessSchema>
