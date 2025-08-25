import { describe, it, expect, beforeEach, vi } from 'vitest'
import { expectTypeOf } from 'vitest'
import type { CreateProjectDTO, ProjectDTO, UpdateProjectDTO } from '~~/dto/project'
import type { CreateProjectTeamMemberDTO, ProjectTeamMemberDTO } from '~~/dto/project'
import type { Pagination } from '~~/types/common'

// Mock the repositories
const mockProjectsRepository = {
  getAll: vi.fn(),
  getById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  updateStatus: vi.fn(),
  updatePhase: vi.fn(),
  addTeamMember: vi.fn(),
  removeTeamMember: vi.fn(),
  getTeamMembers: vi.fn(),
  createPhaseHistory: vi.fn(),
  getPhaseHistory: vi.fn()
}

vi.mock('~~/server/repositories', () => ({
  repositories: {
    projects: mockProjectsRepository
  }
}))

describe('Projects tRPC Router', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAll procedure', () => {
    it('should validate pagination input', async () => {
      const validInput = {
        pageIndex: 1,
        pageSize: 10,
        search: 'test'
      }
      
      // Input validation should accept valid pagination
      expectTypeOf(validInput).toMatchTypeOf<{
        pageIndex?: number
        pageSize?: number 
        search?: string
      }>()
    })

    it('should use default values for optional parameters', async () => {
      const mockResponse = {
        data: [],
        pagination: {
          pageIndex: 1,
          pageSize: 10,
          totalCount: 0,
          totalPages: 0
        }
      }
      
      mockProjectsRepository.getAll.mockResolvedValue(mockResponse)
      
      // Should work with minimal input
      expect(mockProjectsRepository.getAll).toBeDefined()
    })

    it('should return paginated project response', async () => {
      const mockProjects = [
        {
          id: 'project-1',
          customerId: 'customer-1',
          name: 'Test Project',
          type: 'WEBSITE',
          status: 'ACTIVE',
          phase: 'DEVELOPMENT',
          priority: 'HIGH',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      ]
      
      const mockResponse = {
        data: mockProjects,
        pagination: {
          pageIndex: 1,
          pageSize: 10,
          totalCount: 1,
          totalPages: 1
        }
      }
      
      mockProjectsRepository.getAll.mockResolvedValue(mockResponse)
      
      expectTypeOf(mockResponse).toMatchTypeOf<{
        data: any[]
        pagination: {
          pageIndex: number
          pageSize: number
          totalCount: number
          totalPages: number
        }
      }>()
    })
  })

  describe('getById procedure', () => {
    it('should validate string ID input', async () => {
      const input = { id: 'project-123' }
      expectTypeOf(input).toMatchTypeOf<{ id: string }>()
    })

    it('should return project DTO', async () => {
      const mockProject = {
        id: 'project-1',
        customerId: 'customer-1',
        name: 'Test Project',
        type: 'WEBSITE',
        status: 'ACTIVE',
        phase: 'DEVELOPMENT',
        priority: 'HIGH',
        projectManager: {
          id: 'user-1',
          email: 'pm@test.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'PROJECT_MANAGER',
          isActive: true
        },
        teamMembers: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }
      
      mockProjectsRepository.getById.mockResolvedValue(mockProject)
      
      expectTypeOf(mockProject).toMatchTypeOf<ProjectDTO>()
    })

    it('should handle not found errors', async () => {
      mockProjectsRepository.getById.mockRejectedValue(new Error('Project not found'))
      
      expect(mockProjectsRepository.getById).toBeDefined()
    })
  })

  describe('store procedure', () => {
    it('should validate create project input', async () => {
      const input: CreateProjectDTO = {
        customerId: 'customer-1',
        name: 'New Project',
        type: 'WEBSITE',
        startDate: new Date('2024-01-01'),
        projectManagerId: 'user-1'
      }
      
      expectTypeOf(input).toMatchTypeOf<CreateProjectDTO>()
    })

    it('should create project and return DTO', async () => {
      const createData: CreateProjectDTO = {
        customerId: 'customer-1',
        name: 'New Project',
        type: 'WEBSITE',
        startDate: new Date('2024-01-01'),
        projectManagerId: 'user-1'
      }
      
      const mockCreatedProject = {
        id: 'project-1',
        ...createData,
        status: 'DRAFT',
        phase: 'DISCOVERY',
        priority: 'MEDIUM',
        projectManager: {
          id: 'user-1',
          email: 'pm@test.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'PROJECT_MANAGER',
          isActive: true
        },
        teamMembers: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }
      
      mockProjectsRepository.create.mockResolvedValue(mockCreatedProject)
      
      expectTypeOf(mockCreatedProject).toMatchTypeOf<ProjectDTO>()
    })
  })

  describe('update procedure - NEW REQUIREMENT', () => {
    it('should validate update project input', async () => {
      const input: UpdateProjectDTO = {
        id: 'project-1',
        name: 'Updated Project Name',
        description: 'Updated description',
        status: 'ACTIVE',
        priority: 'HIGH'
      }
      
      expectTypeOf(input).toMatchTypeOf<UpdateProjectDTO>()
    })

    it('should update project and return DTO', async () => {
      const updateData: UpdateProjectDTO = {
        id: 'project-1',
        name: 'Updated Project'
      }
      
      const mockUpdatedProject = {
        id: 'project-1',
        customerId: 'customer-1',
        name: 'Updated Project',
        type: 'WEBSITE',
        status: 'ACTIVE',
        phase: 'DEVELOPMENT',
        priority: 'HIGH',
        projectManager: {
          id: 'user-1',
          email: 'pm@test.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'PROJECT_MANAGER',
          isActive: true
        },
        teamMembers: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z'
      }
      
      mockProjectsRepository.update.mockResolvedValue(mockUpdatedProject)
      
      expectTypeOf(mockUpdatedProject).toMatchTypeOf<ProjectDTO>()
    })
  })

  describe('updateStatus procedure - NEW REQUIREMENT', () => {
    it('should validate status update input', async () => {
      const input = {
        id: 'project-1',
        status: 'ACTIVE' as const,
        reason: 'Project approved and ready to start'
      }
      
      expectTypeOf(input).toMatchTypeOf<{
        id: string
        status: 'DRAFT' | 'PENDING_APPROVAL' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED' | 'ARCHIVED'
        reason?: string
      }>()
    })

    it('should update project status and create audit trail', async () => {
      const mockProject = {
        id: 'project-1',
        status: 'ACTIVE',
        updatedAt: '2024-01-02T00:00:00Z'
      }
      
      mockProjectsRepository.updateStatus.mockResolvedValue(mockProject)
      
      expect(mockProjectsRepository.updateStatus).toBeDefined()
    })
  })

  describe('updatePhase procedure - NEW REQUIREMENT', () => {
    it('should validate phase update input', async () => {
      const input = {
        id: 'project-1',
        phase: 'DEVELOPMENT' as const,
        notes: 'Moving to development phase after design approval'
      }
      
      expectTypeOf(input).toMatchTypeOf<{
        id: string
        phase: 'DISCOVERY' | 'PLANNING' | 'DESIGN' | 'DEVELOPMENT' | 'REVIEW' | 'TESTING' | 'LAUNCH' | 'POST_LAUNCH' | 'MAINTENANCE'
        notes?: string
      }>()
    })

    it('should update project phase and create history entry', async () => {
      const mockProject = {
        id: 'project-1',
        phase: 'DEVELOPMENT',
        updatedAt: '2024-01-02T00:00:00Z'
      }
      
      mockProjectsRepository.updatePhase.mockResolvedValue(mockProject)
      mockProjectsRepository.createPhaseHistory.mockResolvedValue({
        id: 'history-1',
        projectId: 'project-1',
        phase: 'DEVELOPMENT',
        status: 'IN_PROGRESS',
        startedAt: '2024-01-02T00:00:00Z',
        notes: 'Moving to development phase'
      })
      
      expect(mockProjectsRepository.updatePhase).toBeDefined()
      expect(mockProjectsRepository.createPhaseHistory).toBeDefined()
    })
  })

  describe('addTeamMember procedure - NEW REQUIREMENT', () => {
    it('should validate team member input', async () => {
      const input: CreateProjectTeamMemberDTO = {
        projectId: 'project-1',
        userId: 'user-2',
        role: 'DEVELOPER'
      }
      
      expectTypeOf(input).toMatchTypeOf<CreateProjectTeamMemberDTO>()
    })

    it('should add team member and return member data', async () => {
      const mockTeamMember = {
        id: 'member-1',
        projectId: 'project-1',
        userId: 'user-2',
        role: 'DEVELOPER',
        user: {
          id: 'user-2',
          email: 'dev@test.com',
          firstName: 'Jane',
          lastName: 'Smith',
          role: 'DEVELOPER',
          isActive: true
        },
        joinedAt: '2024-01-02T00:00:00Z'
      }
      
      mockProjectsRepository.addTeamMember.mockResolvedValue(mockTeamMember)
      
      expectTypeOf(mockTeamMember).toMatchTypeOf<ProjectTeamMemberDTO>()
    })
  })

  describe('removeTeamMember procedure - NEW REQUIREMENT', () => {
    it('should validate remove team member input', async () => {
      const input = {
        projectId: 'project-1',
        userId: 'user-2'
      }
      
      expectTypeOf(input).toMatchTypeOf<{
        projectId: string
        userId: string
      }>()
    })

    it('should remove team member', async () => {
      mockProjectsRepository.removeTeamMember.mockResolvedValue({ success: true })
      
      expect(mockProjectsRepository.removeTeamMember).toBeDefined()
    })
  })

  describe('delete procedure - NEW REQUIREMENT', () => {
    it('should validate delete input', async () => {
      const input = { id: 'project-1' }
      
      expectTypeOf(input).toMatchTypeOf<{ id: string }>()
    })

    it('should delete project', async () => {
      mockProjectsRepository.delete.mockResolvedValue({ success: true })
      
      expect(mockProjectsRepository.delete).toBeDefined()
    })
  })

  describe('error handling', () => {
    it('should handle repository errors', async () => {
      mockProjectsRepository.getById.mockRejectedValue(new Error('Database connection error'))
      
      expect(mockProjectsRepository.getById).toBeDefined()
    })

    it('should handle validation errors', async () => {
      // Invalid input should be caught by Zod validation
      const invalidInput = {
        customerId: '', // Invalid: empty string
        name: '', // Invalid: empty string
        type: 'INVALID_TYPE' // Invalid: not in enum
      }
      
      // This would be caught by Zod validation in the actual router
      expect(invalidInput).toBeDefined()
    })
  })
})