import type { User } from '~~/types/user'

export const PROJECT_TYPES = ['WEBSITE', 'BRANDING', 'MARKETING', 'CONSULTING', 'DEVELOPMENT', 'OTHER'] as const
export type ProjectType = (typeof PROJECT_TYPES)[number]

export const PROJECT_STATUSES = [
  'DRAFT',
  'PENDING_APPROVAL',
  'ACTIVE',
  'ON_HOLD',
  'COMPLETED',
  'CANCELLED',
  'ARCHIVED'
] as const
export type ProjectStatus = (typeof PROJECT_STATUSES)[number]

export const PROJECT_PHASES = [
  'DISCOVERY',
  'PLANNING',
  'DESIGN',
  'DEVELOPMENT',
  'REVIEW',
  'TESTING',
  'LAUNCH',
  'POST_LAUNCH',
  'MAINTENANCE'
] as const
export type ProjectPhase = (typeof PROJECT_PHASES)[number]

export const PHASE_STATUSES = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED'] as const
export type PhaseStatus = (typeof PHASE_STATUSES)[number]

export const PROJECT_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const
export type ProjectPriority = (typeof PROJECT_PRIORITIES)[number]

export interface Project {
  id: string
  customerId: string
  name: string
  description?: string
  type: ProjectType
  status: ProjectStatus
  phase: ProjectPhase
  priority: ProjectPriority
  startDate?: Date
  targetEndDate?: Date
  actualEndDate?: Date
  projectManager?: User
  teamMembers?: User[]
  budget?: number
  createdAt: Date
  updatedAt: Date
}

export interface ProjectTeamMember {
  id: string
  projectId: string
  userId: string
  role: string
  joinedAt: Date
  leftAt?: Date
}

export interface ProjectPhaseHistory {
  id: string
  projectId: string
  phase: ProjectPhase
  status: PhaseStatus
  startedAt: Date
  completedAt?: Date
  notes?: string
}
