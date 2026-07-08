<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { useLocation } from "@/composables/useLocation";
import { useAuth } from "@/composables/useAuth";
import {
  getAttendanceHistory,
  checkoutAttendance,
  getActiveEventsTodayAPI,
} from "@/services/attendance";
import { logout } from "@/utils/logout";
import { LayoutDashboard, CalendarDays, User, LogOut } from "lucide-vue-next";
import API from "@/services/api";
import { getProfileAPI } from "@/services/auth";

import ProfileCard from "@/components/ProfileCard.vue";
import LocationBanner from "@/components/LocationBanner.vue";
import EmployeeBottomNav from "@/components/EmployeeBottomNav.vue";

import { getStatusLabel, getStatusClass } from "@/utils/attendanceStatus";
import { getSafeErrorMessage } from "@/utils/errorMessage";

const router = useRouter();
const { user, loadUser } = useAuth();

const popupMessage = ref("");
const showPopup = ref(false);

const loading = ref(false);
const currentTime = ref("");
const history = ref([]);
const historyLimit = 10;
const todayData = ref(null);
const showLogoutConfirm = ref(false);

const showEarlyLeaveModal = ref(false);
const earlyLeaveReason = ref("");
const activeEvents = ref([]);
const showEventModal = ref(false);

const eventError = ref("");

const { isInRadius, getCurrentLocation, distance, nearestOffice } =
  useLocation();

let interval = null;

const alreadyCheckedOut = computed(() => {
  return todayData.value?.has_checked_out || false;
});

const alreadyCheckedIn = computed(() => {
  return todayData.value?.has_checked_in || false;
});

const canCheckIn = computed(() => {
  return !alreadyCheckedIn.value && !loading.value;
});

function parseLocalDate(dateString) {
  if (!dateString) return null;

  const clean = dateString.split(".")[0];

  const [datePart, timePart] = clean.includes("T")
    ? clean.split("T")
    : clean.split(" ");

  if (!datePart || !timePart) {
    const parsed = new Date(dateString);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const [year, month, day] = datePart.split("-").map(Number);

  const [hour, minute, second] = timePart.split(":").map(Number);

  return new Date(year, month - 1, day, hour, minute, second || 0);
}

const checkoutInfo = computed(() => {
  if (!todayData.value?.attendance?.check_in) return null;

  const checkIn = parseLocalDate(todayData.value.attendance.check_in);

  if (!checkIn) return null;

  const workHours = todayData.value.required_hours || 9;

  const checkoutTime = new Date(checkIn.getTime() + workHours * 60 * 60 * 1000);

  const now = new Date();

  return {
    checkoutTime,
    isFinished: now >= checkoutTime,
  };
});

function openPopup(message) {
  popupMessage.value = message;

  showPopup.value = true;

  setTimeout(() => {
    showPopup.value = false;
    popupMessage.value = "";
  }, 3000);
}

// INIT
onMounted(async () => {
  try {
    await loadProfile();

    const latestUser = JSON.parse(localStorage.getItem("user"));

    user.value = latestUser;

    startClock();

    await getCurrentLocation();
    await fetchToday();
    await fetchHistory();
    await fetchActiveEvents();
  } catch (err) {
    openPopup("Gagal memuat data");
  }
});

onUnmounted(() => {
  clearInterval(interval);
});
//get profile
async function loadProfile() {
  const res = await getProfileAPI();

  const oldUser = JSON.parse(localStorage.getItem("user"));

  const latestUser = {
    ...oldUser,
    ...res.data.data,
  };

  localStorage.setItem("user", JSON.stringify(latestUser));
}

// CLOCK
function startClock() {
  interval = setInterval(() => {
    currentTime.value = new Date().toLocaleTimeString("id-ID", {
      // timeZone: "Asia/Makassar",
    });
  }, 1000);
}

// TODAY
async function fetchToday() {
  try {
    const res = await API.get("/attendance/today");
    todayData.value = res.data.data;
  } catch (err) {}
}

// HISTORY
async function fetchHistory() {
  try {
    const res = await getAttendanceHistory(historyLimit);

    history.value = res.data.data.data || [];
  } catch (err) {}
}

async function fetchActiveEvents() {
  try {
    const res = await getActiveEventsTodayAPI();

    activeEvents.value = Array.isArray(res.data?.data) ? res.data.data : [];
  } catch (err) {
    activeEvents.value = [];
  }
}
// NAVIGATION
function goToScan() {
  if (!canCheckIn.value) return;
  router.push("/employee/checkin-face");
  // router.push("/checkin-face");
}

function goToWFA() {
  if (loading.value) return;
  router.push("/employee/wfa");
}

function goToEvents() {
  if (loading.value) return;
  eventError.value = "";
  showEventModal.value = true;
}

async function startEventAttendance(event) {
  if (event.already_checked_in) return;
  eventError.value = "";

  const selectedEventId = getEventId(event);

  if (!selectedEventId) {
    eventError.value = "Data event tidak valid.";
    return;
  }

  showEventModal.value = false;

  router.push({
    path: "/employee/checkin-face",
    query: {
      eventId: selectedEventId,
      eventName: event.name,
    },
  });
}

function getEventId(event) {
  return event.event_id ?? event.id;
}

function canStartEventAttendance(event) {
  if (!event.date || !event.start_time) return true;

  const start = new Date(`${event.date}T${event.start_time}`);
  const now = new Date();

  return now >= start;
}

function formatEventTime(event) {
  const start = event.start_time?.slice(0, 5) || "-";
  const end = event.end_time?.slice(0, 5) || "selesai";
  return `${start} - ${end}`;
}

async function onClickCheckout() {
  try {
    loading.value = true;

    // await checkoutAttendance({
    //   early_leave_reason: "",
    // });
    const res = await checkoutAttendance({
      early_leave_reason: "",
    });

    openPopup("Check-out berhasil");

    await fetchToday();
    await fetchHistory();
  } catch (err) {
    const errorCode = err.response?.data?.code;

    if (errorCode === "EARLY_LEAVE_REASON_REQUIRED") {
      showEarlyLeaveModal.value = true;
      return;
    }

    openPopup(getSafeErrorMessage(err, "Gagal check-out"));
  } finally {
    loading.value = false;
  }
}

async function handleCheckout(reason = "") {
  try {
    loading.value = true;

    const res = await checkoutAttendance({
      early_leave_reason: reason,
    });

    openPopup("Check-out berhasil");

    showEarlyLeaveModal.value = false;
    earlyLeaveReason.value = "";

    await fetchToday();

    await fetchHistory();
  } catch (err) {
    const errorCode = err.response?.data?.code;

    if (errorCode === "EARLY_LEAVE_REASON_REQUIRED") {
      showEarlyLeaveModal.value = true;
      return;
    }

    openPopup(getSafeErrorMessage(err, "Gagal check-out"));
  } finally {
    loading.value = false;
  }
}

// TIMEZONE
function formatTime(utc) {
  if (!utc) return "-";

  const d = new Date(utc);
  return d.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCheckoutTime(date) {
  if (!date) return "-";

  return new Date(date).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    // timeZone: "Asia/Makassar",
  });
}

