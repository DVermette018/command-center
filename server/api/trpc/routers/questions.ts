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
 * Get project type specific configuration and requirements
 */
function getProjectTypeConfig(planType: string) {
  const configs = {
    LANDING: {
      focus: ['conversion', 'performance', 'seo'],
      techStack: ['Static site generation', 'Fast loading', 'SEO optimization'],
      architecture: 'Single-page marketing site with optimized conversion flows',
      priorities: ['Page speed', 'Mobile responsiveness', 'CRO elements', 'Analytics tracking']
    },
    WEBSITE: {
      focus: ['user-experience', 'content-management', 'scalability'],
      techStack: ['Dynamic content', 'CMS integration', 'Responsive design'],
      architecture: 'Multi-page website with content management and user interaction',
      priorities: ['Content structure', 'Navigation UX', 'Cross-browser compatibility', 'Accessibility']
    },
    PRO: {
      focus: ['complex-features', 'integrations', 'performance', 'security'],
      techStack: ['Advanced functionality', 'Third-party integrations', 'Database management'],
      architecture: 'Full-featured web application with complex business logic',
      priorities: ['Feature completeness', 'Data security', 'API integrations', 'Scalable architecture']
    },
    ALL: {
      focus: ['comprehensive-solution', 'adaptability', 'future-proofing'],
      techStack: ['Flexible architecture', 'Modular components', 'Extensible design'],
      architecture: 'Comprehensive solution supporting multiple use cases and future expansion',
      priorities: ['Flexibility', 'Maintainability', 'Future scalability', 'Code reusability']
    }
  }
  
  return configs[planType as keyof typeof configs] || configs.WEBSITE
}

/**
 * Generate business intelligence insights from structured answers
 */
function generateBusinessIntelligence(structuredAnswers: Record<string, any>) {
  const insights = []
  
  // Target audience analysis
  if (structuredAnswers.target_audience) {
    insights.push(`**Target Market**: ${structuredAnswers.target_audience}`)
  }
  
  // Competitive positioning
  if (structuredAnswers.competitors && structuredAnswers.unique_value) {
    insights.push(`**Competitive Edge**: ${structuredAnswers.unique_value} vs competitors (${structuredAnswers.competitors})`)
  }
  
  // Success metrics and measurability
  if (structuredAnswers.success_metrics) {
    insights.push(`**Success Criteria**: ${structuredAnswers.success_metrics}`)
  }
  
  // Business model insights
  if (structuredAnswers.business_personality) {
    insights.push(`**Industry Focus**: ${structuredAnswers.business_personality}`)
  }
  
  return insights.length > 0 ? insights.join('\n') : 'Business intelligence to be determined during development'
}

/**
 * Generate technical requirements based on features and project type
 */
