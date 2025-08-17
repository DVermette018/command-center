import type { PrismaClient, Prisma } from '@prisma/client'
import type {
  ListAnswerDTO,
  ListQuestionTemplateDTO,
  PlanType,
  SaveAnswerDTO,
  ProjectSetupProgressDTO
} from '~~/dto/question'

export const register = (db: PrismaClient) => ({
  getTemplatesForPlan: async (planType: PlanType): Promise<ListQuestionTemplateDTO[]> => {
    try {
      const data = await db.questionTemplate.findMany({
        where: {
          OR: [
            { planType: planType as any },
            { planType: 'ALL' as any }
          ],
          isActive: true
        },
        include: {
          questions: {
            where: { isActive: true },
            orderBy: { order: 'asc' }
          }
        },
        orderBy: { order: 'asc' }
      })

      return data.map(template => ({
        id: template.id,
        name: template.name,
        section: template.section as any,
        planType: template.planType as PlanType,
        order: template.order,
        isActive: template.isActive,
        version: template.version,
        questions: template.questions.map(q => ({
          id: q.id,
          code: q.code,
          question: q.question,
          helpText: q.helpText,
          placeholder: q.placeholder,
          type: q.type as any,
          required: q.required,
          order: q.order,
          options: q.options,
          maxSelections: q.maxSelections,
          conditionalOn: q.conditionalOn,
          validation: q.validation,
          isActive: q.isActive
        })),
        createdAt: template.createdAt.toISOString(),
        updatedAt: template.updatedAt.toISOString()
      }))
    } catch (error) {
      console.error('Error fetching templates:', error)
      throw error
    }
  },

  getAnswers: async (projectId: string): Promise<ListAnswerDTO[]> => {
    try {
      const data = await db.projectAnswer.findMany({
        where: { projectId, isLatest: true },
        include: {
          question: {
            select: { code: true }
          }
        },
        orderBy: { answeredAt: 'desc' }
      })

      return data.map(answer => ({
        id: answer.id,
        questionId: answer.questionId,
        questionCode: answer.question.code,
        projectId: answer.projectId,
        answer: answer.answer,
        answeredAt: answer.answeredAt.toISOString(),
        answeredBy: answer.answeredBy,
        version: answer.version,
        isLatest: answer.isLatest
      }))
    } catch (error) {
      console.error('Error fetching answers:', error)
      throw error
    }
  },

  getProjectProgress: async (projectId: string): Promise<ProjectSetupProgressDTO | null> => {
    try {
      const progress = await db.projectSetupProgress.findUnique({
        where: { projectId }
      })

      if (!progress) return null

      return {
        id: progress.id,
        projectId: progress.projectId,
        currentSection: progress.currentSection as any,
        sectionsCompleted: progress.sectionsCompleted as string[],
        completionPercentage: progress.completionPercentage,
        aiPromptGenerated: progress.aiPromptGenerated,
        aiPrompt: progress.aiPrompt,
        aiPromptVersion: progress.aiPromptVersion,
        lastSavedAt: progress.lastSavedAt.toISOString(),
        completedAt: progress.completedAt?.toISOString() || null,
        draftData: progress.draftData
      }
    } catch (error) {
      console.error('Error fetching project progress:', error)
      throw error
    }
  },

  saveDraft: async (projectId: string, draftData: any): Promise<void> => {
    try {
      await db.projectSetupProgress.upsert({
        where: { projectId },
        create: {
          projectId,
          draftData,
          sectionsCompleted: [],
          completionPercentage: 0,
          aiPromptGenerated: false,
          aiPromptVersion: 0,
          lastSavedAt: new Date()
        },
        update: {
          draftData,
          lastSavedAt: new Date()
        }
      })
    } catch (error) {
      console.error('Error saving draft:', error)
      throw error
    }
  },

  saveAnswers: async (projectId: string, answers: SaveAnswerDTO[], userId?: string): Promise<void> => {
    try {
      await db.$transaction(async (tx) => {
        // Mark existing answers as not latest
        const questionIds = answers.map(a => a.questionId)
        await tx.projectAnswer.updateMany({
          where: {
            projectId,
            questionId: { in: questionIds },
            isLatest: true
          },
          data: { isLatest: false }
        })

        // Get latest versions for each question
        const latestVersions = await tx.projectAnswer.groupBy({
          by: ['questionId'],
          where: { projectId },
          _max: { version: true }
        })

        const versionMap = new Map(
          latestVersions.map(v => [v.questionId, v._max.version || 0])
        )

        // Create new answers
        const answerData = answers.map(answer => ({
          projectId: answer.projectId,
          questionId: answer.questionId,
          answer: answer.answer,
          answeredBy: userId || null,
          version: (versionMap.get(answer.questionId) || 0) + 1,
          isLatest: true,
          answeredAt: new Date()
        }))

        await tx.projectAnswer.createMany({
          data: answerData
        })
      })
    } catch (error) {
      console.error('Error saving answers:', error)
      throw error
    }
  },

  updateProjectProgress: async (projectId: string): Promise<void> => {
    try {
      // Get all answers and questions
      const answers = await db.projectAnswer.findMany({
        where: { projectId, isLatest: true },
        include: {
          question: {
            include: { template: true }
          }
        }
      })

      // Group by section
      const sectionProgress = answers.reduce((acc, answer) => {
        const section = answer.question.template.section
        if (!acc[section]) {
          acc[section] = { total: 0, completed: 0 }
        }
        acc[section].total++
        if (answer.answer !== null) {
          acc[section].completed++
        }
        return acc
      }, {} as Record<string, { total: number; completed: number }>)

      // Calculate completed sections
      const sectionsCompleted = Object.entries(sectionProgress)
        .filter(([_, progress]) => progress.completed === progress.total)
        .map(([section]) => section)

      // Calculate overall percentage
      const totalQuestions = Object.values(sectionProgress)
        .reduce((sum, s) => sum + s.total, 0)
      const answeredQuestions = Object.values(sectionProgress)
        .reduce((sum, s) => sum + s.completed, 0)
      const completionPercentage = Math.round((answeredQuestions / totalQuestions) * 100)


      await db.projectSetupProgress.upsert({
        where: { projectId },
        create: {
          projectId,
          sectionsCompleted,
          completionPercentage,
          aiPromptGenerated: false,
          aiPromptVersion: 0,
          lastSavedAt: new Date()
        },
        update: {
          sectionsCompleted,
          completionPercentage,
          lastSavedAt: new Date(),
          completedAt: completionPercentage === 100 ? new Date() : null
        }
      })
    } catch (error) {
      console.error('Error updating project progress:', error)
      throw error
    }
  },

  saveGeneratedPrompt: async (projectId: string, prompt: string): Promise<{ aiPrompt: string; aiPromptVersion: number }> => {
    try {
      const progress = await db.projectSetupProgress.upsert({
        where: { projectId },
        create: {
          projectId,
          aiPrompt: prompt,
          aiPromptGenerated: true,
          aiPromptVersion: 1,
          sectionsCompleted: [],
          completionPercentage: 100,
          lastSavedAt: new Date(),
          completedAt: new Date()
        },
        update: {
          aiPrompt: prompt,
          aiPromptGenerated: true,
          aiPromptVersion: { increment: 1 },
          completedAt: new Date()
        }
      })

      return {
        aiPrompt: progress.aiPrompt!,
        aiPromptVersion: progress.aiPromptVersion
      }
    } catch (error) {
      console.error('Error saving generated prompt:', error)
      throw error
    }
  }
})
