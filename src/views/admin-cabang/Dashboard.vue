<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useAuth } from "@/composables/useAuth";
import AdminProfile from "@/components/AdminProfile.vue";
import QRCode from "qrcode.vue";
import AdminSidebar from "@/components/AdminSidebar.vue";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
  getDashboardSummary,
  getQRCode,
  getBranchSettings,
} from "@/services/adminCabang";

const { user, loadUser } = useAuth();

const showQRModal = ref(false);

const loading = ref(false);

const summary = ref({
  total_employee: 0,
  present: 0,
  late: 0,
  wfa: 0,
  absent: 0,
});
const employees = ref([]);
const settings = ref({});

const search = ref("");
const status = ref("");
// const period = ref("daily");
const date = ref("");

const qrToken = ref("");
const qrExpire = ref("");
const countdown = ref(180);

const popupMessage = ref("");
const showPopup = ref(false);

let countdownInterval = null;

onMounted(async () => {
  loadUser();
  await fetchAll();
  // refresh tiap 2 menit 30 detik
  startQRCountdown();
});

onUnmounted(() => {
  clearInterval(countdownInterval);
});

async function fetchAll() {
  await Promise.all([fetchDashboard(), fetchQR(), fetchSettings()]);
}

// async function fetchDashboard() {
//   const res = await getDashboardSummary({
//     search: search.value || undefined,
//     status: status.value || undefined,
//   });

//   console.log("[BE] Dashboard response success:", res.data);

//   summary.value = res.data.data.stats;
//   employees.value = res.data.data.attendance;
// }

function openPopup(message) {
  popupMessage.value = message;

  showPopup.value = true;

  setTimeout(() => {
    showPopup.value = false;
    popupMessage.value = "";
  }, 3000);
}

async function fetchDashboard() {
  loading.value = true;

  try {
    const res = await getDashboardSummary({
      search: search.value || undefined,
      status: status.value || undefined,
    });

    console.log("DASHBOARD:", res.data);

    if (!res.data?.data) {
      openPopup("Data dashboard tidak valid");
      return;
    }

    summary.value = res.data.data.stats || {};

    employees.value = res.data.data.attendance || [];
  } catch (err) {
    console.error("DASHBOARD ERROR:", err);

    if (err.message === "Network Error") {
      openPopup("Tidak dapat terhubung ke server");

      return;
    }

    openPopup(
      err.response?.data?.message ||
        "Server dashboard sedang bermasalah cek backend",
    );
  } finally {
    loading.value = false;
  }
}

async function fetchQR() {
  try {
    const res = await getQRCode();

    qrToken.value = res.data.data.qr_content;
    qrExpire.value = res.data.data.expires_at;

    console.log("QR:", res.data);
  } catch (err) {
    console.error("QR ERROR:", err);

    openPopup(err.response?.data?.message || "Gagal memuat QR");
  }
}

async function fetchSettings() {
  try {
    const res = await getBranchSettings();

    console.log("SETTINGS:", res.data);

    settings.value = res.data.data || {};
  } catch (err) {
    console.error("SETTINGS ERROR:", err);

    openPopup(err.response?.data?.message || "Gagal memuat settings");
  }
}

// async function handleRefreshQR() {
//   loading.value = true;

//   try {
//     const res = await refreshQRCode();

//     qrToken.value = res.data.data.qr_content;
//     qrExpire.value = res.data.data.expires_at;

//     openPopup("QR berhasil diperbarui");
//   } catch (err) {
//     console.error("REFRESH QR ERROR:", err);

//     openPopup(err.response?.data?.message || "Gagal refresh QR");
//   } finally {
//     loading.value = false;
//   }
// }
function startQRCountdown() {
  clearInterval(countdownInterval);

  countdown.value = 180;

  countdownInterval = setInterval(async () => {
    countdown.value--;

    if (countdown.value <= 0) {
      await fetchQR();

      countdown.value = 180;
    }
  }, 1000);
}

