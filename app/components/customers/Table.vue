<script lang="ts" setup>
import { upperFirst } from 'scule'
import { getPaginationRowModel, type Row } from '@tanstack/table-core'
import type { Customer } from '~~/types/customers'
import type { TableColumn } from '@nuxt/ui'
import { useApi } from '~/api'

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UCheckbox = resolveComponent('UCheckbox')

const api = useApi()
const toast = useToast()
const table = useTemplateRef<any>('table')

const columnVisibility = ref()
const rowSelection = ref({})

const pagination = ref({
  pageIndex: 0,
  pageSize: 10
})

const paginationParams = reactive({
  pageIndex: 1,
  pageSize: 10
})

const { data, isLoading, status, error, refetch } = api.customers.getAll(paginationParams)

const selectedRowsCount = computed((): number => {
  return table.value?.tableApi?.getFilteredSelectedRowModel().rows.length || 0
})

const filteredRowsCount = computed(() => {
  return table.value?.tableApi?.getFilteredRowModel().rows.length || 0
})

const getRowItems = (row: Row<Customer>) => {
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

const columns: TableColumn<Customer>[] = [
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
    header: 'Name',
    cell: ({ row }) => {
      return h('div', undefined, [
        h('p', { class: 'font-medium text-highlighted' }, row.original.businessProfile?.businessName),
        h('p', { class: 'text-xs' }, row.original.businessProfile?.website || 'N/A')
      ])
    }
  },
  {
    accessorKey: 'representative',
    header: 'Representative',
    cell: ({ row }) => {
      const primaryContact = row.original.contacts?.find(contact => contact.isPrimary)
      return h('div', undefined, [
        h('p', { class: 'font-medium text-highlighted' }, primaryContact?.user?.firstName + ' ' + primaryContact?.user?.lastName),
        h('p', { class: 'text-xs' }, primaryContact?.user?.email + ' | ' + primaryContact?.user?.email)
      ])
    }
  },
  {
    accessorKey: 'industry',
    header: 'Industry',
    cell: ({ row }) => {
      return h('div', undefined, [
        h('p', { class: 'font-medium text-highlighted' }, row.original.businessProfile?.category || 'N/A'),
        h('p', { class: 'text-xs' }, row.original.businessProfile?.size || 'N/A')
      ])
    }
  },
  {
    accessorKey: 'status',
    header: 'Status',
    filterFn: 'equals',
    cell: ({ row }) => {
      const color = {
        LEAD: 'info' as const,
        PROSPECT: 'info' as const,
        ACTIVE: 'success' as const,
        INACTIVE: 'neutral' as const,
        CHURNED: 'error' as const
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
const nameFilter = ref('')

const onRowClick = (row: Row<Customer>) => {
  navigateTo(`/customers/${row.original.id}`)
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

watch(pagination, (newPagination) => {
  paginationParams.pageIndex = newPagination.pageIndex + 1
  paginationParams.pageSize = newPagination.pageSize
  refetch()
}, { deep: true })

watchEffect(() => {
  if (status.value === 'error') {
    console.error('Failed to fetch customers:', error.value)
    toast.add({
      title: 'Error',
      description: 'Failed to fetch customers',
      color: 'error',
      icon: 'i-lucide-x'
    })
  }
})

const handlePageChange = (page: number) => {
  pagination.value.pageIndex = page - 1
}
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-1.5">
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
          { label: 'Lead', value: 'LEAD' },
          { label: 'Prospect', value: 'PROSPECT' },
          { label: 'Active', value: 'ACTIVE' },
          { label: 'Inactive', value: 'INACTIVE' },
          { label: 'Churned', value: 'CHURNED' }
        ]"
        :ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200' }"
        class="min-w-28"
        placeholder="Filter status"
      />

      <UDropdownMenu
        :content="{ align: 'end' }"
        :items="
          table?.tableApi
            ?.getAllColumns()
            .filter((column: any) => column.getCanHide())
            .map((column: any) => ({
              label: upperFirst(column.id),
              type: 'checkbox' as const,
              checked: column.getIsVisible(),
              onUpdateChecked(checked: boolean) {
                table?.tableApi?.getColumn(column.id)?.toggleVisibility(!!checked)
              },
              onSelect(e?: Event) {
                e?.preventDefault()
              }
            }))
        "
      >
        <UButton
          color="neutral"
          label="Display"
          trailing-icon="i-lucide-settings-2"
          variant="outline"
        />
      </UDropdownMenu>
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
