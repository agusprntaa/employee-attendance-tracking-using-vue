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
  if (rate >= 80) return "Excellent";

  if (rate >= 60) return "Good";

  return "Critical";
}

function getStatusClass(rate) {
  if (rate >= 80) return "excellent";

  if (rate >= 60) return "good";

  return "critical";
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
          <h1>Today Attendance Overview</h1>

          <p>Real-time attendance monitoring across all branches</p>
        </div>

        <button class="back-btn" @click="goBack">×</button>
      </div>

      <div v-if="errorMessage" class="error-box">
        {{ errorMessage }}
      </div>

      <div class="summary-grid">
        <div class="summary-card blue">
          <span>Total Present</span>

          <h2>
            {{ attendanceToday.total_present || 0 }}
          </h2>
        </div>

        <div class="summary-card red">
          <span>Total Employees</span>

          <h2>
            {{ attendanceToday.total_employees || 0 }}
          </h2>
        </div>

        <div class="summary-card purple">
          <span>Attendance Rate</span>

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
          placeholder="Search branch..."
          class="search-input"
        />
      </div>

      <div v-if="loading" class="loading-state">Loading attendance...</div>

      <div v-else class="table-card">
        <table>
          <thead>
            <tr>
              <th>Branch Name</th>
              <th>Total Employees</th>
              <th>Present</th>
              <th>Absent</th>
              <th>Rate</th>
              <th>Progress</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="branch in filteredBranches" :key="branch.branch_name">
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
                      width: Math.min(branch.attendance_rate || 0, 100) + '%',
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
              <td colspan="7" class="empty-table">No attendance data found</td>
            </tr>
          </tbody>
        </table>
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
  flex: 1;

  padding: 32px;

  overflow-x: auto;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));

  gap: 20px;

  margin-bottom: 28px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  margin-bottom: 28px;
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
  width: 320px;
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

table {
  width: 100%;

  border-collapse: collapse;
}

thead {
  background: #f8fafc;
}

th {
  text-align: left;

  padding: 18px 22px;

  font-size: 13px;
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

.status-badge.excellent {
  background: #dcfce7;
  color: #15803d;
}

.status-badge.good {
  background: #dbeafe;
  color: #2563eb;
}

.status-badge.critical {
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
</style>
