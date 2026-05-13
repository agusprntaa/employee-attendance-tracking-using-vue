<script setup>
import { ref, onMounted, onUnmounted, nextTick, computed } from "vue";
import Chart from "chart.js/auto";
import AdminSidebar from "@/components/AdminSidebar.vue";
import AdminProfile from "@/components/AdminProfile.vue";
import { useAuth } from "@/composables/useAuth";
import API from "@/services/api";
import { getReportsAttendance } from "@/services/adminCabang";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const { user, loadUser } = useAuth();

const loading = ref(false);

const summary = ref({
  average_attendance_rate: 0,
  total_present: 0,
  late_arrivals: 0,
  attendance_rate_change: 0,
  total_present_change: 0,
  late_arrivals_change: 0,
});

const weeklyData = ref([]);
const monthlyData = ref([]);
const daily = ref([]);
const currentPage = ref(1);
const itemsPerPage = 10;
const divisions = ref([]);

const startDate = ref("");
const endDate = ref("");
const year = ref(new Date().getFullYear());

const weeklyCanvasRef = ref(null);
const monthlyCanvasRef = ref(null);

let weeklyInstance = null;
let monthlyInstance = null;

async function fetchReports() {
  loading.value = true;
  try {
    const params = {};

    if (startDate.value) params.start_date = startDate.value;
    if (endDate.value) params.end_date = endDate.value;
    if (year.value) params.year = year.value;

    const res = await getReportsAttendance(params); // ✅ INI YANG KURANG
    const data = res.data.data;

    summary.value = data.summary || {};
    weeklyData.value = data.weekly_chart || [];
    monthlyData.value = data.monthly_chart || [];
    daily.value = data.daily || [];
    divisions.value = data.division || [];

    await nextTick();
    renderWeekly();
    renderMonthly();
  } catch (err) {
    console.error("REPORT ERROR:", err);
  } finally {
    loading.value = false;
  }
}

function renderWeekly() {
  weeklyInstance?.destroy();
  if (!weeklyCanvasRef.value || !weeklyData.value.length) return;

  weeklyInstance = new Chart(weeklyCanvasRef.value, {
    type: "bar",
    data: {
      labels: weeklyData.value.map((d) => d.day),
      datasets: [
        {
          label: "Present",
          data: weeklyData.value.map((d) => d.present),
          backgroundColor: "#4f46e5",
          borderRadius: 4,
          borderSkipped: false,
        },
        {
          label: "Late",
          data: weeklyData.value.map((d) => d.late),
          backgroundColor: "#f59e0b",
          borderRadius: 4,
          borderSkipped: false,
        },
        {
          label: "WFA",
          data: weeklyData.value.map((d) => d.wfa),
          backgroundColor: "#a78bfa",
          borderRadius: 4,
          borderSkipped: false,
        },
        {
          label: "Absent",
          data: weeklyData.value.map((d) => d.absent),
          backgroundColor: "#fca5a5",
          borderRadius: 4,
          borderSkipped: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 12, family: "Segoe UI" }, color: "#9ca3af" },
          border: { display: false },
        },
        y: {
          grid: { color: "#f3f4f6", drawBorder: false },
          beginAtZero: true,
          ticks: { font: { size: 12, family: "Segoe UI" }, color: "#9ca3af" },
          border: { display: false },
        },
      },
    },
  });
}

function renderMonthly() {
  monthlyInstance?.destroy();
  if (!monthlyCanvasRef.value || !monthlyData.value.length) return;

  monthlyInstance = new Chart(monthlyCanvasRef.value, {
    type: "line",
    data: {
      labels: monthlyData.value.map((d) => d.month),
      datasets: [
        {
          label: "Attendance Rate",
          data: monthlyData.value.map((d) => d.attendance_rate),
          borderColor: "#4f46e5",
          backgroundColor: "rgba(79, 70, 229, 0.08)",
          fill: true,
          tension: 0.4,
          pointBackgroundColor: "#4f46e5",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          pointRadius: 5,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 12, family: "Segoe UI" }, color: "#9ca3af" },
          border: { display: false },
        },
        y: {
          grid: { color: "#f3f4f6" },
          min: 60,
          max: 100,
          ticks: {
            font: { size: 12, family: "Segoe UI" },
            color: "#9ca3af",
            callback: (v) => v + "%",
          },
          border: { display: false },
        },
      },
    },
  });
}

