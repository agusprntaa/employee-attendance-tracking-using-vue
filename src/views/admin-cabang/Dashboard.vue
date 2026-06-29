<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useAuth } from "@/composables/useAuth";
import AdminProfile from "@/components/AdminProfile.vue";
import QRCode from "qrcode.vue";
import AdminSidebar from "@/components/AdminSidebar.vue";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getStatusLabel, getStatusClass } from "@/utils/attendanceStatus";

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
let qrInterval = null;
const qrCountdown = ref("--:--");

const popupMessage = ref("");
const showPopup = ref(false);

const showReasonModal = ref(false);
const selectedReason = ref("");
const selectedEmployee = ref("");

const page = ref(1);
const limit = ref(10);

onMounted(async () => {
  loadUser();
  await fetchAll();
  watch([search, status], () => {
    page.value = 1;

    fetchDashboard();
  });
  // refresh tiap 2 menit 30 detik
});

onUnmounted(() => {
  clearInterval(qrInterval);
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

function openReason(item) {
  selectedEmployee.value = item.employee_username || "-";

  if (item.work_type === "WFA") {
    selectedReason.value = item.wfa_reason || "Tidak ada alasan WFA";
  } else if (item.status === "EARLY_LEAVE") {
    selectedReason.value =
      item.early_leave_reason || "Tidak ada alasan pulang cepat";
  } else {
    selectedReason.value = "Tidak ada alasan";
  }

  console.log("ITEM:", item);
  console.log("SELECTED REASON:", selectedReason.value);

  showReasonModal.value = true;
}

// console.log(item);

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

    console.log(res.data.data.attendance);

    console.log(
      "RAW CHECKIN:",
      res.data.data.attendance.map((i) => i.check_in),
    );

    console.log("DASHBOARD:", res.data);

    if (!res.data?.data) {
      openPopup("Data dashboard tidak valid");
      return;
    }

    summary.value = res.data.data.stats || {};

    employees.value = res.data.data.attendance || [];

    console.log("TOTAL EMPLOYEE:", summary.value.total_employee);

    console.log("TOTAL ROW TABLE:", employees.value.length);
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

// async function fetchQR() {
//   try {
//     const res = await getQRCode();

//     console.log("QR RESPONSE:", res.data);

//     qrToken.value = res.data.data.token;
//     qrExpire.value = res.data.data.expired_at;

//     startQRCountdown(qrExpire.value);

//     console.log("EXPIRE:", qrExpire.value);
//   } catch (err) {
//     console.error("QR ERROR:", err);

//     openPopup(err.response?.data?.message || "Gagal memuat QR");
//   }
// }
async function fetchQR() {
  try {
    const res = await getQRCode();

    console.log("QR INNER DATA:", res.data.data);

    qrToken.value = res.data.data.qr_content;

    qrExpire.value = res.data.data.expires_at;

    console.log("EXPIRE:", qrExpire.value);

    startQRCountdown(qrExpire.value);
  } catch (err) {
    console.error("QR ERROR:", err.response?.data || err);

    openPopup(err.response?.data?.message || "Gagal memuat QR");
  }
}

function startQRCountdown(expiredAt) {
  clearInterval(qrInterval);

  if (!expiredAt) {
    qrCountdown.value = "--:--";
    return;
  }

  qrInterval = setInterval(() => {
    const now = Date.now();

    const expire = Date.parse(expiredAt);
    if (isNaN(expire)) {
      qrCountdown.value = "--:--";
      return;
    }

    const distance = expire - now;

    if (distance <= 0) {
      qrCountdown.value = "00:00";

      clearInterval(qrInterval);

      fetchQR();

      return;
    }

    const minutes = Math.floor(distance / 1000 / 60);

    const seconds = Math.floor((distance / 1000) % 60);

    qrCountdown.value = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }, 1000);
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

async function handleRefreshQR() {
  loading.value = true;

  try {
    const res = await refreshQRCode();

    qrToken.value = res.data.data.qr_content;
    qrExpire.value = res.data.data.expires_at;

    openPopup("QR berhasil diperbarui");
  } catch (err) {
    console.error("REFRESH QR ERROR:", err);

    openPopup(err.response?.data?.message || "Gagal refresh QR");
  } finally {
    loading.value = false;
  }
}

function formatTime(dateString) {
  if (!dateString) return "-";

  return new Date(dateString).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Makassar",
  });
}

function formatExpire(dateString) {
  if (!dateString) return "-";

  return new Date(dateString).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Makassar",
  });
}

