import { z } from 'zod'
import { baseProcedure } from '../init'
import { repositories } from '~~/server/repositories'
import { USER_ROLES } from '~~/types/user'
import { listUserSchema } from '~~/dto/user'
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

})
