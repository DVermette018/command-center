import { defineService } from '~/api/services/helpers'
import type { Pagination } from '~~/types/common'
import { type CreateProjectDTO, type CreateProjectTeamMemberDTO, type UpdateProjectDTO } from '~~/dto/project'
import type { ProjectPhase } from '~~/types/project'

const trpc = () => useNuxtApp().$trpc

export const registerService = defineService({
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
      request: (payload: {
        id: string;
        status: 'DRAFT' | 'PENDING_APPROVAL' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED' | 'ARCHIVED';
        reason?: string
      }) => trpc().projects.updateStatus.mutate(payload),
      cacheKey: (payload) => [['PROJECTS_GET_ALL'], ['PROJECTS_DETAIL', payload.id]]
    },
    updatePhase: {
      request: (payload: {
        id: string;
        phase: ProjectPhase;
        notes?: string
      }) => trpc().projects.updatePhase.mutate(payload),
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
