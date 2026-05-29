<script setup>
import { ref, computed, onMounted, watch } from "vue";
import EmployeeBottomNav from "@/components/EmployeeBottomNav.vue";

import {
  getLeaveTypesAPI,
  getLeaveNotificationsAPI,
  markLeaveNotificationReadAPI,
  markAllLeaveNotificationsReadAPI,
  getLeaveQuotaAPI,
  getLeaveHolidaysAPI,
  getLeaveHistoryAPI,
  submitLeaveAPI,
} from "@/services/leave";

const currentDate = ref(new Date());

const selectedDate = ref(null);
const showEventModal = ref(false);
const selectedEvents = ref([]);

const showLeaveModal = ref(false);
const leaveForm = ref({
  type: "",
  start_date: "",
  end_date: "",
  reason: "",
  attachment: null,
});

const leaveTypes = ref([]);

const holidays = ref([]);

const leaveHistory = ref([]);

const uploadError = ref("");

const submitError = ref("");

const submitSuccess = ref("");

const leaveStats = ref({
  total: 0,
  used: 0,
  remaining: 0,
});

const upcomingLeaves = computed(() => {
  return leaveHistory.value;
});

//be belum ada endpoint notifikasi
const notifications = ref([]);

const notificationPagination = ref({
  page: 1,
  totalPages: 1,
  unread: 0,
});
// const notifications = ref([
//   {
//     id: 1,
//     title: "Pengajuan cuti disetujui",
//     desc: "Pengajuan cuti tahunan telah disetujui HR",
//     time: "2 jam lalu",
//     type: "success",
//   },
//   {
//     id: 2,
//     title: "Pengajuan cuti ditolak",
//     desc: "Pengajuan cuti ditolak HR",
//     time: "1 hari lalu",
//     type: "danger",
//   },
//   {
//     id: 3,
//     title: "Pengajuan cuti diproses",
//     desc: "Pengajuan cuti sedang menunggu approval",
//     time: "3 hari lalu",
//     type: "warning",
//   },
// ]);

const calendarEvents = ref([]);

const monthYear = computed(() => {
  return currentDate.value.toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });
});

const daysInMonth = computed(() => {
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();

  return new Date(year, month + 1, 0).getDate();
});

const firstDay = computed(() => {
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();

  return new Date(year, month, 1).getDay();
});

const calendarDays = computed(() => {
  const days = [];

  for (let i = 0; i < firstDay.value; i++) {
    days.push(null);
  }

  for (let i = 1; i <= daysInMonth.value; i++) {
    days.push(i);
  }

  return days;
});

function getEvents(day) {
  if (!day) return [];

  const year = currentDate.value.getFullYear();

  const month = String(currentDate.value.getMonth() + 1).padStart(2, "0");

  const formattedDay = String(day).padStart(2, "0");

  const fullDate = `${year}-${month}-${formattedDay}`;

  return calendarEvents.value.filter((item) => item.date === fullDate);
}

function selectDate(day) {
  selectedDate.value = day;
  selectedEvents.value = getEvents(day);
  showEventModal.value = true;
}

function prevMonth() {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() - 1,
    1,
  );
}

function nextMonth() {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() + 1,
    1,
  );
}

function generateDateRange(startDate, endDate) {
  const dates = [];

  const current = new Date(startDate);

  const end = new Date(endDate);

  while (current <= end) {
    dates.push(current.toISOString().split("T")[0]);

    current.setDate(current.getDate() + 1);
  }

  return dates;
}

async function fetchLeaveQuota() {
  try {
    const response = await getLeaveQuotaAPI();

    leaveStats.value = response.data.data;
  } catch (error) {
    console.error("[FE ERROR] FETCH LEAVE QUOTA FAILED");

    console.error(error);

    leaveStats.value = {
      total: 0,
      used: 0,
      remaining: 0,
    };
  }
}

async function fetchLeaveTypes() {
  try {
    const response = await getLeaveTypesAPI();

    leaveTypes.value = response.data.data;
  } catch (error) {
    console.error(error);
  }
}

async function fetchHolidays() {
  try {
    const year = currentDate.value.getFullYear();

    const response = await getLeaveHolidaysAPI(year);

    holidays.value = response.data.data;

    const mappedHolidays = holidays.value.map((item) => ({
      date: item.date,
      type: "holiday",
      title: item.name,
    }));

    calendarEvents.value = mappedHolidays;
  } catch (error) {
    console.error(error);
  }
}

