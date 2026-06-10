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
  width: 100%;
  max-width: 1120px;
  margin: 0 auto;
  padding: 20px 16px 132px;
  background:
    radial-gradient(circle at top left, rgba(37, 99, 235, 0.1), transparent 32rem),
    #f8fafc;
  color: #0f172a;
}

.hero,
.calendar-card,
.section,
.password-note {
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.06);
}

.hero {
  padding: 20px;
  border-radius: 24px;
  margin-bottom: 16px;
}

.hero h1 {
  margin: 0;
  color: #0f172a;
  font-size: 28px;
  font-weight: 800;
  line-height: 1.15;
}

.hero p {
  margin: 8px 0 0;
  color: #64748b;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.5;
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 18px;
}

.stat-card {
  padding: 14px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  background: #f8fafc;
  text-align: center;
}

.stat-card h2 {
  margin: 0;
  color: #2563eb;
  font-size: 28px;
  font-weight: 800;
  line-height: 1;
}

.stat-card span {
  display: block;
  margin-top: 6px;
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
}

.calendar-card {
  padding: 18px;
  border-radius: 24px;
  margin-bottom: 16px;
}

.calendar-header,
.notif-header,
.leave-header,
.event-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}

.calendar-header {
  margin-bottom: 18px;
}

.calendar-header h2,
.section h2,
.leave-header h2,
.event-header h3 {
  margin: 0;
  color: #0f172a;
  font-weight: 800;
  line-height: 1.2;
}

.calendar-header h2,
.section h2 {
  font-size: 20px;
}

.calendar-nav {
  display: flex;
  gap: 8px;
}

.calendar-nav button,
.close-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #ffffff;
  color: #0f172a;
  font-size: 22px;
  font-weight: 800;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

.calendar-nav button:hover,
.close-btn:hover {
  background: #eff6ff;
  color: #2563eb;
}

.calendar-nav button:active,
.close-btn:active,
.fab:active {
  transform: scale(0.96);
}

.weekdays,
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
}

.weekdays {
  gap: 6px;
  margin-bottom: 10px;
}

.weekdays span {
  overflow: hidden;
  color: #64748b;
  font-size: 11px;
  font-weight: 800;
  line-height: 1.2;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.calendar-grid {
  gap: 8px;
}

.day {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
  min-width: 0;
  border: 1px solid transparent;
  border-radius: 14px;
  color: #0f172a;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.day:hover {
  background: #f8fafc;
  border-color: #e2e8f0;
}

.day.active {
  background: #eff6ff;
  border-color: #2563eb;
  color: #2563eb;
}

.event-dots {
  position: absolute;
  bottom: 6px;
  left: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transform: translateX(-50%);
}

.dot,
.legend-dot,
.event-icon {
  border-radius: 999px;
}

.dot {
  width: 6px;
  height: 6px;
}

.dot.employee,
.legend-dot.employee,
.event-icon.employee {
  background: #ec4899;
}

.dot.holiday,
.legend-dot.holiday,
.event-icon.holiday {
  background: #16a34a;
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-dot {
  width: 11px;
  height: 11px;
}

.legend-dot.personal {
  background: #2563eb;
}

.legend-item p {
  margin: 0;
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
}

.section {
  margin-bottom: 16px;
  padding: 18px;
  border-radius: 24px;
}

.section h2 {
  margin-bottom: 14px;
}

.leave-card,
.notif-card {
  padding: 16px;
  margin-bottom: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  background: #ffffff;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.leave-card:last-child,
.notif-card:last-child {
  margin-bottom: 0;
}

.leave-top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.leave-top h3,
.notif-content h3,
.event-info h4 {
  margin: 0;
  color: #0f172a;
  font-size: 15px;
  font-weight: 800;
  line-height: 1.35;
}

.leave-top p,
.notif-content p,
.event-header p,
.event-info p,
.leave-note {
  color: #64748b;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.5;
}

.leave-top p,
.event-header p,
.event-info p {
  margin: 6px 0 0;
}

.leave-note {
  margin-top: 12px;
}

.status,
.notif-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: fit-content;
  padding: 7px 11px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  line-height: 1;
  text-transform: capitalize;
  white-space: nowrap;
}

.status.approved,
.notif-status.approved {
  background: #dcfce7;
  color: #15803d;
}

.status.pending,
.notif-status.pending {
  background: #fef3c7;
  color: #b45309;
}

.status.rejected,
.notif-status.rejected {
  background: #fee2e2;
  color: #dc2626;
}

.status.cancelled {
  background: #f1f5f9;
  color: #475569;
}

.notif-header {
  align-items: center;
  margin-bottom: 14px;
}

.notif-card {
  position: relative;
  cursor: pointer;
}

.notif-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06);
}

