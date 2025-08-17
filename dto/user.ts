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

// export const createUserSchema = z.object({
//   email: z.string().email(),
//   firstName: z.string(),
//   lastName: z.string(),
//   role: z.enum(USER_ROLES),
//   isActive: z.boolean().optional(),
// })
// export type CreateUserDTO = z.output<typeof createUserSchema>
