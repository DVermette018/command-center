<script lang="ts" setup>
import { upperFirst } from 'scule'
import { getPaginationRowModel, type Row } from '@tanstack/table-core'
import type { Customer } from '~~/types/customers'
import type { TableColumn } from '@nuxt/ui'
import { useApi } from '~/api'

const api = useApi()
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

const status = ref<'pending' | 'success' | 'error'>('success')
const { data } = await api.customers.getAll({
  pageIndex: 1,
  pageSize: 10
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

const onRowClick = (row: Row<Customer>) => {
  navigateTo(`/customers/${row.original.id}`)
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

const pagination = ref({
  pageIndex: 0,
  pageSize: 10
})
</script>

<template>

  <div class="flex flex-wrap items-center justify-between gap-1.5">
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
      <UDropdownMenu
        :content="{ align: 'end' }"
        :items="
              table?.tableApi
                ?.getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => ({
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
    v-model:column-filters="columnFilters"
    v-model:column-visibility="columnVisibility"
    v-model:pagination="pagination"
    v-model:row-selection="rowSelection"
    :columns="columns"
    :data="data"
    :loading="status === 'pending'"
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