async function fetchLeaveHistory() {
  try {
    const response = await getLeaveHistoryAPI();

    leaveHistory.value = response.data.data.data;

    const mappedLeaves = leaveHistory.value.flatMap((item) => {
      const dates = generateDateRange(item.start_date, item.end_date);

      if (item.status === "cancelled") {
        return [];
      }

      return dates.map((date) => ({
        date,

        type: "employee",

        title: item.leave_type,

        status: item.status,
      }));
    });

    calendarEvents.value = [
      ...calendarEvents.value.filter((item) => item.type === "holiday"),

      ...mappedLeaves,
    ];
  } catch (error) {
    console.error(error);
  }
}

async function fetchNotifications() {
  try {
    console.log("[FE] FETCH LEAVE NOTIFICATIONS");

    const response = await getLeaveNotificationsAPI();

    console.log("[BE SUCCESS] NOTIFICATIONS:", response.data);

    notifications.value = response.data.data.data;

    notificationPagination.value = {
      page: response.data.data.page,

      totalPages: response.data.data.total_pages,

      unread: response.data.data.unread_count,
    };
  } catch (error) {
    console.error("[BE ERROR] FETCH NOTIFICATIONS FAILED");

    console.error(error);

    notifications.value = [];
  }
}

async function markNotificationRead(id) {
  try {
    await markLeaveNotificationReadAPI(id);

    notifications.value = notifications.value.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          is_read: true,
        };
      }

      return item;
    });

    notificationPagination.value.unread = Math.max(
      0,
      notificationPagination.value.unread - 1,
    );
  } catch (error) {
    console.error(error);
  }
}

async function markAllNotificationsRead() {
  try {
    await markAllLeaveNotificationsReadAPI();

    notifications.value = notifications.value.map((item) => ({
      ...item,
      is_read: true,
    }));

    notificationPagination.value.unread = 0;
  } catch (error) {
    console.error(error);
  }
}

async function submitLeave() {
  try {
    if (leaveForm.value.reason.trim().length < 10) {
      submitError.value = "Alasan minimal 10 karakter";
      return;
    }
    const formData = new FormData();

    formData.append("leave_type", leaveForm.value.type);

    formData.append("start_date", leaveForm.value.start_date);

    formData.append("end_date", leaveForm.value.end_date);

    formData.append("reason", leaveForm.value.reason);

    if (leaveForm.value.attachment) {
      formData.append("attachment", leaveForm.value.attachment);
    }

    await submitLeaveAPI(formData);

    submitError.value = "";

    uploadError.value = "";

    submitSuccess.value = "Pengajuan cuti berhasil dikirim";

    showLeaveModal.value = false;

    await fetchLeaveHistory();
    await fetchLeaveQuota();
  } catch (error) {
    console.error(error);

    const code = error?.response?.data?.code;

    if (code === "NO_QUOTA") {
      submitError.value = "Kuota cuti tahunan habis";
    }

    if (code === "DATE_OVERLAP") {
      submitError.value = "Tanggal bertabrakan dengan pengajuan lain";
    }

    if (code === "HOLIDAY_CONFLICT") {
      submitError.value = "Tanggal mengandung hari libur nasional";
    }

    if (code === "INVALID_ATTACHMENT") {
      console.error("[BE ERROR] INVALID ATTACHMENT FORMAT");

      submitError.value = "Format lampiran tidak valid";
    }

    if (code === "ATTACHMENT_TOO_LARGE") {
      console.error("[BE ERROR] ATTACHMENT TOO LARGE");

      submitError.value = "Ukuran lampiran melebihi 5MB";
    }

    if (code === "UPLOAD_FAILED") {
      console.error("[BE ERROR] FAILED UPLOAD ATTACHMENT");

      console.error("CHECK BACKEND:");

      console.error("- uploads folder");

      console.error("- storage permission");

      console.error("- multer config");

      submitError.value = "Gagal mengupload lampiran";
    }
  }
}

