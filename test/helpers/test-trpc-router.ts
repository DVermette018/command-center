import { PrismaClient } from '@prisma/client'
import { createTRPCRouter, createCallerFactory } from '~~/server/api/trpc/init'
import { createTestRepositories } from './test-repositories'

// We need to mock the repositories module to use our test repositories
let testRepositories: ReturnType<typeof createTestRepositories>

export function initializeTestRepositories(testPrisma: PrismaClient) {
  testRepositories = createTestRepositories(testPrisma)
}

// Mock the repositories import
vi.mock('~~/server/repositories', () => ({
  repositories: testRepositories
}))

// Import the router components after mocking
import * as customers from '~~/server/api/trpc/routers/customers'
import * as businesses from '~~/server/api/trpc/routers/business'
import * as questions from '~~/server/api/trpc/routers/questions'
import * as projects from '~~/server/api/trpc/routers/projects'
import * as users from '~~/server/api/trpc/routers/users'
import * as plans from '~~/server/api/trpc/routers/plans'

export const testAppRouter = createTRPCRouter({
  customers: customers.registerRoutes(),
  business: businesses.registerRoutes(),
  projects: projects.registerRoutes(),
  users: users.registerRoutes(),
  plans: plans.registerRoutes(),
  questions: questions.registerRoutes()
})

/**
 * Create a tRPC caller for testing with the test database
 */
export function createTestCaller(testPrisma: PrismaClient) {
  // Initialize test repositories with the test database
  initializeTestRepositories(testPrisma)
  
  const createCaller = createCallerFactory(testAppRouter)
  
  const mockContext = {
    auth: null,
    prisma: testPrisma
  }
  
  return createCaller(mockContext)
}

export type TestCaller = ReturnType<typeof createTestCaller>