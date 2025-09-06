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
        <svg 
          :class="[iconClasses, 'animate-spin']"
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24">
          <circle 
            class="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            stroke-width="4">
          </circle>
          <path 
            class="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
          </path>
        </svg>
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
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
        </div>
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
          <svg 
            :class="[iconClasses, 'animate-spin']"
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24">
            <circle 
              class="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              stroke-width="4">
            </circle>
            <path 
              class="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
            </path>
          </svg>
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
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

.loading-dots {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.loading-dot {
  width: 0.5rem;
  height: 0.5rem;
  background-color: rgb(75 85 99);
  border-radius: 9999px;
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
  font-size: 0.875rem;
  color: rgb(75 85 99);
}

.overlay-message {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: rgb(55 65 81);
  font-weight: 500;
}

.overlay-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.overlay-spinner {
  color: rgb(59 130 246);
}

.progress-bar {
  width: 100%;
  height: 0.5rem;
  background-color: rgb(229 231 235);
  border-radius: 0.25rem;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: rgb(59 130 246);
  transition: width 0.3s ease;
}

/* Tailwind-like utility classes for testing */
.relative { position: relative; }
.inline-block { display: inline-block; }
.w-full { width: 100%; }
.min-h-screen { min-height: 100vh; }
.min-h-[200px] { min-height: 200px; }
.flex { display: flex; }
.inline-flex { display: inline-flex; }
.items-center { align-items: center; }
.justify-center { justify-content: center; }
.p-4 { padding: 1rem; }
.h-full { height: 100%; }
.gap-2 { gap: 0.5rem; }
.ml-2 { margin-left: 0.5rem; }
.mt-2 { margin-top: 0.5rem; }
.opacity-50 { opacity: 0.5; }
.pointer-events-none { pointer-events: none; }
.absolute { position: absolute; }
.inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
.z-50 { z-index: 50; }
.w-4 { width: 1rem; }
.h-4 { height: 1rem; }
.w-5 { width: 1.25rem; }
.h-5 { height: 1.25rem; }
.w-6 { width: 1.5rem; }
.h-6 { height: 1.5rem; }
.w-8 { width: 2rem; }
.h-8 { height: 2rem; }
.w-10 { width: 2.5rem; }
.h-10 { height: 2.5rem; }
</style>