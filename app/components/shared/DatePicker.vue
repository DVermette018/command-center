<script lang="ts" setup>
import { CalendarDate, DateFormatter, getLocalTimeZone } from '@internationalized/date'

const df = new DateFormatter('en-US', {
  dateStyle: 'medium'
})

const modelValue = defineModel<CalendarDate | null>({
  default: null,
  type: CalendarDate
})
</script>

<template>
  <UPopover>
    <UButton color="neutral" icon="i-lucide-calendar" variant="subtle">
      {{ modelValue ? df.format(modelValue.toDate(getLocalTimeZone())) : 'Select a date' }}
    </UButton>

    <template #content>
      <UCalendar v-model="modelValue" class="p-2"/>
    </template>
  </UPopover>
</template>
