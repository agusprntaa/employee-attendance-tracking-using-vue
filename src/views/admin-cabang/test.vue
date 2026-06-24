<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";

import { useAuth } from "@/composables/useAuth";
import { getBranchSettings } from "@/services/adminCabang";

import AdminSidebar from "@/components/AdminSidebar.vue";
import AdminProfile from "@/components/AdminProfile.vue";

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
  } catch (error) {
    console.error("SETTINGS ERROR:", error);
  }
}

function goToOfficeAttendance() {
  router.push("/admin-cabang/absensi-kantor");
}

function goToEventAttendance() {
  router.push("/admin-cabang/absensi-event");
}
</script>

<template>
  <div class="layout">
    <AdminSidebar />

    <main class="main">
      <div class="header">
        <div>
          <h2>Dashboard Cabang</h2>

          <p class="subtitle">
            {{
              settings.branch_information?.branch_name ||
              "-"
            }}
          </p>
        </div>

        <AdminProfile :user="user" />
      </div>

      <div class="panel">
        <div class="welcome-card">
          <div class="welcome-content">
            <span class="badge">
              Admin Cabang
            </span>

            <h1>
              Selamat Datang,
              {{ user?.name }}
            </h1>

            <p>
              Anda sedang mengelola cabang
              <strong>
                {{
                  settings.branch_information?.branch_name ||
                  "-"
                }}
              </strong>
            </p>

            <div class="actions">
              <button
                class="btn-primary"
                @click="goToOfficeAttendance"
              >
                Absensi Kantor
              </button>

              <button
                class="btn-secondary"
                @click="goToEventAttendance"
              >
                Absensi Event
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  height: 100vh;
  background: #f0f2ff;
  font-family: "Segoe UI", sans-serif;
  overflow: hidden;
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 28px 32px;
  gap: 24px;
}

.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.header h2 {
  font-size: 24px;
  font-weight: 700;
  color: #1e1b4b;
}

.subtitle {
  font-size: 14px;
  color: #6b7280;
  margin-top: 4px;
}

.panel {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e8e8f0;
  overflow: hidden;
}

.welcome-card {
  padding: 48px;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 14px;

  border-radius: 999px;

  background: #e0e7ff;
  color: #4338ca;

  font-size: 12px;
  font-weight: 600;

  margin-bottom: 18px;
}

.welcome-content h1 {
  font-size: 36px;
  font-weight: 700;
  color: #1e1b4b;

  margin-bottom: 12px;
}

.welcome-content p {
  font-size: 16px;
  color: #6b7280;

  margin-bottom: 32px;
}

.actions {
  display: flex;
  gap: 14px;
}

.btn-primary,
.btn-secondary {
  border: none;
  border-radius: 12px;

  padding: 12px 22px;

  font-size: 14px;
  font-weight: 600;

  cursor: pointer;

  transition: 0.2s;
}

.btn-primary {
  background: #0f5db8;
  color: white;
}

.btn-primary:hover {
  background: #0b4a91;
}

.btn-secondary {
  background: #eef2ff;
  color: #4338ca;
}

.btn-secondary:hover {
  background: #e0e7ff;
}

@media (max-width: 768px) {
  .welcome-card {
    padding: 24px;
  }

  .welcome-content h1 {
    font-size: 28px;
  }

  .actions {
    flex-direction: column;
  }

  .btn-primary,
  .btn-secondary {
    width: 100%;
  }
}
</style>