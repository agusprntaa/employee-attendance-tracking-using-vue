<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import * as XLSX from "xlsx";
import autoTable from "jspdf-autotable";
import { useRoute, useRouter } from "vue-router";
import AdminSidebar from "@/components/AdminSidebar.vue";
import AdminProfile from "@/components/AdminProfile.vue";
import QRCode from "qrcode.vue";
import { useAuth } from "@/composables/useAuth";

import {
  getEventDetail,
  getEventQR,
  getEventParticipants,
  getEventAttendance,
  getEventParticipantList,
  addParticipants,
  addAllParticipants,
  deleteParticipant,
} from "@/services/adminCabangEvent";

const { user, loadUser } = useAuth();

const router = useRouter();
const route = useRoute();

const eventId = route.params.id;

const event = ref({});

const participants = ref([]);
const attendanceRows = ref([]);
const eventDates = ref([]);
const selectedDate = ref("");
const attendanceSummary = ref({ total: 0, total_hadir: 0, total_belum: 0 });
const selectedEmployees = ref([]);
const allSelected = computed(() => {
  const available = participants.value.filter((item) => !item.terdaftar);

  return (
    available.length > 0 && selectedEmployees.value.length === available.length
  );
});
const qr = ref(null);

const showQRModal = ref(false);

const qrCountdown = ref("--:--");

let qrInterval = null;

const search = ref("");

