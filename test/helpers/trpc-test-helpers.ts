/**
 * TRPC test helpers for creating test callers
 * Provides utilities for testing TRPC routers in isolation
 */

import { registerRoutes } from '../../server/api/trpc/routers/questions'

/**
 * Create a TRPC caller for testing purposes
 * This allows us to test TRPC procedures directly without HTTP layer
 */
export async function createTRPCCaller() {
  // Create the router with all registered routes
  const router = {
    questions: registerRoutes()
  }

  // Create a caller with mock context
  const mockContext = {
    user: {
      id: 'test-user-123',
      email: 'test@example.com'
    }
  }

  // Create caller function that mimics TRPC's createCallerFactory
  const createCaller = (ctx: any) => {
    const caller = {
      questions: {}
    }

    // Bind each procedure to the caller
    for (const [key, procedure] of Object.entries(router.questions)) {
      ;(caller.questions as any)[key] = async (input: any) => {
        try {
          // Mock the TRPC context structure
          const mockOpts = {
            input,
            ctx: mockContext,
            type: 'query' as const,
            path: `questions.${key}`,
            rawInput: input
          }

          // Call the procedure with the mock opts
          if ('query' in procedure) {
            return await procedure.query(mockOpts)
          } else if ('mutate' in procedure) {
            return await (procedure as any).mutation(mockOpts)
          }
        } catch (error) {
          // Re-throw as TRPC error for realistic testing
          throw error
        }
      }
    }

    return caller
  }

  return createCaller(mockContext)
}

/**
 * Create a minimal mock TRPC context for testing
 */
export function createMockContext(overrides: any = {}) {
  return {
    user: {
      id: 'test-user-123',
      email: 'test@example.com',
      ...overrides.user
    },
    ...overrides
  }
}