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
  } catch (err) {}
}

function goToOfficeAttendance() {
  router.push("/admin-cabang/absen-kantor");
}

function goToEventAttendance() {
  router.push("/admin-cabang/absen-event");
}
</script>

<template>
  <div class="layout">
    <admin-sidebar />

    <main class="main">
      <div class="header">
        <div>
          <h2>Dashboard Cabang</h2>
          <p class="subtitle">
            {{ settings.branch_information?.branch_name || "-" }}
          </p>
        </div>
        <AdminProfile :user="user" />
      </div>
      <div class="panel">
        <div class="welcome-card">
          <div class="welcome-content">
            <span class="badge"> Admin Cabang </span>
            <h1>Selamat Datang, {{ user?.name }}</h1>
            <p>
              Anda sedang mengelola cabang
              <strong>{{
                settings.branch_information?.branch_name || "-"
              }}</strong>
            </p>
            <div class="action">
              <button class="btn-primary" @click="goToOfficeAttendance">
                Absensi Kantor
              </button>
              <button class="btn-secondary" @click="goToEventAttendance">
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
  min-height: 100vh;
  background: #f5f7fb;
  overflow: hidden;
}

.main {
  flex: 1;
  overflow-y: auto;
  padding: 32px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 24px;
}

.header h2 {
  font-size: 28px;
  font-weight: 700;
  color: #111827;
  line-height: 1.2;
}

.subtitle {
  margin-top: 6px;
  color: #6b7280;
  font-size: 15px;
}

.panel {
  background: #fff;
  border-radius: 18px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
  overflow: hidden;
}

.welcome-card {
  padding: 48px;
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 14px;
  margin-bottom: 20px;

  border-radius: 999px;

  background: #eef2ff;
  color: #4338ca;

  font-size: 12px;
  font-weight: 600;
}

.welcome-content h1 {
  font-size: 36px;
  font-weight: 700;
  line-height: 1.2;
  color: #111827;
  margin-bottom: 14px;
}

.welcome-content p {
  max-width: 620px;
  color: #6b7280;
  font-size: 16px;
  line-height: 1.7;
  margin-bottom: 36px;
}

/* ===== PERBAIKI INI ===== */
/* Template memakai class="action", bukan actions */

.action {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}

.btn-primary,
.btn-secondary {
  min-width: 180px;
  height: 46px;
  border: none;
  border-radius: 12px;
  padding: 0 22px;

  font-size: 14px;
  font-weight: 600;

  cursor: pointer;

  transition:
    background 0.2s,
    transform 0.2s,
    box-shadow 0.2s;
}

.btn-primary {
  background: #0f5db8;
  color: #fff;
}

.btn-primary:hover {
  background: #0b4a91;
  transform: translateY(-1px);
}

.btn-secondary {
  background: #eef2ff;
  color: #4338ca;
}

.btn-secondary:hover {
  background: #e4e9ff;
  transform: translateY(-1px);
}

.btn-primary:active,
.btn-secondary:active {
  transform: translateY(0);
}

@media (max-width: 1024px) {
  .main {
    padding: 24px;
  }

  .header {
    flex-wrap: wrap;
  }

  .welcome-card {
    padding: 36px;
  }

  .welcome-content h1 {
    font-size: 32px;
  }
}

@media (max-width: 768px) {
  .main {
    padding: 76px 16px 24px;
  }

  .header {
    flex-direction: column;
    align-items: stretch;
    gap: 18px;
  }

  .header h2 {
    font-size: 24px;
  }

  .subtitle {
    font-size: 14px;
  }

  .welcome-card {
    padding: 28px 22px;
  }

  .badge {
    margin-bottom: 16px;
  }

  .welcome-content h1 {
    font-size: 28px;
  }

  .welcome-content p {
    font-size: 15px;
    margin-bottom: 28px;
  }

  .action {
    flex-direction: column;
  }

  .btn-primary,
  .btn-secondary {
    width: 100%;
    min-width: 0;
  }
}

@media (max-width: 480px) {
  .main {
    padding: 72px 12px 20px;
  }

  .panel {
    border-radius: 14px;
  }

  .welcome-card {
    padding: 20px;
  }

  .welcome-content h1 {
    font-size: 24px;
  }

  .welcome-content p {
    font-size: 14px;
  }
}
</style>