function formatChange(val) {
  if (val === undefined || val === null) return "—";
  const n = parseFloat(val);
  return n >= 0 ? `+${n}%` : `${n}%`;
}

function isPositive(val) {
  return parseFloat(val) >= 0;
}

function formatDate(str) {
  if (!str) return "-";
  return new Date(str).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const totalPages = computed(() => {
  return Math.ceil(daily.value.length / itemsPerPage);
});

const paginatedDaily = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;

  const end = start + itemsPerPage;

  return daily.value.slice(start, end);
});

onMounted(() => {
  fetchReports();
});

onUnmounted(() => {
  weeklyInstance?.destroy();
  monthlyInstance?.destroy();
});

//export
function exportPDF() {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("Attendance Reports", 14, 18);

  doc.setFontSize(11);
  doc.text(
    `Period: ${startDate.value || "-"} to ${endDate.value || "-"}`,
    14,
    28,
  );

  autoTable(doc, {
    startY: 38,
    head: [["Date", "Present", "Late", "WFA", "Absent"]],
    body: daily.value.map((d) => [
      formatDate(d.date),
      d.total_present,
      d.total_late,
      d.total_wfa,
      d.total_absent,
    ]),
  });

  doc.save("attendance-report.pdf");
}

function exportExcel() {
  const worksheet = XLSX.utils.json_to_sheet(
    daily.value.map((d) => ({
      Date: formatDate(d.date),
      Present: d.total_present,
      Late: d.total_late,
      WFA: d.total_wfa,
      Absent: d.total_absent,
    })),
  );

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance Reports");

  XLSX.writeFile(workbook, "attendance-report.xlsx");
}
</script>

