import type { PrismaClient } from '@prisma/client'
import type { Pagination } from '~~/types/common'
import type { PaginatedResponse } from '~~/types/api'
import type { CreateProjectDTO, ProjectDTO, ProjectListDTO } from '~~/dto/project'
import type { Project } from '~~/types/project'

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
        phase: 'DISCOVERY',
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
  }
})
