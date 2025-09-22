/**
 * Integration tests for the complete prompt enhancement pipeline
 * Tests the full flow from user answers to enhanced Lovable prompts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createTRPCCaller } from '../helpers/trpc-test-helpers'
import type { PromptEnhancementResponse } from '../../types/anthropic'

// Mock the Anthropic service
vi.mock('../../server/services/anthropic', () => ({
  anthropicService: {
    enhancePrompt: vi.fn()
  },
  AnthropicService: vi.fn()
}))

// Mock repositories
vi.mock('../../server/repositories', () => ({
  repositories: {
    questions: {
      getAnswers: vi.fn(),
      saveGeneratedPrompt: vi.fn()
    },
    projects: {
      getById: vi.fn()
    }
  }
}))

import { repositories } from '../../server/repositories'
import { anthropicService } from '../../server/services/anthropic'

// Type the mocked services
const mockRepositories = repositories as {
  questions: {
    getAnswers: vi.Mock
    saveGeneratedPrompt: vi.Mock
  }
  projects: {
    getById: vi.Mock
  }
}

const mockAnthropicService = anthropicService as {
  enhancePrompt: vi.Mock
}

describe('Prompt Enhancement Integration Tests', () => {
  let caller: any

  const mockProject = {
    id: 'project-123',
    name: 'Test Project',
    planType: 'WEBSITE',
    userId: 'user-123',
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString()
  }

  const mockAnswers = [
    {
      id: 'answer-1',
      projectId: 'project-123',
      questionCode: 'target_audience',
      answer: 'Small businesses in healthcare',
      questionText: 'Who is your target audience?',
      version: 1
    },
    {
      id: 'answer-2',
      projectId: 'project-123',
      questionCode: 'unique_value',
      answer: 'AI-powered patient management',
      questionText: 'What is your unique value proposition?',
      version: 1
    },
    {
      id: 'answer-3',
      projectId: 'project-123',
      questionCode: 'business_personality',
      answer: 'Healthcare Technology',
      questionText: 'What type of business is this?',
      version: 1
    },
    {
      id: 'answer-4',
      projectId: 'project-123',
      questionCode: 'must_have_features',
      answer: ['appointment-scheduling', 'patient-records', 'billing-integration'],
      questionText: 'What are your must-have features?',
      version: 1
    }
  ]

  const mockEnhancedResponse: PromptEnhancementResponse = {
    enhancedPrompt: `# Healthcare Patient Management System

## Project Overview
Create a comprehensive WEBSITE application for healthcare practices focusing on small businesses in healthcare. This system will leverage AI-powered patient management to streamline operations and improve patient care.

## Business Requirements
- **Target Market**: Small healthcare practices seeking digital transformation
- **Core Value**: AI-powered patient management reducing administrative burden
- **Industry Focus**: Healthcare Technology sector with compliance requirements

## Technical Requirements
### Must-Have Features
1. **Appointment Scheduling System**
   - Real-time availability management
   - Automated reminders and confirmations
   - Multi-provider scheduling support

2. **Patient Records Management**
   - HIPAA-compliant data storage
   - Searchable patient history
   - Document upload and management

3. **Billing Integration**
   - Insurance claim processing
   - Payment tracking and invoicing
   - Financial reporting dashboard

## Implementation Guidelines
- Ensure HIPAA compliance throughout the system
- Implement responsive design for mobile access
- Use secure authentication and authorization
- Include audit logging for compliance tracking
- Optimize for healthcare workflow efficiency`,
    confidence: 0.92,
    metadata: {
      originalLength: 450,
      enhancedLength: 1200,
      processingTimeMs: 2500,
      modelUsed: 'claude-3-5-sonnet-20241022',
      tokenUsage: {
        input: 120,
        output: 280,
        total: 400
      }
    },
    suggestions: [
      'Consider adding telehealth integration for remote consultations',
      'Include patient portal for self-service capabilities'
    ]
  }

  beforeEach(async () => {
    vi.clearAllMocks()

    // Setup default mock responses
    mockRepositories.projects.getById.mockResolvedValue(mockProject)
    mockRepositories.questions.getAnswers.mockResolvedValue(mockAnswers)
    mockRepositories.questions.saveGeneratedPrompt.mockResolvedValue({
      aiPrompt: mockEnhancedResponse.enhancedPrompt,
      aiPromptVersion: 1
    })
    mockAnthropicService.enhancePrompt.mockResolvedValue(mockEnhancedResponse)

    // Create TRPC caller - you'll need to implement this helper
    caller = await createTRPCCaller()
  })

  describe('generateAIPrompt workflow', () => {
    it('should complete full enhancement pipeline successfully', async () => {
      const result = await caller.questions.generateAIPrompt({
        projectId: 'project-123'
      })

      // Verify the complete workflow
      expect(mockRepositories.questions.getAnswers).toHaveBeenCalledWith('project-123')
      expect(mockRepositories.projects.getById).toHaveBeenCalledWith('project-123')
      
      // Verify Anthropic service was called with correct parameters
      expect(mockAnthropicService.enhancePrompt).toHaveBeenCalledWith({
        originalPrompt: expect.stringContaining('Target Audience: Small businesses in healthcare'),
        context: {
          projectType: 'WEBSITE',
          industry: 'Healthcare Technology',
          timeline: undefined,
          audience: 'Small businesses in healthcare',
          metadata: {
            projectId: 'project-123',
            projectName: 'Test Project',
            totalAnswers: 4
          }
        },
        options: {
          style: 'technical',
          focus: ['clarity', 'detail', 'structure'],
          includeExamples: true,
          customInstructions: 'Transform this into a comprehensive development prompt for Lovable.dev that will help create a modern, user-focused application. Include specific technical requirements and implementation guidelines.'
        }
      })

      // Verify prompt was saved
      expect(mockRepositories.questions.saveGeneratedPrompt).toHaveBeenCalledWith(
        'project-123',
        mockEnhancedResponse.enhancedPrompt
      )

      // Verify response format
      expect(result).toEqual({
        prompt: mockEnhancedResponse.enhancedPrompt,
        version: 1
      })
    })

    it('should handle industry-specific enhancements correctly', async () => {
      const healthcareAnswers = [
        ...mockAnswers,
        {
          id: 'answer-5',
          projectId: 'project-123',
          questionCode: 'primary_goal',
          answer: 'Improve patient care efficiency by 40%',
          questionText: 'What is your primary goal?',
          version: 1
        }
      ]

      mockRepositories.questions.getAnswers.mockResolvedValue(healthcareAnswers)

      await caller.questions.generateAIPrompt({
        projectId: 'project-123'
      })

      const callArgs = mockAnthropicService.enhancePrompt.mock.calls[0][0]
      
      // Verify healthcare-specific content is included
      expect(callArgs.originalPrompt).toContain('Primary Goal: Improve patient care efficiency by 40%')
      expect(callArgs.originalPrompt).toContain('Business Personality: Healthcare Technology')
      
      // Verify context includes industry information
      expect(callArgs.context?.industry).toBe('Healthcare Technology')
    })

    it('should structure prompts with comprehensive business context', async () => {
      const comprehensiveAnswers = [
        ...mockAnswers,
        {
          id: 'answer-comp-1',
          projectId: 'project-123',
          questionCode: 'competitors',
          answer: 'Epic MyChart, Cerner PowerChart',
          questionText: 'Who are your main competitors?',
          version: 1
        },
        {
          id: 'answer-comp-2',
          projectId: 'project-123',
          questionCode: 'success_metrics',
          answer: 'Patient satisfaction scores above 4.5/5, 30% reduction in admin time',
          questionText: 'How will you measure success?',
          version: 1
        }
      ]

      mockRepositories.questions.getAnswers.mockResolvedValue(comprehensiveAnswers)

      await caller.questions.generateAIPrompt({
        projectId: 'project-123'
      })

      const callArgs = mockAnthropicService.enhancePrompt.mock.calls[0][0]
      const prompt = callArgs.originalPrompt

      // Verify all business context sections are present and structured
      expect(prompt).toContain('Business Context:')
      expect(prompt).toContain('Project Goals:')
      expect(prompt).toContain('Design Preferences:')
      expect(prompt).toContain('Additional Context:')
      
      // Verify specific content
      expect(prompt).toContain('Competitors: Epic MyChart, Cerner PowerChart')
      expect(prompt).toContain('Success Metrics: Patient satisfaction scores above 4.5/5, 30% reduction in admin time')
    })

    it('should handle different project types with appropriate context', async () => {
      const proProject = { ...mockProject, planType: 'PRO' }
      mockRepositories.projects.getById.mockResolvedValue(proProject)

      await caller.questions.generateAIPrompt({
        projectId: 'project-123'
      })

      const callArgs = mockAnthropicService.enhancePrompt.mock.calls[0][0]
      
      expect(callArgs.originalPrompt).toContain('Project Type: PRO')
      expect(callArgs.context?.projectType).toBe('PRO')
    })

    it('should gracefully handle missing project', async () => {
      mockRepositories.projects.getById.mockResolvedValue(null)

      await expect(
        caller.questions.generateAIPrompt({
          projectId: 'non-existent-project'
        })
      ).rejects.toThrow('Project not found')

      // Verify no attempt was made to enhance prompt
      expect(mockAnthropicService.enhancePrompt).not.toHaveBeenCalled()
      expect(mockRepositories.questions.saveGeneratedPrompt).not.toHaveBeenCalled()
    })

    it('should handle Anthropic service failures with fallback', async () => {
      mockAnthropicService.enhancePrompt.mockRejectedValue(new Error('Service unavailable'))

      const result = await caller.questions.generateAIPrompt({
        projectId: 'project-123'
      })

      // Should still complete successfully with fallback prompt
      expect(result.prompt).toContain('Create a WEBSITE application with the following requirements')
      expect(result.prompt).toContain('- Who is your target audience?: Small businesses in healthcare')
      
      // Verify fallback prompt was saved
      expect(mockRepositories.questions.saveGeneratedPrompt).toHaveBeenCalledWith(
        'project-123',
        expect.stringContaining('Create a WEBSITE application')
      )
    })

    it('should filter out malformed answers in fallback scenario', async () => {
      const malformedAnswers = [
        ...mockAnswers,
        null,
        { questionCode: 'test', answer: null, questionText: null },
        { questionCode: 'valid', answer: 'Valid answer', questionText: 'Valid question' }
      ]

      mockRepositories.questions.getAnswers.mockResolvedValue(malformedAnswers)
      mockAnthropicService.enhancePrompt.mockRejectedValue(new Error('Service error'))

      const result = await caller.questions.generateAIPrompt({
        projectId: 'project-123'
      })

      // Should not include malformed entries in fallback
      expect(result.prompt).not.toContain('null')
      expect(result.prompt).toContain('- Valid question: Valid answer')
      expect(result.prompt).toContain('- Who is your target audience?: Small businesses in healthcare')
    })
  })

  describe('prompt quality validation', () => {
    it('should generate prompts with sufficient business intelligence', async () => {
      await caller.questions.generateAIPrompt({
        projectId: 'project-123'
      })

      const callArgs = mockAnthropicService.enhancePrompt.mock.calls[0][0]
      const originalPrompt = callArgs.originalPrompt
      
      // Verify comprehensive business context is captured
      expect(originalPrompt.length).toBeGreaterThan(300) // Minimum complexity
      expect(originalPrompt.split('\n').length).toBeGreaterThan(15) // Multi-line structure
      
      // Verify key business intelligence elements
      expect(originalPrompt).toMatch(/Target Audience:.+healthcare/i)
      expect(originalPrompt).toMatch(/Unique Value:.+AI-powered/i)
      expect(originalPrompt).toMatch(/Must Have Features:.+\[.+\]/i) // JSON array format
    })

    it('should generate context suitable for development teams', async () => {
      await caller.questions.generateAIPrompt({
        projectId: 'project-123'
      })

      const callArgs = mockAnthropicService.enhancePrompt.mock.calls[0][0]
      const options = callArgs.options
      
      // Verify options are optimized for development
      expect(options?.style).toBe('technical')
      expect(options?.focus).toContain('clarity')
      expect(options?.focus).toContain('detail')
      expect(options?.focus).toContain('structure')
      expect(options?.includeExamples).toBe(true)
      expect(options?.customInstructions).toContain('Lovable.dev')
      expect(options?.customInstructions).toContain('technical requirements')
    })
  })

  describe('performance and reliability', () => {
    it('should complete enhancement within reasonable time', async () => {
      const startTime = Date.now()
      
      await caller.questions.generateAIPrompt({
        projectId: 'project-123'
      })
      
      const duration = Date.now() - startTime
      expect(duration).toBeLessThan(5000) // Should complete within 5 seconds in tests
    })

    it('should handle large answer sets efficiently', async () => {
      const largeAnswerSet = Array.from({ length: 50 }, (_, i) => ({
        id: `answer-${i}`,
        projectId: 'project-123',
        questionCode: `question_${i}`,
        answer: `Answer ${i} with detailed content about the project requirements`,
        questionText: `Question ${i}?`,
        version: 1
      }))

      mockRepositories.questions.getAnswers.mockResolvedValue(largeAnswerSet)

      const result = await caller.questions.generateAIPrompt({
        projectId: 'project-123'
      })

      // Should handle large datasets without failure
      expect(result.prompt).toBeTruthy()
      expect(mockAnthropicService.enhancePrompt).toHaveBeenCalled()
      
      // Verify context includes accurate count
      const callArgs = mockAnthropicService.enhancePrompt.mock.calls[0][0]
      expect(callArgs.context?.metadata.totalAnswers).toBe(50)
    })
  })
})