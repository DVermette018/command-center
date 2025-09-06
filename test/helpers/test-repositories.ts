import { PrismaClient } from '@prisma/client'
import * as customers from '~~/server/repositories/customers'
import * as questions from '~~/server/repositories/questions'
import * as business from '~~/server/repositories/business'
import * as projects from '~~/server/repositories/projects'
import * as users from '~~/server/repositories/users'
import * as plans from '~~/server/repositories/plans'

/**
 * Create test repositories using the provided test database Prisma client
 */
export function createTestRepositories(testPrisma: PrismaClient) {
  return {
    customers: customers.register(testPrisma),
    business: business.register(testPrisma),
    projects: projects.register(testPrisma),
    questions: questions.register(testPrisma),
    users: users.register(testPrisma),
    plans: plans.register(testPrisma)
  }
}

export type TestRepositories = ReturnType<typeof createTestRepositories>