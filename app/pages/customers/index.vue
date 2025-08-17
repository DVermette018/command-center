<script lang="ts" setup></script>

<template>
  <UDashboardPanel id="customers">
    <template #header>
      <UDashboardNavbar title="Customers">
        <template #leading>
          <UDashboardSidebarCollapse/>
        </template>

        <template #right>
          <CustomersAddModal/>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <CustomersTable />
    </template>
  </UDashboardPanel>
</template>
