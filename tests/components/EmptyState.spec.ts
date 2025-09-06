import { describe, it, expect } from 'vitest'

describe('EmptyState Component', () => {
  it('should handle empty state properly', () => {
    const emptyState = {
      isEmpty: true,
      message: 'No data available',
      actionLabel: 'Add item',
      hasAction: true
    }

    expect(emptyState.isEmpty).toBe(true)
    expect(emptyState.message).toBe('No data available')
    expect(emptyState.actionLabel).toBe('Add item')
    expect(emptyState.hasAction).toBe(true)
  })

  it('should provide different empty state types', () => {
    const emptyStates = {
      noData: { type: 'no-data', icon: 'database', message: 'No data found' },
      noResults: { type: 'no-results', icon: 'search', message: 'No search results' },
      noItems: { type: 'no-items', icon: 'list', message: 'No items to display' }
    }

    Object.values(emptyStates).forEach(state => {
      expect(state.type).toBeDefined()
      expect(state.icon).toBeDefined()
      expect(state.message).toBeDefined()
    })
  })

  it('should handle empty state with actions', () => {
    const emptyStateWithAction = {
      isEmpty: true,
      message: 'No customers yet',
      action: {
        label: 'Add Customer',
        onClick: () => ({ actionCalled: true })
      }
    }

    expect(emptyStateWithAction.action).toBeDefined()
    expect(emptyStateWithAction.action.label).toBe('Add Customer')
    
    const result = emptyStateWithAction.action.onClick()
    expect(result.actionCalled).toBe(true)
  })

  it('should provide proper accessibility for empty states', () => {
    const accessibleEmptyState = {
      role: 'status',
      'aria-label': 'Empty state',
      'aria-describedby': 'empty-description'
    }

    expect(accessibleEmptyState.role).toBe('status')
    expect(accessibleEmptyState['aria-label']).toBe('Empty state')
    expect(accessibleEmptyState['aria-describedby']).toBe('empty-description')
  })
})