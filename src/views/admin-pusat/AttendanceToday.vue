<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import adminPusatSidebar from "@/components/AdminPusatSidebar.vue";

import { getTodayAttendance } from "@/services/adminPusat";

const router = useRouter();

const loading = ref(false);

const errorMessage = ref("");

const attendanceToday = ref({
  total_present: 0,
  total_absent: 0,
  total_employees: 0,
  branches: [],
});

const search = ref("");

async function fetchDashboard() {
  loading.value = true;

  try {
    const res = await getTodayAttendance();

    console.log("DASHBOARD:", res.data);

    attendanceToday.value = res.data.data;
  } catch (err) {
    console.error("ATTENDANCE TODAY ERROR:", err);

    console.log("DETAIL ERROR:", err.response?.data);

    errorMessage.value =
      err.response?.data?.message ||
      "Gagal mengambil data attendance today, cek backend";
  } finally {
    loading.value = false;
  }
}

const filteredBranches = computed(() => {
  return (attendanceToday.value?.branches || []).filter((branch) =>
    branch.branch_name?.toLowerCase().includes(search.value.toLowerCase()),
  );
});

function getStatus(rate) {
  if (rate >= 80) return "Sangat Baik";

  if (rate >= 60) return "Baik";

  return "Kritis";
}

function getStatusClass(rate) {
  if (rate >= 80) return "sangat-baik";

  if (rate >= 60) return "baik";

  return "kritis";
}

function goBack() {
  router.back();
}

onMounted(() => {
  fetchDashboard();
});
</script>

<template>
  <div class="attendance-page">
    <adminPusatSidebar />
    <div class="content">
      <div class="page-header">
        <div>
          <h1>Absensi Hari Ini</h1>

          <p>Monitoring kehadiran seluruh cabang secara realtime</p>
        </div>

        <!-- <button class="back-btn" @click="goBack">×</button> -->
      </div>

      <div v-if="errorMessage" class="error-box">
        {{ errorMessage }}
      </div>

      <div class="summary-grid">
        <div class="summary-card blue">
          <span>Total Hadir</span>

          <h2>
            {{ attendanceToday.total_present || 0 }}
          </h2>
        </div>

        <div class="summary-card red">
          <span>Total Karyawan</span>

          <h2>
            {{ attendanceToday.total_employees || 0 }}
          </h2>
        </div>

        <div class="summary-card purple">
          <span>Persentase Kehadiran</span>

          <h2>
            {{
              attendanceToday.total_employees
                ? Math.round(
                    (attendanceToday.total_present /
                      attendanceToday.total_employees) *
                      100,
                  )
                : 0
            }}%
          </h2>
        </div>
      </div>

      <div class="toolbar">
        <input
          v-model="search"
          type="text"
          placeholder="Cari cabang..."
          class="search-input"
        />
      </div>

      <div v-if="loading" class="loading-state">Memuat kehadiran...</div>

      <div v-else class="table-card">
        <div class="table-region">
          <p class="mobile-table-hint" aria-hidden="true">
            Geser tabel ke samping untuk melihat kolom lainnya
          </p>

          <div
            class="table-wrapper"
            tabindex="0"
            role="region"
            aria-label="Data kehadiran cabang"
          >
            <table>
              <caption class="sr-only">
                Data kehadiran seluruh cabang hari ini
              </caption>
              <thead>
                <tr>
                  <th>Nama Cabang</th>
                  <th>Total Karyawan</th>
                  <th>Hadir</th>
                  <th>Tidak Hadir</th>
                  <th>Persentase</th>
                  <th>Progres</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="branch in filteredBranches"
                  :key="branch.branch_name"
                >
                  <td>
                    {{ branch.branch_name }}
                  </td>

                  <td>
                    {{ branch.total_employees }}
                  </td>

                  <td>
                    {{ branch.present_today }}
                  </td>

                  <td>
                    {{ branch.absent }}
                  </td>

                  <td>{{ Math.round(branch.attendance_rate || 0) }}%</td>

                  <td width="35%">
                    <div class="progress-bar">
                      <div
                        class="progress-fill"
                        :style="{
                          width:
                            Math.min(branch.attendance_rate || 0, 100) + '%',
                        }"
                      ></div>
                    </div>
                  </td>

                  <td>
                    <span
                      class="status-badge"
                      :class="getStatusClass(branch.attendance_rate)"
                    >
                      {{ getStatus(branch.attendance_rate) }}
                    </span>
                  </td>
                </tr>

                <tr v-if="!filteredBranches.length">
                  <td colspan="7" class="empty-table">
                    Tidak ada data kehadiran ditemukan
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.attendance-page {
  min-height: 100vh;

  background: #f8fafc;

  display: flex;
}

.content {
  min-width: 0;
  flex: 1;
  padding: 28px 32px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  margin-bottom: 28px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 28px;
}

.page-header > div:first-child {
  min-width: 0;
}

.page-header h1 {
  font-size: 32px;
  font-weight: 700;

  color: #0f172a;
}

.page-header p {
  margin-top: 8px;

  color: #64748b;
  font-size: 15px;
}

