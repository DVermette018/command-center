import * as Plans from '~/api/services/plans'
import * as Customers from '~/api/services/customers'
import * as Projects from '~/api/services/projects'
import * as Users from '~/api/services/users'
import * as Business from '~/api/services/business'
import * as Questions from '~/api/services/questions'

export interface Api {
  plans: any
  customers: any
  projects: any
  users: any
  business: any
  questions: any
}

export const useApi = (): Api => {
  return {
    plans: Plans.registerService,
    customers: Customers.registerService,
    projects: Projects.registerService,
    users: Users.registerService,
    business: Business.registerService,
    questions: Questions.registerService
  } satisfies Api
}
