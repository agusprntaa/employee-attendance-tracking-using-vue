<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "@/composables/useAuth";
import { getBranchSettings } from "@/services/adminCabang";
import AdminProfile from "@/components/AdminProfile.vue";
import AdminPusatSidebar from "../../components/AdminPusatSidebar.vue";

const router = useRouter();

const { user, loadUser } = useAuth();

const settings = ref({});

onMounted(async () => {
  loadUser();
  await fetchSettings();
});

async function fetchSettings() {
  try {
    const res = await getBranchSettings();
    settings.value = res.data.data || {};
  } catch (err) {
    console.error("settings error:", err);
  }
}
</script>

<template>
  <div class="layout">
    <AdminPusatSidebar />
  </div>
  <h2>ini adalah halaman Absensi Event admin pusat</h2>
</template>

<style scoped></style>