function handleFileUpload(event) {
  try {
    console.log("[FE] SELECT ATTACHMENT FILE");

    const file = event.target.files[0];

    // user cancel pilih file
    if (!file) {
      console.warn("[FE WARNING] USER CANCEL FILE PICKER");

      return;
    }

    console.log("[FE] FILE SELECTED:", file.name);

    console.log("[FE] FILE TYPE:", file.type);

    console.log("[FE] FILE SIZE:", file.size);

    const allowedTypes = ["application/pdf", "image/png", "image/jpeg"];

    // validasi format
    if (!allowedTypes.includes(file.type)) {
      console.error("[FE ERROR] INVALID FILE TYPE");

      console.error("ALLOWED: PDF/JPG/PNG");

      console.error("RECEIVED:", file.type);

      uploadError.value = "Format file harus PDF/JPG/PNG";
      return;
    }

    // validasi ukuran
    if (file.size > 5 * 1024 * 1024) {
      console.error("[FE ERROR] FILE TOO LARGE");

      console.error("MAX SIZE: 5MB");

      console.error("RECEIVED:", file.size);

      uploadError.value = "Ukuran file maksimal 5MB";
      return;
    }

    leaveForm.value.attachment = file;

    console.log("[FE SUCCESS] ATTACHMENT READY TO UPLOAD");
  } catch (error) {
    console.error("[FE ERROR] FAILED PROCESS ATTACHMENT");

    console.error(error);

    console.error("CHECK:");

    console.error("- browser file permission");

    console.error("- safari compatibility");

    console.error("- corrupted file");

    console.error("- unsupported mime type");

    uploadError.value = "Gagal memproses lampiran";
  }
}

watch(currentDate, async () => {
  await fetchHolidays();

  await fetchLeaveHistory();
});

onMounted(async () => {
  await Promise.all([
    fetchNotifications(),
    fetchLeaveTypes(),
    fetchLeaveQuota(),
    fetchHolidays(),
    fetchLeaveHistory(),
  ]);
});
</script>