function formatDateIndo(date) {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    // timeZone: "Asia/Makassar",
  });
}

function checkoutLabel(item) {
  if (item.status === "EARLY_LEAVE") {
    return "Pulang Cepat";
  }

  if (item.is_auto_checkout) {
    return "Checkout Otomatis";
  }

  return "";
}

//logout
// async function handleLogout() {
//   try {
//     const refresh = localStorage.getItem("refresh_token");

//     if (refresh) {
//       await logoutAPI(refresh);
//     }
//   } catch (err) {
//   } finally {
//     localStorage.clear();

//     window.location.href = "/";
//   }
// }

async function handleLogout() {
  showLogoutConfirm.value = false;

  await logout();
}
</script>

<template>
  <div class="wrapper">
    <main class="content">
      <section class="dashboard-header" aria-label="Ringkasan dashboard">
        <div>
          <!-- <p class="eyebrow">Employee Attendance</p> -->
          <h1>Dashboard</h1>
        </div>

        <div class="clock-card">
          <span>{{ currentTime || "--:--:--" }}</span>
          <small>Waktu sekarang</small>
        </div>
      </section>

      <div class="dashboard-grid">
        <section class="profile-column" aria-label="Profil dan lokasi">
          <LocationBanner
            :isInRadius="isInRadius"
            :distance="distance"
            :nearestOffice="nearestOffice"
          />

          <ProfileCard v-if="user" :user="user" />
        </section>

        <section class="attendance-card" aria-label="Aksi absensi">
          <div class="section-heading">
            <div>
              <p class="section-kicker">Absensi hari ini</p>
              <h2>Mulai aktivitas kerja</h2>
            </div>

            <span
              class="attendance-state"
              :class="{ completed: alreadyCheckedIn }"
            >
              {{ alreadyCheckedIn ? "Sudah absen" : "Belum absen" }}
            </span>
          </div>

          <div class="action-grid">
            <button
              type="button"
              class="btn btn-primary"
              @click="goToScan"
              :disabled="!canCheckIn"
            >
              {{ alreadyCheckedIn ? "Sudah Absen" : "Check In" }}
            </button>

            <button
              type="button"
              class="btn btn-secondary"
              @click="goToWFA"
              :disabled="loading || alreadyCheckedIn"
            >
              {{ alreadyCheckedIn ? "Sudah Absen" : "WFA" }}
            </button>

            <button
              type="button"
              class="btn btn-event"
              @click="goToEvents"
              :disabled="loading"
            >
              {{ showEventModal ? "Tutup Daftar Event" : "Absen Event" }}
            </button>
          </div>

          <div
            v-if="alreadyCheckedIn && !alreadyCheckedOut && checkoutInfo"
            class="checkout-info"
          >
            <p class="checkout-time">
              Anda dapat pulang pukul
              <strong>{{
                formatCheckoutTime(checkoutInfo.checkoutTime)
              }}</strong>
            </p>

            <button
              type="button"
              class="checkout-link"
              :class="{ danger: checkoutInfo.isFinished }"
              @click="onClickCheckout"
            >
              {{
                checkoutInfo.isFinished
                  ? "Pulang sekarang"
                  : "Ajukan pulang cepat?"
              }}
            </button>
          </div>
        </section>
      </div>

      <section class="history-card" aria-label="Riwayat absensi">
        <div class="section-heading history-heading">
          <div>
            <p class="section-kicker">Aktivitas</p>
            <h2>Riwayat Absensi</h2>
          </div>
        </div>

        <div class="history-list">
          <article class="history-item" v-for="item in history" :key="item.id">
            <div class="history-main">
              <strong class="time">
                {{ formatTime(item.check_in) }}
              </strong>

              <p class="date">
                {{ formatDateIndo(item.date) }}
              </p>
            </div>

            <div class="status-wrapper">
              <span class="status" :class="getStatusClass(item.status)">
                {{ getStatusLabel(item.status) }}
              </span>

              <small v-if="checkoutLabel(item)" class="status-note">
                {{ checkoutLabel(item) }}
              </small>
            </div>
          </article>
        </div>
      </section>
    </main>

    <Transition name="toast">
      <div v-if="showPopup" class="popup" role="status" aria-live="polite">
        {{ popupMessage }}
      </div>
    </Transition>

    <div
      v-if="showLogoutConfirm"
      class="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-title"
    >
      <div class="modal-box">
        <h3 id="logout-title" class="modal-title">Yakin ingin keluar?</h3>

        <div class="actions">
          <button
            type="button"
            class="cancel"
            @click="showLogoutConfirm = false"
          >
            Tetap di sini
          </button>

          <button type="button" class="confirm" @click="handleLogout">
            Keluar
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showEarlyLeaveModal"
      class="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="early-leave-title"
    >
      <div class="modal-box">
        <h3 id="early-leave-title" class="modal-title">Alasan Pulang Cepat</h3>

        <label class="reason-label" for="early-leave-reason">
          Jelaskan alasan Anda
        </label>

        <textarea
          id="early-leave-reason"
          v-model="earlyLeaveReason"
          class="reason-input"
          placeholder="Masukkan alasan pulang cepat..."
        ></textarea>

        <div class="actions">
          <button
            type="button"
            class="cancel"
            @click="showEarlyLeaveModal = false"
          >
            Batal
          </button>

          <button
            type="button"
            class="confirm"
            @click="handleCheckout(earlyLeaveReason)"
          >
            Kirim
          </button>
        </div>
      </div>
    </div>
    <div v-if="showEventModal" class="modal">
      <div class="modal-box event-modal">
        <h3 class="modal-title">Pilih Event</h3>

        <div v-if="activeEvents.length === 0" class="empty-event">
          <h4>Tidak Ada Event</h4>

          <p>Saat ini belum ada event absensi yang sedang berlangsung.</p>
        </div>

        <div v-else class="event-list">
          <article
            v-for="event in activeEvents"
            :key="getEventId(event)"
            class="event-item"
          >
            <div>
              <strong>{{ event.name }}</strong>

              <span>
                {{ formatEventTime(event) }}
                •
                {{ event.location }}
              </span>
            </div>

            <button
              type="button"
              :disabled="
                event.already_checked_in || !canStartEventAttendance(event)
              "
              :title="
                !canStartEventAttendance(event)
                  ? 'Belum waktu absensi event'
                  : event.already_checked_in
                    ? 'Anda sudah melakukan absensi'
                    : 'Masuk ke absensi event'
              "
              @click="startEventAttendance(event)"
            >
              {{
                event.already_checked_in
                  ? "Sudah Absen"
                  : canStartEventAttendance(event)
                    ? "Pilih"
                    : "Belum Dimulai"
              }}
            </button>
          </article>
        </div>

        <p v-if="eventError" class="event-error">
          {{ eventError }}
        </p>

        <div class="actions">
          <button class="cancel" @click="showEventModal = false">Tutup</button>
        </div>
      </div>
    </div>
  </div>

  <EmployeeBottomNav />
