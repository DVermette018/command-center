import { z } from 'zod'
import { baseProcedure } from '../init'
import { repositories } from '~~/server/repositories'
import { 
  projectDTOSchema, 
  createProjectSchema, 
  updateProjectSchema,
  createProjectTeamMemberSchema,
  projectTeamMemberDTOSchema
} from '~~/dto/project'
import { paginatedResponseSchema } from '~~/dto/common'

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
    }),

  update: baseProcedure
    .input(updateProjectSchema)
    .output(projectDTOSchema)
    .mutation(async ({ input }) => {
      const project = await repositories.projects.update(input)
      return projectDTOSchema.parse(project)
    }),

  updateStatus: baseProcedure
    .input(z.object({
      id: z.string().min(1),
      status: z.enum(['DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED', 'ARCHIVED']),
      reason: z.string().optional()
    }))
    .output(projectDTOSchema)
    .mutation(async ({ input }) => {
      const project = await repositories.projects.updateStatus(input)
      return projectDTOSchema.parse(project)
    }),

  updatePhase: baseProcedure
    .input(z.object({
      id: z.string().min(1),
      phase: z.enum(['DISCOVERY', 'PLANNING', 'DESIGN', 'DEVELOPMENT', 'REVIEW', 'TESTING', 'LAUNCH', 'POST_LAUNCH', 'MAINTENANCE']),
      notes: z.string().optional()
    }))
    .output(projectDTOSchema)
    .mutation(async ({ input }) => {
      const project = await repositories.projects.updatePhase(input)
      return projectDTOSchema.parse(project)
    }),

  addTeamMember: baseProcedure
    .input(createProjectTeamMemberSchema)
    .output(projectTeamMemberDTOSchema)
    .mutation(async ({ input }) => {
      const teamMember = await repositories.projects.addTeamMember(input)
      return projectTeamMemberDTOSchema.parse(teamMember)
    }),

  removeTeamMember: baseProcedure
    .input(z.object({
      projectId: z.string().min(1),
      userId: z.string().min(1)
    }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input }) => {
      await repositories.projects.removeTeamMember(input)
      return { success: true }
    }),

  getTeamMembers: baseProcedure
    .input(z.object({ projectId: z.string().min(1) }))
    .output(z.array(projectTeamMemberDTOSchema))
    .query(async ({ input }) => {
      const teamMembers = await repositories.projects.getTeamMembers(input.projectId)
      return z.array(projectTeamMemberDTOSchema).parse(teamMembers)
    }),

  getPhaseHistory: baseProcedure
    .input(z.object({ projectId: z.string().min(1) }))
    .output(z.array(z.object({
      id: z.string(),
      projectId: z.string(),
      phase: z.enum(['DISCOVERY', 'PLANNING', 'DESIGN', 'DEVELOPMENT', 'REVIEW', 'TESTING', 'LAUNCH', 'POST_LAUNCH', 'MAINTENANCE']),
      status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED']),
      startedAt: z.string().datetime(),
      completedAt: z.string().datetime().optional(),
      notes: z.string().optional()
    })))
    .query(async ({ input }) => {
      const phaseHistory = await repositories.projects.getPhaseHistory(input.projectId)
      return phaseHistory
    }),

  delete: baseProcedure
    .input(z.object({ id: z.string().min(1) }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input }) => {
      await repositories.projects.delete(input.id)
      return { success: true }
    })
})