<template>
  <div class="calendar-page">
    <div class="hero">
      <div>
        <h1>Kalender Cuti</h1>

        <p>Kalender Pengajuan cuti karyawan</p>
      </div>

      <div class="stats">
        <div class="stat-card">
          <h2>{{ leaveStats.total }}</h2>

          <span>Total Cuti</span>
        </div>

        <div class="stat-card">
          <h2>{{ leaveStats.used }}</h2>

          <span>Digunakan</span>
        </div>

        <div class="stat-card">
          <h2>{{ leaveStats.remaining }}</h2>

          <span>Sisa</span>
        </div>
      </div>
    </div>

    <div class="calendar-card">
      <div class="calendar-header">
        <h2>{{ monthYear }}</h2>

        <div class="calendar-nav">
          <button @click="prevMonth">‹</button>

          <button @click="nextMonth">›</button>
        </div>
      </div>

      <div class="weekdays">
        <span>Minggu</span>
        <span>Senin</span>
        <span>Selasa</span>
        <span>Rabu</span>
        <span>Kamis</span>
        <span>Jumat</span>
        <span>Sabtu</span>
      </div>

      <div class="calendar-grid">
        <div
          v-for="(day, index) in calendarDays"
          :key="index"
          class="day"
          :class="{
            active: selectedDate === day,
          }"
          @click="day && selectDate(day)"
        >
          <span v-if="day">
            {{ day }}
          </span>

          <div v-if="getEvents(day).length" class="event-dots">
            <span
              v-for="(event, index) in getEvents(day)"
              :key="index"
              class="dot"
              :class="event.type"
            />
          </div>
        </div>
      </div>

      <div class="legend">
        <div class="legend-item">
          <span class="legend-dot employee" />

          <p>Cuti Karyawan</p>
        </div>

        <div class="legend-item">
          <span class="legend-dot holiday" />

          <p>Libur Nasional</p>
        </div>

        <!-- <div class="legend-item">
          <span class="legend-dot personal" />

          <p>Personal Leave</p>
        </div> -->
      </div>
    </div>

    <div class="section">
      <h2>Cuti Mendatang</h2>

      <div v-for="item in upcomingLeaves" :key="item.id" class="leave-card">
        <div class="leave-top">
          <div>
            <h3>{{ item.leave_type }}</h3>

            <p>
              {{ item.start_date }}
              -
              {{ item.end_date }} ({{ item.total_days }} Hari)
            </p>
          </div>

          <span class="status" :class="item.status">
            {{
              item.status === "approved"
                ? "Disetujui"
                : item.status === "rejected"
                  ? "Ditolak"
                  : item.status === "cancelled"
                    ? "Dibatalkan"
                    : "Menunggu"
            }}
          </span>
        </div>

        <div class="leave-note">
          {{ item.note }}
        </div>
      </div>
    </div>

    <div class="section">
      <div class="notif-header">
        <h2>Notifikasi</h2>

        <button
          v-if="notificationPagination.unread > 0"
          class="read-all-btn"
          @click="markAllNotificationsRead"
        >
          Tandai Dibaca
        </button>
      </div>

      <div v-if="notifications.length">
        <div
          v-for="item in notifications"
          :key="item.id"
          class="notif-card"
          :class="{
            unread: !item.is_read,
          }"
          @click="!item.is_read && markNotificationRead(item.id)"
        >
          <div class="notif-content">
            <h3>{{ item.title }}</h3>

            <span class="notif-status" :class="item.status">
              {{
                item.status === "approved"
                  ? "Disetujui"
                  : item.status === "rejected"
                    ? "Ditolak"
                    : "Diproses"
              }}
            </span>

            <p>
              {{ item.description }}
            </p>

            <span class="notif-time">
              {{ item.updated_at }}
            </span>
          </div>
        </div>
      </div>

      <div v-else class="empty-event">Belum ada notifikasi cuti</div>
    </div>

    <p class="password-note">
      Pengajuan cuti akan diproses oleh HR/admin cabang. Silakan hubungi HR
      untuk kebutuhan mendesak.
    </p>

    <button class="fab" @click="showLeaveModal = true">+</button>
  </div>

  <div
    v-if="showEventModal"
    class="modal-overlay"
    @click.self="showEventModal = false"
  >
    <div class="event-modal">
      <div class="event-header">
        <div>
          <h3>Detail Tanggal</h3>

          <p>
            {{ selectedDate }}
            {{ monthYear }}
          </p>
        </div>

        <button class="close-btn" @click="showEventModal = false">✕</button>
      </div>

      <div v-if="selectedEvents.length" class="event-list">
        <div
          v-for="(event, index) in selectedEvents"
          :key="index"
          class="event-item"
        >
          <div class="event-icon" :class="event.type" />

          <div class="event-info">
            <h4>
              {{ event.type === "holiday" ? "Hari Libur" : "Karyawan Cuti" }}
            </h4>

            <p>{{ event.title }}</p>
          </div>
        </div>
      </div>

      <div v-else class="empty-event">Tidak ada event di tanggal ini</div>
    </div>
  </div>

  <div
    v-if="showLeaveModal"
    class="modal-cuti"
    @click.self="showLeaveModal = false"
  >
    <div class="leave-modal">
      <div class="leave-header">
        <h2>Ajukan Cuti</h2>

        <button class="close-btn" @click="showLeaveModal = false">✕</button>
      </div>

      <div class="leave-form">
        <div class="form-group">
          <label>Jenis Cuti</label>

          <select v-model="leaveForm.type">
            <option value="">Pilih jenis cuti</option>

            <option
              v-for="type in leaveTypes"
              :key="type.value"
              :value="type.value"
            >
              {{ type.label }}
            </option>
          </select>
        </div>

        <div class="date-grid">
          <div class="form-group">
            <label>Tanggal Mulai</label>

            <input v-model="leaveForm.start_date" type="date" />
          </div>

          <div class="form-group">
            <label>Tanggal Selesai</label>

            <input v-model="leaveForm.end_date" type="date" />
          </div>
        </div>

        <div class="form-group">
          <label>Alasan</label>

          <textarea
            v-model="leaveForm.reason"
            placeholder="Masukkan alasan pengajuan cuti..."
          />
        </div>

        <p v-if="submitError" class="submit-error">
          {{ submitError }}
        </p>

        <div class="form-group">
          <label>Lampiran (Opsional)</label>

          <label class="upload-box">
            <input type="file" hidden @change="handleFileUpload" />
            <span v-if="leaveForm.attachment">
              {{ leaveForm.attachment.name }}
            </span>

            <span v-else> Upload PDF / JPG / PNG </span>
          </label>

          <p v-if="uploadError" class="form-error">
            {{ uploadError }}
          </p>
        </div>

        <p v-if="submitSuccess" class="submit-success">
          {{ submitSuccess }}
        </p>

        <button class="submit-btn" @click="submitLeave">Ajukan Cuti</button>
      </div>
    </div>
  </div>

  <EmployeeBottomNav />
</template>

<style scoped>
.calendar-page {
  min-height: 100vh;
  height: 300;
  background: #f5f7fb;
  padding: 18px 18px 180px;
}

