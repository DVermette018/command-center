import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { baseProcedure } from '../init'
import { repositories } from '~~/server/repositories'
import {
  listAnswerSchema,
  listQuestionTemplateSchema,
  PLAN_TYPES,
  saveDraftSchema,
  saveAnswersSchema,
  projectSetupProgressSchema,
  type PlanType
} from '~~/dto/question'
import { anthropicService } from '../../../server/services/anthropic'
import type { PromptContext } from '../../../types/anthropic'

export const registerRoutes = () => ({
  getTemplatesForPlan: baseProcedure
    .input(z.object({
      planType: z.enum(PLAN_TYPES)
    }))
    .output(z.array(listQuestionTemplateSchema))
    .query(async (opts) => {
      const templates = await repositories.questions.getTemplatesForPlan(opts.input.planType)
      return z.array(listQuestionTemplateSchema).parse(templates)
    }),

  getProjectAnswers: baseProcedure
    .input(z.object({ projectId: z.string() }))
    .output(z.array(listAnswerSchema))
    .query(async (opts) => {
      const answers = await repositories.questions.getAnswers(opts.input.projectId)
      return z.array(listAnswerSchema).parse(answers)
    }),

  getLastCompletedSection: baseProcedure
    .input(z.object({ projectId: z.string() }))
    .output(z.number())
    .query(async (opts) => {
      const progress = await repositories.questions.getProjectProgress(opts.input.projectId)
      if (!progress) return -1

      // Return the index of the last completed section
      const sections = ['BUSINESS_CONTEXT', 'PROJECT_GOALS', 'DESIGN_PREFERENCES', 'CONTENT_STRUCTURE', 'ADDITIONAL_CONTEXT']
      const completedSections = progress.sectionsCompleted as string[]

      let lastIndex = -1
      sections.forEach((section, index) => {
        if (completedSections.includes(section)) {
          lastIndex = Math.max(lastIndex, index)
        }
      })

      return lastIndex
    }),

  saveDraft: baseProcedure
    .input(saveDraftSchema)
    .mutation(async (opts) => {
      const { projectId, sectionIndex, answers } = opts.input

      // Save draft data to project progress
      await repositories.questions.saveDraft(projectId, {
        sectionIndex,
        answers,
        timestamp: new Date().toISOString()
      })

      return { success: true }
    }),

  saveAnswers: baseProcedure
    .input(saveAnswersSchema)
    .mutation(async (opts) => {
      const { projectId, answers } = opts.input
      // const userId = opts.ctx.user?.id  // TODO: Add user context

      // Save answers with versioning
      await repositories.questions.saveAnswers(projectId, answers, '1')

      // Update project progress
      await repositories.questions.updateProjectProgress(projectId)

      return { success: true }
    }),

  generateAIPrompt: baseProcedure
    .input(z.object({ projectId: z.string() }))
    .output(z.object({
      prompt: z.string(),
      version: z.number()
    }))
    .mutation(async (opts) => {
      const { projectId } = opts.input

      // Get all answers
      const answers = await repositories.questions.getAnswers(projectId)

      // Get project details
      const project = await repositories.projects.getById(projectId)
      if (!project) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found'
        })
      }


      // Generate prompt using AI (this is a placeholder - implement your AI logic)
      const prompt = await generateLovablePrompt(answers, project)

      // Save the generated prompt
      const result = await repositories.questions.saveGeneratedPrompt(projectId, prompt)

      return {
        prompt: result.aiPrompt!,
        version: result.aiPromptVersion
      }
    }),

  getProjectProgress: baseProcedure
    .input(z.object({ projectId: z.string() }))
    .output(projectSetupProgressSchema.nullable())
    .query(async (opts) => {
      const progress = await repositories.questions.getProjectProgress(opts.input.projectId)
      return progress ? projectSetupProgressSchema.parse(progress) : null
    }),
})

/**
 * Generate enhanced Lovable prompt using Anthropic service
 * Transforms user answers into an AI-enhanced prompt for development
 */
async function generateLovablePrompt(answers: any[], project: any): Promise<string> {
  try {
    // Structure answers by question code
    const structuredAnswers = answers.reduce((acc, item) => {
      if (item.questionCode) {
        acc[item.questionCode] = item.answer
      }
      return acc
    }, {} as Record<string, any>)

    // Create base prompt with structured data
    const basePrompt = `
      Project Type: ${project.planType}

      Business Context:
      - Target Audience: ${structuredAnswers.target_audience || 'Not specified'}
      - Unique Value: ${structuredAnswers.unique_value || 'Not specified'}
      - Business Personality: ${structuredAnswers.business_personality || 'Not specified'}
      - Competitors: ${structuredAnswers.competitors || 'Not specified'}

      Project Goals:
      - Primary Goal: ${structuredAnswers.primary_goal || 'Not specified'}
      - Success Metrics: ${structuredAnswers.success_metrics || 'Not specified'}
      - Problems Solving: ${structuredAnswers.problems_solving || 'Not specified'}
      - Must Have Features: ${JSON.stringify(structuredAnswers.must_have_features || [])}

      Design Preferences:
      - Visual Style: ${JSON.stringify(structuredAnswers.visual_style || [])}
      - Color Emotions: ${structuredAnswers.color_emotions || 'Not specified'}
      - Inspiration Elements: ${JSON.stringify(structuredAnswers.inspiration_elements || [])}
      - Avoid Elements: ${structuredAnswers.avoid_elements || 'Not specified'}

      Additional Context:
      - Timeline: ${structuredAnswers.timeline_urgency || 'Not specified'}
      - Budget Priorities: ${structuredAnswers.budget_priorities || 'Not specified'}
      - Future Vision: ${structuredAnswers.future_vision || 'Not specified'}
      - Additional Notes: ${structuredAnswers.anything_else || 'Not specified'}
    `.trim()

    // Build context for prompt enhancement
    const context: PromptContext = {
      projectType: project.planType,
      industry: structuredAnswers.business_personality,
      timeline: structuredAnswers.timeline_urgency,
      audience: structuredAnswers.target_audience,
      metadata: {
        projectId: project.id,
        projectName: project.name,
        totalAnswers: answers.length
      }
    }

    // Use Anthropic service to enhance the prompt
    const enhancedPrompt = await anthropicService.enhancePrompt({
      originalPrompt: basePrompt,
      context,
      options: {
        style: 'technical',
        focus: ['clarity', 'detail', 'structure'],
        includeExamples: true,
        customInstructions: 'Transform this into a comprehensive development prompt for Lovable.dev that will help create a modern, user-focused application. Include specific technical requirements and implementation guidelines.'
      }
    })

    return enhancedPrompt.enhancedPrompt

  } catch (error) {
    // Log the error but don't fail the entire operation
    console.error('Failed to enhance prompt with AI:', error)
    
    // Fallback to basic prompt structure
    const fallbackPrompt = `Create a ${project.planType} application with the following requirements based on user feedback:\n\n${answers.map(a => `- ${a.questionText}: ${a.answer}`).join('\n')}`
    
    return fallbackPrompt
  }
}
