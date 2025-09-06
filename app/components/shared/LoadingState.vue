<template>
  <div class="loading-state-container" :class="containerClasses">
    <!-- Loading State -->
    <div v-if="loading" class="loading-wrapper" :class="wrapperClasses">
      <!-- Spinner Loading -->
      <div v-if="type === 'spinner'" 
           data-testid="loading-spinner"
           class="loading-spinner"
           :class="spinnerClasses"
           role="status"
           :aria-busy="true"
           :aria-label="ariaLabel">
        <UIcon 
          name="lucide:loader-2" 
          :class="iconClasses"
          class="animate-spin" 
        />
        <span v-if="message" class="loading-message">{{ message }}</span>
        <span v-else class="loading-message">{{ defaultMessage }}</span>
      </div>

      <!-- Skeleton Loading -->
      <div v-else-if="type === 'skeleton'" 
           data-testid="loading-skeleton"
           class="loading-skeleton"
           role="status"
           :aria-busy="true"
           :aria-label="ariaLabel">
        <LoadingSkeleton 
          :type="skeletonType" 
          :count="skeletonCount"
          :animate="true"
        />
      </div>

      <!-- Dots Loading -->
      <div v-else-if="type === 'dots'" 
           data-testid="loading-dots"
           class="loading-dots"
           role="status"
           :aria-busy="true"
           :aria-label="ariaLabel">
        <span class="loading-dot"></span>
        <span class="loading-dot"></span>
        <span class="loading-dot"></span>
        <span v-if="message" class="loading-message ml-2">{{ message }}</span>
      </div>

      <!-- Progress Loading -->
      <div v-else-if="type === 'progress'" 
           data-testid="loading-progress"
           class="loading-progress"
           role="progressbar"
           :aria-valuenow="progress"
           :aria-valuemin="0"
           :aria-valuemax="100"
           :aria-label="ariaLabel">
        <UProgress :value="progress" :max="100" />
        <span v-if="message" class="loading-message mt-2">{{ message }}</span>
      </div>
    </div>

    <!-- Content (shown when not loading or in overlay mode) -->
    <div v-if="!loading || overlay" 
         class="content-wrapper"
         :class="{ 'opacity-50 pointer-events-none': loading && overlay }"
         :aria-busy="loading && overlay">
      <slot />
    </div>

    <!-- Overlay Loading -->
    <div v-if="loading && overlay" 
         class="loading-overlay"
         :class="overlayClasses"
         data-testid="loading-overlay">
      <div class="overlay-content">
        <div v-if="type === 'spinner'" class="overlay-spinner">
          <UIcon 
            name="lucide:loader-2" 
            :class="iconClasses"
            class="animate-spin" 
          />
        </div>
        <span v-if="message" class="overlay-message">{{ message }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import LoadingSkeleton from './LoadingSkeleton.vue'

export interface LoadingStateProps {
  loading: boolean
  type?: 'spinner' | 'skeleton' | 'dots' | 'progress'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  message?: string
  overlay?: boolean
  progress?: number
  skeletonType?: 'text' | 'card' | 'table' | 'list'
  skeletonCount?: number
  inline?: boolean
  center?: boolean
  fullHeight?: boolean
  delay?: number
}

const props = withDefaults(defineProps<LoadingStateProps>(), {
  type: 'spinner',
  size: 'md',
  overlay: false,
  progress: 0,
  skeletonType: 'text',
  skeletonCount: 3,
  inline: false,
  center: true,
  fullHeight: false,
  delay: 0
})

const defaultMessage = computed(() => {
  switch (props.type) {
    case 'skeleton':
      return ''
    case 'progress':
      return 'Processing...'
    default:
      return 'Loading...'
  }
})

const ariaLabel = computed(() => {
  return props.message || defaultMessage.value || 'Loading content'
})

const containerClasses = computed(() => ({
  'relative': true,
  'inline-block': props.inline,
  'w-full': !props.inline,
  'min-h-screen': props.fullHeight && !props.inline,
  'min-h-[200px]': !props.fullHeight && !props.inline && props.loading
}))

const wrapperClasses = computed(() => ({
  'flex items-center justify-center': props.center && !props.inline,
  'inline-flex items-center': props.inline,
  'p-4': !props.inline,
  'h-full': props.fullHeight && !props.inline
}))

const spinnerClasses = computed(() => ({
  'flex flex-col items-center gap-2': !props.inline && props.message,
  'flex items-center gap-2': props.inline
}))

const iconClasses = computed(() => {
  const sizes = {
    xs: 'w-4 h-4',
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-10 h-10'
  }
  return sizes[props.size]
})

const overlayClasses = computed(() => ({
  'absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm': true,
  'z-50 flex items-center justify-center': true
}))
</script>

<style scoped>
.loading-dots {
  @apply flex items-center gap-1;
}

.loading-dot {
  @apply w-2 h-2 bg-gray-600 dark:bg-gray-400 rounded-full;
  animation: dot-pulse 1.4s infinite ease-in-out both;
}

.loading-dot:nth-child(1) {
  animation-delay: -0.32s;
}

.loading-dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes dot-pulse {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.loading-message {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.overlay-message {
  @apply mt-2 text-sm text-gray-700 dark:text-gray-300 font-medium;
}

.overlay-content {
  @apply flex flex-col items-center;
}

.overlay-spinner {
  @apply text-primary-500;
}
</style>