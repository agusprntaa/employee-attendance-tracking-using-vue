<script setup>
import { ref, onMounted, onUnmounted, nextTick, computed } from "vue";
import AdminProfile from "@/components/AdminProfile.vue";
import { getAllBranches, createBranchAdmin } from "@/services/adminPusat";
import { useRouter } from "vue-router";
import adminPusatSidebar from "@/components/AdminPusatSidebar.vue";
import { useAuth } from "@/composables/useAuth";

import { getGlobalDashboard } from "@/services/adminPusat";
import Chart from "chart.js/auto";

const router = useRouter();

const { user, loadUser } = useAuth();

const branches = ref([]);

const loading = ref(false);
const errorMessage = ref("");

const formError = ref("");
const successMessage = ref("");

const stats = ref({
  total_employees: 0,
  present_today: 0,
  attendance_rate: 0,
  total_branches: 0,
  rate_change: 0,
});

const attendancePerBranch = ref([]);

const workMode = ref({
  wfo_count: 0,
  wfa_count: 0,
  wfo_percent: 0,
  wfa_percent: 0,
});

const branchPerformance = ref([]);
const currentPage = ref(1);
const itemsPerPage = 10;
const branchChartRef = ref(null);
const workModeChartRef = ref(null);

let branchChart = null;
let workModeChart = null;
const showModal = ref(false);

const form = ref({
  username: "",
  password: "",
  branch_id: "",
});

async function fetchDashboard() {
  loading.value = true;

  try {
    const res = await getGlobalDashboard();

    console.log("DASHBOARD:", res.data);

    const data = res.data.data;

    stats.value = data.stats || {};

    attendancePerBranch.value = data.attendance_per_branch || [];

    branchPerformance.value = data.branch_performance || [];

    workMode.value = data.work_mode || {};

    await nextTick();

    renderBranchChart();
    renderWorkModeChart();
  } catch (err) {
    console.error("DASHBOARD ERROR:", err);

    console.log("DETAIL ERROR:", err.response?.data);

    errorMessage.value =
      err.response?.data?.message ||
      "Gagal mengambil data dashboard, cek backend";
  } finally {
    loading.value = false;
  }
}

function openAdd() {
  formError.value = "";
  successMessage.value = "";

  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
}

async function handleCreateAdmin() {
  formError.value = "";

  if (!form.value.username) {
    formError.value = "Username wajib diisi";
    return;
  }

  if (!form.value.password) {
    formError.value = "Password wajib diisi";
    return;
  }

  if (!form.value.branch_id) {
    formError.value = "Pilih branch terlebih dahulu";
    return;
  }

  try {
    const payload = {
      username: form.value.username,
      password: form.value.password,
      branch_id: form.value.branch_id,
    };

    console.log("CREATE ADMIN:", payload);

    const res = await createBranchAdmin(payload);

    console.log("CREATE ADMIN RESPONSE:", res.data);

    successMessage.value = "Admin cabang berhasil dibuat";

    closeModal();

    form.value = {
      username: "",
      password: "",
      branch_id: "",
    };
  } catch (err) {
    console.error("CREATE ADMIN ERROR:", err);

    formError.value =
      err.response?.data?.message || "Admin tidak bisa dibuat, cek backend";
  }
}

function renderBranchChart() {
  branchChart?.destroy();

  if (!branchChartRef.value) return;

  branchChart = new Chart(branchChartRef.value, {
    type: "bar",

    data: {
      labels: attendancePerBranch.value.map((b) => b.branch_name),

      datasets: [
        {
          label: "Present",

          data: attendancePerBranch.value.map((b) => b.present),

          backgroundColor: "#4f46e5",

          borderRadius: 8,
        },
      ],
    },

    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  });
}

function renderWorkModeChart() {
  workModeChart?.destroy();

  if (!workModeChartRef.value) return;

  workModeChart = new Chart(workModeChartRef.value, {
    type: "doughnut",

    data: {
      labels: ["WFO", "WFA"],

      datasets: [
        {
          data: [workMode.value.wfo_count, workMode.value.wfa_count],

          backgroundColor: ["#4f46e5", "#a78bfa"],
        },
      ],
    },

    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  });
}

async function fetchBranches() {
  try {
    const res = await getAllBranches();

    console.log("BRANCHES:", res.data);

    // branches.value = res.data.data;
    branches.value = res.data.data.data || [];
  } catch (err) {
    console.error("BRANCH ERROR:", err);

    console.log("DETAIL ERROR:", err.response?.data);

    errorMessage.value =
      err.response?.data?.message || "Gagal mengambil data branch, cek backend";
  }
}

const totalPages = computed(() => {
  return Math.ceil(branchPerformance.value.length / itemsPerPage);
});

