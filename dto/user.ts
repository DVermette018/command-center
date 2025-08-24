import { z } from 'zod'
import { USER_ROLES } from '~~/types/user'


export const listUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  role: z.enum(USER_ROLES),
})
export type ListUserDTO = z.output<typeof listUserSchema>

export const userDTOSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  role: z.enum(USER_ROLES),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
})
export type UserDTO = z.output<typeof userDTOSchema>

export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(USER_ROLES),
  isActive: z.boolean().optional().default(true)
})
export type CreateUserDTO = z.output<typeof createUserSchema>

export const updateUserSchema = z.object({
  id: z.string().min(1, 'User ID is required'),
  email: z.string().email('Invalid email address').optional(),
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  role: z.enum(USER_ROLES).optional(),
  isActive: z.boolean().optional()
})
export type UpdateUserDTO = z.output<typeof updateUserSchema>
