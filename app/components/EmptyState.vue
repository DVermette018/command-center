<template>
  <div 
    class="empty-state"
    :class="variantClasses"
    data-testid="empty-state">
    
    <!-- Icon -->
    <div 
      v-if="showIcon"
      class="empty-icon-wrapper"
      data-testid="empty-icon">
      <component
        :is="iconComponent"
        :class="iconClasses"
        v-bind="iconProps"
      />
    </div>
    
    <!-- Title -->
    <h3 class="empty-title">
      {{ title }}
    </h3>
    
    <!-- Description -->
    <p 
      v-if="description"
      class="empty-description">
      {{ description }}
    </p>
    
    <!-- Actions -->
    <div 
      v-if="hasActions"
      class="empty-actions"
      data-testid="empty-actions">
      
      <!-- Primary Action -->
      <button
        v-if="primaryAction"
        @click="handlePrimaryAction"
        class="empty-action-button primary"
        :disabled="primaryAction.disabled"
        data-testid="primary-action">
        <component
          v-if="primaryAction.icon"
          :is="getIconComponent(primaryAction.icon)"
          class="action-icon"
        />
        {{ primaryAction.label }}
      </button>
      
      <!-- Secondary Action -->
      <button
        v-if="secondaryAction"
        @click="handleSecondaryAction"
        class="empty-action-button secondary"
        :disabled="secondaryAction.disabled"
        data-testid="secondary-action">
        <component
          v-if="secondaryAction.icon"
          :is="getIconComponent(secondaryAction.icon)"
          class="action-icon"
        />
        {{ secondaryAction.label }}
      </button>
      
      <!-- Custom Actions Slot -->
      <slot name="actions" />
    </div>
    
    <!-- Custom Content Slot -->
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed, h } from 'vue'

export interface EmptyStateAction {
  label: string
  icon?: string
  disabled?: boolean
  onClick?: () => void | Promise<void>
}

export interface EmptyStateProps {
  title?: string
  description?: string
  icon?: string
  showIcon?: boolean
  variant?: 'default' | 'compact' | 'large' | 'inline'
  primaryAction?: EmptyStateAction
  secondaryAction?: EmptyStateAction
}

const props = withDefaults(defineProps<EmptyStateProps>(), {
  title: 'No data available',
  showIcon: true,
  variant: 'default',
  icon: 'i-lucide-inbox'
})

const emit = defineEmits<{
  'primary-action': []
  'secondary-action': []
}>()

// Computed
const hasActions = computed(() => {
  return props.primaryAction || props.secondaryAction
})

const variantClasses = computed(() => ({
  'empty-default': props.variant === 'default',
  'empty-compact': props.variant === 'compact',
  'empty-large': props.variant === 'large',
  'empty-inline': props.variant === 'inline'
}))

const iconClasses = computed(() => {
  const baseClasses = ['empty-icon']
  
  if (props.icon) {
    baseClasses.push(props.icon)
  }
  
  switch (props.variant) {
    case 'compact':
      baseClasses.push('w-8', 'h-8')
      break
    case 'large':
      baseClasses.push('w-16', 'h-16')
      break
    case 'inline':
      baseClasses.push('w-5', 'h-5')
      break
    default:
      baseClasses.push('w-12', 'h-12')
  }
  
  return baseClasses.join(' ')
})

const iconProps = computed(() => ({
  'aria-hidden': 'true'
}))

// Create icon component
const iconComponent = computed(() => {
  // For testing purposes, we'll use a simple SVG
  // In production, this would use the actual icon library
  return h('svg', {
    class: iconClasses.value,
    xmlns: 'http://www.w3.org/2000/svg',
    fill: 'none',
    viewBox: '0 0 24 24',
    stroke: 'currentColor'
  }, [
    h('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': 2,
      d: getIconPath()
    })
  ])
})

