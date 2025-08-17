import { type PlanService, planService } from '~/api/services/plans'
import { type CustomerService, customerService } from '~/api/services/customers'
import { type ProjectService, projectService } from '~/api/services/projects'
import { type UserService, userService } from '~/api/services/users'
import { type BusinessService, businessService } from '~/api/services/business'
import { type QuestionService, questionService } from '~/api/services/questions'

export interface Api {
  plans: PlanService
  customers: CustomerService
  projects: ProjectService
  users: UserService
  business: BusinessService
  questions: QuestionService
}

export const useApi = (): Api => {
  return {
    plans: planService,
    customers: customerService,
    projects: projectService,
    users: userService,
    business: businessService,
    questions: questionService
  } satisfies Api
}
