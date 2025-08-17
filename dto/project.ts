import { z } from 'zod'

// Enum constants
export const PROJECT_TYPES = ['WEBSITE', 'BRANDING', 'CONSULTING', 'DEVELOPMENT', 'MARKETING', 'OTHER'] as const
export const PROJECT_STATUSES = ['DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED', 'ARCHIVED'] as const
export const PROJECT_PHASES = ['DISCOVERY', 'PLANNING', 'DESIGN', 'DEVELOPMENT', 'REVIEW', 'TESTING', 'LAUNCH', 'POST_LAUNCH', 'MAINTENANCE'] as const
export const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const
// export const CURRENCIES = ['USD', 'MXN', 'EUR', 'CAD'] as const

// Enum schemas
export const projectTypeEnum = z.enum(PROJECT_TYPES)
export const projectStatusEnum = z.enum(PROJECT_STATUSES)
export const projectPhaseEnum = z.enum(PROJECT_PHASES)
export const priorityEnum = z.enum(PRIORITIES)
// export const currencyEnum = z.enum(CURRENCIES)

// Main project schema
export const createProjectSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  name: z.string().min(1, 'Project name is required'),
  type: projectTypeEnum,

  // Dates
  startDate: z.coerce.date().optional(),
  targetEndDate: z.coerce.date().optional(),

  // Assignment
  projectManagerId: z.string()
})

// export const updateProjectSchema = createProjectSchema.partial().extend({
//   id: z.string().min(1, 'Project ID is required')
// })

// Type exports
export type CreateProjectDTO = z.output<typeof createProjectSchema>
// export type UpdateProjectSchema = z.output<typeof updateProjectSchema>
// export type ProjectType = z.infer<typeof projectTypeEnum>
// export type ProjectStatus = z.infer<typeof projectStatusEnum>
// export type ProjectPhase = z.infer<typeof projectPhaseEnum>
// export type Priority = z.infer<typeof priorityEnum>
// export type Currency = z.infer<typeof currencyEnum>

export const projectListDTOSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  type: projectTypeEnum,
  status: projectStatusEnum,
  phases: projectPhaseEnum.optional(),
  priority: priorityEnum.optional(),

  startDate: z.string().datetime().optional(),
  targetEndDate: z.string().datetime().optional(),
  actualEndDate: z.string().datetime().optional(),

  projectManager: z.object({
    id: z.string(),
    email: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    role: z.string(),
    isActive: z.boolean()
  }),
  teamMembersCount: z.number().int().nonnegative(),

  phase: projectPhaseEnum,

  budget: z.number().optional(),
  currency: z.string().optional(),

  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
})

export const projectDTOSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  type: projectTypeEnum,
  status: projectStatusEnum,
  phases: projectPhaseEnum.optional(),
  priority: priorityEnum.optional(),

  startDate: z.string().datetime().optional(),
  targetEndDate: z.string().datetime().optional(),
  actualEndDate: z.string().datetime().optional(),

  projectManager: z.object({
    id: z.string(),
    email: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    role: z.string(),
    isActive: z.boolean()
  }),
  teamMembers: z.array(z.object({
    id: z.string(),
    email: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    role: z.string(),
    leftAt: z.string().datetime().optional(),
    isActive: z.boolean()
  })).optional(),

  phase: projectPhaseEnum,

  budget: z.number().optional(),
  currency: z.string().optional(),

  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
})

export type ProjectDTO = z.infer<typeof projectDTOSchema>;
export type ProjectListDTO = z.infer<typeof projectListDTOSchema>;