function formatDate(date) {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function startQRCountdown() {
  clearInterval(qrInterval);

  qrInterval = setInterval(() => {
    const now = Date.now();

    const expire = Date.parse(qr.value.expires_at);

    const distance = expire - now;

    if (distance <= 0) {
      qrCountdown.value = "00:00";

      clearInterval(qrInterval);

      fetchQR();

      return;
    }

    const minute = Math.floor(distance / 1000 / 60);

    const second = Math.floor((distance / 1000) % 60);

    qrCountdown.value = `${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}`;
  }, 1000);
}

async function fetchEvent() {
  const res = await getEventDetail(eventId);
  const payload = res.data.data || {};
  event.value = {
    name: payload.event_name,
    location: payload.location,
    radius_meter: payload.radius_meter,
    start_date: payload.start_date,
    end_date: payload.end_date,
    start_time: payload.start_time,
    end_time: payload.end_time,
    description: payload.description,
  };
}

async function fetchParticipants() {
  const res = await getEventParticipants(eventId);

  participants.value = res.data.data;
}

async function fetchAttendance() {
  const res = await getEventAttendance(eventId);
  const payload = res.data.data || {};
  attendanceSummary.value = {
    total: payload.total || 0,
    total_hadir: payload.total_hadir || 0,
    total_belum: payload.total_belum || 0,
  };
  attendanceRows.value = Array.isArray(payload.data) ? payload.data : [];
  eventDates.value = Array.isArray(payload.dates) ? payload.dates : [];
  if (!selectedDate.value && eventDates.value.length) {
    const today = new Date().toISOString().split("T")[0];

    selectedDate.value = eventDates.value.includes(today)
      ? today
      : eventDates.value[0];
  }
}

async function fetchParticipantAttendance() {
  const res = await getEventParticipantList(
    eventId,
    selectedDate.value || undefined,
  );
  const rows = Array.isArray(res.data.data) ? res.data.data : [];
  if (selectedDate.value) {
    attendanceRows.value = rows;
  }
}

async function changeAttendanceDate() {
  page.value = 1;
  if (!selectedDate.value) return;
  await fetchParticipantAttendance();
  page.value = 1;
}

async function fetchQR() {
  const res = await getEventQR(eventId);
  qr.value = res.data.data;
  startQRCountdown();
}

onUnmounted(() => {
  clearInterval(qrInterval);
});

const filteredParticipants = computed(() => {
  return attendanceRows.value.filter((item) =>
    item.employee_name.toLowerCase().includes(search.value.toLowerCase()),
  );
});

const filteredAvailableParticipants = computed(() => {
  return participants.value.filter((item) =>
    item.employee_name.toLowerCase().includes(search.value.toLowerCase()),
  );
});

const page = ref(1);

const limit = ref(10);

const totalPages = computed(() =>
  Math.ceil(filteredParticipants.value.length / limit.value),
);

const paginatedParticipants = computed(() => {
  const start = (page.value - 1) * limit.value;

  return filteredParticipants.value.slice(start, start + limit.value);
});

const showParticipantModal = ref(false);

async function openParticipantModal() {
  selectedEmployees.value = [];

  await fetchParticipants();

  showParticipantModal.value = true;
}

function closeParticipantModal() {
  showParticipantModal.value = false;
}

function toggleSelectAll() {
  if (allSelected.value) {
    selectedEmployees.value = [];
    return;
  }

  selectedEmployees.value = participants.value
    .filter((item) => !item.terdaftar)
    .map((item) => item.employee_id);
}

async function removeParticipant(employeeId) {
  await deleteParticipant(eventId, employeeId);

  await fetchParticipants();
  await fetchParticipantAttendance();
}

async function saveParticipants() {
  if (!selectedEmployees.value.length) return;
  if (allSelected.value) {
    await addAllParticipants(eventId);
  } else {
    await addParticipants(eventId, selectedEmployees.value);
  }
  closeParticipantModal();
  await fetchParticipants();
  await fetchParticipantAttendance();
}

function exportExcel() {
  if (!attendanceRows.value.length) {
    alert("Tidak ada data absensi untuk diexport");
    return;
  }
  const data = attendanceRows.value.map((item) => ({
    ID: `EMP-${item.employee_id}`,
    "Nama Karyawan": item.employee_name,
    "Absen Masuk": item.check_in || "-",
    Divisi: item.division_name || "-",
    "Jarak (Meter)": item.distance_meter != null ? item.distance_meter : "-",
    Status: item.status || (item.hadir ? "Hadir" : "Belum Hadir"),
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Absensi Event");
  XLSX.writeFile(
    wb,
    `${event.value.name || "Absensi_Event"}_${selectedDate.value || ""}.xlsx`,
  );
}

function exportPDF() {
  if (!attendanceRows.value.length) {
    alert("Tidak ada data absensi untuk diexport");
    return;
  }
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("Laporan Absensi Event", 14, 16);
  doc.setFontSize(10);
  doc.text(`Event : ${event.value.name || "-"}`, 14, 24);
  doc.text(`Tanggal : ${selectedDate.value || "-"}`, 14, 30);
  doc.text(`Lokasi : ${event.value.location || "-"}`, 14, 36);
  const rows = attendanceRows.value.map((item) => [
    `EMP-${item.employee_id}`,
    item.employee_name,
    item.check_in || "-",
    item.division_name || "-",
    item.distance_meter != null ? `${item.distance_meter} m` : "-",
    item.status || (item.hadir ? "Hadir" : "Belum Hadir"),
  ]);
  autoTable(doc, {
    startY: 44,
    head: [["ID", "Nama Karyawan", "Absen Masuk", "Divisi", "Jarak", "Status"]],
    body: rows,
    styles: {
      fontSize: 9,
    },
    headStyles: {
      fillColor: [79, 70, 229],
    },
  });
  doc.save(
    `${event.value.name || "Absensi_Event"}_${selectedDate.value || ""}.pdf`,
  );
}

function goBack() {
  router.back();
}

function openQRModal() {
  showQRModal.value = true;
}

function closeQRModal() {
  showQRModal.value = false;
}

onMounted(async () => {
  loadUser();
  await fetchEvent();
  await fetchParticipants();
  await fetchAttendance();
  await fetchQR();
});
</script>

<template>
  <div class="layout">
    <AdminSidebar />

    <main class="main">
      <div class="header">
        <div>
          <button class="btn-back" @click="goBack">← Kembali</button>

          <h2>{{ event.name }}</h2>

          <p class="subtitle">
            {{ event.location }}
            •
            {{ event.start_date || event.date }}
            <template
              v-if="event.end_date && event.end_date !== event.start_date"
            >
              s/d {{ event.end_date }}
            </template>
          </p>
        </div>

        <AdminProfile :user="user" />
      </div>

      <section class="top-grid">
        <section class="panel detail-panel">
          <div class="panel-header">
            <h3>Detail Event</h3>
          </div>

          <div class="detail-grid">
            <div class="detail-item">
              <label>Nama Event</label>
              <span>{{ event.name }}</span>
            </div>

            <div class="detail-item">
              <label>Lokasi</label>
              <span>{{ event.location }}</span>
            </div>

            <div class="detail-item">
              <label>Radius</label>
              <span>{{ event.radius_meter }} Meter</span>
            </div>

            <div class="detail-item">
              <label>Tanggal</label>
              <span>
                {{ event.start_date || event.date }}
                <template
                  v-if="event.end_date && event.end_date !== event.start_date"
                >
                  s/d {{ event.end_date }}
                </template>
              </span>
            </div>

            <div class="detail-item">
              <label>Jam</label>
              <span>{{ event.start_time }} - {{ event.end_time }}</span>
            </div>

            <div class="detail-item full">
              <label>Deskripsi</label>
              <span>{{ event.description }}</span>
            </div>
          </div>
        </section>

        <section class="panel qr-panel">
          <div class="panel-header">
            <h3>QR Event</h3>
          </div>

          <p class="qr-hint">Klik QR Code untuk memperbesar</p>

          <div class="qr-wrapper">
            <div class="qr-box" @click="openQRModal">
              <QRCode v-if="qr" :value="qr.token" :size="280" level="H" />

              <p v-else class="qr-loading">Memuat QR...</p>
            </div>

            <div class="qr-info">
              <p class="qr-expire">
                Berlaku sampai

                <strong>
                  {{ qr?.expires_at }}
                </strong>
              </p>

              <p class="qr-countdown">
                QR otomatis diperbarui

                <!-- <strong>
                  {{ qrCountdown }}
                </strong> -->
              </p>
            </div>
          </div>
        </section>
      </section>

      <section class="stats attendance-stats">
        <div class="card">
          <h2>{{ attendanceSummary.total }}</h2>
          <p>Total Peserta</p>
        </div>
        <div class="card">
          <h2>{{ attendanceSummary.total_hadir }}</h2>
          <p>Sudah Hadir</p>
        </div>
        <div class="card">
          <h2>{{ attendanceSummary.total_belum }}</h2>
          <p>Belum Hadir</p>
        </div>
      </section>

      <section class="panel participant-panel">
        <div class="panel-header">
          <div>
            <h3>Peserta Event</h3>
            <p>Daftar peserta dan status absensi event</p>
          </div>

          <button class="btn-add" @click="openParticipantModal">
            + Tambah Peserta
          </button>
        </div>

        <div class="toolbar">
          <div class="filter-wrap">
            <select
              v-if="eventDates.length"
              v-model="selectedDate"
              @change="changeAttendanceDate"
            >
              <option v-for="date in eventDates" :key="date" :value="date">
                {{ formatDate(date) }}
              </option>
            </select>
          </div>

          <div class="search-wrap">
            <input
              v-model="search"
              type="text"
              placeholder="Cari karyawan..."
            />
          </div>

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

        <div class="table-region">
          <p class="mobile-table-hint">
            Geser tabel ke samping untuk melihat seluruh data peserta
          </p>

          <div
            class="table-scroll"
            tabindex="0"
            role="region"
            aria-label="Daftar peserta event"
          >
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nama Karyawan</th>
                  <th>Absen Masuk</th>
                  <th>Divisi</th>
                  <th>Jarak</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="item in paginatedParticipants"
                  :key="item.employee_id"
                >
                  <td>EMP-{{ item.employee_id }}</td>

                  <td class="bold">
                    {{ item.employee_name }}
                  </td>

                  <td>
                    {{ item.check_in || "--:--" }}
                  </td>

                  <td>
                    {{ item.division_name || "-" }}
                  </td>

                  <td>
                    {{
                      item.distance_meter !== undefined &&
                      item.distance_meter !== null
                        ? `${Number(item.distance_meter).toFixed(0)} m`
                        : "-"
                    }}
                  </td>
                  <td>
                    <span
                      class="badge"
                      :class="
                        item.status || (item.hadir ? 'Hadir' : 'Belum Hadir')
                      "
                    >
                      {{
                        item.status
                          ? item.status
                          : item.hadir
                            ? "Hadir"
                            : "Belum Hadir"
                      }}
                    </span>
                  </td>
                </tr>

                <tr v-if="!paginatedParticipants.length">
                  <td colspan="6" class="empty-table">
                    Belum ada data absensi pada tanggal yang dipilih.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="pagination">
          <span class="pagination-info">
            Menampilkan
            {{ paginatedParticipants.length }}
            dari
            {{ filteredParticipants.length }}
            peserta
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

            <button
              :disabled="page >= totalPages || totalPages === 0"
              @click="page++"
            >
              ›
            </button>
          </div>
        </div>
      </section>
    </main>
  </div>

  <div
    v-if="showParticipantModal"
    class="modal-overlay"
    @click.self="closeParticipantModal"
  >
    <div class="modal-box">
      <div class="modal-header">
        <h3>Tambah Peserta Event</h3>

        <button class="modal-close" @click="closeParticipantModal">✕</button>
      </div>

      <div class="modal-body">
        <div class="participant-toolbar">
          <button class="btn-select-all" @click="toggleSelectAll">
            {{ allSelected ? "Batal Pilih Semua" : "Pilih Semua" }}
          </button>

          <input
            v-model="search"
            class="participant-search"
            placeholder="Cari karyawan..."
            type="text"
          />
        </div>

        <div class="participant-list">
          <label
            v-for="item in filteredAvailableParticipants"
            :key="item.employee_id"
            class="participant-card"
            :class="{ disabled: item.terdaftar }"
          >
            <input
              type="checkbox"
              :value="item.employee_id"
              v-model="selectedEmployees"
              :disabled="item.terdaftar"
            />

            <div class="participant-info">
              <div class="participant-name">
                {{ item.employee_name }}
              </div>

              <div class="participant-division">
                {{ item.division_name }}
              </div>
            </div>

            <span v-if="item.terdaftar" class="participant-badge">
              Terdaftar
            </span>
          </label>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-cancel" @click="closeParticipantModal">Batal</button>

        <button class="btn-add" @click="saveParticipants">
          Simpan Peserta
        </button>
      </div>
    </div>
  </div>

  <div v-if="showQRModal" class="qr-modal-overlay" @click.self="closeQRModal">
    <div class="qr-modal">
      <button class="qr-modal-close" @click="closeQRModal">✕</button>

      <QRCode v-if="qr" :value="qr.token" :size="520" level="H" />

      <p class="qr-modal-title">QR Event</p>

      <p class="qr-modal-subtitle">
        Berlaku sampai

        <strong>
          {{ qr?.expires_at }}
        </strong>
      </p>
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
  background: #f4f6fb;
}

.main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 28px 32px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
}

.header h2 {
  margin-top: 10px;
  color: #1e1b4b;
  font-size: 28px;
  font-weight: 700;
}

.subtitle {
  margin-top: 5px;
  color: #6b7280;
  font-size: 14px;
}

.btn-back {
  border: none;
  background: transparent;
  color: #4f46e5;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.btn-back:hover {
  text-decoration: underline;
}

.top-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 560px;
  gap: 22px;
  margin-bottom: 22px;
  align-items: stretch;
}

.panel {
  overflow: hidden;
  border: 1px solid #e8e8f0;
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.04);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  padding: 20px 22px;
  border-bottom: 1px solid #edf0f4;
}