.hero {
  background: linear-gradient(135deg, #6366f1, #4f46e5);

  border-radius: 24px;

  padding: 24px 20px;

  color: white;

  position: relative;

  overflow: hidden;

  margin-bottom: 18px;

  box-shadow: 0 10px 30px rgba(79, 70, 229, 0.18);
}

.hero h1 {
  font-size: 28px;
  font-weight: 700;

  line-height: 1.2;
}

.hero p {
  margin-top: 6px;

  font-size: 14px;

  opacity: 0.92;
}

.stats {
  display: grid;

  grid-template-columns: repeat(3, 1fr);

  gap: 12px;

  margin-top: 24px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.14);

  border-radius: 18px;

  padding: 18px 12px;

  text-align: center;

  backdrop-filter: blur(10px);
}

.stat-card h2 {
  font-size: 30px;
  font-weight: 700;
}

.stat-card span {
  margin-top: 6px;

  display: block;

  font-size: 13px;

  opacity: 0.92;
}

.calendar-card {
  background: #ffffff;

  border-radius: 22px;

  padding: 22px 18px;

  margin-bottom: 24px;

  border: 1px solid #eef2f7;

  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.04);
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  margin-bottom: 24px;
}

.calendar-header h2 {
  font-size: 21px;
  font-weight: 700;

  color: #111827;
}

.calendar-nav {
  display: flex;

  gap: 10px;
}

.calendar-nav button {
  width: 38px;
  height: 38px;

  border: none;
  border-radius: 12px;

  background: #f3f4f6;

  color: #111827;

  font-size: 24px;

  cursor: pointer;

  transition: all 0.18s ease;
}

.calendar-nav button:active {
  transform: scale(0.96);
}

.weekdays {
  display: grid;

  grid-template-columns: repeat(7, 1fr);

  margin-bottom: 12px;
}

.weekdays span {
  text-align: center;

  font-size: 12px;
  font-weight: 600;

  color: #6b7280;
}

.calendar-grid {
  display: grid;

  grid-template-columns: repeat(7, 1fr);

  gap: 10px;
}

.day {
  aspect-ratio: 1;

  border-radius: 14px;

  display: flex;
  align-items: center;
  justify-content: center;

  position: relative;

  font-size: 15px;
  font-weight: 600;

  cursor: pointer;

  transition: all 0.18s ease;
}

.day:hover {
  background: #f3f4f6;
}

.day.active {
  background: #eef2ff;

  border: 2px solid #6366f1;

  color: #4f46e5;
}

.event-dots {
  position: absolute;

  bottom: 6px;
  left: 50%;

  transform: translateX(-50%);

  display: flex;
  align-items: center;
  justify-content: center;

  gap: 4px;
}

.dot {
  width: 6px;
  height: 6px;

  border-radius: 50%;
}

.dot.employee {
  background: #ef4444;
}

.dot.holiday {
  background: #22c55e;
}

.legend {
  display: flex;
  flex-wrap: wrap;

  gap: 16px;

  margin-top: 24px;

  padding-top: 16px;

  border-top: 1px solid #eef2f7;
}

.legend-item {
  display: flex;
  align-items: center;

  gap: 8px;
}

.legend-dot {
  width: 12px;
  height: 12px;

  border-radius: 50%;
}

.legend-dot.employee {
  background: #ef4444;
}

.legend-dot.holiday {
  background: #22c55e;
}

.legend-dot.personal {
  background: #3b82f6;
}

.legend-item p {
  font-size: 12px;

  color: #6b7280;
}

.section {
  margin-bottom: 30px;
}

.section h2 {
  font-size: 20px;
  font-weight: 700;

  margin-bottom: 16px;

  color: #111827;
}

.leave-card,
.notif-card {
  background: #ffffff;

  border-radius: 20px;

  padding: 18px;

  margin-bottom: 14px;

  border: 1px solid #eef2f7;

  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04);
}

.leave-top {
  display: flex;
  justify-content: space-between;

  gap: 12px;
}

.leave-top h3 {
  font-size: 17px;
  font-weight: 700;

  color: #111827;
}

.leave-top p {
  margin-top: 6px;

  color: #6b7280;

  font-size: 14px;
}

.status {
  height: fit-content;

  padding: 7px 12px;

  border-radius: 999px;

  font-size: 11px;
  font-weight: 700;

  text-transform: capitalize;
}