<template>
  <div class="layout">
    <AdminSidebar />

    <main class="main">
      <div class="header">
        <div>
          <h2>Reports</h2>
          <p class="subtitle">Attendance analytics and insights</p>
        </div>
        <AdminProfile :user="user" />
      </div>

      <!-- TOOLBAR -->
      <div class="filter-bar">
        <div class="filter-group">
          <label>Start Date</label>
          <input type="date" v-model="startDate" />
        </div>

        <div class="filter-group">
          <label>End Date</label>
          <input type="date" v-model="endDate" />
        </div>

        <button class="btn-apply" @click="fetchReports" :disabled="loading">
          {{ loading ? "Loading..." : "Apply" }}
          <span class="tooltip"> Apply Filters </span>
        </button>

        <!-- export -->
        <div class="export">
          <div class="export-actions">
            <button class="btn-export excel" @click="exportExcel">
              Excel
              <span class="tooltip"> Export to Excel </span>
            </button>
            <button class="btn-export pdf" @click="exportPDF">
              PDF
              <span class="tooltip"> Export to PDF </span>
            </button>
          </div>
        </div>
      </div>

      <!-- SUMMARY CARDS -->
      <div class="cards">
        <div class="card">
          <p class="card-label">Average Attendance Rate</p>
          <h3 class="card-value">
            {{ summary.average_attendance_rate ?? 0 }}%
          </h3>
          <span
            class="card-change"
            :class="
              isPositive(summary.attendance_rate_change)
                ? 'positive'
                : 'negative'
            "
          >
            {{ formatChange(summary.attendance_rate_change) }} vs last period
          </span>
        </div>

        <div class="card">
          <p class="card-label">Total Present</p>
          <h3 class="card-value">{{ summary.total_present ?? 0 }}</h3>
          <span
            class="card-change"
            :class="
              isPositive(summary.total_present_change) ? 'positive' : 'negative'
            "
          >
            {{ formatChange(summary.total_present_change) }} vs last period
          </span>
        </div>

        <div class="card">
          <p class="card-label">Late Arrivals</p>
          <h3 class="card-value late">{{ summary.late_arrivals ?? 0 }}</h3>
          <span
            class="card-change"
            :class="
              isPositive(summary.late_arrivals_change) ? 'negative' : 'positive'
            "
          >
            {{ formatChange(summary.late_arrivals_change) }} vs last period
          </span>
        </div>
      </div>

      <!-- CHARTS -->
      <div class="chart-row">
        <div class="panel">
          <div class="panel-header">
            <h3>Weekly Attendance</h3>
            <div class="legend">
              <span class="dot" style="background: #4f46e5"></span>Present
              <span class="dot" style="background: #f59e0b"></span>Late
              <span class="dot" style="background: #a78bfa"></span>WFA
              <span class="dot" style="background: #fca5a5"></span>Absent
            </div>
          </div>
          <div class="chart-body">
            <canvas
              ref="weeklyCanvasRef"
              role="img"
              aria-label="Bar chart showing weekly attendance by day"
            ></canvas>
            <p v-if="!weeklyData.length && !loading" class="empty">
              No data available
            </p>
          </div>
        </div>

        <div class="panel">
          <div class="panel-header">
            <h3>Monthly Trend</h3>
            <div class="legend">
              <span class="dot" style="background: #4f46e5"></span>Attendance
              Rate
            </div>
          </div>
          <div class="chart-body">
            <canvas
              ref="monthlyCanvasRef"
              role="img"
              aria-label="Line chart showing monthly attendance rate trend"
            ></canvas>
            <p v-if="!monthlyData.length && !loading" class="empty">
              No data available
            </p>
          </div>
        </div>
      </div>

      <!-- DIVISION PERFORMANCE TABLE -->
      <div class="panel">
        <div class="panel-header">
          <h3>Division Performance</h3>
        </div>
        <table>
          <thead>
            <tr>
              <th>Division</th>
              <th>Total Employees</th>
              <th>Attendance Rate</th>
              <th>Progress</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!divisions.length">
              <td colspan="5" class="empty-cell">No division data</td>
            </tr>
            <tr v-for="d in divisions" :key="d.division_name">
              <td class="bold">{{ d.division_name }}</td>
              <td>{{ d.total_employees }}</td>
              <td>{{ d.attendance_rate }}%</td>
              <td>
                <div class="progress-bar">
                  <div
                    class="progress-fill"
                    :style="{ width: d.attendance_rate + '%' }"
                  ></div>
                </div>
              </td>
              <td>
                <span
                  class="badge"
                  :class="{
                    'badge-excellent': d.status === 'Excellent',
                    'badge-good': d.status === 'Good',
                    'badge-poor': d.status === 'Poor',
                  }"
                  >{{ d.status }}</span
                >
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- DAILY ATTENDANCE TABLE -->
      <div class="panel">
        <div class="panel-header">
          <h3>Daily Breakdown</h3>
        </div>
        <div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Present</th>
                <th>Late</th>
                <th>WFA</th>
                <th>Absent</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!daily.length">
                <td colspan="5" class="empty-cell">No daily data</td>
              </tr>
              <tr v-for="d in paginatedDaily" :key="d.date">
                <td class="bold">{{ formatDate(d.date) }}</td>
                <td>
                  <span class="badge badge-PRESENT">{{ d.total_present }}</span>
                </td>
                <td>
                  <span class="badge badge-LATE">{{ d.total_late }}</span>
                </td>
                <td>
                  <span class="badge badge-WFA">{{ d.total_wfa }}</span>
                </td>
                <td>
                  <span class="badge badge-ABSENT">{{ d.total_absent }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="pagination">
          <span class="pagination-info">
            Showing {{ paginatedDaily.length }} of {{ daily.length }} data
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
    </main>
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

  display: flex;
  flex-direction: column;

  padding: 28px 32px;

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

.filter-bar {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  background: #fff;
  padding: 16px 20px;
  border-radius: 14px;
  border: 1px solid #e8e8f0;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 120px;
}

.filter-group label {
  font-size: 10px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.6px;
}

.filter-group input {
  height: 36px;
  padding: 0 12px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  font-size: 13px;
  color: #1f2937;
  background: #ffffff;
  outline: none;

  transition: all 0.2s ease;
}

.btn-apply {
  position: relative;
  padding: 9px 20px;
  background: #4f46e5;
  color: #fff;
  border: none;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
  white-space: nowrap;
}

.btn-apply:hover {
  background: #4338ca;
}

.btn-apply:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.card {
  background: #fff;
  border-radius: 14px;
  padding: 20px;
  border: 1px solid #e8e8f0;
  transition:
    box-shadow 0.2s,
    transform 0.2s;
}

.card:hover {
  box-shadow: 0 4px 20px rgba(79, 70, 229, 0.1);
  transform: translateY(-2px);
}

.card-label {
  font-size: 12px;
  font-weight: 500;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.card-value {
  font-size: 30px;
  font-weight: 700;
  color: #1e1b4b;
  letter-spacing: -0.5px;
  margin: 8px 0 6px;
  line-height: 1;
}

.card-value.late {
  color: #dc2626;
}

.card-change {
  font-size: 12px;
  font-weight: 500;
}

.positive {
  color: #16a34a;
}

.negative {
  color: #dc2626;
}

.chart-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.chart-body {
  padding: 16px 20px 20px;
  height: 240px;
  position: relative;
}

.empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: #9ca3af;
}

.legend {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: #6b7280;
}

.dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 2px;
}

