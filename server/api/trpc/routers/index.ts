import { createTRPCRouter } from '../init'
import * as customers from './customers'
import * as businesses from './business'
import * as questions from './questions'
import * as projects from './projects'
import * as users from './users'
import * as plans from './plans'

export const appRouter = createTRPCRouter({
  customers: customers.registerRoutes(),
  business: businesses.registerRoutes(),
  projects: projects.registerRoutes(),
  users: users.registerRoutes(),
  plans: plans.registerRoutes(),
  questions: questions.registerRoutes()
})

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter
