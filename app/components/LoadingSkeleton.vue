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
  background-color: #e5e7eb;
  border-radius: 0.25rem;
}

.skeleton-animate {
  animation: skeleton-shimmer 2s ease-in-out infinite;
  background: linear-gradient(
    90deg,
    #e5e7eb 0%,
    #f3f4f6 50%,
    #e5e7eb 100%
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
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.skeleton-text {
  width: 100%;
}

/* Card Skeleton */
.skeleton-card-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.skeleton-card {
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
}

.skeleton-card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.skeleton-avatar {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  flex-shrink: 0;
}

.skeleton-card-header-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.skeleton-title {
  height: 1rem;
  width: 33.333333%;
}

.skeleton-subtitle {
  height: 0.75rem;
  width: 50%;
}

.skeleton-card-body {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.skeleton-line {
  height: 0.75rem;
  width: 100%;
}

/* Table Skeleton */
.skeleton-table {
  width: 100%;
}

.skeleton-table-header {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.skeleton-table-row {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid #f3f4f6;
}

.skeleton-cell {
  height: 1rem;
  flex: 1;
}

/* List Skeleton */
.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.skeleton-list-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 1px solid #f3f4f6;
  border-radius: 0.5rem;
}

.skeleton-list-icon {
  width: 2rem;
  height: 2rem;
  border-radius: 0.25rem;
  flex-shrink: 0;
}

.skeleton-list-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.skeleton-list-title {
  height: 1rem;
  width: 33.333333%;
}

.skeleton-list-description {
  height: 0.75rem;
  width: 66.666667%;
}

/* Avatar Skeleton */
.skeleton-avatar-group {
  display: flex;
  gap: 0.5rem;
}

.skeleton-avatar-item {
  border-radius: 50%;
}

/* Custom Skeleton */
.skeleton-custom-default {
  height: 5rem;
  width: 100%;
}

/* Size classes */
.h-3 { height: 0.75rem; }
.h-4 { height: 1rem; }
.h-5 { height: 1.25rem; }
.h-6 { height: 1.5rem; }
.h-8 { height: 2rem; }

.w-6 { width: 1.5rem; }
.h-6 { height: 1.5rem; }
.w-8 { width: 2rem; }
.h-8 { height: 2rem; }
.w-10 { width: 2.5rem; }
.h-10 { height: 2.5rem; }
.w-12 { width: 3rem; }
.h-12 { height: 3rem; }
.w-16 { width: 4rem; }
.h-16 { height: 4rem; }
</style>