.status.approved {
  background: #dcfce7;

  color: #15803d;
}

.status.pending {
  background: #fef3c7;

  color: #b45309;
}

.leave-note {
  margin-top: 14px;

  color: #6b7280;

  font-size: 13px;
}

.notif-card {
  position: relative;

  background: #ffffff;

  border-radius: 22px;

  padding: 18px;

  margin-bottom: 14px;

  border: 1px solid #eef2f7;

  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.04);

  cursor: pointer;

  transition: all 0.2s ease;
}

.notif-card:hover {
  transform: translateY(-1px);

  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
}

.notif-card.unread {
  background: linear-gradient(135deg, #eef2ff, #f8faff);

  border: 1px solid #c7d2fe;
}

.notif-content {
  width: 100%;
}

.notif-content h3 {
  font-size: 15px;

  font-weight: 700;

  line-height: 1.4;

  color: #111827;

  margin-bottom: 10px;
}

.notif-content p {
  font-size: 13px;

  color: #6b7280;

  line-height: 1.6;

  margin-top: 10px;
}

.notif-time {
  display: inline-flex;

  margin-top: 12px;

  font-size: 12px;

  font-weight: 500;

  color: #9ca3af;
}

.fab {
  position: fixed;
  right: 20px;
  bottom: 96px;
  width: 58px;
  height: 58px;
  border: none;
  border-radius: 18px;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: white;
  font-size: 34px;
  box-shadow: 0 10px 24px rgba(79, 70, 229, 0.24);
  z-index: 99;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fab:active {
  transform: scale(0.96);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 999;
  padding: 18px 18px 140px;
}

.modal-cuti {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 999;
}

.event-modal {
  width: 100%;
  max-width: 520px;

  background: white;

  border-radius: 28px;

  padding: 22px 20px 34px;

  margin-bottom: 88px;
}

.event-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;

  margin-bottom: 22px;
}

.event-header h3 {
  font-size: 20px;
  font-weight: 700;

  color: #111827;
}

.event-header p {
  margin-top: 4px;

  font-size: 13px;

  color: #6b7280;
}

.close-btn {
  width: 38px;
  height: 38px;

  border: none;
  border-radius: 12px;

  background: #f3f4f6;

  font-size: 16px;

  cursor: pointer;
}

.event-list {
  display: flex;
  flex-direction: column;

  gap: 14px;
}

.event-item {
  display: flex;
  align-items: center;

  gap: 14px;

  padding: 14px;

  border-radius: 18px;

  background: #f8fafc;
}

.event-icon {
  width: 14px;
  height: 14px;

  border-radius: 50%;

  flex-shrink: 0;
}

.event-icon.employee {
  background: #ef4444;
}

.event-icon.holiday {
  background: #22c55e;
}

.event-info h4 {
  font-size: 14px;
  font-weight: 700;

  color: #111827;
}

.event-info p {
  margin-top: 4px;

  font-size: 13px;

  color: #6b7280;
}

.empty-event {
  text-align: center;

  padding: 30px 10px;

  font-size: 14px;

  color: #9ca3af;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }

  to {
    transform: translateY(0);
  }
}

.leave-header h2 {
  font-size: 22px;
  font-weight: 700;

  color: #111827;
}

.form-group label {
  font-size: 14px;
  font-weight: 600;

  color: #111827;
}

.form-group select,
.form-group input,
.form-group textarea {
  width: 100%;

  border: none;
  outline: none;

  background: #f3f4f6;

  border-radius: 16px;

  padding: 15px 16px;

  font-size: 14px;

  font-weight: 500;

  color: #111827;

  transition: all 0.18s ease;
}

.form-group select {
  appearance: none;

  -webkit-appearance: none;

  -moz-appearance: none;

  cursor: pointer;

  padding-right: 48px;

  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");

  background-repeat: no-repeat;

  background-position: right 16px center;

  background-size: 16px;
}

.form-group select:focus,
.form-group input:focus,
.form-group textarea:focus {
  background: #ffffff;

  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.12);

  border-color: #6366f1;
}

.form-group option {
  color: #111827;

  background: #ffffff;
}

.form-group textarea {
  min-height: 120px;

  resize: none;
}

.date-grid {
  display: grid;

  grid-template-columns: 1fr 1fr;

  gap: 14px;
}

