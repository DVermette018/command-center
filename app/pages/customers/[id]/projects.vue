<script lang="ts" setup>
const { $trpc } = useNuxtApp()
const route = useRoute()

</script>

<template>
  <ProjectsTable :customerId="route.params.id as string"/>
</template>