</template>

<style scoped>
.wrapper {
  min-height: 100vh;
  background:
    radial-gradient(
      circle at top left,
      rgba(37, 99, 235, 0.1),
      transparent 32rem
    ),
    #f8fafc;
  color: #0f172a;
}

.content {
  width: 100%;
  max-width: 1120px;
  margin: 0 auto;
  padding: 20px 16px 112px;
}

.dashboard-header {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 18px;
}

.eyebrow,
.section-kicker {
  margin: 0 0 6px;
  color: #2563eb;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.dashboard-header h1,
.section-heading h2 {
  margin: 0;
  color: #0f172a;
}

.dashboard-header h1 {
  font-size: 28px;
  font-weight: 800;
  line-height: 1.15;
}

.clock-card {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  padding: 16px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 20px;
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.06);
}

.clock-card span {
  color: #0f172a;
  font-size: 30px;
  font-weight: 800;
  line-height: 1;
}

.clock-card small {
  color: #64748b;
  font-size: 13px;
  font-weight: 600;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
}

.profile-column {
  min-width: 0;
}

.attendance-card,
.history-card {
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 24px;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.06);
}

.attendance-card {
  padding: 20px;
}

.section-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 18px;
}

.section-heading h2 {
  font-size: 20px;
  font-weight: 800;
  line-height: 1.25;
}