function formatDate(dateString) {
  if (!dateString) return "-";

  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Makassar",
  });
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
    Masuk: formatTime(item.check_in),
    Pulang: item.check_out ? formatTime(item.check_out) : "-",
    Status: formatStatus(item.status),
    "Mode Kerja": item.work_type,
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, ws, "Absensi");

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
    item.check_out ? formatTime(item.check_out) : "-",
    formatStatus(item.status),
    item.work_type || "-",
  ]);

  autoTable(doc, {
    startY: 28,
    head: [["ID", "Nama", "Tanggal", "Masuk", "Pulang", "Status", "Mode"]],
    body: rows,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [79, 70, 229] },
  });

  doc.save("attendance.pdf");
}

function formatStatus(status) {
  if (!status || status === "") return "Belum Absen";

  switch (status) {
    case "ON_TIME":
      return "Hadir";

    case "LATE":
      return "Terlambat";

    case "WFA":
      return "WFA";

    case "EARLY_LEAVE":
      return "Pulang Cepat";

    case "ABSENT":
      return "Tidak Hadir";

    case "BELUM_ABSEN":
      return "Belum Absen";

    default:
      return "Belum Absen";
  }
}

const sortedEmployees = computed(() => {
  return [...employees.value].sort((a, b) => {
    const aBelum =
      !a.status || a.status === "BELUM_ABSEN" || a.status === "ABSENT";

    const bBelum =
      !b.status || b.status === "BELUM_ABSEN" || b.status === "ABSENT";

    const aCheckout = !!a.check_out;
    const bCheckout = !!b.check_out;

    // yang sudah checkout paling atas
    if (aCheckout !== bCheckout) {
      return aCheckout ? -1 : 1;
    }

    // belum absen paling bawah
    if (aBelum !== bBelum) {
      return aBelum ? 1 : -1;
    }

    return a.employee_id - b.employee_id;
  });
});

const totalPages = computed(() => {
  return Math.ceil(sortedEmployees.value.length / limit.value);
});