.panel-header h3 {
  color: #1e1b4b;
  font-size: 18px;
  font-weight: 700;
}

.panel-header p {
  margin-top: 4px;
  color: #6b7280;
  font-size: 13px;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 22px;
  border-bottom: 1px solid #edf0f4;
}

.filter-wrap {
  width: 180px;
  flex-shrink: 0;
}

.filter-wrap select {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  border: 1px solid #d8deea;
  border-radius: 10px;
  background: white;
  font-size: 13px;
  outline: none;
  cursor: pointer;
  transition: 0.2s;
}

.filter-wrap select:focus {
  border-color: #4f46e5;
}

.export-actions {
  display: flex;
  gap: 10px;
}

.search-wrap {
  flex: 1;
  min-width: 220px;
}

.toolbar input {
  width: 100%;
  height: 40px;
  padding: 0 14px;
  border: 1px solid #d8deea;
  border-radius: 10px;
  font-size: 13px;
  outline: none;
  transition: 0.2s;
}

.toolbar input:focus {
  border-color: #4f46e5;
}

.btn-export {
  position: relative;

  height: 40px;

  padding: 0 16px;

  border-radius: 10px;

  border: 1.5px solid #4f46e5;

  background: transparent;

  color: #4f46e5;

  font-size: 12px;

  font-weight: 600;

  cursor: pointer;

  transition: 0.2s;
}