.attendance-state {
  flex-shrink: 0;
  padding: 7px 10px;
  border-radius: 999px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 11px;
  font-weight: 800;
  white-space: nowrap;
}

.attendance-state.completed {
  background: #dcfce7;
  color: #15803d;
}

.action-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 12px;
}

.btn {
  width: 100%;
  min-height: 54px;
  padding: 0 18px;
  border-radius: 16px;
  border: 1px solid transparent;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #ffffff;
  box-shadow: 0 12px 26px rgba(37, 99, 235, 0.24);
}

.btn-secondary {
  background: #ffffff;
  color: #2563eb;
  border-color: rgba(37, 99, 235, 0.28);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
}

.btn-event {
  grid-column: 1 / -1;
  background: #0f172a;
  color: #ffffff;
  box-shadow: 0 12px 26px rgba(15, 23, 42, 0.18);
}

.event-list {
  display: grid;
  gap: 10px;
  margin-top: 14px;
}

.empty-event {
  padding: 24px;
  border: 1px dashed #cbd5e1;
  border-radius: 16px;
  background: #f8fafc;
  text-align: center;
}

.empty-event h4 {
  margin-bottom: 6px;
  color: #334155;
  font-size: 16px;
  font-weight: 700;
}

.empty-event p {
  color: #64748b;
  font-size: 13px;
  line-height: 1.5;
}

.event-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  background: #f8fafc;
}

