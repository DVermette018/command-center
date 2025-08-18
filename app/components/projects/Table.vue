<script lang="ts" setup>
import { upperFirst } from 'scule'
import { getPaginationRowModel, type Row } from '@tanstack/table-core'
import type { TableColumn } from '@nuxt/ui'
import type { Project } from '~~/types/project'
import { format } from 'date-fns'
import { useApi } from '~/api'

defineProps<{
  customerId: string
}>()

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UCheckbox = resolveComponent('UCheckbox')

const toast = useToast()
const table = useTemplateRef('table')

const columnFilters = ref([{
  id: 'id',
  value: ''
}])
const columnVisibility = ref()
const rowSelection = ref({ 1: true })

const api = useApi()

// Use reactive pagination state
const pagination = ref({
  pageIndex: 0,
  pageSize: 10
})

// Use the proper query hook for fetching projects
const { data, isLoading, status, error } = api.projects.useGetAllQuery({
  pageIndex: pagination.value.pageIndex + 1, // API expects 1-based pagination
  pageSize: pagination.value.pageSize
})

// Handle errors appropriately
watchEffect(() => {
  if (status.value === 'error') {
    console.error('Failed to fetch projects:', error.value)
    toast.add({
      title: 'Error',
      description: 'Failed to fetch projects',
      color: 'error',
      icon: 'i-lucide-x'
    })
  }
})