const paginatedEmployees = computed(() => {
  const start = (page.value - 1) * limit.value;

  const end = start + limit.value;

  return sortedEmployees.value.slice(start, end);
});
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
                timeZone: "Asia/Makassar",
              })
            }}
          </p>
        </div>

        <AdminProfile :user="user" />
      </div>
      <div class="stats">
        <div class="card">
          <h2>{{ summary.total_employee }}</h2>
          <p>Total Karyawan</p>
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
          <p>Absen/Tidak Hadir</p>
        </div>
      </div>

      <div class="panels">
        <div class="panel">
          <div class="panel-header">
            <h3>Absensi Hari Ini</h3>

            <div class="export">
              <div class="export-actions">
                <button class="btn-export excel" @click="exportExcel">
                  Excel
                  <span class="tooltip"> Export ke Excel </span>
                </button>
                <button class="btn-export pdf" @click="exportPDF">
                  PDF
                  <span class="tooltip"> Export ke PDF </span>
                </button>
              </div>
            </div>
          </div>

          <div class="toolbar">
            <input v-model="search" placeholder="Cari karyawan..." />

            <select v-model="status">
              <option value="">Semua</option>
              <option value="ON_TIME">Hadir</option>
              <option value="LATE">Terlambat</option>
              <option value="WFA">WFA</option>
              <option value="ABSENT">Tidak Hadir</option>
              <option value="BELUM_ABSEN">Belum Absen</option>
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

          <div class="table-region">
            <p class="mobile-table-hint" aria-hidden="true">
              Geser tabel ke samping untuk melihat kolom lainnya
            </p>

            <div
              class="table-scroll"
              tabindex="0"
              role="region"
              aria-label="Data absensi hari ini, dapat digeser secara horizontal"
            >
              <table>
                <caption class="sr-only">
                  Daftar absensi karyawan hari ini
                </caption>

                <colgroup>
                  <col class="col-id" />
                  <col class="col-name" />
                  <col class="col-time" />
                  <col class="col-time" />
                  <col class="col-status" />
                  <col class="col-mode" />
                </colgroup>

                <thead>
                  <tr>
                    <th scope="col">ID</th>
                    <th scope="col">Nama</th>
                    <th scope="col">Masuk</th>
                    <th scope="col">Pulang</th>
                    <th scope="col">Status</th>
                    <th scope="col">Mode Kerja</th>
                  </tr>
                </thead>

                <tbody>
                  <tr v-for="item in paginatedEmployees" :key="item.id">
                    <!-- <tr v-for="item in filteredEmployees" :key="item.id"> -->
                    <td>#{{ item.employee_id }}</td>
                    <th scope="row" class="employee-name">
                      {{ item.employee_username }}
                    </th>
                    <td>{{ formatTime(item.check_in) }}</td>
                    <td>
                      {{ item.check_out ? formatTime(item.check_out) : "-" }}
                    </td>
                    <td>
                      <div class="badge-wrapper">
                        <span
                          :class="[
                            'badge',
                            getStatusClass(item.status),
                            item.status === 'EARLY_LEAVE' ? 'clickable' : '',
                          ]"
                          @click="
                            item.status === 'EARLY_LEAVE'
                              ? openReason(item)
                              : null
                          "
                        >
                          {{ getStatusLabel(item.status) }}

                          {{ item.status === "EARLY_LEAVE" ? " ⓘ" : "" }}
                        </span>

                        <span
                          v-if="item.status === 'EARLY_LEAVE'"
                          class="badge-tooltip"
                        >
                          Cek alasan pulang cepat
                        </span>
                      </div>
                    </td>
                    <td>
                      <div class="badge-wrapper">
                        <span
                          :class="[
                            'mode-badge',
                            item.work_type?.toLowerCase(),
                            item.work_type === 'WFA' ? 'clickable' : '',
                          ]"
                          @click="
                            item.work_type === 'WFA' ? openReason(item) : null
                          "
                        >
                          {{ item.work_type || "-" }}

                          {{ item.work_type === "WFA" ? " ⓘ" : "" }}
                        </span>

                        <span
                          v-if="item.work_type === 'WFA'"
                          class="badge-tooltip"
                        >
                          Cek alasan WFA
                        </span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="pagination">
            <span class="pagination-info">
              Menampilkan
              {{ paginatedEmployees.length }}
              dari
              {{ sortedEmployees.length }}
              Data Absensi
            </span>

            <div class="pagination-controls">
              <button :disabled="page <= 1" @click="page--">‹</button>

              <button
                v-for="p in totalPages"
                :key="p"
                :class="{ active: p === page }"
                @click="page = p"
              >
                {{ p }}
              </button>

              <button :disabled="page >= totalPages" @click="page++">›</button>
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
                {{ isExpired(qrExpire) ? "QR Kadaluwarsa" : "Berlaku sampai:" }}
                {{ formatExpire(qrExpire) }}
              </span>
            </div>
            <p class="qr-timer">
              QR otomatis refresh dalam
              <!-- <strong>{{ formatCountdown(countdown) }}</strong> -->
              <strong>{{ qrCountdown }}</strong>
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

      <div
        v-if="showReasonModal"
        class="reason-overlay"
        @click="showReasonModal = false"
      >
        <div class="reason-modal" @click.stop>
          <button class="reason-close" @click="showReasonModal = false">
            ✕
          </button>

          <h3>Detail Alasan</h3>
          <div class="reason-user">
            {{ selectedEmployee }}
          </div>

          <p class="reason-text">
            {{ selectedReason }}
          </p>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.layout {
  --primary: #4f46e5;
  --primary-dark: #4338ca;
  --navy: #1e1b4b;
  --surface: #ffffff;
  --background: #f4f5ff;
  --border: #e6e8f0;
  --muted: #6b7280;
  --text: #374151;
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  background: var(--background);
  font-family:
    "Segoe UI",
    Inter,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    sans-serif;
}

