import { defineService } from '~/api/services/helpers'
import type {
  ListAnswerDTO,
  ListQuestionTemplateDTO,
  PlanType,
  ProjectSetupProgressDTO,
  SaveAnswersDTO,
  SaveDraftDTO
} from '~~/dto/question'

const trpc = () => useNuxtApp().$trpc

export interface QuestionService {
  getTemplatesForPlan: (planType: PlanType) => Promise<ListQuestionTemplateDTO[]>
  getProjectAnswers: (projectId: string) => Promise<ListAnswerDTO[]>
  getLastCompletedSection: (projectId: string) => Promise<number>
  getProjectProgress: (projectId: string) => Promise<ProjectSetupProgressDTO | null>
  saveDraft: (data: SaveDraftDTO) => Promise<{ success: boolean; }>
  saveAnswers: (data: SaveAnswersDTO) => Promise<{ success: boolean; }>
  generateAIPrompt: (projectId: string) => Promise<{ prompt: string; version: number }>
}

export const questionsQueries = defineService({
  queries: {
    getTemplatesForPlan: {
      queryKey: (planType: PlanType) => ['QUESTIONS_GET_TEMPLATES_FOR_PLAN', planType],
      queryFn: (planType: PlanType) => trpc().questions.getTemplatesForPlan.query({ planType }),
    },
    getProjectAnswers: {
      queryKey: (projectId: string) => ['QUESTIONS_GET_PROJECT_ANSWERS', projectId],
      queryFn: (projectId: string) => trpc().questions.getProjectAnswers.query({ projectId })
    },
    getLastCompletedSection: {
      queryKey: (projectId: string) => ['QUESTIONS_GET_LAST_COMPLETED_SECTION', projectId],
      queryFn: (projectId: string) => trpc().questions.getLastCompletedSection.query({ projectId })
    },
    getProjectProgress: {
      queryKey: (projectId: string) => ['QUESTIONS_GET_PROJECT_PROGRESS', projectId],
      queryFn: (projectId: string) => trpc().questions.getProjectProgress.query({ projectId })
    }
  },
  mutations: {
    saveDraft: {
      request: (data: SaveDraftDTO) => trpc().questions.saveDraft.mutate(data),
      cacheKey: (data: SaveDraftDTO) => [['QUESTIONS_GET_PROJECT_PROGRESS']]
    },
    saveAnswers: {
      request: (data: SaveAnswersDTO) => trpc().questions.saveAnswers.mutate(data),
      cacheKey: (_, variables) => [['QUESTIONS_GET_PROJECT_PROGRESS'], ['QUESTIONS_GET_PROJECT_ANSWERS', variables.projectId], ['QUESTIONS_GET_PROJECT_PROGRESS', variables.projectId]]
    },
    generateAIPrompt: {
      request: (projectId: string) => trpc().questions.generateAIPrompt.mutate({ projectId }),
      cacheKey: (_, projectId) => [['QUESTIONS_GET_PROJECT_PROGRESS', projectId]]
    }
  }
})

export const questionService: QuestionService = {
  getTemplatesForPlan: async (planType: PlanType) => questionsQueries.getTemplatesForPlan(planType),
  getProjectAnswers: async (projectId: string) => questionsQueries.getProjectAnswers(projectId),
  getLastCompletedSection: async (projectId: string) => questionsQueries.getLastCompletedSection(projectId),
  getProjectProgress: async (projectId: string) => questionsQueries.getProjectProgress(projectId),

  saveDraft: async (data: SaveDraftDTO) => questionsQueries.callSaveDraft()(data),
  saveAnswers: async (data: SaveAnswersDTO) => questionsQueries.callSaveAnswers()(data),
  generateAIPrompt: async (projectId: string) => questionsQueries.callGenerateAIPrompt()(projectId)
}