const paginatedBranches = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;

  const end = start + itemsPerPage;

  return branchPerformance.value.slice(start, end);
});

onMounted(async () => {
  await loadUser();

  fetchDashboard();
  fetchBranches();
});

onUnmounted(() => {
  branchChart?.destroy();
  workModeChart?.destroy();
});
</script>

<template>
  <div class="layout">
    <adminPusatSidebar />
    <div class="main">
      <div class="header">
        <div>
          <h2>Dashboard Admin Pusat</h2>
          <p class="subtitle">Monitoring absensi multi cabang</p>
        </div>
        <AdminProfile :user="user" />
      </div>

      <div v-if="errorMessage" class="error-box">
        {{ errorMessage }}
      </div>
      <div v-if="successMessage" class="success-box">
        {{ successMessage }}
      </div>
      <div class="stats">
        <div class="card" @click="router.push('/admin-pusat/employees')">
          <h2>
            {{ stats.total_employees || 0 }}
          </h2>

          <p>Total Karyawan</p>
        </div>

        <div class="card" @click="router.push('/admin-pusat/attendanceToday')">
          <h2>{{ stats.present_today || 0 }}</h2>

          <p>Kehadiran Hari Ini</p>
        </div>

        <div class="card1">
          <h2>{{ Number(stats.attendance_rate || 0).toFixed(1) }}%</h2>

          <p>Persentase Kehadiran</p>
        </div>

        <div class="card" @click="router.push('/admin-pusat/branches')">
          <h2>{{ stats.total_branches || 0 }}</h2>

          <p>Total Cabang</p>
        </div>
      </div>

      <div class="panels">
        <div class="panel">
          <div class="panel-header">
            <h3>Kehadiran Setiap Cabang</h3>
            <p>Kehadiran saat ini vs Kapasitas</p>
          </div>

          <div class="panel-body">
            <canvas ref="branchChartRef"></canvas>
            <p v-if="!attendancePerBranch.length" class="empty">
              Tidak ada Data
            </p>
          </div>
        </div>

        <div class="panel">
          <div class="panel-header">
            <h3>Distribusi Mode Kerja</h3>
            <p>Perbandingan WFO vs WFA</p>
          </div>

          <div class="panel-body">
            <canvas ref="workModeChartRef"></canvas>
            <p v-if="!workMode.wfo_count" class="empty">
              Tidak ada Data Mode Kerja
            </p>
          </div>
        </div>
      </div>

      <div class="filter-bar">
        <button class="btn-add" @click="openAdd">+ Tambah Admin Cabang</button>
      </div>
      <div class="panel">
        <div class="panel-header">
          <h3>Performa Cabang</h3>
          <p>Detail metrik kehadiran tiap cabang</p>
        </div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Branch</th>
                <th>Total Karyawan</th>
                <th>Hadir</th>
                <th>Tidak Hadir</th>
                <th>Persentase</th>
                <th>WFO</th>
                <th>WFA</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="branch in paginatedBranches" :key="branch.branch">
                <td>{{ branch.branch }}</td>

                <td>{{ branch.total_employees }}</td>

                <td>{{ branch.present }}</td>

                <td>{{ branch.absent }}</td>

                <td>{{ Number(branch.rate).toFixed(1) }}%</td>

                <td>{{ branch.wfo }}</td>

                <td>{{ branch.wfa }}</td>

                <td>
                  <span class="status" :class="branch.status.toLowerCase()">
                    {{ branch.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="pagination">
          <span class="pagination-info">
            Menampilkan
            {{ paginatedBranches.length }}
            of
            {{ branchPerformance.length }}
            data
          </span>

          <div class="pagination-controls">
            <button :disabled="currentPage <= 1" @click="currentPage--">
              ‹
            </button>

            <button
              v-for="p in totalPages"
              :key="p"
              :class="{ active: p === currentPage }"
              @click="currentPage = p"
            >
              {{ p }}
            </button>

            <button
              :disabled="currentPage >= totalPages"
              @click="currentPage++"
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-if="showModal" class="modal-overlay">
    <div class="modal-box">
      <div class="modal-header">
        <div>
          <h2>Tambah Admin Cabang</h2>
          <p>Buat akun admin untuk manajemen cabang</p>
        </div>

        <button class="modal-close" @click="closeModal">✕</button>
      </div>

      <div class="modal-content">
        <p v-if="formError" class="form-error">
          {{ formError }}
        </p>
        <div class="form-grid">
          <div class="form-group">
            <label>Username</label>

            <input
              v-model="form.username"
              type="text"
              placeholder="Masukkan username"
            />
          </div>

          <div class="form-group">
            <label>Password</label>

            <input
              v-model="form.password"
              type="password"
              placeholder="Masukkan password"
            />
          </div>

          <div class="form-group full">
            <label>Cabang</label>

            <select v-model="form.branch_id">
              <option disabled value="">Pilih cabang</option>

              <option
                v-for="branch in branches"
                :key="branch.branch_id"
                :value="branch.branch_id"
              >
                {{ branch.branch_name }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-cancel" @click="closeModal">Batal</button>

        <button class="btn-submit" @click="handleCreateAdmin">
          Buat Admin
        </button>
      </div>
    </div>
  </div>
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

.main {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  padding: 28px 32px;
  max-width: 100%;
  gap: 20px;
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
  letter-spacing: -0.3px;
}

.subtitle {
  font-size: 13px;
  color: #6b7280;
  margin-top: 3px;
}

.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

.card1 {
  background: #fff;
  border-radius: 14px;
  padding: 20px;
  border: 1px solid #e8e8f0;
  cursor: pointer;
}

/* .card1:hover {
  box-shadow: 0 4px 20px rgba(79, 70, 229, 0.1);
  transform: translateY(-2px);
} */

.card1:active {
  transform: scale(0.98);
}

.card1 h2 {
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.5px;
  margin-bottom: 8px;
}

.card1 p {
  font-size: 12px;
  font-weight: 500;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.card {
  background: #fff;
  border-radius: 14px;
  padding: 20px;
  border: 1px solid #e8e8f0;
  cursor: pointer;

  transition:
    box-shadow 0.2s,
    transform 0.2s;
}

.card:hover {
  box-shadow: 0 4px 20px rgba(79, 70, 229, 0.1);
  transform: translateY(-2px);
}

.card:active {
  transform: scale(0.98);
}

.card h2 {
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.5px;
  margin-bottom: 8px;
}

.card p {
  font-size: 12px;
  font-weight: 500;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.card:nth-child(1) h2 {
  color: #1e1b4b;
}

.card:nth-child(2) h2 {
  color: #16a34a;
}

.card:nth-child(3) h2 {
  color: #d97706;
}

.card:nth-child(4) h2 {
  color: #4f46e5;
}

.panels {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  align-items: start;
}

.panel {
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 16px;
  border: 1px solid #e8e8f0;
}

.panel-header {
  padding: 16px 22px;
  border-bottom: 1px solid #f3f4f6;

  display: flex;
  align-items: center;
  justify-content: space-between;
}

.panel-header h3 {
  font-size: 15px;
  font-weight: 600;
  color: #1e1b4b;
}

.panel-header p {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 2px;
}

.panel-body {
  padding: 16px 20px 20px;
  height: 240px;
  position: relative;
}

.panel-body img {
  width: 120px;
  opacity: 0.12;
}

table {
  width: 100%;
  min-width: 950px;
  border-collapse: collapse;
}

.table-wrapper {
  width: 100%;
  overflow-x: auto;
}

thead tr {
  background: #f8f8ff;
}

th {
  padding: 11px 22px;
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  text-align: left;
  border-bottom: 1px solid #f3f4f6;
}

td {
  padding: 13px 22px;
  font-size: 13px;
  color: #374151;
  border-bottom: 1px solid #f9fafb;
}

tbody tr {
  transition: background 0.15s ease;
}

tbody tr:hover {
  background: #fafafe;
}

tbody tr:last-child td {
  border-bottom: none;
}

.status {
  display: inline-flex;
  align-items: center;
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
}

.status.excellent {
  background: #dcfce7;
  color: #15803d;
}

.status.good {
  background: #dbeafe;
  color: #2563eb;
}

@media (max-width: 1100px) {
  .stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .panels {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 700px) {
  .main {
    padding: 20px;
  }

  .stats {
    grid-template-columns: 1fr;
  }

  .header {
    flex-direction: column;
    gap: 14px;
  }

  table {
    min-width: 900px;
  }

  .table-panel {
    overflow-x: auto;
  }
}

.btn-add {
  padding: 9px 18px;
  background: transparent !important;
  color: #4f46e5 !important;
  border: 1.5px solid #4f46e5 !important;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 600 !important;
  cursor: pointer;
  transition: all 0.2s ease !important;
  white-space: nowrap;
}

.btn-add:hover {
  background: #4f46e5 !important;
  color: #fff !important;
  box-shadow: 0 4px 14px rgba(79, 70, 229, 0.25);
}

.card {
  cursor: pointer;
}

.status.warning {
  background: #fef3c7;
  color: #d97706;
}

.status.critical {
  background: #fee2e2;
  color: #dc2626;
}

.action-row {
  display: flex;
  justify-content: flex-end;
}

.filter-bar {
  display: flex;
  justify-content: flex-end;
  background: #fff;
  padding: 16px 20px;
  border-radius: 14px;
  border: 1px solid #e8e8f0;
}

.empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-style: italic;
  color: #9ca3af;
}

.card-meta {
  display: block;
  margin-top: 10px;

  font-size: 12px;
  color: #9ca3af;

  font-weight: 500;
}

.modal-overlay {
  position: fixed;
  inset: 0;

  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(4px);

  display: flex;
  align-items: center;
  justify-content: center;

  z-index: 999;
}

.modal-box {
  width: 100%;
  max-width: 620px;

  background: white;

  border-radius: 24px;

  overflow: hidden;

  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.18);

  animation: modalFade 0.2s ease;
}

.modal-header {
  padding: 24px 28px;

  border-bottom: 1px solid #f1f5f9;

  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.modal-header h2 {
  font-size: 22px;
  font-weight: 700;
  color: #1e1b4b;
}

.modal-header p {
  margin-top: 6px;

  font-size: 13px;
  color: #6b7280;
}

.modal-close {
  width: 38px;
  height: 38px;

  border: none;
  border-radius: 12px;

  background: #f8fafc;

  cursor: pointer;

  font-size: 16px;

  transition: all 0.2s ease;
}

.modal-close:hover {
  background: #eef2ff;
  color: #4f46e5;
}

.modal-content {
  padding: 28px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.form-group.full {
  grid-column: span 2;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.form-group input {
  height: 48px;

  border: 1px solid #dbe2ea;
  border-radius: 14px;

  padding: 0 16px;

  font-size: 14px;

  outline: none;

  transition: all 0.2s ease;
}

.form-group input:focus {
  border-color: #4f46e5;

  box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
}

.modal-footer {
  padding: 22px 28px;

  border-top: 1px solid #f1f5f9;

  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn-cancel {
  height: 44px;
  padding: 0 20px;

  border: 1px solid #dbe2ea;
  border-radius: 12px;

  background: white;

  font-weight: 600;

  cursor: pointer;
}

.btn-submit {
  height: 44px;
  padding: 0 22px;

  border: none;
  border-radius: 12px;

  background: #4f46e5;
  color: white;

  font-weight: 600;

  cursor: pointer;

  transition: all 0.2s ease;
}

.btn-submit:hover {
  background: #4338ca;
}

@keyframes modalFade {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.98);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.form-group select {
  width: 100%;
  height: 52px;

  padding: 0 16px;

  border: 1px solid #dbe2ea;
  border-radius: 14px;

  background-color: #ffffff !important;
  color: #111827 !important;

  font-size: 14px;
  font-weight: 500;

  outline: none;
  cursor: pointer;

  transition: all 0.2s ease;

  -webkit-appearance: menulist;
  -moz-appearance: menulist;
  appearance: menulist;
}

.form-group select:focus {
  border-color: #4f46e5;

  box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.08);
}

.form-group select option {
  background: #ffffff !important;
  color: #111827 !important;
}

.error-box {
  margin-bottom: 20px;

  padding: 14px 18px;

  border-radius: 14px;

  background: #fee2e2;
  color: #b91c1c;

  border: 1px solid #fecaca;

  font-size: 14px;
  font-weight: 500;
}

.form-error {
  margin-bottom: 18px;

  padding: 12px 14px;

  border-radius: 12px;

  background: #fee2e2;
  color: #dc2626;

  font-size: 13px;
  font-weight: 500;
}

.success-box {
  margin-bottom: 20px;

  padding: 14px 18px;

  border-radius: 14px;

  background: #dcfce7;
  color: #15803d;

  border: 1px solid #bbf7d0;

  font-size: 14px;
  font-weight: 500;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;

  padding: 14px 22px;

  border-top: 1px solid #f3f4f6;
}

.pagination-info {
  font-size: 12px;
  color: #9ca3af;
}

.pagination-controls {
  display: flex;
  gap: 6px;
}

.pagination-controls button {
  min-width: 32px;
  height: 32px;

  padding: 0 10px;

  border-radius: 8px;

  border: 1px solid #e5e7eb;

  background: #f9fafb;
  color: #374151;

  font-size: 13px;
  font-weight: 500;

  cursor: pointer;

  transition: all 0.15s;
}

.pagination-controls button:hover {
  border-color: #4f46e5;

  color: #4f46e5;

  background: #eef2ff;
}

.pagination-controls button.active {
  background: #4f46e5;

  color: #fff;

  border-color: #4f46e5;
}

.pagination-controls button:disabled {
  opacity: 0.4;

  cursor: not-allowed;
}
</style>