.main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 28px 32px 36px;
}

.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
}

.header > div:first-child {
  min-width: 0;
}

.header h2 {
  margin: 0;
  color: var(--navy);
  font-size: clamp(22px, 2vw, 26px);
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: -0.35px;
}

.header .subtitle {
  margin: 5px 0 0;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.5;
}

.stats {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 14px;
}

.card {
  position: relative;
  min-width: 0;
  min-height: 118px;
  padding: 20px;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--surface);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
  transition:
    transform 180ms ease,
    box-shadow 180ms ease;
}

.card::before {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: #818cf8;
  content: "";
}

.card:nth-child(2)::before {
  background: #22c55e;
}
.card:nth-child(3)::before {
  background: #f59e0b;
}
.card:nth-child(4)::before {
  background: #6366f1;
}
.card:nth-child(5)::before {
  background: #ef4444;
}

.card:hover {
  box-shadow: 0 8px 24px rgba(30, 27, 75, 0.08);
  transform: translateY(-2px);
}

.card h2 {
  margin: 0 0 10px;
  color: var(--navy);
  font-size: 30px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.5px;
}

.card:nth-child(2) h2 {
  color: #15803d;
}
.card:nth-child(3) h2 {
  color: #b45309;
}
.card:nth-child(4) h2 {
  color: var(--primary);
}
.card:nth-child(5) h2 {
  color: #dc2626;
}

.card p {
  margin: 0;
  color: #858b98;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.45;
  letter-spacing: 0.42px;
  text-transform: uppercase;
}

.panels {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(300px, 360px);
  gap: 20px;
  align-items: start;
}

.panel {
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--surface);
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.03);
}

.panel-header {
  min-height: 62px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 20px;
  border-bottom: 1px solid #edf0f4;
}

.panel-header h3 {
  margin: 0;
  color: var(--navy);
  font-size: 15px;
  font-weight: 650;
  line-height: 1.4;
}

.export,
.export-actions {
  display: flex;
  align-items: center;
}

.export-actions {
  gap: 8px;
}

.btn-export {
  position: relative;
  min-height: 36px;
  padding: 7px 13px;
  border: 1px solid currentColor;
  border-radius: 9px;
  background: #ffffff;
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.3;
  cursor: pointer;
  transition:
    background-color 160ms ease,
    color 160ms ease,
    box-shadow 160ms ease,
    transform 100ms ease;
}

.btn-export.excel {
  color: #15803d;
}
.btn-export.pdf {
  color: #dc2626;
}
.btn-export.excel:hover {
  background: #15803d;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(21, 128, 61, 0.2);
}
.btn-export.pdf:hover {
  background: #dc2626;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.2);
}
.btn-export:active {
  transform: scale(0.97);
}

.btn-export:focus-visible,
.toolbar input:focus-visible,
.toolbar select:focus-visible,
.pagination-controls button:focus-visible,
.qr-close:focus-visible,
.reason-close:focus-visible,
.table-scroll:focus-visible {
  outline: 3px solid rgba(99, 102, 241, 0.22);
  outline-offset: 2px;
}

.tooltip,
.badge-tooltip {
  position: absolute;
  z-index: 30;
  left: 50%;
  padding: 6px 9px;
  border-radius: 7px;
  background: #111827;
  color: #ffffff;
  font-size: 11px;
  line-height: 1.3;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition:
    opacity 150ms ease,
    visibility 150ms ease;
}

