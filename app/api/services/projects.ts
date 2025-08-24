import { defineService } from '~/api/services/helpers'
import type { PaginatedResponse } from '~~/types/api'
import type { Pagination, Range } from '~~/types/common'
import { type CreateProjectDTO, type ProjectDTO, type UpdateProjectDTO, type CreateProjectTeamMemberDTO, type ProjectTeamMemberDTO } from '~~/dto/project'

const trpc = () => useNuxtApp().$trpc

export interface ProjectService {
  getAll: (pagination: Pagination) => ReturnType<typeof projectQueries.useGetAllQuery>
  getById: (id: string) => ReturnType<typeof projectQueries.useGetByIdQuery>
  create: () => ReturnType<typeof projectQueries.useStoreMutation>
  update: () => ReturnType<typeof projectQueries.useUpdateMutation>
  updateStatus: () => ReturnType<typeof projectQueries.useUpdateStatusMutation>
  updatePhase: () => ReturnType<typeof projectQueries.useUpdatePhaseMutation>
  addTeamMember: () => ReturnType<typeof projectQueries.useAddTeamMemberMutation>
  removeTeamMember: () => ReturnType<typeof projectQueries.useRemoveTeamMemberMutation>
  getTeamMembers: (projectId: string) => ReturnType<typeof projectQueries.useGetTeamMembersQuery>
  getPhaseHistory: (projectId: string) => ReturnType<typeof projectQueries.useGetPhaseHistoryQuery>
  delete: () => ReturnType<typeof projectQueries.useDeleteMutation>
}

export const projectQueries = defineService({
  queries: {
    getAll: {
      queryKey: (p: Pagination) => ['PROJECTS_GET_ALL', String(p?.pageIndex), String(p?.pageSize)],
      queryFn: (p: Pagination) => trpc().projects.getAll.query(p)
    },
    getById: {
      queryKey: (id: string) => ['PROJECTS_DETAIL', id],
      queryFn: (id: string) => trpc().projects.getById.query({ id })
    },
    getTeamMembers: {
      queryKey: (projectId: string) => ['PROJECT_TEAM_MEMBERS', projectId],
      queryFn: (projectId: string) => trpc().projects.getTeamMembers.query({ projectId })
    },
    getPhaseHistory: {
      queryKey: (projectId: string) => ['PROJECT_PHASE_HISTORY', projectId],
      queryFn: (projectId: string) => trpc().projects.getPhaseHistory.query({ projectId })
    }
  },
  mutations: {
    store: {
      request: (payload: CreateProjectDTO) => trpc().projects.store.mutate(payload),
      cacheKey: () => [['PROJECTS_GET_ALL']]
    },
    update: {
      request: (payload: UpdateProjectDTO) => trpc().projects.update.mutate(payload),
      cacheKey: (payload) => [['PROJECTS_GET_ALL'], ['PROJECTS_DETAIL', payload.id]]
    },
    updateStatus: {
      request: (payload: { id: string; status: 'DRAFT' | 'PENDING_APPROVAL' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED' | 'ARCHIVED'; reason?: string }) => trpc().projects.updateStatus.mutate(payload),
      cacheKey: (payload) => [['PROJECTS_GET_ALL'], ['PROJECTS_DETAIL', payload.id]]
    },
    updatePhase: {
      request: (payload: { id: string; phase: 'DISCOVERY' | 'PLANNING' | 'DESIGN' | 'DEVELOPMENT' | 'REVIEW' | 'TESTING' | 'LAUNCH' | 'POST_LAUNCH' | 'MAINTENANCE'; notes?: string }) => trpc().projects.updatePhase.mutate(payload),
      cacheKey: (payload) => [['PROJECTS_GET_ALL'], ['PROJECTS_DETAIL', payload.id], ['PROJECT_PHASE_HISTORY', payload.id]]
    },
    addTeamMember: {
      request: (payload: CreateProjectTeamMemberDTO) => trpc().projects.addTeamMember.mutate(payload),
      cacheKey: (payload) => [['PROJECT_TEAM_MEMBERS', payload.projectId], ['PROJECTS_DETAIL', payload.projectId]]
    },
    removeTeamMember: {
      request: (payload: { projectId: string; userId: string }) => trpc().projects.removeTeamMember.mutate(payload),
      cacheKey: (payload) => [['PROJECT_TEAM_MEMBERS', payload.projectId], ['PROJECTS_DETAIL', payload.projectId]]
    },
    delete: {
      request: (payload: { id: string }) => trpc().projects.delete.mutate(payload),
      cacheKey: (payload) => [['PROJECTS_GET_ALL'], ['PROJECTS_DETAIL', payload.id]]
    }
  }
})

export const projectService: ProjectService = {
  getAll: (p: Pagination) => projectQueries.useGetAllQuery(p),
  getById: (id: string) => projectQueries.useGetByIdQuery(id),
  getTeamMembers: (projectId: string) => projectQueries.useGetTeamMembersQuery(projectId),
  getPhaseHistory: (projectId: string) => projectQueries.useGetPhaseHistoryQuery(projectId),
  create: () => projectQueries.useStoreMutation(),
  update: () => projectQueries.useUpdateMutation(),
  updateStatus: () => projectQueries.useUpdateStatusMutation(),
  updatePhase: () => projectQueries.useUpdatePhaseMutation(),
  addTeamMember: () => projectQueries.useAddTeamMemberMutation(),
  removeTeamMember: () => projectQueries.useRemoveTeamMemberMutation(),
  delete: () => projectQueries.useDeleteMutation(),
}