.panel {
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 16px;
  border: 1px solid #e8e8f0;
  overflow: hidden;
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

table {
  width: 100%;
  border-collapse: collapse;
}

tbody {
  vertical-align: top;
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

tbody tr:hover {
  background: #fafafe;
}

tbody tr:last-child td {
  border-bottom: none;
}

td.bold {
  font-weight: 600;
  color: #1e1b4b;
}

.empty-cell {
  text-align: center;
  color: #9ca3af;
  font-style: italic;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #4f46e5;
  border-radius: 10px;
  transition: width 0.4s ease;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.3px;
}

.badge-excellent {
  background: #dcfce7;
  color: #15803d;
}

.badge-good {
  background: #dbeafe;
  color: #1d4ed8;
}

.badge-poor {
  background: #fee2e2;
  color: #b91c1c;
}

.badge-PRESENT {
  background: #dcfce7;
  color: #15803d;
}

.badge-LATE {
  background: #fef9c3;
  color: #b45309;
}

.badge-WFA {
  background: #ede9fe;
  color: #6d28d9;
}

.badge-ABSENT {
  background: #fee2e2;
  color: #b91c1c;
}

/* export */
.export {
  display: flex;
  gap: 10px;
}

.btn-export {
  padding: 8px 18px;
  border-radius: 10px;
  border: 1.5px solid #4f46e5;
  background: transparent;
  color: #4f46e5;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  letter-spacing: 0.2px;
}

.btn-export:hover {
  background: #4f46e5;
  color: white;
  box-shadow: 0 4px 14px rgba(79, 70, 229, 0.25);
}

.btn-export:active {
  transform: scale(0.96);
}

.btn-export.excel {
  border-color: #16a34a;
  color: #16a34a;
}

.btn-export.excel:hover {
  background: #16a34a;
  color: white;
  box-shadow: 0 4px 14px rgba(22, 163, 74, 0.3);
}

.btn-export.pdf {
  border-color: #dc2626;
  color: #dc2626;
}

.btn-export.pdf:hover {
  background: #dc2626;
  color: white;
  box-shadow: 0 4px 14px rgba(220, 38, 38, 0.3);
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

.export-actions {
  display: flex;
  gap: 10px;
}

.btn-export {
  position: relative;
  padding: 8px 14px;
  border-radius: 10px;
  border: 1.5px solid #4f46e5;
  background: transparent;
  color: #4f46e5;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  letter-spacing: 0.2px;
}

.tooltip {
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translate(-50%, -100%);
  background: #111827;
  color: white;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 11px;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: 0.18s ease;
  pointer-events: none;
  z-index: 9999;
}

.btn-export:hover .tooltip,
.btn-apply:hover .tooltip {
  opacity: 1;
  visibility: visible;
}

.btn-export:hover .tooltip {
  opacity: 1;
  visibility: visible;
}
</style>