.notif-card.unread {
  border-color: rgba(37, 99, 235, 0.22);
  background: #eff6ff;
}

.notif-content {
  width: 100%;
}

.notif-content h3 {
  margin-bottom: 10px;
}

.notif-content p {
  margin: 10px 0 0;
}

.notif-time {
  display: inline-flex;
  margin-top: 12px;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 700;
}

.read-all-btn {
  flex-shrink: 0;
  min-height: 38px;
  padding: 0 14px;
  border: 1px solid rgba(37, 99, 235, 0.18);
  border-radius: 12px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}

.password-note {
  padding: 14px 16px;
  border-radius: 18px;
  color: #1d4ed8;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.6;
}

.fab {
  position: fixed;
  right: 20px;
  bottom: calc(92px + env(safe-area-inset-bottom));
  z-index: 99;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 58px;
  height: 58px;
  border: none;
  border-radius: 18px;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #ffffff;
  font-size: 34px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 12px 26px rgba(37, 99, 235, 0.28);
}

.modal-overlay,
.modal-cuti {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  justify-content: center;
  padding: 20px;
  background: rgba(15, 23, 42, 0.48);
  backdrop-filter: blur(6px);
}

.modal-overlay {
  align-items: center;
}

.modal-cuti {
  align-items: flex-end;
}

.event-modal,
.leave-modal {
  width: 100%;
  max-width: 520px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: #ffffff;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.2);
  animation: slideUp 0.22s ease;
}

.event-modal {
  padding: 22px;
  border-radius: 24px;
}

.leave-modal {
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  padding: 22px 20px 110px;
  border-radius: 24px 24px 0 0;
}

.event-header {
  margin-bottom: 20px;
}

.leave-header {
  align-items: center;
  margin-bottom: 22px;
}

.leave-header h2 {
  font-size: 22px;
}

.event-list,
.leave-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.event-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  background: #f8fafc;
}

.event-icon {
  flex-shrink: 0;
  width: 14px;
  height: 14px;
}

.empty-event {
  padding: 26px 10px;
  color: #94a3b8;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.5;
  text-align: center;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  color: #475569;
  font-size: 13px;
  font-weight: 800;
}

.form-group select,
.form-group input,
.form-group textarea {
  width: 100%;
  padding: 15px 16px;
  border: 1px solid #cbd5e1;
  border-radius: 16px;
  background: #f8fafc;
  color: #0f172a;
  font-size: 14px;
  font-weight: 600;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.form-group select {
  appearance: none;
  cursor: pointer;
  padding-right: 48px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 16px center;
  background-size: 16px;
}

.form-group select:focus,
.form-group input:focus,
.form-group textarea:focus {
  border-color: #2563eb;
  background: #ffffff;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
}

.form-group option {
  color: #0f172a;
  background: #ffffff;
}

.form-group textarea {
  min-height: 120px;
  resize: vertical;
}

.date-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 14px;
}

.upload-box {
  width: 100%;
  padding: 20px;
  border: 2px dashed #cbd5e1;
  border-radius: 18px;
  background: #f8fafc;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.upload-box span {
  color: #64748b;
  font-size: 14px;
  font-weight: 700;
}

.upload-box:hover {
  border-color: #2563eb;
  background: #eff6ff;
}

.submit-btn {
  width: 100%;
  min-height: 54px;
  margin-top: 8px;
  border: 1px solid transparent;
  border-radius: 16px;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #ffffff;
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 12px 26px rgba(37, 99, 235, 0.24);
}

.form-error,
.submit-error,
.submit-success {
  font-size: 13px;
  font-weight: 800;
  line-height: 1.5;
}

.form-error {
  margin-top: 8px;
  color: #dc2626;
}

.submit-error,
.submit-success {
  padding: 12px 14px;
  border-radius: 14px;
}

.submit-error {
  border: 1px solid #fecaca;
  background: #fef2f2;
  color: #dc2626;
}

.submit-success {
  border: 1px solid #bbf7d0;
  background: #ecfdf5;
  color: #15803d;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(18px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (min-width: 640px) {
  .calendar-page {
    padding: 28px 24px 140px;
  }

  .hero {
    padding: 24px;
  }

  .date-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 900px) {
  .hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(360px, 0.8fr);
    align-items: center;
    gap: 24px;
  }

  .stats {
    margin-top: 0;
  }
}

@media (max-width: 430px) {
  .calendar-page {
    padding-left: 12px;
    padding-right: 12px;
  }

  .calendar-card,
  .section,
  .hero {
    padding: 16px;
  }

  .calendar-grid {
    gap: 5px;
  }

  .day {
    border-radius: 10px;
    font-size: 12px;
  }

  .weekdays span {
    font-size: 10px;
  }

  .leave-top,
  .notif-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .status {
    align-self: flex-start;
  }
}
</style>
