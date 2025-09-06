import { createCallerFactory } from '~~/server/api/trpc/init'
import { appRouter } from '~~/server/api/trpc/routers'
import { PrismaClient } from '@prisma/client'

/**
 * Create a tRPC caller for testing purposes
 */
export function createTestCaller(prisma: PrismaClient) {
  const createCaller = createCallerFactory(appRouter)
  
  // Create a mock context for testing
  const mockContext = {
    auth: null, // No auth for testing
    prisma // Pass the test database prisma instance
  }
  
  return createCaller(mockContext)
}

export type TestCaller = ReturnType<typeof createTestCaller>