function generateTechnicalSpecs(structuredAnswers: Record<string, any>, projectConfig: any) {
  const specs = []
  
  // Feature-driven technical requirements
  if (structuredAnswers.must_have_features && Array.isArray(structuredAnswers.must_have_features)) {
    specs.push(`**Core Features**: ${structuredAnswers.must_have_features.join(', ')}`)
  }
  
  // Architecture recommendations
  specs.push(`**Recommended Architecture**: ${projectConfig.architecture}`)
  
  // Technical priorities
  specs.push(`**Technical Priorities**: ${projectConfig.priorities.join(', ')}`)
  
  // Performance considerations
  if (structuredAnswers.timeline_urgency) {
    specs.push(`**Development Timeline**: ${structuredAnswers.timeline_urgency}`)
  }
  
  return specs.join('\n')
}

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

    // Get project-specific configuration
    const projectConfig = getProjectTypeConfig(project.planType)
    
    // Generate business intelligence
    const businessIntelligence = generateBusinessIntelligence(structuredAnswers)
    
    // Generate technical specifications
    const technicalSpecs = generateTechnicalSpecs(structuredAnswers, projectConfig)

    // Create enhanced base prompt with project-type specific structure
    const basePrompt = `# ${project.planType} Development Brief: ${project.name}

## Project Overview
**Type**: ${project.planType} - ${projectConfig.architecture}
**Focus Areas**: ${projectConfig.focus.join(', ')}

## Business Intelligence
${businessIntelligence}

### Detailed Business Context
- **Target Audience**: ${structuredAnswers.target_audience || 'Not specified'}
- **Unique Value Proposition**: ${structuredAnswers.unique_value || 'Not specified'}
- **Business Personality/Industry**: ${structuredAnswers.business_personality || 'Not specified'}
- **Competitors**: ${structuredAnswers.competitors || 'Not specified'}

### Project Goals & Success Metrics
- **Primary Goal**: ${structuredAnswers.primary_goal || 'Not specified'}
- **Success Metrics**: ${structuredAnswers.success_metrics || 'Not specified'}
- **Problems Being Solved**: ${structuredAnswers.problems_solving || 'Not specified'}

## Technical Specifications
${technicalSpecs}

### Feature Requirements
- **Must-Have Features**: ${JSON.stringify(structuredAnswers.must_have_features || [])}
- **Technology Stack Recommendations**: ${projectConfig.techStack.join(', ')}

### Design & User Experience
- **Visual Style**: ${JSON.stringify(structuredAnswers.visual_style || [])}
- **Color Psychology**: ${structuredAnswers.color_emotions || 'Not specified'}
- **Design Inspiration**: ${JSON.stringify(structuredAnswers.inspiration_elements || [])}
- **Elements to Avoid**: ${structuredAnswers.avoid_elements || 'Not specified'}

### Project Constraints & Context
- **Timeline Requirements**: ${structuredAnswers.timeline_urgency || 'Not specified'}
- **Budget Priorities**: ${structuredAnswers.budget_priorities || 'Not specified'}
- **Future Vision**: ${structuredAnswers.future_vision || 'Not specified'}
- **Additional Requirements**: ${structuredAnswers.anything_else || 'None specified'}

## Development Guidelines
This ${project.planType} project should prioritize: ${projectConfig.priorities.join(', ')}.
Focus on ${projectConfig.focus.join(', ')} to deliver optimal results for the target audience.`.trim()

    // Build enhanced context for prompt enhancement
    const context: PromptContext = {
      projectType: project.planType,
      industry: structuredAnswers.business_personality,
      timeline: structuredAnswers.timeline_urgency,
      audience: structuredAnswers.target_audience,
      metadata: {
        projectId: project.id,
        projectName: project.name,
        totalAnswers: answers.length,
        projectFocus: projectConfig.focus,
        techPriorities: projectConfig.priorities
      }
    }

    // Use Anthropic service to enhance the prompt with project-specific instructions
    const enhancedPrompt = await anthropicService.enhancePrompt({
      originalPrompt: basePrompt,
      context,
      options: {
        style: 'technical',
        focus: ['clarity', 'detail', 'structure', 'actionability'],
        includeExamples: true,
        customInstructions: `Transform this into a comprehensive development prompt for Lovable.dev optimized for ${project.planType} projects. 
        
        Focus on:
        - ${projectConfig.focus.join(', ')}
        - Specific technical implementation guidelines
        - Business requirements that drive technical decisions
        - Component architecture suggestions
        - Performance and SEO considerations
        - User experience optimization
        
        Ensure the output is actionable for developers and includes specific examples where helpful.`
      }
    })

    return enhancedPrompt.enhancedPrompt

  } catch (error) {
    // Log the error but don't fail the entire operation
    console.error('Failed to enhance prompt with AI:', error)
    
    // Enhanced fallback with project-specific structure
    const projectConfig = getProjectTypeConfig(project.planType)
    const validAnswers = answers.filter(a => a && a.questionText && a.answer)
    
    const fallbackPrompt = `# ${project.planType} Development Brief: ${project.name}

## Project Type
${project.planType} - Focus on ${projectConfig.focus.join(', ')}

## Requirements
${validAnswers.map(a => `- **${a.questionText}**: ${a.answer}`).join('\n')}

## Technical Priorities
- ${projectConfig.priorities.join('\n- ')}

## Architecture Recommendation
${projectConfig.architecture}

Please create a ${project.planType.toLowerCase()} application based on these requirements with focus on ${projectConfig.focus.join(', ')}.`
    
    return fallbackPrompt
  }
}
