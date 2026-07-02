<script setup>
import { onMounted } from "vue";
import { useRoute } from "vue-router";
import { getOnboardingStatusAPI } from "@/services/employee";

const route = useRoute();

onMounted(async () => {
  if (route.path === "/") return;

  try {
    await getOnboardingStatusAPI();
  } catch (error) {}
});
</script>

<template>
  <router-view />
</template>
