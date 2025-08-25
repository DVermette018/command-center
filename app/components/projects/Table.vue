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

const api = useApi()
const toast = useToast()
const table = useTemplateRef<any>('table')

const columnVisibility = ref()
const rowSelection = ref({})
const nameFilter = ref('')

const pagination = ref({
  pageIndex: 0,
  pageSize: 10
})

const paginationParams = reactive({
  pageIndex: 1,
  pageSize: 10
})

const { data, isLoading, status, error, refetch } = api.projects.getAll(paginationParams)

const selectedRowsCount = computed((): number => {
  return table.value?.tableApi?.getFilteredSelectedRowModel().rows.length || 0
})

const filteredRowsCount = computed(() => {
  return table.value?.tableApi?.getFilteredRowModel().rows.length || 0
})

watch(pagination, (newPagination) => {
  paginationParams.pageIndex = newPagination.pageIndex + 1
  paginationParams.pageSize = newPagination.pageSize
  refetch()
}, { deep: true })

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
      label: 'Copy project ID',
      icon: 'i-lucide-copy',
      onSelect: () => {
        navigator.clipboard.writeText(row.original.id.toString())
        toast.add({
          title: 'Copied to clipboard',
          description: `Project ID ${row.original.id} copied to clipboard`
        })
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'View project details',
      icon: 'i-lucide-list',
      onSelect: () => {
        navigateTo(`/projects/${row.original.id}`)
      }
    },
    {
      label: 'View project timeline',
      icon: 'i-lucide-calendar'
    },
    {
      type: 'separator'
    },
    {
      label: 'Delete project',
      icon: 'i-lucide-trash',
      color: 'error',
      onSelect: () => {
        toast.add({
          title: 'Project deleted',
          description: 'The project has been deleted.'
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
        (row.original.actualEndDate ? format(row.original.actualEndDate, 'd MMM') : 'Not set')
      )
    }
  },
  {
    accessorKey: 'team',
    header: 'Team',
    cell: ({ row }) => {
      return h('div', undefined, [
        h('p', { class: 'font-medium text-highlighted' },
          row.original.projectManager ?
            `${row.original.projectManager.firstName} ${row.original.projectManager.lastName}` :
            'No manager assigned'
        ),
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
        row.original.status.toLowerCase().replace('_', ' ')
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

watch(nameFilter, (value) => {
  nextTick(() => {
    if (table?.value?.tableApi) {
      const nameColumn = table.value.tableApi.getColumn('name')
      if (nameColumn) {
        nameColumn.setFilterValue(value || undefined)
      }
    }
  })
})

watch(statusFilter, (newVal) => {
  nextTick(() => {
    if (!table?.value?.tableApi) return

    const statusColumn = table.value.tableApi.getColumn('status')
    if (!statusColumn) return

    if (newVal === 'all') {
      statusColumn.setFilterValue(undefined)
    } else {
      statusColumn.setFilterValue(newVal)
    }
  })
})

const handlePageChange = (page: number) => {
  pagination.value.pageIndex = page - 1
}
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-1.5 w-full">
    <UInput
      v-model="nameFilter"
      class="max-w-sm"
      icon="i-lucide-search"
      placeholder="Filter name..."
    />

    <div class="flex flex-wrap items-center gap-1.5">
      <CustomersDeleteModal :count="selectedRowsCount">
        <UButton
          v-if="selectedRowsCount > 0"
          color="error"
          icon="i-lucide-trash"
          label="Delete"
          variant="subtle"
        >
          <template #trailing>
            <UKbd>
              {{ selectedRowsCount }}
            </UKbd>
          </template>
        </UButton>
      </CustomersDeleteModal>

      <USelect
        v-model="statusFilter"
        :items="[
          { label: 'All', value: 'all' },
          { label: 'Draft', value: 'DRAFT' },
          { label: 'Pending Approval', value: 'PENDING_APPROVAL' },
          { label: 'Active', value: 'ACTIVE' },
          { label: 'On Hold', value: 'ON_HOLD' },
          { label: 'Completed', value: 'COMPLETED' },
          { label: 'Cancelled', value: 'CANCELLED' },
          { label: 'Archived', value: 'ARCHIVED' }
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
    v-model:column-visibility="columnVisibility"
    v-model:row-selection="rowSelection"
    v-model:pagination="pagination"
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
      {{ selectedRowsCount }} of
      {{ filteredRowsCount }} row(s) selected.
    </div>

    <div class="flex items-center gap-1.5">
      <UPagination
        :page="pagination.pageIndex + 1"
        :page-count="Math.ceil((data?.pagination?.total || 0) / pagination.pageSize)"
        @update:page="handlePageChange"
      />
    </div>
  </div>
</template>

<style scoped>
</style>
