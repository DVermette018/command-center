import { z } from 'zod'
import { baseProcedure } from '../init'
import { repositories } from '~~/server/repositories'
import { USER_ROLES } from '~~/types/user'
import { listUserSchema, userDTOSchema, createUserSchema, updateUserSchema } from '~~/dto/user'
import { paginatedResponseSchema } from '~~/dto/common'

export const registerRoutes = () => ({
  getAllByRoles: baseProcedure
    .input(
      z.object({
        pageIndex: z.number().optional().default(1),
        pageSize: z.number().optional().default(10),
        roles: z.array(z.enum(USER_ROLES)).optional().default(['DESIGNER', 'PROJECT_MANAGER', 'DEVELOPER']),
      })
    )
    .output(paginatedResponseSchema(listUserSchema))
    .query(async (opts) => {
      const users = await repositories.users.getAllByRoles({
        pageIndex: opts.input.pageIndex,
        pageSize: opts.input.pageSize
      }, opts.input.roles)
      return paginatedResponseSchema(listUserSchema).parse(users)
    }),

  getAll: baseProcedure
    .input(
      z.object({
        pageIndex: z.number().min(1, 'Page index must be at least 1').optional().default(1),
        pageSize: z.number().min(1, 'Page size must be at least 1').max(100, 'Page size cannot exceed 100').optional().default(10)
      })
    )
    .output(paginatedResponseSchema(userDTOSchema))
    .query(async ({ input }) => {
      const users = await repositories.users.getAll(input)
      return paginatedResponseSchema(userDTOSchema).parse(users)
    }),

  getById: baseProcedure
    .input(z.object({
      id: z.string().min(1, 'User ID is required')
    }))
    .output(userDTOSchema)
    .query(async ({ input }) => {
      const user = await repositories.users.getById(input.id)
      return userDTOSchema.parse(user)
    }),

  create: baseProcedure
    .input(createUserSchema)
    .output(userDTOSchema)
    .mutation(async ({ input }) => {
      const user = await repositories.users.create(input)
      return userDTOSchema.parse(user)
    }),

  update: baseProcedure
    .input(updateUserSchema)
    .output(userDTOSchema)
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input
      const user = await repositories.users.update(id, updateData)
      return userDTOSchema.parse(user)
    }),

  delete: baseProcedure
    .input(z.object({
      id: z.string().min(1, 'User ID is required')
    }))
    .output(z.object({
      success: z.boolean(),
      message: z.string()
    }))
    .mutation(async ({ input }) => {
      const result = await repositories.users.delete(input.id)
      return result
    }),

  reactivate: baseProcedure
    .input(z.object({
      id: z.string().min(1, 'User ID is required')
    }))
    .output(userDTOSchema)
    .mutation(async ({ input }) => {
      const user = await repositories.users.reactivate(input.id)
      return userDTOSchema.parse(user)
    })

})