.btn-export.excel {
  border-color: #16a34a;
  color: #16a34a;
}

.btn-export.excel:hover {
  background: #16a34a;
  color: white;
}

.btn-export.pdf {
  border-color: #dc2626;
  color: #dc2626;
}

.btn-export.pdf:hover {
  background: #dc2626;
  color: white;
}

.btn-add {
  height: 40px;
  padding: 0 18px;
  border: none;
  border-radius: 10px;
  background: #4f46e5;
  color: white;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
}

.btn-add:hover {
  background: #4338ca;
}

.tooltip {
  position: absolute;
  top: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  padding: 6px 10px;
  border-radius: 8px;
  background: #111827;
  color: white;
  font-size: 11px;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: 0.2s;
  z-index: 9999;
}

.btn-export:hover .tooltip {
  opacity: 1;
  visibility: visible;
}

.qr-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
}

.qr-box {
  width: 100%;
  min-height: 360px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f8ff;
  border: 2px dashed #c7d2fe;
  border-radius: 18px;
  padding: 24px;
  transition: 0.2s;
}

.qr-box:hover {
  border-color: #4f46e5;
  background: #fafbff;
}

.qr-info {
  width: 100%;
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: center;
}

.qr-expire {
  font-size: 13px;
  color: #6b7280;
}

