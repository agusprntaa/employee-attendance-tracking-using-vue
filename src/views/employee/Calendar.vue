<script setup>
import { ref, computed } from "vue";

import EmployeeBottomNav from "@/components/EmployeeBottomNav.vue";

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
  attachment: "",
});

const leaveStats = ref({
  total: 12,
  used: 8,
  remaining: 4,
});

const upcomingLeaves = ref([
  {
    id: 1,
    title: "Cuti tahunan",
    date: "20 Mei - 21 Mei",
    days: "2 Hari",
    status: "approved",
    note: "Disetujui HR",
  },
  {
    id: 2,
    title: "Cuti sakit",
    date: "28 Mei - 28 Mei",
    days: "1 Hari",
    status: "pending",
    note: "Menunggu persetujuan HR",
  },
]);

const notifications = ref([
  {
    id: 1,
    title: "Pengajuan cuti disetujui",
    desc: "Pengajuan cuti tahunan telah disetujui HR",
    time: "2 jam lalu",
    type: "success",
  },
  {
    id: 2,
    title: "Pengajuan cuti ditolak",
    desc: "Pengajuan cuti ditolak HR",
    time: "1 hari lalu",
    type: "danger",
  },
  {
    id: 3,
    title: "Pengajuan cuti diproses",
    desc: "Pengajuan cuti sedang menunggu approval",
    time: "3 hari lalu",
    type: "warning",
  },
]);

const calendarEvents = [
  {
    day: 15,
    type: "holiday",
    title: "Hari Raya",
  },

  {
    day: 20,
    type: "employee",
    title: "Widi mengambil cuti",
  },

  {
    day: 20,
    type: "employee",
    title: "Agus mengambil cuti",
  },

  {
    day: 21,
    type: "employee",
    title: "Wahyu mengambil cuti",
  },

  {
    day: 28,
    type: "holiday",
    title: "Libur Nasional",
  },
];

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
  return calendarEvents.filter((item) => item.day === day);
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

function submitLeave() {
  console.log("SUBMIT CUTI:", leaveForm.value);

  showLeaveModal.value = false;
}
</script>

<template>
  <div class="calendar-page">
    <div class="hero">
      <div>
        <h1>Kalender Cuti</h1>

        <p>Kalender Pengajuan cuti karyawan</p>
      </div>

      <button class="notif-btn">
        <!-- tambahkan icon notif.png -->
        <!-- <img src="/notif.png" alt="notif" /> -->
      </button>

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
            <h3>{{ item.title }}</h3>

            <p>
              {{ item.date }}
              ({{ item.days }})
            </p>
          </div>

          <span class="status" :class="item.status">
            {{ item.status === "approved" ? "Disetujui" : "Menunggu" }}
          </span>
        </div>

        <div class="leave-note">
          {{ item.note }}
        </div>
      </div>
    </div>

    <div class="section">
      <h2>Notifikasi</h2>

      <div v-for="item in notifications" :key="item.id" class="notif-card">
        <div class="notif-icon" :class="item.type">
          <!-- tambahkan icon sesuai status -->
          <!-- success.png -->
          <!-- warning.png -->
          <!-- danger.png -->

          <!-- <img v-if="item.type === 'success'" src="/success.png" alt="" /> -->

          <!-- <img v-else-if="item.type === 'warning'" src="/warning.png" alt="" /> -->

          <!-- <img v-else src="/danger.png" alt="" /> -->
        </div>

        <div class="notif-content">
          <h3>{{ item.title }}</h3>

          <p>{{ item.desc }}</p>

          <span>{{ item.time }}</span>
        </div>
      </div>
    </div>

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
              <h4>
                {{ event.type === "holiday" ? "Hari Libur" : "Karyawan Cuti" }}
              </h4>
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

            <option value="tahunan">Cuti Tahunan</option>

            <option value="sakit">Cuti Sakit</option>

            <option value="melahirkan">Cuti Melahirkan</option>

            <option value="pribadi">Cuti Pribadi</option>
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

        <div class="form-group">
          <label>Lampiran (Opsional)</label>

          <label class="upload-box">
            <input type="file" hidden />

            <span> Upload PDF / JPG / PNG </span>
          </label>
        </div>

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

  padding: 18px 18px 140px;
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

.notif-btn {
  position: absolute;

  top: 20px;
  right: 20px;

  width: 42px;
  height: 42px;

  border: none;
  border-radius: 14px;

  background: rgba(255, 255, 255, 0.14);

  display: flex;
  align-items: center;
  justify-content: center;

  backdrop-filter: blur(10px);
}

.notif-btn img {
  width: 20px;
  height: 20px;

  object-fit: contain;
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
  display: flex;

  gap: 14px;
}

.notif-icon {
  width: 48px;
  height: 48px;

  border-radius: 16px;

  flex-shrink: 0;

  display: flex;
  align-items: center;
  justify-content: center;
}

.notif-icon.success {
  background: #dcfce7;
}

.notif-icon.warning {
  background: #fef3c7;
}

.notif-icon.danger {
  background: #fee2e2;
}

.notif-icon img {
  width: 24px;
  height: 24px;

  object-fit: contain;
}

.notif-content h3 {
  font-size: 15px;
  font-weight: 700;

  color: #111827;
}

.notif-content p {
  margin-top: 5px;

  font-size: 13px;

  color: #6b7280;

  line-height: 1.5;
}

.notif-content span {
  display: block;

  margin-top: 8px;

  font-size: 12px;

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
</style>
