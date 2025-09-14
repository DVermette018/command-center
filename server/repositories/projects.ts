import type { PrismaClient } from '@prisma/client'
import type { Pagination } from '~~/types/common'
import type { PaginatedResponse } from '~~/types/api'
import type { CreateProjectDTO, ProjectDTO, ProjectListDTO, UpdateProjectDTO, CreateProjectTeamMemberDTO, ProjectTeamMemberDTO } from '~~/dto/project'
import type { Project, ProjectStatus } from '~~/types/project'
import { prismaToDTO } from '~~/utils/prisma-mappers'

// projects
export const register = (db: PrismaClient) => ({
  getAll: async (pagination: Pagination) => {
    try {
      const [projects, projectCount] = await db.$transaction([
        db.project.findMany({
          skip: (pagination.pageIndex - 1) * pagination.pageSize,
          take: pagination.pageSize,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            customerId: true,
            name: true,
            description: true,
            type: true,
            status: true,
            priority: true,

            startDate: true,
            targetEndDate: true,
            actualEndDate: true,

            projectManager: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                isActive: true
              }
            },

            teamMembers: {
              select: {
                id: true
              }
            },

            phase: true,

            budget: true,
            currency: true,

            createdAt: true,
            updatedAt: true
          }
        }),
        db.project.count()
      ])

      return {
        data: projects.map(p => ({
          id: p.id,
          customerId: p.customerId,
          name: p.name,
          description: p.description ?? undefined,
          type: p.type,
          status: p.status,

          priority: p.priority,

          startDate: p.startDate ? p.startDate.toISOString() : undefined,
          targetEndDate: p.targetEndDate ? p.targetEndDate.toISOString() : undefined,
          actualEndDate: p.actualEndDate ? p.actualEndDate.toISOString() : undefined,

          projectManager: {
            id: p.projectManager?.id ?? '',
            email: p.projectManager?.email ?? '',
            firstName: p.projectManager?.firstName ?? '',
            lastName: p.projectManager?.lastName ?? '',
            role: p.projectManager?.role ?? 'CUSTOMER',
            isActive: p.projectManager?.isActive ?? false
          },

          teamMembersCount: p.teamMembers?.length ?? 0,

          phase: p.phase,

          budget: p.budget ? Number(p.budget) : undefined,
          currency: p.currency,

          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString()
        })),
        pagination: {
          totalCount: projectCount,
          totalPages: Math.ceil(projectCount / Math.max(1, pagination.pageSize))
        }
      } satisfies PaginatedResponse<ProjectListDTO>
    } catch (error) {
      console.error('Error fetching projects:', error)
      throw error
    }
  },

  getById: async (id: string): Promise<ProjectDTO> => {
    try {
      const p = await db.project.findUnique({
        where: { id },
        include: {
          projectManager: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
              isActive: true
            }
          },
          teamMembers: {
            select: {
              id: true,
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                  role: true,
                  isActive: true
                }
              }
            }
          }
        }
      })

      if (!p) {
        throw new Error(`Project with ID ${id} not found`)
      }

      return {
        id: p.id,
        customerId: p.customerId,
        name: p.name,
        description: p.description ?? undefined,
        type: p.type,
        status: p.status,
        phase: p.phase,
        priority: p.priority,

        startDate: p.startDate ? p.startDate.toISOString() : undefined,
        targetEndDate: p.targetEndDate ? p.targetEndDate.toISOString() : undefined,
        actualEndDate: p.actualEndDate ? p.actualEndDate.toISOString() : undefined,

        projectManager: {
          id: p.projectManager?.id ?? '',
          email: p.projectManager?.email ?? '',
          firstName: p.projectManager?.firstName ?? '',
          lastName: p.projectManager?.lastName ?? '',
          role: p.projectManager?.role ?? 'CUSTOMER',
          isActive: p.projectManager?.isActive ?? false
        },
        teamMembers: p.teamMembers?.map(tm => ({
          id: tm.id,
          email: tm.user?.email ?? '',
          firstName: tm.user?.firstName ?? '',
          lastName: tm.user?.lastName ?? '',
          role: tm.user?.role ?? 'CUSTOMER',
          isActive: tm.user?.isActive ?? false
        })) ?? [],
        budget: p.budget ? Number(p.budget) : undefined,
        currency: p.currency,

        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString()
      }
    } catch (error) {
      console.error('Error fetching project by ID:', error)
      throw error
    }
  },

  create: async (projectData: CreateProjectDTO) => {
    try {
      const p = await db.project.create({
        data: {
          ...projectData,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        include: {
          projectManager: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
              isActive: true
            }
          },
          teamMembers: {
            select: {
              id: true,
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        }
      })
      return {
        id: p.id,
        customerId: p.customerId,
        name: p.name,
        description: p.description ?? undefined,
        type: p.type,
        status: p.status,

        priority: p.priority,

        startDate: p.startDate ? p.startDate.toISOString() : undefined,
        targetEndDate: p.targetEndDate ? p.targetEndDate.toISOString() : undefined,
        actualEndDate: p.actualEndDate ? p.actualEndDate.toISOString() : undefined,

        projectManager: {
          id: p.projectManager?.id ?? '',
          email: p.projectManager?.email ?? '',
          firstName: p.projectManager?.firstName ?? '',
          lastName: p.projectManager?.lastName ?? '',
          role: p.projectManager?.role ?? 'CUSTOMER',
          isActive: p.projectManager?.isActive ?? false
        },

        teamMembersCount: p.teamMembers?.length ?? 0,

        phase: p.phase,

        budget: p.budget ? Number(p.budget) : undefined,
        currency: p.currency,

        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString()
      }
    } catch (error) {
      console.error('Error creating project:', error)
      throw error
    }
  },

  update: async (updateData: UpdateProjectDTO): Promise<ProjectDTO> => {
    try {
      const { id, ...data } = updateData

      const p = await db.project.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date()
        },
        include: {
          projectManager: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
              isActive: true
            }
          },
          teamMembers: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                  role: true,
                  isActive: true
                }
              }
            }
          }
        }
      })

      return prismaToDTO({
        id: p.id,
        customerId: p.customerId,
        name: p.name,
        description: p.description,
        type: p.type,
        status: p.status,
        phase: p.phase,
        priority: p.priority,
        startDate: p.startDate,
        targetEndDate: p.targetEndDate,
        actualEndDate: p.actualEndDate,
        projectManager: p.projectManager ? {
          id: p.projectManager.id,
          email: p.projectManager.email,
          firstName: p.projectManager.firstName,
          lastName: p.projectManager.lastName,
          role: p.projectManager.role,
          isActive: p.projectManager.isActive
        } : null,
        teamMembers: p.teamMembers?.map(tm => ({
          id: tm.user.id,
          email: tm.user.email,
          firstName: tm.user.firstName,
          lastName: tm.user.lastName,
          role: tm.user.role,
          isActive: tm.user.isActive,
          leftAt: tm.leftAt
        })),
        budget: p.budget ? Number(p.budget) : null,
        currency: p.currency,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt
      }) as any
    } catch (error) {
      console.error('Error updating project:', error)
      throw error
    }
  },

  updateStatus: async (statusData: { id: string; status: ProjectStatus; reason?: string }): Promise<ProjectDTO> => {
    try {
      const p = await db.project.update({
        where: { id: statusData.id },
        data: {
          status: statusData.status as any,
          updatedAt: new Date()
        },
        include: {
          projectManager: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
              isActive: true
            }
          },
          teamMembers: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                  role: true,
                  isActive: true
                }
              }
            }
          }
        }
      })

      return prismaToDTO({
        id: p.id,
        customerId: p.customerId,
        name: p.name,
        description: p.description,
        type: p.type,
        status: p.status,
        phase: p.phase,
        priority: p.priority,
        startDate: p.startDate,
        targetEndDate: p.targetEndDate,
        actualEndDate: p.actualEndDate,
        projectManager: p.projectManager ? {
          id: p.projectManager.id,
          email: p.projectManager.email,
          firstName: p.projectManager.firstName,
          lastName: p.projectManager.lastName,
          role: p.projectManager.role,
          isActive: p.projectManager.isActive
        } : null,
        teamMembers: p.teamMembers?.map(tm => ({
          id: tm.user.id,
          email: tm.user.email,
          firstName: tm.user.firstName,
          lastName: tm.user.lastName,
          role: tm.user.role,
          isActive: tm.user.isActive,
          leftAt: tm.leftAt
        })),
        budget: p.budget ? Number(p.budget) : null,
        currency: p.currency,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt
      }) as any
    } catch (error) {
      console.error('Error updating project status:', error)
      throw error
    }
  },

  updatePhase: async (phaseData: { id: string; phase: string; notes?: string }): Promise<ProjectDTO> => {
    try {
      const [p, _] = await db.$transaction([
        db.project.update({
          where: { id: phaseData.id },
          data: {
            phase: phaseData.phase as any,
            updatedAt: new Date()
          },
          include: {
            projectManager: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                isActive: true
              }
            },
            teamMembers: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    isActive: true
                  }
                }
              }
            }
          }
        }),
        db.projectPhaseHistory.create({
          data: {
            projectId: phaseData.id,
            phase: phaseData.phase as any,
            status: 'IN_PROGRESS',
            startedAt: new Date(),
            notes: phaseData.notes
          }
        })
      ])

      return prismaToDTO({
        id: p.id,
        customerId: p.customerId,
        name: p.name,
        description: p.description,
        type: p.type,
        status: p.status,
        phase: p.phase,
        priority: p.priority,
        startDate: p.startDate,
        targetEndDate: p.targetEndDate,
        actualEndDate: p.actualEndDate,
        projectManager: p.projectManager ? {
          id: p.projectManager.id,
          email: p.projectManager.email,
          firstName: p.projectManager.firstName,
          lastName: p.projectManager.lastName,
          role: p.projectManager.role,
          isActive: p.projectManager.isActive
        } : null,
        teamMembers: p.teamMembers?.map(tm => ({
          id: tm.user.id,
          email: tm.user.email,
          firstName: tm.user.firstName,
          lastName: tm.user.lastName,
          role: tm.user.role,
          isActive: tm.user.isActive,
          leftAt: tm.leftAt
        })),
        budget: p.budget ? Number(p.budget) : null,
        currency: p.currency,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt
      }) as any
    } catch (error) {
      console.error('Error updating project phase:', error)
      throw error
    }
  },

  addTeamMember: async (memberData: CreateProjectTeamMemberDTO): Promise<ProjectTeamMemberDTO> => {
    try {
      const teamMember = await db.projectTeamMember.create({
        data: {
          projectId: memberData.projectId,
          userId: memberData.userId,
          role: memberData.role,
          joinedAt: new Date()
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
              isActive: true
            }
          }
        }
      })

      return prismaToDTO({
        id: teamMember.id,
        projectId: teamMember.projectId,
        userId: teamMember.userId,
        role: teamMember.role,
        user: {
          id: teamMember.user.id,
          email: teamMember.user.email,
          firstName: teamMember.user.firstName,
          lastName: teamMember.user.lastName,
          role: teamMember.user.role,
          isActive: teamMember.user.isActive
        },
        joinedAt: teamMember.joinedAt,
        leftAt: teamMember.leftAt
      }) as any
    } catch (error) {
      console.error('Error adding team member:', error)
      throw error
    }
  },

  removeTeamMember: async (removeData: { projectId: string; userId: string }): Promise<void> => {
    try {
      const result = await db.projectTeamMember.updateMany({
        where: {
          projectId: removeData.projectId,
          userId: removeData.userId,
          leftAt: null
        },
        data: {
          leftAt: new Date()
        }
      })

      if (result.count === 0) {
        throw new Error('Team member not found or already removed')
      }
    } catch (error) {
      console.error('Error removing team member:', error)
      throw error
    }
  },

  getTeamMembers: async (projectId: string): Promise<ProjectTeamMemberDTO[]> => {
    try {
      const teamMembers = await db.projectTeamMember.findMany({
        where: {
          projectId,
          leftAt: null // Only active team members
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
              isActive: true
            }
          }
        },
        orderBy: { joinedAt: 'asc' }
      })

      return teamMembers.map(tm => prismaToDTO({
        id: tm.id,
        projectId: tm.projectId,
        userId: tm.userId,
        role: tm.role,
        user: {
          id: tm.user.id,
          email: tm.user.email,
          firstName: tm.user.firstName,
          lastName: tm.user.lastName,
          role: tm.user.role,
          isActive: tm.user.isActive
        },
        joinedAt: tm.joinedAt,
        leftAt: tm.leftAt
      }) as any)
    } catch (error) {
      console.error('Error fetching team members:', error)
      throw error
    }
  },

  createPhaseHistory: async (historyData: { projectId: string; phase: string; status: string; notes?: string }) => {
    try {
      const history = await db.projectPhaseHistory.create({
        data: {
          projectId: historyData.projectId,
          phase: historyData.phase as any,
          status: historyData.status as any,
          startedAt: new Date(),
          notes: historyData.notes
        }
      })

      return prismaToDTO({
        id: history.id,
        projectId: history.projectId,
        phase: history.phase,
        status: history.status,
        startedAt: history.startedAt,
        completedAt: history.completedAt,
        notes: history.notes
      })
    } catch (error) {
      console.error('Error creating phase history:', error)
      throw error
    }
  },

  getPhaseHistory: async (projectId: string) => {
    try {
      const history = await db.projectPhaseHistory.findMany({
        where: { projectId },
        orderBy: { startedAt: 'asc' }
      })

      return history.map(h => prismaToDTO({
        id: h.id,
        projectId: h.projectId,
        phase: h.phase,
        status: h.status,
        startedAt: h.startedAt,
        completedAt: h.completedAt,
        notes: h.notes
      }))
    } catch (error) {
      console.error('Error fetching phase history:', error)
      throw error
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      // Soft delete by updating status to ARCHIVED
      await db.project.update({
        where: { id },
        data: {
          status: 'ARCHIVED',
          updatedAt: new Date()
        }
      })
    } catch (error) {
      console.error('Error deleting project:', error)
      throw error
    }
  }
})