.tooltip {
  top: -8px;
  transform: translate(-50%, -100%);
}

.badge-tooltip {
  top: -35px;
  transform: translateX(-50%);
}

.btn-export:hover .tooltip,
.badge-wrapper:hover .badge-tooltip {
  opacity: 1;
  visibility: visible;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  border-bottom: 1px solid #edf0f4;
  background: #ffffff;
}

.toolbar input,
.toolbar select {
  min-height: 40px;
  border: 1px solid #dfe3ea;
  border-radius: 9px;
  outline: none;
  color: var(--text);
  font-family: inherit;
  font-size: 13px;
  transition:
    border-color 150ms ease,
    box-shadow 150ms ease;
}

.toolbar input {
  flex: 1;
  min-width: 160px;
  padding: 9px 14px 9px 38px;
  background: #f9fafb
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='15' height='15' fill='none' viewBox='0 0 24 24'%3E%3Ccircle cx='11' cy='11' r='7.5' stroke='%239CA3AF' stroke-width='2'/%3E%3Cpath d='M20 20l-3.7-3.7' stroke='%239CA3AF' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E")
    no-repeat 13px center;
}

.toolbar select {
  flex: 0 0 auto;
  min-width: 142px;
  padding: 9px 34px 9px 12px;
  appearance: none;
  background-color: #f9fafb;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%236B7280' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 11px center;
  cursor: pointer;
}

.toolbar input:focus,
.toolbar select:focus {
  border-color: var(--primary);
  background-color: #ffffff;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.table-scroll {
  width: 100%;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scrollbar-width: thin;
  scrollbar-color: #c7d2fe #f8f8ff;
}

.table-scroll::-webkit-scrollbar {
  height: 8px;
}

.table-scroll::-webkit-scrollbar-track {
  background: #f8f8ff;
}

.table-scroll::-webkit-scrollbar-thumb {
  border: 2px solid #f8f8ff;
  border-radius: 999px;
  background: #c7d2fe;
}

.table-region {
  position: relative;
  min-width: 0;
}

