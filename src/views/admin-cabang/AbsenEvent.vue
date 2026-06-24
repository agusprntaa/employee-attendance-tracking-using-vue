<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "@/composables/useAuth";
import { getBranchSettings } from "@/services/adminCabang";
import AdminProfile from "@/components/AdminProfile.vue";
import AdminSidebar from "@/components/AdminSidebar.vue";

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
    <admin-sidebar />
  </div>
  <h2>ini adalah halaman Absensi Event admin cabang</h2>
</template>

<style scoped>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.layout {
  display: flex;
  min-height: 100vh;
  background: #f0f2ff;
  font-family: "Segoe UI", sans-serif;
}
</style>