.event-item div {
  display: grid;
  gap: 4px;
  min-width: 0;
}
.event-item strong {
  font-size: 14px;
}
.event-item span {
  color: #64748b;
  font-size: 12px;
  line-height: 1.4;
}
.event-item button {
  flex: 0 0 auto;
  min-height: 38px;
  padding: 0 14px;
  border: 0;
  border-radius: 12px;
  background: #2563eb;
  color: #fff;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}
.event-item button:disabled {
  background: #e2e8f0;
  color: #64748b;
  cursor: not-allowed;
  opacity: 0.9;
}

.btn:hover {
  transform: translateY(-1px);
}

.btn-primary:hover {
  box-shadow: 0 16px 30px rgba(37, 99, 235, 0.28);
}

.btn:active {
  transform: scale(0.98);
}

.btn:disabled {
  opacity: 0.58;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.checkout-info {
  margin-top: 16px;
  padding: 14px;
  border-radius: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  text-align: center;
}

.checkout-time {
  margin: 0 0 8px;
  color: #64748b;
  font-size: 13px;
  line-height: 1.5;
}

.checkout-time strong {
  color: #0f172a;
}

.checkout-link {
  border: none;
  background: transparent;
  color: #2563eb;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
}

.checkout-link:hover {
  text-decoration: underline;
}

.checkout-link.danger {
  color: #dc2626;
}

.history-card {
  margin-top: 16px;
  padding: 20px;
}

.history-heading {
  margin-bottom: 14px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  background: #ffffff;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.history-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06);
}

.history-main {
  min-width: 0;
}

.time {
  display: block;
  color: #0f172a;
  font-size: 20px;
  font-weight: 800;
  line-height: 1.1;
}

.date {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
}

.status-wrapper {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex-shrink: 0;
  gap: 5px;
}

.status {
  padding: 7px 11px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  line-height: 1;
  white-space: nowrap;
}

.status.hadir {
  background: #dcfce7;
  color: #15803d;
}

.status.late {
  background: #fef3c7;
  color: #b45309;
}

.status.wfa {
  background: #dbeafe;
  color: #1d4ed8;
}

.status-note {
  color: #94a3b8;
  font-size: 11px;
  font-weight: 700;
  text-align: right;
}

.modal {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(15, 23, 42, 0.48);
  backdrop-filter: blur(6px);
  animation: fadeIn 0.2s ease;
}

.modal-box {
  width: 100%;
  max-width: 380px;
  max-height: 80vh;
  overflow-y: auto;
  padding: 24px;
  background: #ffffff;
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 24px;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.2);
  animation: slideUp 0.24s ease;
}

.event-modal {
  max-width: 680px;
  width: min(92vw, 680px);
  max-height: 80vh;
  overflow-y: auto;
}

.modal-title {
  margin: 0 0 18px;
  color: #0f172a;
  font-size: 18px;
  font-weight: 800;
  text-align: center;
}

.reason-label {
  display: block;
  margin-bottom: 8px;
  color: #475569;
  font-size: 13px;
  font-weight: 800;
}

.reason-input {
  width: 100%;
  min-height: 124px;
  padding: 14px;
  margin-bottom: 16px;
  resize: vertical;
  border: 1px solid #cbd5e1;
  border-radius: 16px;
  background: #f8fafc;
  color: #0f172a;
  font-size: 14px;
  line-height: 1.5;
  outline: none;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;
}

.reason-input:focus {
  border-color: #2563eb;
  background: #ffffff;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
}

.actions {
  display: flex;
  gap: 10px;
}

.event-modal .actions {
  margin-top: 28px;
  padding-top: 18px;
  border-top: 1px solid #e2e8f0;
}

.cancel,
.confirm {
  flex: 1;
  min-height: 44px;
  padding: 0 14px;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    background 0.2s ease,
    box-shadow 0.2s ease;
}

.cancel {
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #475569;
}

.confirm {
  border: 1px solid transparent;
  background: #2563eb;
  color: #ffffff;
  box-shadow: 0 10px 22px rgba(37, 99, 235, 0.22);
}

.cancel:hover,
.confirm:hover {
  transform: translateY(-1px);
}

.cancel:hover {
  background: #f8fafc;
}

.popup {
  position: fixed;
  top: 20px;
  left: 50%;
  z-index: 10000;
  width: calc(100% - 32px);
  max-width: 420px;
  transform: translateX(-50%);
  padding: 14px 18px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.94);
  color: #ffffff;
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.18);
  font-size: 14px;
  font-weight: 700;
  text-align: center;
}

.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -10px);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
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
  .content {
    padding: 28px 24px 124px;
  }

  .dashboard-header {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .clock-card {
    width: auto;
    min-width: 220px;
    align-items: flex-end;
  }

  .action-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 900px) {
  .content {
    padding: 34px 28px 130px;
  }

  .dashboard-grid {
    grid-template-columns: minmax(0, 1.05fr) minmax(320px, 0.95fr);
    align-items: start;
  }

  .attendance-card {
    min-height: 100%;
  }

  .dashboard-header h1 {
    font-size: 32px;
  }
}

@media (max-width: 430px) {
  .section-heading {
    flex-direction: column;
  }

  .attendance-state {
    align-self: flex-start;
  }

  .history-item {
    align-items: flex-start;
    flex-direction: column;
  }

  .status-wrapper {
    align-items: flex-start;
  }

  .actions {
    flex-direction: column;
  }
}

.event-error {
  margin-top: 14px;
  padding: 12px 14px;
  border-radius: 12px;
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
  font-size: 13px;
  font-weight: 600;
}
</style>