.upload-box {
  width: 100%;

  border: 2px dashed #d1d5db;

  border-radius: 18px;

  padding: 20px;

  text-align: center;

  background: #f9fafb;

  cursor: pointer;

  transition: all 0.18s ease;
}

.upload-box span {
  font-size: 14px;
  font-weight: 500;

  color: #6b7280;
}

.upload-box:hover {
  border-color: #6366f1;

  background: #eef2ff;
}

.leave-modal {
  width: 100%;
  max-width: 520px;

  background: white;

  border-radius: 28px 28px 0 0;

  padding: 22px 20px 120px;

  animation: slideUp 0.2s ease;
}

.leave-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  margin-bottom: 24px;
}

.leave-header h2 {
  font-size: 22px;
  font-weight: 700;

  color: #111827;
}

.leave-form {
  display: flex;
  flex-direction: column;

  gap: 18px;
}

.form-group {
  display: flex;
  flex-direction: column;

  gap: 8px;
}

.form-group label {
  font-size: 14px;
  font-weight: 600;

  color: #111827;
}

.form-group select,
.form-group input,
.form-group textarea {
  width: 100%;

  border: none;
  outline: none;

  background: #f3f4f6;

  border-radius: 16px;

  padding: 15px 16px;

  font-size: 14px;

  color: #111827;
}

.form-group textarea {
  min-height: 120px;

  resize: none;
}

.date-grid {
  display: grid;

  grid-template-columns: 1fr 1fr;

  gap: 14px;
}

.upload-box {
  width: 100%;

  border: 2px dashed #d1d5db;

  border-radius: 18px;

  padding: 20px;

  text-align: center;

  background: #f9fafb;

  cursor: pointer;

  transition: all 0.18s ease;
}

.upload-box span {
  font-size: 14px;
  font-weight: 500;

  color: #6b7280;
}

.upload-box:hover {
  border-color: #6366f1;

  background: #eef2ff;
}

.submit-btn {
  width: 100%;

  border: none;

  border-radius: 18px;

  padding: 16px;

  background: linear-gradient(135deg, #6366f1, #4f46e5);

  color: white;

  font-size: 15px;
  font-weight: 700;

  margin-top: 8px;

  box-shadow: 0 10px 24px rgba(79, 70, 229, 0.24);
}

.password-note {
  padding: 12px 14px;

  border-radius: 12px;

  background: #eef2ff;

  color: #4338ca;

  font-size: 12px;

  line-height: 1.6;

  border: 1px solid #c7d2fe;
}

.status.rejected {
  background: #fee2e2;
  color: #dc2626;
}

.status.cancelled {
  background: #e5e7eb;
  color: #4b5563;
}

.form-error {
  margin-top: 8px;

  font-size: 12px;

  color: #dc2626;

  line-height: 1.5;
}

.submit-error {
  padding: 12px 14px;

  border-radius: 14px;

  background: #fef2f2;

  border: 1px solid #fecaca;

  color: #dc2626;

  font-size: 13px;

  line-height: 1.5;
}

.submit-success {
  padding: 12px 14px;

  border-radius: 14px;

  background: #ecfdf5;

  border: 1px solid #bbf7d0;

  color: #15803d;

  font-size: 13px;

  line-height: 1.5;
}

.notif-card.unread {
  border: 1px solid #c7d2fe;

  background: #eef2ff;
}

.notif-status {
  display: inline-flex;

  align-items: center;

  justify-content: center;

  min-width: 88px;

  height: 28px;

  padding: 0 12px;

  border-radius: 999px;

  font-size: 11px;

  font-weight: 700;

  letter-spacing: 0.2px;
}

.notif-status.approved {
  background: #dcfce7;

  color: #15803d;
}

.notif-status.rejected {
  background: #fee2e2;

  color: #dc2626;
}

.notif-status.pending {
  background: #fef3c7;

  color: #b45309;
}

.read-all-btn {
  border: none;

  background: #eef2ff;

  color: #4f46e5;

  height: 38px;

  padding: 0 14px;

  border-radius: 12px;

  font-size: 12px;

  font-weight: 700;

  cursor: pointer;

  transition: all 0.18s ease;

  margin-bottom: 14px;
}

.read-all-btn:hover {
  background: #dbe4ff;
}

.notif-card {
  cursor: pointer;
}

.notif-header {
  display: flex;

  align-items: center;

  justify-content: space-between;

  margin-bottom: 16px;
}
</style>
