import { PrismaClient } from '@prisma/client'
import * as customers from './customers'
import * as questions from './questions'
import * as business from './business'
import * as projects from './projects'
import * as users from './users'
import * as plans from './plans'

const prisma = new PrismaClient()

export const repositories = {
  customers: customers.register(prisma),
  business: business.register(prisma),
  projects: projects.register(prisma),
  questions: questions.register(prisma),
  users: users.register(prisma),
  plans: plans.register(prisma)
}