.qr-expire strong {
  color: #1f2937;
  font-weight: 600;
}

.qr-countdown {
  font-size: 14px;
  color: #6b7280;
}

.qr-countdown strong {
  color: #4f46e5;
  font-size: 15px;
  font-weight: 700;
}

.qr-loading {
  color: #9ca3af;
  font-size: 14px;
}

.attendance-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.attendance-stats .card {
  padding: 24px;
  border: 1px solid #e8e8f0;
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.04);
  transition: 0.2s;
}

.attendance-stats .card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
}

.attendance-stats .card h2 {
  margin-bottom: 8px;
  color: #4f46e5;
  font-size: 34px;
  font-weight: 700;
}

.attendance-stats .card p {
  color: #6b7280;
  font-size: 13px;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  padding: 20px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.detail-item.full {
  grid-column: span 1;
}

.detail-item label {
  color: #9ca3af;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-item span {
  min-height: 44px;
  display: flex;
  align-items: center;
  padding: 11px 13px;
  border: 1px solid #eef2f7;
  border-radius: 12px;
  background: #f9fafb;
  color: #111827;
  font-size: 13px;
  line-height: 1.45;
}

.table-region {
  position: relative;

  flex: 1;

  display: flex;
  flex-direction: column;
}

.mobile-table-hint {
  display: none;
}

.table-scroll {
  flex: 1;
  width: 100%;
  overflow-x: auto;
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
  background: #c7d2fe;
  border-radius: 999px;
}

table {
  width: 100%;
  min-width: 760px;
  border-collapse: collapse;
}

thead {
  background: #f8f8ff;
}

th {
  padding: 14px 20px;
  text-align: left;

  color: #6b7280;

  font-size: 13px;
  font-weight: 700;

  text-transform: uppercase;

  letter-spacing: 0.4px;
}

td {
  padding: 16px 20px;

  border-top: 1px solid #edf0f4;

  color: #374151;

  font-size: 13px;
}

tbody tr:hover {
  background: #fafbff;
  transition: 0.2s;
}

.bold {
  font-weight: 600;
  color: #1f2937;
}

.empty-table {
  padding: 60px 20px;
  text-align: center;
  color: #9ca3af;
  font-size: 14px;
  font-weight: 500;
}

.badge {
  display: inline-flex;
  align-items: center;

  padding: 5px 12px;

  border-radius: 999px;

  font-size: 12px;
  font-weight: 600;
}

.badge.Hadir {
  background: #dcfce7;
  color: #15803d;
}

.badge.Belum\ Pulang {
  background: #fef3c7;
  color: #b45309;
}

.badge.Belum\ Hadir {
  background: #fee2e2;
  color: #b91c1c;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  gap: 16px;

  padding: 18px 22px;

  border-top: 1px solid #edf0f4;
}

.pagination-info {
  color: #9ca3af;
  font-size: 13px;
}

.pagination-controls {
  display: flex;
  gap: 6px;
}

.pagination-controls button {
  width: 34px;
  height: 34px;

  border: 1px solid #e5e7eb;

  border-radius: 8px;

  background: white;

  cursor: pointer;

  transition: 0.18s;
}

.pagination-controls button:hover {
  background: #eef2ff;
  color: #4f46e5;
}

.pagination-controls button.active {
  background: #4f46e5;
  color: white;
}

.pagination-controls button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.modal-overlay {
  position: fixed;
  inset: 0;

  display: flex;
  align-items: center;
  justify-content: center;

  padding: 20px;

  background: rgba(0, 0, 0, 0.45);

  backdrop-filter: blur(4px);

  z-index: 999;
}

.modal-box {
  width: 100%;
  max-width: 520px;

  overflow: hidden;

  border-radius: 18px;

  background: white;

  animation: modalShow 0.2s ease;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  padding: 20px 24px;

  border-bottom: 1px solid #edf0f4;
}

.modal-header h3 {
  color: #1e1b4b;
  font-size: 17px;
}

.modal-close {
  width: 34px;
  height: 34px;

  border: none;

  border-radius: 10px;

  background: #f3f4f6;

  cursor: pointer;
}

.modal-body {
  padding: 24px;
}

.coming-soon {
  color: #6b7280;

  line-height: 1.7;

  text-align: center;
}

.modal-footer {
  padding: 20px 24px;

  border-top: 1px solid #edf0f4;

  display: flex;
  justify-content: flex-end;
}

.btn-cancel {
  padding: 10px 22px;

  border: none;

  border-radius: 10px;

  background: #4f46e5;

  color: white;

  cursor: pointer;
}

.btn-cancel:hover {
  background: #4338ca;
}

@keyframes modalShow {
  from {
    opacity: 0;
    transform: translateY(14px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 1200px) {
  .content-grid {
    grid-template-columns: minmax(0, 1fr) 320px;
  }

  .main {
    padding: 24px;
  }

  .dummy-qr {
    width: 170px;
    height: 170px;
  }
}

@media (max-width: 992px) {
  .top-grid {
    grid-template-columns: 1fr;
  }

  .side-column {
    order: -1;
  }

  .qr-panel,
  .detail-panel {
    width: 100%;
  }

  .detail-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .detail-item.full {
    grid-column: span 2;
  }
}

@media (max-width: 768px) {
  .main {
    padding: 18px 16px 28px;
    gap: 18px;
  }

  .header {
    flex-direction: column;
    align-items: stretch;
    gap: 18px;
  }

  .header h2 {
    font-size: 24px;
  }

  .panel-header {
    flex-direction: column;
    align-items: stretch;
    gap: 14px;
  }

  .btn-add {
    width: 100%;
  }

  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .attendance-stats {
    grid-template-columns: 1fr;
  }

  .export-actions {
    width: 100%;
    display: flex;
  }

  .export-actions button {
    flex: 1;
  }

  .search-wrap {
    width: 100%;
    min-width: 0;
  }

  .toolbar input,
  .toolbar button {
    width: 100%;
  }

  .mobile-table-hint {
    display: flex;
    align-items: center;
    gap: 8px;

    padding: 10px 16px;

    border-bottom: 1px solid #edf0f4;

    background: #fafbff;

    color: #6b7280;

    font-size: 12px;
  }

  .mobile-table-hint::before {
    content: "↔";
    color: #4f46e5;
    font-weight: bold;
  }

  table {
    min-width: 720px;
  }

  .pagination {
    flex-direction: column;
    align-items: flex-start;
  }

  .pagination-controls {
    width: 100%;
    overflow-x: auto;
    padding-bottom: 4px;
  }

  .dummy-qr {
    width: 190px;
    height: 190px;
  }
}

@media (max-width: 576px) {
  .main {
    padding: 16px 12px 24px;
  }

  .panel {
    border-radius: 16px;
  }

  .participant-panel {
    display: flex;
    flex-direction: column;

    min-height: 680px;
  }

  .panel-header,
  .toolbar,
  .modal-header,
  .modal-body,
  .modal-footer {
    padding-left: 16px;
    padding-right: 16px;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }

  .detail-item.full {
    grid-column: span 1;
  }

  .dummy-qr {
    width: 170px;
    height: 170px;
  }

  .modal-overlay {
    padding: 12px;
  }

  .modal-box {
    max-height: calc(100dvh - 24px);
    overflow-y: auto;
    border-radius: 16px;
  }

  .modal-footer {
    flex-direction: column;
  }

  .btn-cancel {
    width: 100%;
  }
}

@media (max-width: 380px) {
  .header h2 {
    font-size: 21px;
  }

  .subtitle {
    font-size: 12px;
  }

  .dummy-qr {
    width: 150px;
    height: 150px;
    font-size: 13px;
  }

  .pagination-info {
    font-size: 12px;
  }
}

.modal-box {
  max-width: 720px;
}

.participant-toolbar {
  display: flex;
  align-items: center;
  gap: 14px;

  margin-bottom: 20px;
}

.btn-select-all {
  flex-shrink: 0;

  height: 46px;

  padding: 0 18px;

  border: none;

  border-radius: 12px;

  background: #eef2ff;

  color: #4338ca;

  font-weight: 600;

  cursor: pointer;

  transition: 0.2s;
}

.btn-select-all:hover {
  background: #dfe5ff;
}

.participant-search {
  flex: 1;
  height: 48px;
  padding: 0 18px;
  border: 1px solid #d9dfeb;
  border-radius: 12px;
  font-size: 14px;
  outline: none;
  transition: 0.2s;
}

.participant-search:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.08);
}

.btn-select-all {
  height: 48px;
  padding: 0 20px;
  background: #eef2ff;
  color: #4338ca;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
}

.participant-list {
  max-height: 430px;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-right: 6px;
}

.participant-card {
  display: grid;
  grid-template-columns: 24px 1fr auto;
  align-items: center;
  gap: 18px;
  padding: 18px;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  transition: 0.2s;
  cursor: pointer;
}

.participant-card:hover {
  border-color: #4f46e5;
  background: #fafbff;
}

.participant-card input {
  width: 18px;
  height: 18px;
}

.participant-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.participant-name {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
}

.participant-division {
  font-size: 13px;
  color: #6b7280;
}

.participant-badge {
  padding: 6px 14px;
  border-radius: 999px;
  background: #dcfce7;
  color: #15803d;
  font-size: 12px;
  font-weight: 600;
}

.participant-card.disabled {
  opacity: 0.7;
  background: #fafafa;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.qr-box {
  cursor: pointer;
}

.qr-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 14px;
  color: #6366f1;
  font-size: 13px;
  font-weight: 600;
}

.qr-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  animation: fadeIn 0.2s;
}

.qr-modal {
  position: relative;
  background: white;
  padding: 34px;
  border-radius: 22px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  animation: modalShow 0.2s;
}

.qr-modal-close {
  position: absolute;
  top: 18px;
  right: 18px;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: #f3f4f6;
  cursor: pointer;
  font-size: 18px;
  transition: 0.2s;
}

.qr-modal-close:hover {
  background: #e5e7eb;
}

.qr-modal-title {
  font-size: 20px;
  font-weight: 700;
  color: #111827;
}

.qr-modal-subtitle {
  color: #6b7280;
  text-align: center;
  font-size: 14px;
}
</style>
