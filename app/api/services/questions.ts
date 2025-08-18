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
  // TanStack Query hooks for components
  useGetTemplatesForPlanQuery: (planType: PlanType) => ReturnType<typeof questionsQueries.useGetTemplatesForPlanQuery>
  useGetProjectAnswersQuery: (projectId: string) => ReturnType<typeof questionsQueries.useGetProjectAnswersQuery>
  useGetLastCompletedSectionQuery: (projectId: string) => ReturnType<typeof questionsQueries.useGetLastCompletedSectionQuery>
  useGetProjectProgressQuery: (projectId: string) => ReturnType<typeof questionsQueries.useGetProjectProgressQuery>
  useSaveDraftMutation: () => ReturnType<typeof questionsQueries.useSaveDraftMutation>
  useSaveAnswersMutation: () => ReturnType<typeof questionsQueries.useSaveAnswersMutation>
  useGenerateAIPromptMutation: () => ReturnType<typeof questionsQueries.useGenerateAIPromptMutation>
  
  // Direct call methods for server-side or utility usage
  getTemplatesForPlan: (planType: PlanType) => Promise<ListQuestionTemplateDTO[]>
  getProjectAnswers: (projectId: string) => Promise<ListAnswerDTO[]>
  getLastCompletedSection: (projectId: string) => Promise<number>
  getProjectProgress: (projectId: string) => Promise<ProjectSetupProgressDTO | null>
  callSaveDraft: () => (data: SaveDraftDTO) => Promise<{ success: boolean; }>
  callSaveAnswers: () => (data: SaveAnswersDTO) => Promise<{ success: boolean; }>
  callGenerateAIPrompt: () => (projectId: string) => Promise<{ prompt: string; version: number }>
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
  // TanStack Query hooks for components
  useGetTemplatesForPlanQuery: (planType: PlanType) => questionsQueries.useGetTemplatesForPlanQuery(planType),
  useGetProjectAnswersQuery: (projectId: string) => questionsQueries.useGetProjectAnswersQuery(projectId),
  useGetLastCompletedSectionQuery: (projectId: string) => questionsQueries.useGetLastCompletedSectionQuery(projectId),
  useGetProjectProgressQuery: (projectId: string) => questionsQueries.useGetProjectProgressQuery(projectId),
  useSaveDraftMutation: () => questionsQueries.useSaveDraftMutation(),
  useSaveAnswersMutation: () => questionsQueries.useSaveAnswersMutation(),
  useGenerateAIPromptMutation: () => questionsQueries.useGenerateAIPromptMutation(),
  
  // Direct call methods for server-side or utility usage
  getTemplatesForPlan: (planType: PlanType) => questionsQueries.getTemplatesForPlan(planType),
  getProjectAnswers: (projectId: string) => questionsQueries.getProjectAnswers(projectId),
  getLastCompletedSection: (projectId: string) => questionsQueries.getLastCompletedSection(projectId),
  getProjectProgress: (projectId: string) => questionsQueries.getProjectProgress(projectId),
  callSaveDraft: () => questionsQueries.callSaveDraft(),
  callSaveAnswers: () => questionsQueries.callSaveAnswers(),
  callGenerateAIPrompt: () => questionsQueries.callGenerateAIPrompt()
}
