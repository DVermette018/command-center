import { z } from 'zod'
import { baseProcedure } from '../init'
import { repositories } from '~~/server/repositories'
import { projectDTOSchema, createProjectSchema } from '~~/dto/project'
import { paginatedResponseSchema } from '~~/dto/common'
import { customerDTOSchema } from '~~/dto/customer'

export const registerRoutes = () => ({
  getAll: baseProcedure
    .input(
      z.object({
        pageIndex: z.number().optional().default(1),
        pageSize: z.number().optional().default(10),
        search: z.string().optional().default('')
      })
    )
    .output(paginatedResponseSchema(projectDTOSchema))
    .query(async ({ input }) => {
      const result = await repositories.projects.getAll({
        pageIndex: input.pageIndex,
        pageSize: input.pageSize
      })

      return paginatedResponseSchema(projectDTOSchema).parse(result)
    }),

  getById: baseProcedure
    .input(z.object({ id: z.string() }))
    .output(projectDTOSchema)
    .query(async ({ input }) => {
      const project = await repositories.projects.getById(input.id)
      return projectDTOSchema.parse(project)
    }),

  store: baseProcedure
    .input(createProjectSchema)
    .output(projectDTOSchema)
    .mutation(async ({input}) => {
      const project = await repositories.projects.create(input)
      return projectDTOSchema.parse(project)
    })
})
