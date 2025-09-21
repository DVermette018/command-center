import { describe, it, expect } from 'vitest'
import { createMockProject } from './factories'

describe('Factory Date Range Fix', () => {
  it('should generate projects without date range errors', () => {
    // Generate multiple projects to test different scenarios
    const projects = Array.from({ length: 20 }, () => createMockProject())
    
    projects.forEach((project, index) => {
      // Verify startDate exists and is valid
      expect(project.startDate).toBeInstanceOf(Date)
      expect(project.targetEndDate).toBeInstanceOf(Date)
      
      // Verify targetEndDate is after startDate
      expect(project.targetEndDate.getTime()).toBeGreaterThan(project.startDate.getTime())
      
      if (project.actualEndDate) {
        // If actualEndDate exists, it should be between startDate and targetEndDate
        expect(project.actualEndDate).toBeInstanceOf(Date)
        expect(project.actualEndDate.getTime()).toBeGreaterThanOrEqual(project.startDate.getTime())
        expect(project.actualEndDate.getTime()).toBeLessThanOrEqual(project.targetEndDate.getTime())
      }
    })
    
    // Should have some projects with actualEndDate (completed) and some without
    const completedProjects = projects.filter(p => p.actualEndDate)
    const ongoingProjects = projects.filter(p => !p.actualEndDate)
    
    expect(completedProjects.length).toBeGreaterThan(0)
    expect(ongoingProjects.length).toBeGreaterThan(0)
  })
  
  it('should handle overrides correctly', () => {
    const fixedStartDate = new Date('2023-01-01')
    const fixedTargetEndDate = new Date('2023-06-01')
    
    const project = createMockProject({
      startDate: fixedStartDate,
      targetEndDate: fixedTargetEndDate,
      actualEndDate: new Date('2023-03-15')
    })
    
    expect(project.startDate).toEqual(fixedStartDate)
    expect(project.targetEndDate).toEqual(fixedTargetEndDate)
    expect(project.actualEndDate).toEqual(new Date('2023-03-15'))
  })
})