const getRowItems = (row: Row<Project>) => {
  return [
    {
      type: 'label',
      label: 'Actions'
    },
    {
      label: 'Copy customer ID',
      icon: 'i-lucide-copy',
      onSelect: () => {
        navigator.clipboard.writeText(row.original.id.toString())
        toast.add({
          title: 'Copied to clipboard',
          description: `Customer ID ${row.original.id} copied to clipboard`
        })
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'View customer details',
      icon: 'i-lucide-list',
      onSelect: () => {
        navigateTo(`/customers/${row.original.id}`)
      }
    },
    {
      label: 'View customer payments',
      icon: 'i-lucide-wallet'
    },
    {
      type: 'separator'
    },
    {
      label: 'Delete customer',
      icon: 'i-lucide-trash',
      color: 'error',
      onSelect: () => {
        toast.add({
          title: 'Customer deleted',
          description: 'The customer has been deleted.'
        })
      }
    }
  ]
}

const columns: TableColumn<Project>[] = [
  {
    id: 'select',
    header: ({ table }) =>
      h(UCheckbox, {
        'modelValue': table.getIsSomePageRowsSelected()
          ? 'indeterminate'
          : table.getIsAllPageRowsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
          table.toggleAllPageRowsSelected(!!value),
        'ariaLabel': 'Select all'
      }),
    cell: ({ row }) =>
      h(UCheckbox, {
        'modelValue': row.getIsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') => row.toggleSelected(!!value),
        'ariaLabel': 'Select row'
      })
  },
  {
    accessorKey: 'name',
    header: 'Project',
    cell: ({ row }) => {
      return h('div', undefined, [
        h('p', { class: 'font-medium text-highlighted' }, row.original.name),
        h('p', { class: 'text-xs' }, row.original.type)
      ])
    }
  },
  {
    accessorKey: 'dates',
    header: 'Target Dates',
    cell: ({ row }) => {
      return h('p', { class: 'font-medium text-highlighted' },
        (row.original.startDate ? format(row.original.startDate, 'd MMM') : 'Not Set') +
        ' - ' +
        ((row.original.actualEndDate || row.original.actualEndDate) ?? 'Not set')
      )
    }
  },
  {
    accessorKey: 'team',
    header: 'Team',
    cell: ({ row }) => {
      return h('div', undefined, [
        h('p', { class: 'font-medium text-highlighted' }, row.original.projectManager?.firstName + ' ' + row.original.projectManager?.lastName),
        h('p', { class: 'text-xs' }, (row.original.teamMembers?.length || '0') + ' members assigned')
    ])
    }
  },
  {
    accessorKey: 'status',
    header: 'Status',
    filterFn: 'equals',
    cell: ({ row }) => {
      const color = {
        DRAFT: 'neutral' as const,
        PENDING_APPROVAL: 'warning' as const,
        ACTIVE: 'success' as const,
        ON_HOLD: 'info' as const,
        COMPLETED: 'success' as const,
        CANCELLED: 'warning' as const,
        ARCHIVED: 'neutral' as const,
      }[row.original.status]

      return h(UBadge, { class: 'capitalize', variant: 'subtle', color }, () =>
        row.original.status
      )
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      return h(
        'div',
        { class: 'text-right' },
        h(
          UDropdownMenu,
          {
            content: {
              align: 'end'
            },
            items: getRowItems(row)
          },
          () =>
            h(UButton, {
              icon: 'i-lucide-ellipsis-vertical',
              color: 'neutral',
              variant: 'ghost',
              class: 'ml-auto'
            })
        )
      )
    }
  }
]

const statusFilter = ref('all')

const onRowClick = (row: Row<Project>) => {
  navigateTo(`/projects/${row.original.id}`)
}

watch(() => statusFilter.value, (newVal) => {
  if (!table?.value?.tableApi) return

  const statusColumn = table.value.tableApi.getColumn('status')
  if (!statusColumn) return

  if (newVal === 'all') {
    statusColumn.setFilterValue(undefined)
  } else {
    statusColumn.setFilterValue(newVal)
  }
})
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-1.5 w-full">
    <UInput
      :model-value="(table?.tableApi?.getColumn('name')?.getFilterValue() as string)"
      class="max-w-sm"
      icon="i-lucide-search"
      placeholder="Filter name..."
      @update:model-value="table?.tableApi?.getColumn('name')?.setFilterValue($event)"
    />

    <div class="flex flex-wrap items-center gap-1.5">
      <CustomersDeleteModal :count="table?.tableApi?.getFilteredSelectedRowModel().rows.length">
        <UButton
          v-if="table?.tableApi?.getFilteredSelectedRowModel().rows.length"
          color="error"
          icon="i-lucide-trash"
          label="Delete"
          variant="subtle"
        >
          <template #trailing>
            <UKbd>
              {{ table?.tableApi?.getFilteredSelectedRowModel().rows.length }}
            </UKbd>
          </template>
        </UButton>
      </CustomersDeleteModal>

      <USelect
        v-model="statusFilter"
        :items="[
              { label: 'All', value: 'all' },
              { label: 'Subscribed', value: 'subscribed' },
              { label: 'Unsubscribed', value: 'unsubscribed' },
              { label: 'Bounced', value: 'bounced' }
            ]"
        :ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200' }"
        class="min-w-28"
        placeholder="Filter status"
      />
      <ProjectsAddModal :customerId="customerId" />
    </div>
  </div>

  <UTable
    ref="table"
    v-model:column-filters="columnFilters"
    v-model:column-visibility="columnVisibility"
    v-model:pagination="pagination"
    v-model:row-selection="rowSelection"
    :columns="columns"
    :data="data?.data || []"
    :loading="isLoading"
    :pagination-options="{
          getPaginationRowModel: getPaginationRowModel()
        }"
    :ui="{
          base: 'table-fixed border-separate border-spacing-0',
          thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
          tbody: '[&>tr]:last:[&>td]:border-b-0',
          th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
          td: 'border-b border-default cursor-pointer',
        }"
    class="shrink-0"
    @select="onRowClick"
  />

  <div class="flex items-center justify-between gap-3 border-t border-default pt-4 mt-auto">
    <div class="text-sm text-muted">
      {{ table?.tableApi?.getFilteredSelectedRowModel().rows.length || 0 }} of
      {{ table?.tableApi?.getFilteredRowModel().rows.length || 0 }} row(s) selected.
    </div>

    <div class="flex items-center gap-1.5">
      <UPagination
        :default-page="(table?.tableApi?.getState().pagination.pageIndex || 0) + 1"
        :items-per-page="table?.tableApi?.getState().pagination.pageSize"
        :total="table?.tableApi?.getFilteredRowModel().rows.length"
        @update:page="(p: number) => table?.tableApi?.setPageIndex(p - 1)"
      />
    </div>
  </div>
</template>

<style scoped>

</style>