const getIconComponent = (iconName: string) => {
  return h('svg', {
    class: 'action-icon',
    xmlns: 'http://www.w3.org/2000/svg',
    fill: 'none',
    viewBox: '0 0 20 20',
    stroke: 'currentColor'
  }, [
    h('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': 2,
      d: 'M12 6v6m0 0v6m0-6h6m-6 0H6'
    })
  ])
}

const getIconPath = () => {
  // Return different paths based on icon prop
  switch (props.icon) {
    case 'i-lucide-users':
      return 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75'
    case 'i-lucide-search':
      return 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
    case 'i-lucide-file':
      return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
    default:
      // Default inbox icon
      return 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4'
  }
}

// Methods
const handlePrimaryAction = async () => {
  if (props.primaryAction?.onClick) {
    await props.primaryAction.onClick()
  }
  emit('primary-action')
}

const handleSecondaryAction = async () => {
  if (props.secondaryAction?.onClick) {
    await props.secondaryAction.onClick()
  }
  emit('secondary-action')
}
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
}

/* Variants */
.empty-default {
  min-height: 20rem;
}

.empty-compact {
  min-height: 10rem;
  padding: 1rem;
}

.empty-large {
  min-height: 30rem;
  padding: 3rem;
}

.empty-inline {
  min-height: auto;
  padding: 0.5rem;
  flex-direction: row;
  gap: 0.75rem;
  text-align: left;
}

/* Icon */
.empty-icon-wrapper {
  margin-bottom: 1rem;
}

.empty-inline .empty-icon-wrapper {
  margin-bottom: 0;
}

.empty-icon {
  color: #9ca3af;
}

/* Title */
.empty-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.empty-compact .empty-title {
  font-size: 1rem;
}

.empty-large .empty-title {
  font-size: 1.5rem;
}

.empty-inline .empty-title {
  font-size: 0.875rem;
}

/* Description */
.empty-description {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
  max-width: 24rem;
}

.empty-compact .empty-description {
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

.empty-large .empty-description {
  font-size: 1rem;
  max-width: 32rem;
}

.empty-inline .empty-description {
  font-size: 0.75rem;
  margin-top: 0;
}

/* Actions */
.empty-actions {
  margin-top: 1.5rem;
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: center;
}

.empty-compact .empty-actions {
  margin-top: 1rem;
  gap: 0.5rem;
}

.empty-large .empty-actions {
  margin-top: 2rem;
  gap: 1rem;
}

.empty-inline .empty-actions {
  margin-top: 0;
  margin-left: auto;
  flex-wrap: nowrap;
}

/* Action Buttons */
.empty-action-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  border: 1px solid transparent;
}

.empty-action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.empty-action-button.primary {
  background-color: #3b82f6;
  color: white;
}

.empty-action-button.primary:hover:not(:disabled) {
  background-color: #2563eb;
}

.empty-action-button.primary:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

.empty-action-button.secondary {
  background-color: white;
  color: #374151;
  border-color: #d1d5db;
}

.empty-action-button.secondary:hover:not(:disabled) {
  background-color: #f9fafb;
}

.empty-action-button.secondary:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(156, 163, 175, 0.2);
}

.action-icon {
  width: 1rem;
  height: 1rem;
}

/* Size utilities */
.w-5 { width: 1.25rem; }
.h-5 { height: 1.25rem; }
.w-8 { width: 2rem; }
.h-8 { height: 2rem; }
.w-12 { width: 3rem; }
.h-12 { height: 3rem; }
.w-16 { width: 4rem; }
.h-16 { height: 4rem; }

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .empty-title {
    color: #f3f4f6;
  }
  
  .empty-description {
    color: #9ca3af;
  }
  
  .empty-icon {
    color: #6b7280;
  }
  
  .empty-action-button.secondary {
    background-color: #374151;
    color: #f3f4f6;
    border-color: #4b5563;
  }
  
  .empty-action-button.secondary:hover:not(:disabled) {
    background-color: #4b5563;
  }
}
</style>