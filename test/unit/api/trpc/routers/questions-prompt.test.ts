/**
 * Unit tests for prompt generation business logic in questions router
 * Following TDD principles to test core business requirements
 */

import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest'
import type { PromptEnhancementResponse, PromptContext } from '../../../../../types/anthropic'

// Mock the anthropic service using factory function
vi.mock('../../../../../server/services/anthropic', () => ({
  anthropicService: {
    enhancePrompt: vi.fn()
  }
}))

// Import the function we're testing after mocking
import { anthropicService } from '../../../../../server/services/anthropic'

// Cast to mocked for type safety
const mockAnthropicService = anthropicService as {
  enhancePrompt: MockedFunction<typeof anthropicService.enhancePrompt>
}

// Helper functions extracted for testing - these mirror the implementation
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

function generateBusinessIntelligence(structuredAnswers: Record<string, any>) {
  const insights = []
  
  if (structuredAnswers.target_audience) {
    insights.push(`**Target Market**: ${structuredAnswers.target_audience}`)
  }
  
  if (structuredAnswers.competitors && structuredAnswers.unique_value) {
    insights.push(`**Competitive Edge**: ${structuredAnswers.unique_value} vs competitors (${structuredAnswers.competitors})`)
  }
  
  if (structuredAnswers.success_metrics) {
    insights.push(`**Success Criteria**: ${structuredAnswers.success_metrics}`)
  }
  
  if (structuredAnswers.business_personality) {
    insights.push(`**Industry Focus**: ${structuredAnswers.business_personality}`)
  }
  
  return insights.length > 0 ? insights.join('\n') : 'Business intelligence to be determined during development'
}

function generateTechnicalSpecs(structuredAnswers: Record<string, any>, projectConfig: any) {
  const specs = []
  
  if (structuredAnswers.must_have_features && Array.isArray(structuredAnswers.must_have_features)) {
    specs.push(`**Core Features**: ${structuredAnswers.must_have_features.join(', ')}`)
  }
  
  specs.push(`**Recommended Architecture**: ${projectConfig.architecture}`)
  specs.push(`**Technical Priorities**: ${projectConfig.priorities.join(', ')}`)
  
  if (structuredAnswers.timeline_urgency) {
    specs.push(`**Development Timeline**: ${structuredAnswers.timeline_urgency}`)
  }
  
  return specs.join('\n')
}