.back-btn {
  width: 40px;
  height: 40px;

  border: 1px solid #e8e8f0;
  background: white;

  border-radius: 12px;

  font-size: 22px;
  color: #6b7280;

  cursor: pointer;

  transition: all 0.2s ease;
}

.back-btn:hover {
  background: #f5f3ff;
  color: #4f46e5;
}

.summary-card {
  padding: 24px;

  border-radius: 24px;

  background: white;

  border: 1px solid #eef2ff;
}

.summary-card span {
  font-size: 14px;
  color: #64748b;
}

.summary-card h2 {
  margin-top: 12px;

  font-size: 38px;
  font-weight: 700;
}

.summary-card.blue {
  background: #eef2ff;
  color: #4338ca;
}

.summary-card.green {
  background: #ecfdf5;
  color: #059669;
}

.summary-card.purple {
  background: #f5f3ff;
  color: #7c3aed;
}

.toolbar {
  margin-bottom: 24px;
}

.search-input {
  width: 420px;
  /* width: 320px; */
  height: 46px;

  border: 1px solid #dbe2ea;
  border-radius: 14px;

  padding: 0 16px;

  font-size: 14px;

  outline: none;
}

.search-input:focus {
  border-color: #4f46e5;

  box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.08);
}

.table-card {
  background: white;

  border-radius: 24px;

  overflow: hidden;

  border: 1px solid #eef2ff;
}

.table-region {
  position: relative;
  min-width: 0;
}

.table-wrapper {
  width: 100%;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scrollbar-width: thin;
  scrollbar-color: #c7d2fe #f8f8ff;
}

.table-wrapper::-webkit-scrollbar {
  height: 8px;
}

.table-wrapper::-webkit-scrollbar-track {
  background: #f8f8ff;
}

.table-wrapper::-webkit-scrollbar-thumb {
  background: #c7d2fe;
  border-radius: 999px;
  border: 2px solid #f8f8ff;
}

.mobile-table-hint {
  display: none;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  overflow: hidden;
  white-space: nowrap;
}

table {
  width: 100%;
  min-width: 900px;
  border-collapse: separate;
  border-spacing: 0;
  table-layout: fixed;
}

thead {
  background: #f8fafc;
}

th {
  text-align: left;

  padding: 18px 22px;

  font-size: 14px;
  font-weight: 700;

  color: #64748b;

  text-transform: uppercase;
}

td {
  padding: 22px;

  border-top: 1px solid #f1f5f9;

  font-size: 14px;

  color: #0f172a;
}

.progress-bar {
  width: 100%;
  height: 10px;

  background: #e5e7eb;

  border-radius: 999px;

  overflow: hidden;
}

.progress-fill {
  height: 100%;

  background: #4f46e5;

  border-radius: 999px;
}

.status-badge {
  padding: 8px 14px;

  border-radius: 999px;

  font-size: 12px;
  font-weight: 600;
}

.status-badge.sangat-baik {
  background: #dcfce7;
  color: #15803d;
}

.status-badge.baik {
  background: #dbeafe;
  color: #2563eb;
}

.status-badge.kritis {
  background: #fee2e2;
  color: #dc2626;
}

.loading-state {
  padding: 80px;

  text-align: center;

  color: #64748b;
}

.empty-table {
  text-align: center;

  padding: 50px;

  color: #94a3b8;
}

.summary-card.red {
  background: #fef2f2;
  color: #dc2626;
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

tr.critical-row {
  background: #fef2f2;
}

@media (max-width: 768px) {
  .attendance-page {
    flex-direction: column;
  }

  .content {
    padding: 20px 16px 28px;
  }

  .page-header {
    flex-direction: column;
    gap: 16px;
  }

  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .summary-card {
    min-width: 0;
  }

  .toolbar {
    margin-bottom: 18px;
  }

  .search-input {
    width: 100%;
  }

  .mobile-table-hint {
    display: flex;
    align-items: center;
    gap: 7px;
    margin: 0;
    padding: 10px 16px;
    border-bottom: 1px solid #edf0f4;
    background: #fafaff;
    color: #6b7280;
    font-size: 11px;
  }

  .mobile-table-hint::before {
    content: "↔";
    color: #4f46e5;
  }

  .table-wrapper {
    scroll-snap-type: x proximity;
  }
}

@media (max-width: 480px) {
  .content {
    padding: 16px 12px 24px;
  }

  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .summary-card {
    min-height: 108px;
    padding: 16px;
    border-radius: 16px;
  }

  .summary-card h2 {
    margin-top: 10px;
    font-size: 28px;
  }

  .summary-card span {
    font-size: 11px;
  }

  .table-card {
    border-radius: 14px;
  }

  .page-header h1 {
    font-size: 24px;
  }

  .page-header p {
    font-size: 13px;
  }
}

@media (max-width: 360px) {
  .content {
    padding-inline: 10px;
  }

  .summary-grid {
    gap: 8px;
  }

  .summary-card {
    min-height: 102px;
    padding: 14px;
  }

  .summary-card h2 {
    font-size: 24px;
  }

  .summary-card span {
    font-size: 10px;
  }

  .page-header h1 {
    font-size: 22px;
  }

  .page-header p {
    font-size: 12px;
  }
}
</style>
