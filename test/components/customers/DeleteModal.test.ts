import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import DeleteModal from '~/app/components/customers/DeleteModal.vue'

describe('CustomersDeleteModal', () => {
  let wrapper: ReturnType<typeof mount>

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Modal Open/Close State Tests
  it('does not show modal by default', () => {
    wrapper = mount(DeleteModal)
    const modal = wrapper.find('div[role="dialog"]')
    expect(modal.exists()).toBe(false)
  })

  // Prop and Dynamic Content Tests
  it('renders correct title based on number of customers', async () => {
    wrapper = mount(DeleteModal, {
      props: { count: 1 }
    })

    const triggerSlot = wrapper.find('button')
    await triggerSlot.trigger('click')

    const modalTitle = wrapper.find('[data-testid="modal-title"]')
    expect(modalTitle.text()).toContain('Delete 1 customer')
  })

  it('renders correct title for multiple customers', async () => {
    wrapper = mount(DeleteModal, {
      props: { count: 3 }
    })

    const triggerSlot = wrapper.find('button')
    await triggerSlot.trigger('click')

    const modalTitle = wrapper.find('[data-testid="modal-title"]')
    expect(modalTitle.text()).toContain('Delete 3 customers')
  })

  // Interaction and State Management Tests
  it('opens modal when trigger is clicked', async () => {
    wrapper = mount(DeleteModal)
    const triggerSlot = wrapper.find('button')
    await triggerSlot.trigger('click')

    const modal = wrapper.find('div[role="dialog"]')
    expect(modal.exists()).toBe(true)
  })

  it('closes modal when cancel button is clicked', async () => {
    wrapper = mount(DeleteModal, {
      props: { count: 2 }
    })

    const triggerSlot = wrapper.find('button')
    await triggerSlot.trigger('click')

    const cancelButton = wrapper.find('button[label="Cancel"]')
    await cancelButton.trigger('click')

    const modal = wrapper.find('div[role="dialog"]')
    expect(modal.exists()).toBe(false)
  })

  // Action and Submission Tests
  it('shows loading state on delete button when submitting', async () => {
    wrapper = mount(DeleteModal, {
      props: { count: 2 }
    })

    const triggerSlot = wrapper.find('button')
    await triggerSlot.trigger('click')

    const deleteButton = wrapper.find('button[label="Delete"]')
    await deleteButton.trigger('click')

    await nextTick()
    expect(deleteButton.attributes('data-loading')).toBe('true')
  })

  it('closes modal after successful submission', async () => {
    wrapper = mount(DeleteModal, {
      props: { count: 2 }
    })

    const triggerSlot = wrapper.find('button')
    await triggerSlot.trigger('click')

    const deleteButton = wrapper.find('button[label="Delete"]')
    await deleteButton.trigger('click')

    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 1100))

    const modal = wrapper.find('div[role="dialog"]')
    expect(modal.exists()).toBe(false)
  })

  // Accessibility Tests
  it('has proper ARIA attributes', async () => {
    wrapper = mount(DeleteModal, {
      props: { count: 2 }
    })

    const triggerSlot = wrapper.find('button')
    await triggerSlot.trigger('click')

    const modal = wrapper.find('div[role="dialog"]')
    expect(modal.attributes('aria-modal')).toBe('true')
    expect(modal.attributes('role')).toBe('dialog')
  })

  // Error Handling and Edge Cases
  it('handles zero count gracefully', () => {
    wrapper = mount(DeleteModal, {
      props: { count: 0 }
    })

    const triggerSlot = wrapper.find('button')
    expect(triggerSlot.text()).toContain('0')
  })
})