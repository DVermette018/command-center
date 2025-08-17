import { z } from 'zod'

// Enums
export const PROJECT_SETUP_SECTIONS = ['BUSINESS_CONTEXT', 'PROJECT_GOALS', 'DESIGN_PREFERENCES', 'CONTENT_STRUCTURE', 'ADDITIONAL_CONTEXT'] as const
export type ProjectSetupSection = (typeof PROJECT_SETUP_SECTIONS)[number]

export const PLAN_TYPES = ['LANDING', 'WEBSITE', 'PRO', 'ALL'] as const
export type PlanType = (typeof PLAN_TYPES)[number]

export const QUESTION_TYPES = [
  'TEXT', 'TEXTAREA', 'SELECT', 'MULTI_SELECT', 'IMAGE_SELECT',
  'NUMBER', 'DATE', 'URL', 'EMAIL', 'TOGGLE', 'RANGE', 'FILE_UPLOAD'
] as const
export type QuestionType = (typeof QUESTION_TYPES)[number]

// Question schemas
export const listQuestionSchema = z.object({
  id: z.string(),
  code: z.string(),
  question: z.string(),
  helpText: z.string().nullable(),
  placeholder: z.string().nullable(),
  type: z.enum(QUESTION_TYPES),
  required: z.boolean(),
  order: z.number(),
  options: z.any().nullable(), // JSON field
  maxSelections: z.number().nullable(),
  conditionalOn: z.any().nullable(), // JSON field
  validation: z.any().nullable(), // JSON field
  isActive: z.boolean(),
})
export type ListQuestionDTO = z.output<typeof listQuestionSchema>

export const listQuestionTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  section: z.enum(PROJECT_SETUP_SECTIONS),
  planType: z.enum(PLAN_TYPES),
  order: z.number(),
  isActive: z.boolean(),
  version: z.number(),
  questions: z.array(listQuestionSchema).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
})
export type ListQuestionTemplateDTO = z.output<typeof listQuestionTemplateSchema>

// Answer schemas
export const listAnswerSchema = z.object({
  id: z.string(),
  questionId: z.string(),
  questionCode: z.string().optional(),
  projectId: z.string(),
  answer: z.any(),
  answeredAt: z.string().datetime(),
  answeredBy: z.string().nullable(),
  version: z.number(),
  isLatest: z.boolean(),
})
export type ListAnswerDTO = z.output<typeof listAnswerSchema>

export const saveAnswerSchema = z.object({
  projectId: z.string(),
  questionId: z.string(),
  questionCode: z.string(),
  answer: z.any(),
})
export type SaveAnswerDTO = z.input<typeof saveAnswerSchema>

export const saveDraftSchema = z.object({
  projectId: z.string(),
  sectionIndex: z.number(),
  answers: z.array(saveAnswerSchema),
})
export type SaveDraftDTO = z.input<typeof saveDraftSchema>

export const saveAnswersSchema = z.object({
  projectId: z.string(),
  answers: z.array(saveAnswerSchema),
})
export type SaveAnswersDTO = z.input<typeof saveAnswersSchema>

// Progress schemas
export const projectSetupProgressSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  currentSection: z.enum(PROJECT_SETUP_SECTIONS).nullable(),
  sectionsCompleted: z.array(z.string()),
  completionPercentage: z.number(),
  aiPromptGenerated: z.boolean(),
  aiPrompt: z.string().nullable(),
  aiPromptVersion: z.number(),
  lastSavedAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
  draftData: z.any().nullable(),
})
export type ProjectSetupProgressDTO = z.output<typeof projectSetupProgressSchema>