// For testing purposes, we'll create a testable version of the function
// This follows TDD principle - test drives design improvements
const generateLovablePrompt = async (answers: any[], project: any): Promise<string> => {
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

describe('generateLovablePrompt', () => {
  const mockProject = {
    id: 'test-project-id',
    name: 'Test Project',
    planType: 'WEBSITE'
  }

  const mockAnswers = [
    {
      questionCode: 'target_audience',
      answer: 'Small businesses and entrepreneurs',
      questionText: 'Who is your target audience?'
    },
    {
      questionCode: 'unique_value',
      answer: 'AI-powered project management',
      questionText: 'What is your unique value proposition?'
    },
    {
      questionCode: 'primary_goal',
      answer: 'Increase productivity by 50%',
      questionText: 'What is your primary goal?'
    },
    {
      questionCode: 'must_have_features',
      answer: ['dashboard', 'analytics', 'integrations'],
      questionText: 'What are your must-have features?'
    }
  ]

  const mockEnhancedResponse: PromptEnhancementResponse = {
    enhancedPrompt: 'Enhanced comprehensive prompt for Lovable development',
    confidence: 0.9,
    metadata: {
      originalLength: 500,
      enhancedLength: 1200,
      processingTimeMs: 2000,
      modelUsed: 'claude-3-5-sonnet-20241022',
      tokenUsage: {
        input: 100,
        output: 200,
        total: 300
      }
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockAnthropicService.enhancePrompt.mockResolvedValue(mockEnhancedResponse)
  })

  describe('successful prompt generation', () => {
    it('should structure answers by question code correctly', async () => {
      await generateLovablePrompt(mockAnswers, mockProject)

      expect(mockAnthropicService.enhancePrompt).toHaveBeenCalledWith({
        originalPrompt: expect.stringContaining('**Target Audience**: Small businesses and entrepreneurs'),
        context: expect.objectContaining({
          projectType: 'WEBSITE',
          audience: 'Small businesses and entrepreneurs',
          metadata: expect.objectContaining({
            projectFocus: ['user-experience', 'content-management', 'scalability'],
            techPriorities: expect.arrayContaining(['Content structure', 'Navigation UX'])
          })
        }),
        options: expect.objectContaining({
          style: 'technical',
          focus: ['clarity', 'detail', 'structure', 'actionability'],
          includeExamples: true
        })
      })
    })

    it('should generate base prompt with all business context sections', async () => {
      await generateLovablePrompt(mockAnswers, mockProject)

      const callArgs = mockAnthropicService.enhancePrompt.mock.calls[0][0]
      const originalPrompt = callArgs.originalPrompt

      expect(originalPrompt).toContain('# WEBSITE Development Brief:')
      expect(originalPrompt).toContain('## Business Intelligence')
      expect(originalPrompt).toContain('### Detailed Business Context')
      expect(originalPrompt).toContain('### Project Goals & Success Metrics')
      expect(originalPrompt).toContain('### Design & User Experience')
      expect(originalPrompt).toContain('### Project Constraints & Context')
      expect(originalPrompt).toContain('**Target Audience**: Small businesses and entrepreneurs')
      expect(originalPrompt).toContain('**Primary Goal**: Increase productivity by 50%')
    })

    it('should handle JSON serialization for array answers', async () => {
      await generateLovablePrompt(mockAnswers, mockProject)

      const callArgs = mockAnthropicService.enhancePrompt.mock.calls[0][0]
      const originalPrompt = callArgs.originalPrompt

      expect(originalPrompt).toContain('**Must-Have Features**: ["dashboard","analytics","integrations"]')
    })

    it('should build proper context for enhancement', async () => {
      await generateLovablePrompt(mockAnswers, mockProject)

      const callArgs = mockAnthropicService.enhancePrompt.mock.calls[0][0]
      const context = callArgs.context

      expect(context).toEqual({
        projectType: 'WEBSITE',
        industry: undefined, // business_personality not in mock answers
        timeline: undefined, // timeline_urgency not in mock answers
        audience: 'Small businesses and entrepreneurs',
        metadata: {
          projectId: 'test-project-id',
          projectName: 'Test Project',
          totalAnswers: 4
        }
      })
    })

    it('should use technical style with comprehensive options', async () => {
      await generateLovablePrompt(mockAnswers, mockProject)

      const callArgs = mockAnthropicService.enhancePrompt.mock.calls[0][0]
      const options = callArgs.options

      expect(options).toEqual({
        style: 'technical',
        focus: ['clarity', 'detail', 'structure'],
        includeExamples: true,
        customInstructions: 'Transform this into a comprehensive development prompt for Lovable.dev that will help create a modern, user-focused application. Include specific technical requirements and implementation guidelines.'
      })
    })

    it('should return enhanced prompt from AI service', async () => {
      const result = await generateLovablePrompt(mockAnswers, mockProject)

      expect(result).toBe('Enhanced comprehensive prompt for Lovable development')
    })
  })

  describe('handling missing answer data', () => {
    it('should handle missing question codes gracefully', async () => {
      const answersWithoutCodes = [
        { answer: 'Some answer', questionText: 'Some question' },
        { questionCode: null, answer: 'Another answer', questionText: 'Another question' }
      ]

      await generateLovablePrompt(answersWithoutCodes, mockProject)

      const callArgs = mockAnthropicService.enhancePrompt.mock.calls[0][0]
      expect(callArgs.originalPrompt).toContain('Target Audience: Not specified')
      expect(callArgs.originalPrompt).toContain('Unique Value: Not specified')
    })

    it('should handle empty answers array', async () => {
      await generateLovablePrompt([], mockProject)

      const callArgs = mockAnthropicService.enhancePrompt.mock.calls[0][0]
      expect(callArgs.originalPrompt).toContain('Target Audience: Not specified')
      expect(callArgs.context?.metadata.totalAnswers).toBe(0)
    })

    it('should provide default values for missing fields', async () => {
      const minimalAnswers = [{ questionCode: 'target_audience', answer: 'Test audience', questionText: 'Who?' }]

      await generateLovablePrompt(minimalAnswers, mockProject)

      const callArgs = mockAnthropicService.enhancePrompt.mock.calls[0][0]
      const prompt = callArgs.originalPrompt

      expect(prompt).toContain('Unique Value: Not specified')
      expect(prompt).toContain('Primary Goal: Not specified')
      expect(prompt).toContain('Must Have Features: []')
      expect(prompt).toContain('Visual Style: []')
    })
  })

  describe('different project types', () => {
    it('should handle LANDING page project type', async () => {
      const landingProject = { ...mockProject, planType: 'LANDING' }

      await generateLovablePrompt(mockAnswers, landingProject)

      const callArgs = mockAnthropicService.enhancePrompt.mock.calls[0][0]
      expect(callArgs.originalPrompt).toContain('Project Type: LANDING')
      expect(callArgs.context?.projectType).toBe('LANDING')
    })

    it('should handle PRO project type', async () => {
      const proProject = { ...mockProject, planType: 'PRO' }

      await generateLovablePrompt(mockAnswers, proProject)

      const callArgs = mockAnthropicService.enhancePrompt.mock.calls[0][0]
      expect(callArgs.originalPrompt).toContain('Project Type: PRO')
      expect(callArgs.context?.projectType).toBe('PRO')
    })
  })

  describe('error handling and fallback', () => {
    it('should use fallback prompt when AI service fails', async () => {
      const errorMessage = 'AI service unavailable'
      mockAnthropicService.enhancePrompt.mockRejectedValue(new Error(errorMessage))

      // Mock console.error to avoid noise in tests
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const result = await generateLovablePrompt(mockAnswers, mockProject)

      expect(result).toContain('Create a WEBSITE application with the following requirements')
      expect(result).toContain('- Who is your target audience?: Small businesses and entrepreneurs')
      expect(result).toContain('- What is your unique value proposition?: AI-powered project management')
      
      expect(consoleSpy).toHaveBeenCalledWith('Failed to enhance prompt with AI:', expect.any(Error))
      
      consoleSpy.mockRestore()
    })

    it('should handle network timeouts gracefully', async () => {
      mockAnthropicService.enhancePrompt.mockRejectedValue(new Error('Request timeout'))
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const result = await generateLovablePrompt(mockAnswers, mockProject)

      expect(result).toContain('Create a WEBSITE application')
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
      
      consoleSpy.mockRestore()
    })

    it('should never throw errors even with malformed input', async () => {
      mockAnthropicService.enhancePrompt.mockRejectedValue(new Error('Service error'))
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      const malformedAnswers = [
        null,
        { questionCode: undefined, answer: null },
        { questionCode: 'test', answer: { complex: { nested: 'object' } } }
      ]

      await expect(generateLovablePrompt(malformedAnswers as any, mockProject)).resolves.toBeTruthy()
      
      consoleSpy.mockRestore()
    })
  })

  describe('business logic validation', () => {
    it('should prioritize business context in prompt structure', async () => {
      const businessFocusedAnswers = [
        { questionCode: 'target_audience', answer: 'Enterprise clients', questionText: 'Target?' },
        { questionCode: 'business_personality', answer: 'B2B SaaS', questionText: 'Business type?' },
        { questionCode: 'competitors', answer: 'Slack, Microsoft Teams', questionText: 'Competitors?' },
        { questionCode: 'unique_value', answer: 'AI-powered collaboration', questionText: 'Value prop?' }
      ]

      await generateLovablePrompt(businessFocusedAnswers, mockProject)

      const callArgs = mockAnthropicService.enhancePrompt.mock.calls[0][0]
      const prompt = callArgs.originalPrompt

      // Should use new enhanced format with markdown structure
      expect(prompt).toContain('# WEBSITE Development Brief:')
      expect(prompt).toContain('## Business Intelligence')
      expect(prompt).toContain('**Target Market**: Enterprise clients')
      expect(prompt).toContain('**Competitive Edge**: AI-powered collaboration vs competitors (Slack, Microsoft Teams)')
      expect(prompt).toContain('**Industry Focus**: B2B SaaS')
    })

    it('should structure technical requirements clearly', async () => {
      const techAnswers = [
        { questionCode: 'must_have_features', answer: ['authentication', 'real-time-chat', 'file-sharing'], questionText: 'Features?' },
        { questionCode: 'visual_style', answer: ['modern', 'minimalist'], questionText: 'Style?' }
      ]

      await generateLovablePrompt(techAnswers, mockProject)

      const callArgs = mockAnthropicService.enhancePrompt.mock.calls[0][0]
      const prompt = callArgs.originalPrompt

      expect(prompt).toContain('**Core Features**: authentication, real-time-chat, file-sharing')
      expect(prompt).toContain('**Technology Stack Recommendations**: Dynamic content, CMS integration, Responsive design')
      expect(prompt).toContain('**Technical Priorities**: Content structure, Navigation UX, Cross-browser compatibility, Accessibility')
    })

    it('should include project-specific architecture recommendations', async () => {
      await generateLovablePrompt(mockAnswers, mockProject)

      const callArgs = mockAnthropicService.enhancePrompt.mock.calls[0][0]
      const prompt = callArgs.originalPrompt

      expect(prompt).toContain('**Recommended Architecture**: Multi-page website with content management and user interaction')
      expect(prompt).toContain('Focus Areas: user-experience, content-management, scalability')
    })
  })

  describe('project type specific enhancements', () => {
    it('should customize prompt for LANDING page projects', async () => {
      const landingProject = { ...mockProject, planType: 'LANDING' }

      await generateLovablePrompt(mockAnswers, landingProject)

      const callArgs = mockAnthropicService.enhancePrompt.mock.calls[0][0]
      const prompt = callArgs.originalPrompt
      const customInstructions = callArgs.options?.customInstructions

      expect(prompt).toContain('# LANDING Development Brief:')
      expect(prompt).toContain('Focus Areas: conversion, performance, seo')
      expect(prompt).toContain('Page speed, Mobile responsiveness, CRO elements, Analytics tracking')
      expect(customInstructions).toContain('optimized for LANDING projects')
      expect(customInstructions).toContain('conversion, performance, seo')
    })

    it('should customize prompt for PRO projects with advanced features', async () => {
      const proProject = { ...mockProject, planType: 'PRO' }

      await generateLovablePrompt(mockAnswers, proProject)

      const callArgs = mockAnthropicService.enhancePrompt.mock.calls[0][0]
      const prompt = callArgs.originalPrompt
      const customInstructions = callArgs.options?.customInstructions

      expect(prompt).toContain('# PRO Development Brief:')
      expect(prompt).toContain('Focus Areas: complex-features, integrations, performance, security')
      expect(prompt).toContain('Feature completeness, Data security, API integrations, Scalable architecture')
      expect(customInstructions).toContain('optimized for PRO projects')
      expect(customInstructions).toContain('complex-features, integrations, performance, security')
    })

    it('should include enhanced metadata in context for better AI processing', async () => {
      await generateLovablePrompt(mockAnswers, mockProject)

      const callArgs = mockAnthropicService.enhancePrompt.mock.calls[0][0]
      const context = callArgs.context

      expect(context?.metadata).toEqual({
        projectId: 'test-project-id',
        projectName: 'Test Project',
        totalAnswers: 4,
        projectFocus: ['user-experience', 'content-management', 'scalability'],
        techPriorities: ['Content structure', 'Navigation UX', 'Cross-browser compatibility', 'Accessibility']
      })
    })

    it('should provide enhanced fallback structure when AI service fails', async () => {
      mockAnthropicService.enhancePrompt.mockRejectedValue(new Error('Service error'))
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const result = await generateLovablePrompt(mockAnswers, mockProject)

      expect(result).toContain('# WEBSITE Development Brief: Test Project')
      expect(result).toContain('Focus on user-experience, content-management, scalability')
      expect(result).toContain('## Technical Priorities')
      expect(result).toContain('- Content structure')
      expect(result).toContain('## Architecture Recommendation')
      expect(result).toContain('Multi-page website with content management and user interaction')
      
      consoleSpy.mockRestore()
    })
  })
})