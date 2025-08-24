<script lang="ts" setup>
import type { Period, Range, Stat } from '~/types'
import { useApi } from '~/api'

const props = defineProps<{
  period: Period
  range: Range
}>()

const api = useApi()

function formatCurrency (value: number): string {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  })
}

const baseStats: Stat[] = [
  {
    title: 'Customers',
    key: 'customers',
    icon: 'i-lucide-users',
    value: 0,
    variation: 0,
  },
  {
    title: 'Conversions',
    key: 'conversions',
    icon: 'i-lucide-chart-pie',
    value: 0,
    variation: 0
  },
  {
    title: 'Revenue',
    key: 'revenue',
    icon: 'i-lucide-circle-dollar-sign',
    value: 0,
    variation: 0
  },
  {
    title: 'Orders',
    key: 'orders',
    icon: 'i-lucide-shopping-cart',
    value: 0,
    variation: 0
  }
]

const { data: stats } = await useAsyncData<Stat[]>('stats', async () => {

  const { data: response } = api.customers.getPeriodVariationByStatus({
    status: 'ACTIVE',
    period: props.period,
    range: {
      start: props.range.start.toISOString(),
      end: props.range.end.toISOString()
    }
  })

  // Map the response to the base stats structure
  return baseStats.map(stat => {
    if (stat.key === 'customers' && response.value) {
      return { ...stat, value: response.value.currentPeriod, variation: response.value.percentageChange }
    }
    // Fetch other stats similarly
    return stat
  })
}, {
  watch: [() => props.period, () => props.range],
  default: () => []
})
</script>

<template>
  <UPageGrid class="lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-px">
    <UPageCard
      v-for="(stat, index) in stats"
      :key="index"
      :icon="stat.icon"
      :title="stat.title"
      :ui="{
        container: 'gap-y-1.5',
        wrapper: 'items-start',
        leading: 'p-2.5 rounded-full bg-primary/10 ring ring-inset ring-primary/25 flex-col',
        title: 'font-normal text-muted text-xs uppercase'
      }"
      class="lg:rounded-none first:rounded-l-lg last:rounded-r-lg hover:z-1"
      to="/customers"
      variant="subtle"
    >
      <div class="flex items-center gap-2">
        <span class="text-2xl font-semibold text-highlighted">
          {{ stat.value }}
        </span>

        <UBadge
          :color="stat.variation > 0 ? 'success' : 'error'"
          class="text-xs"
          variant="subtle"
        >
          {{ stat.variation > 0 ? '+' : '' }}{{ stat.variation }}%
        </UBadge>
      </div>
    </UPageCard>
  </UPageGrid>
</template>