.mobile-table-hint {
  display: none;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.col-id {
  width: 88px;
}

.col-name {
  width: 190px;
}

.col-time {
  width: 112px;
}

.col-status {
  width: 156px;
}

.col-mode {
  width: 136px;
}

tbody .employee-name {
  overflow: hidden;
  padding: 13px 18px;
  border-bottom: 1px solid #f0f2f5;
  color: #1f2937;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.45;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}

th:nth-child(1),
td:nth-child(1),
th:nth-child(3),
td:nth-child(3),
th:nth-child(4),
td:nth-child(4) {
  font-variant-numeric: tabular-nums;
}

th:nth-child(3),
td:nth-child(3),
th:nth-child(4),
td:nth-child(4) {
  text-align: center;
}

table {
  width: 100%;
  min-width: 794px;
  border-collapse: separate;
  border-spacing: 0;
  table-layout: fixed;
}

thead tr {
  background: #f8f8ff;
}

th,
td {
  padding: 13px 18px;
  text-align: left;
  vertical-align: middle;
}

th {
  border-bottom: 1px solid #e9ebf1;
  color: #6b7280;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.4;
  letter-spacing: 0.55px;
  text-transform: uppercase;
}

td {
  overflow: hidden;
  border-bottom: 1px solid #f0f2f5;
  color: var(--text);
  font-size: 13px;
  line-height: 1.45;
  text-overflow: ellipsis;
  white-space: nowrap;
}

tbody tr {
  transition: background-color 120ms ease;
}

tbody tr:hover {
  background: #fafafe;
}

tbody tr:last-child td {
  border-bottom: 0;
}

.badge-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.badge,
.mode-badge {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 650;
  line-height: 1.35;
  letter-spacing: 0.1px;
}

.badge.hadir {
  background: #dcfce7;
  color: #15803d;
}
.badge.late {
  background: #fef3c7;
  color: #a16207;
}
.badge.wfa {
  background: #e0e7ff;
  color: #4338ca;
}
.badge.early {
  background: #fee2e2;
  color: #b91c1c;
}
.badge.absent {
  background: #fee2e2;
  color: #b91c1c;
}
.badge.belum_absen {
  background: #e5e7eb;
  color: #4b5563;
}
.mode-badge.wfo {
  background: #dbeafe;
  color: #1d4ed8;
}
.mode-badge.wfa {
  background: #ede9fe;
  color: #6d28d9;
}

.clickable {
  cursor: pointer;
  transition:
    transform 140ms ease,
    box-shadow 140ms ease;
}

.clickable:hover {
  box-shadow: 0 4px 10px rgba(79, 70, 229, 0.16);
  transform: translateY(-1px);
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  border-top: 1px solid #edf0f4;
}

.pagination-info {
  color: #858b98;
  font-size: 12px;
  line-height: 1.5;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 6px;
}

.pagination-controls button {
  min-width: 34px;
  height: 34px;
  padding: 0 9px;
  border: 1px solid #dfe3ea;
  border-radius: 8px;
  background: #ffffff;
  color: var(--text);
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition:
    background-color 140ms ease,
    border-color 140ms ease,
    color 140ms ease;
}

.pagination-controls button:hover:not(:disabled):not(.active) {
  border-color: #a5b4fc;
  background: #eef2ff;
  color: var(--primary);
}

.pagination-controls button.active {
  border-color: var(--primary);
  background: var(--primary);
  color: #ffffff;
}

.pagination-controls button:disabled {
  opacity: 0.42;
  cursor: not-allowed;
}

.qr-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 22px;
}

.qr-box {
  width: min(100%, 270px);
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  overflow: hidden;
  border: 1px dashed #a5b4fc;
  border-radius: 14px;
  background: #fafaff;
  color: #818cf8;
  font-size: 13px;
}

.qr-box canvas {
  display: block;
  max-width: 78%;
  height: auto !important;
  cursor: pointer;
}

.qr-loading,
.qr-expire,
.qr-timer {
  margin: 0;
  text-align: center;
}

.qr-expire {
  margin-top: 4px;
  color: var(--text);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.5;
}

.qr-expire .expired {
  color: #dc2626;
}

.qr-timer {
  color: var(--muted);
  font-size: 12px;
  line-height: 1.5;
}

.qr-timer strong {
  color: var(--primary);
  font-weight: 700;
}

.qr-modal-overlay,
.reason-overlay {
  position: fixed;
  inset: 0;
  z-index: 1900;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(15, 23, 42, 0.62);
  backdrop-filter: blur(3px);
}

.qr-modal,
.reason-modal {
  position: relative;
  width: min(100%, 560px);
  max-height: calc(100dvh - 40px);
  overflow: auto;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  background: #ffffff;
  box-shadow: 0 26px 70px rgba(15, 23, 42, 0.28);
}

.qr-modal {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  padding: 30px;
}

.qr-modal canvas {
  display: block;
  width: min(500px, 100%) !important;
  height: auto !important;
}

.qr-close,
.reason-close {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 2;
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border: 1px solid #e5e7eb;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.94);
  color: #374151;
  font-family: inherit;
  font-size: 17px;
  cursor: pointer;
}

.qr-close:hover,
.reason-close:hover {
  background: #f3f4f6;
}

.qr-modal-expire {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.5;
  text-align: center;
}

.reason-modal {
  max-width: 430px;
  padding: 28px;
}

.reason-modal h3 {
  margin: 0 0 18px;
  padding-right: 42px;
  color: var(--navy);
  font-size: 19px;
  font-weight: 700;
  line-height: 1.4;
}

.reason-user {
  margin-bottom: 12px;
  color: var(--primary);
  font-size: 13px;
  font-weight: 650;
  overflow-wrap: anywhere;
}

.reason-text {
  margin: 0;
  padding: 15px;
  border: 1px solid #edf0f4;
  border-radius: 12px;
  background: #f9fafb;
  color: var(--text);
  font-size: 13px;
  line-height: 1.7;
  overflow-wrap: anywhere;
}

.popup {
  position: fixed;
  top: 20px;
  left: 50%;
  z-index: 2100;
  width: min(calc(100% - 32px), 420px);
  padding: 13px 18px;
  border: 1px solid #fecaca;
  border-radius: 12px;
  background: #fef2f2;
  color: #b91c1c;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.14);
  font-size: 13px;
  font-weight: 600;
  line-height: 1.5;
  text-align: center;
  transform: translateX(-50%);
}

@media (max-width: 1240px) {
  .main {
    padding-inline: 24px;
  }

  .stats {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .panels {
    grid-template-columns: minmax(0, 1fr) 300px;
  }
}

@media (max-width: 1024px) {
  .panels {
    grid-template-columns: minmax(0, 1fr);
  }

  .panels > .panel:last-child {
    width: 100%;
  }

  .qr-box {
    width: min(100%, 280px);
  }
}

@media (max-width: 768px) {
  .layout {
    flex-direction: column;
  }

  .main {
    gap: 18px;
    padding: 20px 16px 28px;
  }

  .header {
    gap: 16px;
  }

  .header .subtitle {
    font-size: 13px;
  }

  .stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .card {
    min-height: 104px;
    padding: 18px;
  }

  .card h2 {
    font-size: 27px;
  }

  .panel-header,
  .toolbar,
  .pagination,
  .qr-body {
    padding-inline: 16px;
  }

  .toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .toolbar input,
  .toolbar select {
    width: 100%;
    min-width: 0;
  }

  th,
  td {
    padding-inline: 14px;
  }

  .pagination {
    align-items: flex-start;
    flex-direction: column;
  }

  .pagination-controls {
    width: 100%;
    overflow-x: auto;
    padding-bottom: 3px;
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
    line-height: 1.4;
  }

  .mobile-table-hint::before {
    color: #4f46e5;
    font-size: 15px;
    content: "↔";
  }

  .table-scroll {
    scroll-snap-type: x proximity;
  }

  tbody .employee-name {
    padding-inline: 14px;
  }
}

@media (max-width: 480px) {
  .main {
    padding: 16px 12px 24px;
  }

  .header {
    flex-direction: column;
  }

  .stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .card {
    min-width: 0;
    min-height: 108px;
    display: block;
    padding: 16px;
  }

  .card h2 {
    margin: 0 0 9px;
    font-size: 26px;
  }

  .card p {
    max-width: none;
    font-size: 10.5px;
    line-height: 1.4;
    text-align: left;
    overflow-wrap: anywhere;
  }

  .panel {
    border-radius: 14px;
  }

  .panel-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .export,
  .export-actions {
    width: 100%;
  }

  .btn-export {
    flex: 1;
    min-height: 40px;
  }

  .tooltip,
  .badge-tooltip {
    display: none;
  }

  .qr-modal-overlay,
  .reason-overlay {
    padding: 12px;
  }

  .qr-modal,
  .reason-modal {
    max-height: calc(100dvh - 24px);
    border-radius: 16px;
  }

  .qr-modal {
    padding: 54px 16px 22px;
  }

  .reason-modal {
    padding: 24px 18px;
  }
}

@media (max-width: 360px) {
  .main {
    padding-inline: 10px;
  }

  .stats {
    gap: 8px;
  }

  .card {
    min-height: 102px;
    padding: 14px;
  }

  .card h2 {
    font-size: 24px;
  }

  .card p {
    font-size: 10px;
    letter-spacing: 0.28px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .card,
  .btn-export,
  .clickable,
  tbody tr {
    transition: none;
  }
}
</style>
