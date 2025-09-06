<script lang="ts" setup>
import { upperFirst } from 'scule'
import { getPaginationRowModel, type Row } from '@tanstack/table-core'
import type { CustomerDTO } from '~~/dto/customer'
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

// Status change modal state
const statusModalOpen = ref(false)
const selectedCustomer = ref<CustomerDTO | null>(null)

const openStatusModal = (customer: CustomerDTO) => {
  selectedCustomer.value = customer
  statusModalOpen.value = true
}

const onStatusChanged = (updatedCustomer: CustomerDTO) => {
  // Refresh the table data to show updated status
  refetch()
}

const { t } = useI18n()

const getRowItems = (row: Row<CustomerDTO>) => {
  return [
    {
      type: 'label',
      label: t('customers.table.actions.label_actions')
    },
    {
      label: t('customers.table.actions.copy_id'),
      icon: 'i-lucide-copy',
      onSelect: () => {
        navigator.clipboard.writeText(row.original.id.toString())
        toast.add({
          title: t('customers.table.messages.copied_id', { id: row.original.id })
        })
      }
    },
    {
      type: 'separator'
    },
    {
      label: t('customers.table.actions.view_details'),
      icon: 'i-lucide-list',
      onSelect: () => {
        navigateTo(`/customers/${row.original.id}`)
      }
    },
    {
      label: t('customers.table.actions.change_status'),
      icon: 'i-lucide-refresh-cw',
      onSelect: () => {
        openStatusModal(row.original)
      }
    },
    {
      label: t('customers.table.actions.view_payments'),
      icon: 'i-lucide-wallet'
    },
    {
      type: 'separator'
    },
    {
      label: t('customers.table.actions.delete_customer'),
      icon: 'i-lucide-trash',
      color: 'error',
      onSelect: () => {
        toast.add({
          title: t('customers.table.messages.deleted')
        })
      }
    }
  ]
}

const columns: TableColumn<CustomerDTO>[] = [
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
    header: () => t('customers.table.header_name'),
    cell: ({ row }) => {
      return h('div', undefined, [
        h('p', { class: 'font-medium text-highlighted' }, row.original.businessProfile?.businessName),
        h('p', { class: 'text-xs' }, row.original.businessProfile?.website || 'N/A')
      ])
    }
  },
  {
    accessorKey: 'representative',
    header: () => t('customers.table.header_representative'),
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
    header: () => t('customers.table.header_industry'),
    cell: ({ row }) => {
      return h('div', undefined, [
        h('p', { class: 'font-medium text-highlighted' }, row.original.businessProfile?.category || 'N/A'),
        h('p', { class: 'text-xs' }, row.original.businessProfile?.size || 'N/A')
      ])
    }
  },
  {
    accessorKey: 'status',
    header: () => t('customers.table.header_status'),
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

const onRowClick = (row: Row<CustomerDTO>) => {
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
      title: t('common.general.error'),
      description: t('customers.table.messages.error_fetch'),
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
      :placeholder="$t('customers.table.placeholder_search')"
    />

    <div class="flex flex-wrap items-center gap-1.5">
      <CustomersDeleteModal :count="selectedRowsCount">
        <UButton
          v-if="selectedRowsCount > 0"
          color="error"
          icon="i-lucide-trash"
          :label="$t('customers.table.button_delete')"
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
          { label: t('common.general.all'), value: 'all' },
          { label: t('customers.statuses.lead'), value: 'LEAD' },
          { label: t('customers.statuses.prospect'), value: 'PROSPECT' },
          { label: t('customers.statuses.active'), value: 'ACTIVE' },
          { label: t('customers.statuses.inactive'), value: 'INACTIVE' },
          { label: t('customers.statuses.churned'), value: 'CHURNED' }
        ]"
        :ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200' }"
        class="min-w-28"
        :placeholder="$t('customers.table.placeholder_status_filter')"
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
          :label="$t('customers.table.button_display')"
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
      {{ $t('customers.table.selection_summary', { selected: selectedRowsCount, total: filteredRowsCount }) }}
    </div>

    <div class="flex items-center gap-1.5">
      <UPagination
        :page="pagination.pageIndex + 1"
        :page-count="Math.ceil((data?.pagination?.totalCount || 0) / pagination.pageSize)"
        @update:page="handlePageChange"
      />
    </div>
  </div>

  <!-- Status Change Modal -->
  <CustomersStatusModal
    v-if="selectedCustomer"
    v-model:open="statusModalOpen"
    :customer="selectedCustomer"
    @status-changed="onStatusChanged"
  />
</template>

<style scoped>
</style>