function formatTime(utc) {
  if (!utc) return "-";
  return new Date(utc).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(utc) {
  if (!utc) return "-";
  return new Date(utc).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatExpire(utc) {
  if (!utc) return "-";
  return new Date(utc).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatCountdown(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;

  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function isExpired(utc) {
  return utc && new Date(utc) < new Date();
}

function exportExcel() {
  if (!employees.value.length) {
    openPopup("Tidak ada data");
    return;
  }

  const data = employees.value.map((item) => ({
    ID: item.employee_id,
    Nama: item.employee_username,
    Tanggal: formatDate(item.check_in),
    "Check In": formatTime(item.check_in),
    Status: item.status,
    Mode: item.work_type,
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, ws, "Attendance");

  XLSX.writeFile(wb, "attendance.xlsx");
}

function exportPDF() {
  if (!employees.value.length) {
    openPopup("Tidak ada data");
    return;
  }

  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("Laporan Absensi", 14, 15);

  doc.setFontSize(10);
  doc.text(new Date().toLocaleDateString("id-ID"), 14, 22);

  const rows = employees.value.map((item) => [
    item.employee_id,
    item.employee_username,
    formatDate(item.check_in),
    formatTime(item.check_in),
    item.status,
    item.work_type,
  ]);

  autoTable(doc, {
    startY: 28,
    head: [["ID", "Nama", "Tanggal", "Check In", "Status", "Mode"]],
    body: rows,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [79, 70, 229] },
  });

  doc.save("attendance.pdf");
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
              user?.branch_name ||
              "-"
            }}
            —
            {{
              new Date().toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })
            }}
          </p>
        </div>

        <AdminProfile :user="user" />
      </div>
      <div class="stats">
        <div class="card">
          <h2>{{ summary.total_employee }}</h2>
          <p>Total</p>
        </div>
        <div class="card">
          <h2>{{ summary.present }}</h2>
          <p>Hadir</p>
        </div>
        <div class="card">
          <h2>{{ summary.late }}</h2>
          <p>Terlambat</p>
        </div>
        <div class="card">
          <h2>{{ summary.wfa }}</h2>
          <p>WFA</p>
        </div>
        <div class="card">
          <h2>{{ summary.absent }}</h2>
          <p>Absen</p>
        </div>
      </div>

      <div class="panels">
        <div class="panel">
          <div class="panel-header">
            <h3>Today's Attendance</h3>
          </div>

          <div class="toolbar">
            <input v-model="search" placeholder="Cari karyawan..." />

            <select v-model="status">
              <option value="">Semua</option>
              <option value="PRESENT">Hadir</option>
              <option value="LATE">Terlambat</option>
              <option value="WFA">WFA</option>
              <option value="EARLY_LEAVE">Pulang Cepat</option>
              <option value="ABSENT">Absen</option>
            </select>

            <!-- <select v-model="period">
              <option value="daily">Harian</option>
              <option value="weekly">Mingguan</option>
              <option value="monthly">Bulanan</option>
              <option value="yearly">Tahunan</option>
            </select> -->

            <!-- <input type="date" v-model="date" /> -->

            <!-- <button @click="fetchDashboard">Filter</button> -->
          </div>

          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nama</th>
                <th>Check In</th>
                <th>Status</th>
                <th>Mode</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="item in employees" :key="item.id">
                <!-- <tr v-for="item in filteredEmployees" :key="item.id"> -->
                <td>#{{ item.employee_id }}</td>
                <td>{{ item.employee_username }}</td>
                <td>{{ formatTime(item.check_in) }}</td>
                <td>
                  <span
                    :class="['badge', 'badge-' + item.status?.toLowerCase()]"
                  >
                    {{ item.status }}
                  </span>
                </td>
                <td>{{ item.work_type }}</td>
              </tr>
            </tbody>
          </table>

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

        <div class="panel">
          <div class="panel-header">
            <h3>QR Absensi</h3>
          </div>

          <div class="qr-body">
            <div class="qr-box">
              <QRCode
                v-if="qrToken"
                :value="qrToken"
                :size="180"
                level="H"
                @click="showQRModal = true"
              />
              <p v-else class="qr-loading">Memuat QR...</p>
            </div>

            <div class="qr-expire" v-if="qrExpire">
              <span :class="{ expired: isExpired(qrExpire) }">
                {{ isExpired(qrExpire) ? "QR Expired" : "Berlaku sampai:" }}
                {{ formatExpire(qrExpire) }}
              </span>
            </div>
            <p class="qr-timer">
              QR otomatis refresh dalam
              <strong>{{ formatCountdown(countdown) }}</strong>
            </p>
          </div>
        </div>
      </div>
      <div
        v-if="showQRModal"
        class="qr-modal-overlay"
        @click="showQRModal = false"
      >
        <div class="qr-modal" @click.stop>
          <button class="qr-close" @click="showQRModal = false">✕</button>

          <!-- ganti ukuran qr modal -->
          <QRCode :value="qrToken" :size="500" level="H" />

          <p class="qr-modal-expire">
            Berlaku sampai:
            {{ formatExpire(qrExpire) }}
          </p>
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
  letter-spacing: -0.3px;
}

.header .subtitle {
  font-size: 13px;
  color: #6b7280;
  margin-top: 3px;
  font-weight: 400;
}

.header .avatar {
  width: 40px;
  height: 40px;
  background: #e0e7ff;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  color: #4f46e5;
  cursor: pointer;
}

.export-actions {
  display: flex;
  gap: 8px;
}

.stats {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 14px;
}

.card {
  background: #ffffff;
  border-radius: 14px;
  padding: 20px 20px 18px;
  border: 1px solid #e8e8f0;
  transition:
    box-shadow 0.2s,
    transform 0.2s;
  cursor: default;
}

.card:hover {
  box-shadow: 0 4px 20px rgba(79, 70, 229, 0.1);
  transform: translateY(-2px);
}

.card h2 {
  font-size: 30px;
  font-weight: 700;
  color: #1e1b4b;
  letter-spacing: -0.5px;
  line-height: 1;
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
.card:nth-child(5) h2 {
  color: #dc2626;
}

.panels {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 20px;
  align-items: start;
}

.panel {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e8e8f0;
  overflow: hidden;
}

.panel-header {
  padding: 18px 22px 14px;
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

.toolbar {
  display: flex;
  gap: 10px;
  padding: 16px 22px;
  align-items: center;
  border-bottom: 1px solid #f3f4f6;
}

.toolbar input {
  flex: 1;
  padding: 9px 14px 9px 36px;
  border: 1px solid #e5e7eb;
  border-radius: 9px;
  font-size: 13px;
  color: #374151;
  background: #f9fafb
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' fill='none' viewBox='0 0 24 24'%3E%3Ccircle cx='11' cy='11' r='8' stroke='%239CA3AF' stroke-width='2'/%3E%3Cpath d='M21 21l-4.35-4.35' stroke='%239CA3AF' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E")
    no-repeat 12px center;
  outline: none;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}

.toolbar input:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  background-color: #fff;
}

.toolbar select {
  padding: 9px 32px 9px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 9px;
  font-size: 13px;
  color: #374151;
  background: #f9fafb;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%236B7280' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  cursor: pointer;
  outline: none;
  transition: border-color 0.15s;
}

/* .toolbar select:focus { 
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.toolbar button {
  padding: 9px 18px;
  background: #4f46e5;
  color: #fff;
  border: none;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition:
    background 0.15s,
    transform 0.1s;
  white-space: nowrap;
}

.toolbar button:hover {
  background: #4338ca;
}

.toolbar button:active {
  transform: scale(0.97);
} */

table {
  width: 100%;
  border-collapse: collapse;
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

td .badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.3px;
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

.qr-body {
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}

.qr-box {
  width: 100%;
  aspect-ratio: 1;
  background: #f8f8ff;
  border: 1.5px dashed #c7d2fe;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #a5b4fc;
  font-size: 13px;
}

.qr-token {
  font-family: "Courier New", monospace;
  font-size: 11px;
  color: #6b7280;
  text-align: center;
  word-break: break-all;
  background: #f3f4f6;
  padding: 8px 12px;
  border-radius: 8px;
  width: 100%;
}

.qr-expire {
  font-size: 12px;
  color: #9ca3af;
  text-align: center;
}

.btn-refresh {
  width: 100%;
  padding: 11px;
  background: #4f46e5;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 0.15s,
    box-shadow 0.15s;
  letter-spacing: 0.2px;
}

.btn-refresh:hover {
  background: #4338ca;
  box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);
}

.qr-expire {
  margin-top: 12px;
  font-size: 13px;
  color: #374151;
}

.qr-expire .expired {
  color: #dc2626;
  font-weight: 600;
}

.export {
  padding: 18px 22px 14px;
  display: flex;
  align-items: center;
  justify-content: right;
}

.btn-export {
  margin-top: 40px;
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

.qr-box canvas {
  cursor: pointer;
}

.qr-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);

  display: flex;
  align-items: center;
  justify-content: center;

  z-index: 9999;
}

.qr-modal {
  position: relative;

  background: white;
  padding: 28px;
  border-radius: 24px;

  display: flex;
  flex-direction: column;
  align-items: center;

  gap: 18px;
}

.qr-close {
  position: absolute;
  top: 12px;
  right: 12px;

  border: none;
  background: transparent;

  font-size: 22px;
  cursor: pointer;
}

.qr-modal-expire {
  font-size: 14px;
  color: #666;
}

.popup {
  position: fixed;

  top: 20px;
  left: 50%;

  transform: translateX(-50%);

  background: #fee2e2;
  color: #b91c1c;

  padding: 14px 22px;

  border-radius: 14px;

  font-size: 14px;
  font-weight: 600;

  z-index: 9999;

  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
}

.qr-timer {
  margin-top: 14px;

  font-size: 13px;
  color: #6b7280;

  text-align: center;
}

.qr-timer strong {
  color: #4f46e5;
  font-weight: 700;
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

.btn-export:hover .tooltip {
  opacity: 1;
  visibility: visible;
}

.btn-export:hover .tooltip {
  opacity: 1;
  visibility: visible;
}
</style>
