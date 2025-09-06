<template>
  <div class="skeleton-container" data-testid="skeleton-container">
    <!-- Text Skeleton -->
    <div v-if="type === 'text'" class="skeleton-text-group">
      <div v-for="i in count" 
           :key="`text-${i}`" 
           class="skeleton skeleton-text"
           :class="[sizeClasses, { 'skeleton-animate': animate }]"
           :style="getTextStyle(i)"
           role="status"
           aria-label="Loading text content">
      </div>
    </div>

    <!-- Card Skeleton -->
    <div v-else-if="type === 'card'" class="skeleton-card-group">
      <div v-for="i in count" 
           :key="`card-${i}`" 
           class="skeleton skeleton-card"
           :class="{ 'skeleton-animate': animate }"
           role="status"
           aria-label="Loading card content">
        <div class="skeleton-card-header">
          <div class="skeleton skeleton-avatar"></div>
          <div class="skeleton-card-header-text">
            <div class="skeleton skeleton-title"></div>
            <div class="skeleton skeleton-subtitle"></div>
          </div>
        </div>
        <div class="skeleton-card-body">
          <div class="skeleton skeleton-line"></div>
          <div class="skeleton skeleton-line" style="width: 80%"></div>
          <div class="skeleton skeleton-line" style="width: 60%"></div>
        </div>
      </div>
    </div>

    <!-- Table Skeleton -->
    <div v-else-if="type === 'table'" class="skeleton-table">
      <div class="skeleton-table-header">
        <div v-for="col in columns" 
             :key="`header-${col}`" 
             class="skeleton skeleton-cell"
             :class="{ 'skeleton-animate': animate }">
        </div>
      </div>
      <div v-for="row in count" 
           :key="`row-${row}`" 
           class="skeleton-table-row">
        <div v-for="col in columns" 
             :key="`cell-${row}-${col}`" 
             class="skeleton skeleton-cell"
             :class="{ 'skeleton-animate': animate }"
             :style="getCellStyle(col)">
        </div>
      </div>
    </div>

    <!-- List Skeleton -->
    <div v-else-if="type === 'list'" class="skeleton-list">
      <div v-for="i in count" 
           :key="`list-${i}`" 
           class="skeleton-list-item"
           role="status"
           aria-label="Loading list item">
        <div class="skeleton skeleton-list-icon" 
             :class="{ 'skeleton-animate': animate }"></div>
        <div class="skeleton-list-content">
          <div class="skeleton skeleton-list-title" 
               :class="{ 'skeleton-animate': animate }"></div>
          <div class="skeleton skeleton-list-description" 
               :class="{ 'skeleton-animate': animate }"></div>
        </div>
      </div>
    </div>

    <!-- Avatar Skeleton -->
    <div v-else-if="type === 'avatar'" class="skeleton-avatar-group">
      <div v-for="i in count"
           :key="`avatar-${i}`"
           class="skeleton skeleton-avatar-item"
           :class="[avatarSizeClasses, { 'skeleton-animate': animate }]"
           role="status"
           aria-label="Loading avatar">
      </div>
    </div>

    <!-- Custom Skeleton -->
    <div v-else-if="type === 'custom'" class="skeleton-custom">
      <slot name="skeleton">
        <div class="skeleton skeleton-custom-default" 
             :class="{ 'skeleton-animate': animate }">
        </div>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface LoadingSkeletonProps {
  type?: 'text' | 'card' | 'table' | 'list' | 'avatar' | 'custom'
  count?: number
  animate?: boolean
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  columns?: number
  rounded?: boolean
}

const props = withDefaults(defineProps<LoadingSkeletonProps>(), {
  type: 'text',
  count: 3,
  animate: true,
  size: 'md',
  columns: 4,
  rounded: false
})

const sizeClasses = computed(() => {
  const sizes = {
    xs: 'h-3',
    sm: 'h-4',
    md: 'h-5',
    lg: 'h-6',
    xl: 'h-8'
  }
  return sizes[props.size]
})

const avatarSizeClasses = computed(() => {
  const sizes = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }
  return sizes[props.size]
})

const getTextStyle = (index: number) => {
  // Vary text line widths for more realistic appearance
  const widths = ['100%', '85%', '95%', '70%', '90%']
  return {
    width: widths[(index - 1) % widths.length]
  }
}

const getCellStyle = (columnIndex: number) => {
  // Vary cell content widths
  const widths = ['80%', '60%', '90%', '70%', '85%']
  return {
    width: widths[(columnIndex - 1) % widths.length]
  }
}
</script>

<style scoped>
.skeleton {
  @apply bg-gray-200 dark:bg-gray-700 rounded;
}

.skeleton-animate {
  animation: skeleton-shimmer 2s ease-in-out infinite;
  background: linear-gradient(
    90deg,
    theme('colors.gray.200') 0%,
    theme('colors.gray.100') 50%,
    theme('colors.gray.200') 100%
  );
  background-size: 200% 100%;
}

.dark .skeleton-animate {
  background: linear-gradient(
    90deg,
    theme('colors.gray.700') 0%,
    theme('colors.gray.600') 50%,
    theme('colors.gray.700') 100%
  );
  background-size: 200% 100%;
}

@keyframes skeleton-shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

/* Text Skeleton */
.skeleton-text-group {
  @apply space-y-3;
}

.skeleton-text {
  @apply w-full;
}

/* Card Skeleton */
.skeleton-card-group {
  @apply space-y-4;
}

.skeleton-card {
  @apply p-4 border border-gray-200 dark:border-gray-700 rounded-lg;
}

.skeleton-card-header {
  @apply flex items-center gap-3 mb-4;
}

.skeleton-avatar {
  @apply w-10 h-10 rounded-full flex-shrink-0;
}

.skeleton-card-header-text {
  @apply flex-1 space-y-2;
}

.skeleton-title {
  @apply h-4 w-1/3;
}

.skeleton-subtitle {
  @apply h-3 w-1/2;
}

.skeleton-card-body {
  @apply space-y-2;
}

.skeleton-line {
  @apply h-3 w-full;
}

/* Table Skeleton */
.skeleton-table {
  @apply w-full;
}

.skeleton-table-header {
  @apply flex gap-4 p-4 border-b border-gray-200 dark:border-gray-700;
}

.skeleton-table-row {
  @apply flex gap-4 p-4 border-b border-gray-100 dark:border-gray-800;
}

.skeleton-cell {
  @apply h-4 flex-1;
}

/* List Skeleton */
.skeleton-list {
  @apply space-y-3;
}

.skeleton-list-item {
  @apply flex items-center gap-3 p-3 border border-gray-100 dark:border-gray-800 rounded-lg;
}

.skeleton-list-icon {
  @apply w-8 h-8 rounded flex-shrink-0;
}

.skeleton-list-content {
  @apply flex-1 space-y-2;
}

.skeleton-list-title {
  @apply h-4 w-1/3;
}

.skeleton-list-description {
  @apply h-3 w-2/3;
}

/* Avatar Skeleton */
.skeleton-avatar-group {
  @apply flex gap-2;
}

.skeleton-avatar-item {
  @apply rounded-full;
}

/* Custom Skeleton */
.skeleton-custom-default {
  @apply h-20 w-full;
}
</style>