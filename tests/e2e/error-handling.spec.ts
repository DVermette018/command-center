import { test, expect } from '@playwright/test'

// Global error handling and UX polish E2E tests
test.describe('Error Handling and UX Polish E2E Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Setup for each test
    await page.goto('/dashboard')
    
    // Mock API responses for consistent testing
    await page.route('/api/trpc/customers.getAll', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          result: {
            data: [
              { id: '1', name: 'Test Customer', email: 'test@example.com' }
            ]
          }
        })
      })
    })
  })

  test.describe('Global Error Boundary', () => {
    test('should catch and display JavaScript errors gracefully', async ({ page }) => {
      // Inject a JavaScript error
      await page.evaluate(() => {
        // Trigger an error in a component
        setTimeout(() => {
          throw new Error('Test error for error boundary')
        }, 100)
      })

      // Wait for error boundary to appear
      const errorBoundary = page.locator('[data-testid="error-boundary"]')
      await expect(errorBoundary).toBeVisible()
      
      // Should show user-friendly error message
      await expect(errorBoundary).toContainText('Something went wrong')
      
      // Should provide retry functionality
      const retryButton = page.locator('[data-testid="retry-button"]')
      await expect(retryButton).toBeVisible()
      
      // Retry should work
      await retryButton.click()
      await expect(errorBoundary).not.toBeVisible()
    })

    test('should handle async component errors', async ({ page }) => {
      // Navigate to a page with async components
      await page.goto('/customers')
      
      // Mock async component failure
      await page.route('/api/trpc/customers.getAll', (route) => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' })
        })
      })

      // Refresh to trigger the error
      await page.reload()

      // Error boundary should catch async errors
      const errorState = page.locator('[data-testid="error-state"]')
      await expect(errorState).toBeVisible()
      await expect(errorState).toContainText('Failed to load')
    })
  })

  test.describe('TRPC Error Handling', () => {
    test('should handle validation errors with appropriate UI feedback', async ({ page }) => {
      await page.goto('/customers/new')

      // Mock validation error response
      await page.route('/api/trpc/customers.create', (route) => {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: {
              code: 'BAD_REQUEST',
              message: 'Email is required'
            }
          })
        })
      })

      // Fill form with invalid data and submit
      await page.fill('[data-testid="name-input"]', 'Test Customer')
      await page.click('[data-testid="submit-button"]')

      // Should show validation error in toast
      const toast = page.locator('[data-testid="toast-error"]')
      await expect(toast).toBeVisible()
      await expect(toast).toContainText('Email is required')

      // Should highlight the invalid field
      const emailField = page.locator('[data-testid="email-input"]')
      await expect(emailField).toHaveClass(/field-invalid/)
    })

    test('should handle server errors with retry functionality', async ({ page }) => {
      await page.goto('/customers')

      // Mock server error
      await page.route('/api/trpc/customers.getAll', (route) => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: {
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Database connection failed'
            }
          })
        })
      })

      await page.reload()

      // Should show error toast with retry option
      const errorToast = page.locator('[data-testid="toast-error"]')
      await expect(errorToast).toBeVisible()
      await expect(errorToast).toContainText('Something went wrong')

      const retryButton = errorToast.locator('[data-testid="retry-action"]')
      await expect(retryButton).toBeVisible()

      // Mock successful retry
      await page.route('/api/trpc/customers.getAll', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            result: { data: [] }
          })
        })
      })

      await retryButton.click()

      // Should clear error and show success
      await expect(errorToast).not.toBeVisible()
    })

    test('should handle network errors appropriately', async ({ page }) => {
      await page.goto('/customers')

      // Simulate network failure
      await page.route('/api/trpc/customers.getAll', (route) => {
        route.abort('failed')
      })

      await page.reload()

      // Should show network error message
      const networkError = page.locator('[data-testid="network-error"]')
      await expect(networkError).toBeVisible()
      await expect(networkError).toContainText('connection')
    })
  })

  test.describe('Loading States and Skeletons', () => {
    test('should show loading skeleton during data fetch', async ({ page }) => {
      await page.goto('/customers')

      // Mock slow API response
      await page.route('/api/trpc/customers.getAll', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 2000))
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ result: { data: [] } })
        })
      })

      await page.reload()

      // Should show skeleton while loading
      const skeleton = page.locator('[data-testid="loading-skeleton"]')
      await expect(skeleton).toBeVisible()

      // Should have proper skeleton structure
      const skeletonLines = skeleton.locator('[data-testid="skeleton-line"]')
      await expect(skeletonLines).toHaveCount(3)

      // Wait for data to load
      await expect(skeleton).not.toBeVisible({ timeout: 3000 })
    })

    test('should show appropriate loading states for different operations', async ({ page }) => {
      await page.goto('/customers/new')

      // Mock slow form submission
      await page.route('/api/trpc/customers.create', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 1000))
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ result: { data: { id: '1' } } })
        })
      })

      // Fill and submit form
      await page.fill('[data-testid="name-input"]', 'Test Customer')
      await page.fill('[data-testid="email-input"]', 'test@example.com')
      
      const submitButton = page.locator('[data-testid="submit-button"]')
      await submitButton.click()

      // Should show loading state on button
      await expect(submitButton).toHaveAttribute('disabled')
      await expect(submitButton.locator('[data-testid="loading-spinner"]')).toBeVisible()
      
      // Should clear loading state after completion
      await expect(submitButton).not.toHaveAttribute('disabled', { timeout: 2000 })
    })
  })

  test.describe('Toast Notifications', () => {
    test('should display and auto-dismiss success notifications', async ({ page }) => {
      await page.goto('/customers/new')

      // Mock successful creation
      await page.route('/api/trpc/customers.create', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            result: { data: { id: '1', name: 'Test Customer' } }
          })
        })
      })

      // Submit form
      await page.fill('[data-testid="name-input"]', 'Test Customer')
      await page.fill('[data-testid="email-input"]', 'test@example.com')
      await page.click('[data-testid="submit-button"]')

      // Should show success toast
      const successToast = page.locator('[data-testid="toast-success"]')
      await expect(successToast).toBeVisible()
      await expect(successToast).toContainText('Customer created')

      // Should auto-dismiss after timeout
      await expect(successToast).not.toBeVisible({ timeout: 4000 })
    })

    test('should allow manual dismissal of notifications', async ({ page }) => {
      await page.goto('/customers')

      // Trigger an error notification
      await page.route('/api/trpc/customers.getAll', (route) => {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: { message: 'Test error' } })
        })
      })

      await page.reload()

      const errorToast = page.locator('[data-testid="toast-error"]')
      await expect(errorToast).toBeVisible()

      // Should have dismiss button
      const dismissButton = errorToast.locator('[data-testid="dismiss-button"]')
      await expect(dismissButton).toBeVisible()

      await dismissButton.click()
      await expect(errorToast).not.toBeVisible()
    })

    test('should stack multiple notifications', async ({ page }) => {
      await page.goto('/customers')

      // Trigger multiple notifications
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: { type: 'info', message: 'First notification' }
        }))
        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: { type: 'warning', message: 'Second notification' }
        }))
      })

      const toasts = page.locator('[data-testid^="toast-"]')
      await expect(toasts).toHaveCount(2)

      // Should be stacked vertically
      const firstToast = toasts.first()
      const secondToast = toasts.last()

      const firstRect = await firstToast.boundingBox()
      const secondRect = await secondToast.boundingBox()

      expect(firstRect!.y).toBeLessThan(secondRect!.y)
    })
  })

  test.describe('Confirmation Dialogs', () => {
    test('should show confirmation for destructive actions', async ({ page }) => {
      await page.goto('/customers')

      // Click delete button for a customer
      const deleteButton = page.locator('[data-testid="delete-customer-1"]')
      await deleteButton.click()

      // Should show confirmation dialog
      const confirmDialog = page.locator('[data-testid="confirmation-dialog"]')
      await expect(confirmDialog).toBeVisible()
      await expect(confirmDialog).toContainText('Are you sure')

      // Should have cancel and confirm buttons
      const cancelButton = confirmDialog.locator('[data-testid="cancel-button"]')
      const confirmButton = confirmDialog.locator('[data-testid="confirm-button"]')

      await expect(cancelButton).toBeVisible()
      await expect(confirmButton).toBeVisible()

      // Cancel should close dialog
      await cancelButton.click()
      await expect(confirmDialog).not.toBeVisible()
    })

    test('should require text confirmation for critical actions', async ({ page }) => {
      await page.goto('/customers/1')

      // Click permanent delete button
      const deleteButton = page.locator('[data-testid="permanent-delete"]')
      await deleteButton.click()

      const confirmDialog = page.locator('[data-testid="confirmation-dialog"]')
      await expect(confirmDialog).toBeVisible()

      // Should have text input for confirmation
      const confirmInput = confirmDialog.locator('[data-testid="confirmation-input"]')
      await expect(confirmInput).toBeVisible()

      const confirmButton = confirmDialog.locator('[data-testid="confirm-button"]')
      await expect(confirmButton).toBeDisabled()

      // Type correct confirmation text
      await confirmInput.fill('DELETE')
      await expect(confirmButton).not.toBeDisabled()
    })

    test('should handle keyboard navigation in dialogs', async ({ page }) => {
      await page.goto('/customers')

      const deleteButton = page.locator('[data-testid="delete-customer-1"]')
      await deleteButton.click()

      const confirmDialog = page.locator('[data-testid="confirmation-dialog"]')
      await expect(confirmDialog).toBeVisible()

      // Focus should be on cancel button (safe default)
      const cancelButton = confirmDialog.locator('[data-testid="cancel-button"]')
      await expect(cancelButton).toBeFocused()

      // Tab should move to confirm button
      await page.keyboard.press('Tab')
      const confirmButton = confirmDialog.locator('[data-testid="confirm-button"]')
      await expect(confirmButton).toBeFocused()

      // Escape should close dialog
      await page.keyboard.press('Escape')
      await expect(confirmDialog).not.toBeVisible()
    })
  })

  test.describe('Form Validation', () => {
    test('should show real-time validation feedback', async ({ page }) => {
      await page.goto('/customers/new')

      const emailInput = page.locator('[data-testid="email-input"]')
      
      // Type invalid email
      await emailInput.fill('invalid-email')
      await emailInput.blur()

      // Should show validation error
      const errorMessage = page.locator('[data-testid="email-error"]')
      await expect(errorMessage).toBeVisible()
      await expect(errorMessage).toContainText('valid email')

      // Should highlight field as invalid
      await expect(emailInput).toHaveClass(/field-invalid/)

      // Type valid email
      await emailInput.fill('valid@email.com')
      await emailInput.blur()

      // Should clear error and show valid state
      await expect(errorMessage).not.toBeVisible()
      await expect(emailInput).toHaveClass(/field-valid/)
    })

    test('should prevent submission with validation errors', async ({ page }) => {
      await page.goto('/customers/new')

      // Try to submit empty form
      const submitButton = page.locator('[data-testid="submit-button"]')
      await submitButton.click()

      // Should show validation errors
      const nameError = page.locator('[data-testid="name-error"]')
      const emailError = page.locator('[data-testid="email-error"]')

      await expect(nameError).toBeVisible()
      await expect(emailError).toBeVisible()

      // Form should not be submitted
      await expect(page).toHaveURL(/\/customers\/new/)
    })

    test('should handle server-side validation errors', async ({ page }) => {
      await page.goto('/customers/new')

      // Mock server validation error
      await page.route('/api/trpc/customers.create', (route) => {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: {
              code: 'BAD_REQUEST',
              message: 'Email already exists',
              cause: { field: 'email' }
            }
          })
        })
      })

      // Fill and submit form
      await page.fill('[data-testid="name-input"]', 'Test Customer')
      await page.fill('[data-testid="email-input"]', 'existing@email.com')
      await page.click('[data-testid="submit-button"]')

      // Should show server error on specific field
      const emailError = page.locator('[data-testid="email-error"]')
      await expect(emailError).toBeVisible()
      await expect(emailError).toContainText('already exists')
    })
  })

  test.describe('Empty States', () => {
    test('should show empty state when no data exists', async ({ page }) => {
      await page.goto('/customers')

      // Mock empty response
      await page.route('/api/trpc/customers.getAll', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ result: { data: [] } })
        })
      })

      await page.reload()

      // Should show empty state
      const emptyState = page.locator('[data-testid="empty-state"]')
      await expect(emptyState).toBeVisible()
      await expect(emptyState).toContainText('No customers found')

      // Should have action button
      const createButton = emptyState.locator('[data-testid="primary-action"]')
      await expect(createButton).toBeVisible()
      await expect(createButton).toContainText('Add Customer')
    })

    test('should show search empty state with clear action', async ({ page }) => {
      await page.goto('/customers')

      // Perform search with no results
      const searchInput = page.locator('[data-testid="search-input"]')
      await searchInput.fill('nonexistent customer')
      await page.keyboard.press('Enter')

      // Mock empty search results
      await page.route('/api/trpc/customers.getAll*', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ result: { data: [] } })
        })
      })

      // Should show search empty state
      const searchEmpty = page.locator('[data-testid="search-empty"]')
      await expect(searchEmpty).toBeVisible()
      await expect(searchEmpty).toContainText('No results found')
      await expect(searchEmpty).toContainText('nonexistent customer')

      // Should have clear search action
      const clearSearch = page.locator('[data-testid="clear-search"]')
      await expect(clearSearch).toBeVisible()

      await clearSearch.click()
      await expect(searchInput).toHaveValue('')
    })
  })

  test.describe('Accessibility Features', () => {
    test('should maintain focus management in modals', async ({ page }) => {
      await page.goto('/customers')

      // Open modal
      const addButton = page.locator('[data-testid="add-customer"]')
      await addButton.click()

      const modal = page.locator('[data-testid="customer-modal"]')
      await expect(modal).toBeVisible()

      // Focus should be trapped in modal
      const firstInput = modal.locator('input').first()
      await expect(firstInput).toBeFocused()

      // Tab should cycle through modal elements only
      await page.keyboard.press('Tab')
      const secondInput = modal.locator('input').nth(1)
      await expect(secondInput).toBeFocused()

      // Escape should close modal and restore focus
      await page.keyboard.press('Escape')
      await expect(modal).not.toBeVisible()
      await expect(addButton).toBeFocused()
    })

    test('should provide keyboard navigation for interactive elements', async ({ page }) => {
      await page.goto('/customers')

      // Use keyboard to navigate table
      const firstRow = page.locator('[data-testid="customer-row"]').first()
      await firstRow.focus()

      // Arrow keys should navigate between rows
      await page.keyboard.press('ArrowDown')
      const secondRow = page.locator('[data-testid="customer-row"]').nth(1)
      await expect(secondRow).toBeFocused()

      // Enter should activate action
      await page.keyboard.press('Enter')
      await expect(page).toHaveURL(/\/customers\/\d+/)
    })

    test('should announce important changes to screen readers', async ({ page }) => {
      await page.goto('/customers/new')

      // Fill form and submit
      await page.fill('[data-testid="name-input"]', 'Test Customer')
      await page.fill('[data-testid="email-input"]', 'test@example.com')

      // Mock successful submission
      await page.route('/api/trpc/customers.create', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            result: { data: { id: '1', name: 'Test Customer' } }
          })
        })
      })

      await page.click('[data-testid="submit-button"]')

      // Should have live region announcement
      const liveRegion = page.locator('[aria-live="assertive"]')
      await expect(liveRegion).toHaveText(/customer.*created/i)
    })

    test('should work with reduced motion preferences', async ({ page }) => {
      // Set reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' })
      
      await page.goto('/customers')

      // Open modal (animations should be minimal/instant)
      const addButton = page.locator('[data-testid="add-customer"]')
      await addButton.click()

      const modal = page.locator('[data-testid="customer-modal"]')
      
      // Modal should appear without animation delays
      await expect(modal).toBeVisible()
      
      // Transitions should be instant or very short
      const modalStyles = await modal.evaluate(el => 
        getComputedStyle(el).transitionDuration
      )
      
      expect(modalStyles).toMatch(/^0s|^0\.0\d+s/)
    })
  })

  test.describe('Network Error Handling', () => {
    test('should show offline indicator when network is unavailable', async ({ page }) => {
      await page.goto('/customers')

      // Simulate offline state
      await page.context().setOffline(true)

      // Try to perform an action that requires network
      const refreshButton = page.locator('[data-testid="refresh-data"]')
      await refreshButton.click()

      // Should show offline indicator
      const offlineIndicator = page.locator('[data-testid="offline-indicator"]')
      await expect(offlineIndicator).toBeVisible()
      await expect(offlineIndicator).toContainText('offline')

      // Go back online
      await page.context().setOffline(false)

      // Should hide offline indicator
      await expect(offlineIndicator).not.toBeVisible({ timeout: 5000 })
    })

    test('should retry failed operations when connection is restored', async ({ page }) => {
      await page.goto('/customers/new')

      // Fill form
      await page.fill('[data-testid="name-input"]', 'Test Customer')
      await page.fill('[data-testid="email-input"]', 'test@example.com')

      // Simulate network failure during submission
      await page.context().setOffline(true)

      const submitButton = page.locator('[data-testid="submit-button"]')
      await submitButton.click()

      // Should show network error
      const networkError = page.locator('[data-testid="network-error"]')
      await expect(networkError).toBeVisible()

      // Should have retry button
      const retryButton = networkError.locator('[data-testid="retry-button"]')
      await expect(retryButton).toBeVisible()

      // Go back online and retry
      await page.context().setOffline(false)

      // Mock successful retry
      await page.route('/api/trpc/customers.create', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            result: { data: { id: '1', name: 'Test Customer' } }
          })
        })
      })

      await retryButton.click()

      // Should succeed and navigate away
      await expect(page).toHaveURL(/\/customers\/1/)
    })
  })

  test.describe('Performance and Loading', () => {
    test('should show loading states for slow operations', async ({ page }) => {
      // Set slow network conditions
      await page.route('**/*', (route) => {
        setTimeout(() => route.continue(), 1000)
      })

      await page.goto('/customers')

      // Should show loading indicator during navigation
      const loadingIndicator = page.locator('[data-testid="page-loading"]')
      await expect(loadingIndicator).toBeVisible()

      // Should hide after loading completes
      await expect(loadingIndicator).not.toBeVisible({ timeout: 3000 })
    })

    test('should handle large datasets efficiently', async ({ page }) => {
      await page.goto('/customers')

      // Mock large dataset
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: String(i + 1),
        name: `Customer ${i + 1}`,
        email: `customer${i + 1}@example.com`
      }))

      await page.route('/api/trpc/customers.getAll', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ result: { data: largeDataset } })
        })
      })

      await page.reload()

      // Should render efficiently (virtual scrolling)
      const customerTable = page.locator('[data-testid="customers-table"]')
      await expect(customerTable).toBeVisible()

      // Should only render visible rows
      const visibleRows = customerTable.locator('[data-testid="customer-row"]')
      const rowCount = await visibleRows.count()
      
      // Should be significantly less than total dataset
      expect(rowCount).toBeLessThan(100)
      expect(rowCount).toBeGreaterThan(0)
    })
  })
})