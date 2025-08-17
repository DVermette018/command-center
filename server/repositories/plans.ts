import type { PrismaClient } from '@prisma/client'
import type { Pagination } from '~~/types/common'
import type { Plan } from '~~/types/plans'
import type { PaginatedResponse } from '~~/types/api'

export const register = (db: PrismaClient) => ({
  getAll: async (pagination: Pagination) => {
    try {
      const [plans, plansCount] = await db.$transaction([
        db.plan.findMany({
          skip: (pagination.pageIndex - 1) * pagination.pageSize,
          take: pagination.pageSize,
          orderBy: { createdAt: 'desc' },
          where: {
            isActive: true
          },
          select: {
            id: true,
            name: true,
            description: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
            versions: {
              select: {
                id: true,
                planId: true,
                price: true,
                currency: true,
                billingCycle: true,
                features: true,
                isActive: true,
                daysTurnAround: true,
                aiGenerated: true,
                humanSupport: true,
                expiresAt: true,
                effectiveAt: true
              },
              where: { isActive: true },
              orderBy: { createdAt: 'desc' }
            }
          }
        }),
        db.plan.count()
      ])

      return {
        data: plans.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description || '',
          isActive: p.isActive,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
          versions: p.versions.map(v => ({
            ...v,
            price: v.price.toString(),
            effectiveAt: v.effectiveAt.toISOString(),
            expiresAt: v.expiresAt ? v.expiresAt.toISOString() : undefined
          }))
        })),
        pagination: {
          totalCount: plansCount,
          totalPages: Math.ceil(plansCount / Math.max(1, pagination.pageSize))
        }
      } satisfies PaginatedResponse<Plan>
    } catch (error) {
      console.error('Error fetching projects:', error)
      throw error
    }
  },
  getById: async (id: string) => {
    try {
      return await db.plan.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          description: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          versions: {
            select: {
              id: true,
              planId: true,
              price: true,
              currency: true,
              billingCycle: true,
              features: true,
              isActive: true,
              daysTurnAround: true,
              aiGenerated: true,
              humanSupport: true,
              expiresAt: true,
              effectiveAt: true
            },
            where: { isActive: true },
            orderBy: { createdAt: 'desc' }
          }
        }
      })
    } catch (error) {
      console.error('Error fetching project by ID:', error)
      throw error
    }
  },

  create: async (projectData: any) => {
    try {
      return await db.project.create({
        data: {
          ...projectData,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        include: {
          projectManager: {
            select: {
              id: true,
              firstName: true,
              lastName: true
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
    } catch (error) {
      console.error('Error creating project:', error)
      throw error
    }
  }
})
