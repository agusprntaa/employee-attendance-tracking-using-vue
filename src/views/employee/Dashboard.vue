<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useLocation } from "@/composables/useLocation";
import { useAuth } from "@/composables/useAuth";
import { getAttendanceHistory } from "@/services/attendance";
import { logoutAPI } from "@/services/auth";
import API from "@/services/api";
import { getProfileAPI } from "@/services/auth";

import ProfileCard from "@/components/ProfileCard.vue";
import LocationBanner from "@/components/LocationBanner.vue";

const router = useRouter();
const { user, loadUser } = useAuth();

const loading = ref(false);
const currentTime = ref("");
const history = ref([]);
const todayData = ref(null);
const showLogoutConfirm = ref(false);

const { isInRadius, getCurrentLocation, distance, nearestOffice } =
  useLocation();

let interval = null;

const alreadyCheckedIn = computed(() => {
  return todayData.value?.has_checked_in || false;
});

const canCheckIn = computed(() => {
  return isInRadius.value && !alreadyCheckedIn.value && !loading.value;
});

// INIT
onMounted(async () => {
  try {
    await loadProfile();
    loadUser();

    startClock();

    await getCurrentLocation();
    await fetchToday();
    await fetchHistory();
  } catch (err) {
    console.error(err);
    alert("Gagal memuat data");
  }
});

onUnmounted(() => {
  clearInterval(interval);
});
//get profile
async function loadProfile() {
  const res = await getProfileAPI();
  localStorage.setItem("user", JSON.stringify(res.data.data));
}

// CLOCK
function startClock() {
  interval = setInterval(() => {
    currentTime.value = new Date().toLocaleTimeString("id-ID");
  }, 1000);
}

// TODAY
async function fetchToday() {
  try {
    const res = await API.get("/attendance/today");
    todayData.value = res.data.data;
  } catch (err) {
    console.error("TODAY ERROR:", err);
  }
}

// HISTORY
async function fetchHistory() {
  try {
    const res = await getAttendanceHistory(1, 10);
    history.value = res.data.data.data || [];
  } catch (err) {
    console.error("HISTORY ERROR:", err);
  }
}

// NAVIGATION
function goToScan() {
  if (!canCheckIn.value) return;
  router.push("/employee/scan");
}

function goToWFA() {
  if (loading.value) return;
  router.push("/employee/wfa");
}

// TIMEZONE
function formatTime(utc) {
  if (!utc) return "-";

  return new Date(utc).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
}

function formatDateIndo(date) {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
}

// FORMAT STATUS
function formatStatus(item) {
  if (item.work_type === "WFA") return "WFA";
  if (item.status === "PRESENT") return "HADIR";
  if (item.status === "LATE") return "TERLAMBAT";
  return item.status || "-";
}

function statusClass(item) {
  if (item.work_type === "WFA") return "wfa";
  if (item.status === "PRESENT") return "hadir";
  if (item.status === "LATE") return "late";
  return "";
}

//logout
async function handleLogout() {
  try {
    const refresh = localStorage.getItem("refresh_token");

    if (refresh) {
      await logoutAPI(refresh);
    }
  } catch (err) {
    console.error("LOGOUT ERROR:", err);
  } finally {
    localStorage.clear();

    window.location.href = "/";
  }
}

async function confirmLogout() {
  showLogoutConfirm.value = false;

  try {
    const refresh = localStorage.getItem("refresh_token");

    if (refresh) {
      await logoutAPI(refresh);
    }
  } catch (err) {
    console.error("LOGOUT ERROR:", err);
  } finally {
    localStorage.clear();
    window.location.href = "/";
  }
}
</script>

<template>
  <div class="wrapper">
    <div class="content">
      <LocationBanner
        :isInRadius="isInRadius"
        :distance="distance"
        :nearestOffice="nearestOffice"
      />

      <ProfileCard v-if="user" :user="user" />

      <div class="clock">
        <h1>{{ currentTime }}</h1>
        <p>Waktu sekarang</p>
      </div>

      <button class="btn" @click="goToScan" :disabled="!canCheckIn">
        {{
          alreadyCheckedIn
            ? "SUDAH ABSEN"
            : !isInRadius
              ? "DI LUAR RADIUS"
              : "CHECK IN"
        }}
      </button>

      <button
        class="btn-outline"
        @click="goToWFA"
        :disabled="loading || alreadyCheckedIn"
      >
        {{ alreadyCheckedIn ? "SUDAH ABSEN" : "WFA" }}
      </button>

      <div class="history">
        <h3>Riwayat Absensi</h3>

        <div class="item" v-for="item in history" :key="item.id">
          <div>
            <strong class="time">{{ formatTime(item.check_in) }}</strong>
            <p class="date">{{ formatDateIndo(item.date) }}</p>
          </div>

          <span class="status" :class="statusClass(item)">
            {{ formatStatus(item) }}
          </span>
        </div>
      </div>

      <div class="logout-wrapper">
        <button class="btn-logout" @click="showLogoutConfirm = true">
          Logout
        </button>
      </div>

      <div v-if="showLogoutConfirm" class="modal">
        <div class="modal-box">
          <p>Yakin ingin keluar?</p>

          <div class="actions">
            <button class="cancel" @click="showLogoutConfirm = false">
              Tetap di sini
            </button>

            <button class="confirm" @click="confirmLogout">Keluar</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wrapper {
  min-height: 100vh;
  background: #f5f7fb;
}

.content {
  width: 100%;
  max-width: 640px;
  margin: 0 auto;
  padding: 20px;
}

@media (min-width: 1024px) {
  .content {
    max-width: 820px;
    padding: 30px 40px;
  }
}

.clock {
  text-align: center;
  margin: 28px 0;
}

.clock h1 {
  font-size: 38px;
  font-weight: 700;
  letter-spacing: 1px;
  color: #111827;
}

@media (min-width: 1024px) {
  .clock h1 {
    font-size: 44px;
  }
}

.btn {
  width: 100%;
  padding: 16px;
  border-radius: 14px;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: white;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: 0 6px 18px rgba(79, 70, 229, 0.25);
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(79, 70, 229, 0.35);
}

.btn:active {
  transform: scale(0.98);
}

.btn-outline {
  width: 100%;
  padding: 16px;
  border-radius: 14px;
  border: 2px solid #4f46e5;
  background: white;
  color: #4f46e5;
  font-weight: 600;
  cursor: pointer;
  margin-top: 12px;
  transition: all 0.25s ease;
}

.btn-outline:active {
  transform: scale(0.98);
}

@media (min-width: 1024px) {
  .btn,
  .btn-outline {
    padding: 18px;
  }
}

.btn:disabled,
.btn-outline:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.history {
  margin-top: 32px;
}

.history h3 {
  margin-bottom: 14px;
  font-size: 15px;
  font-weight: 600;
  color: #374151;
}

.item {
  background: #ffffff;
  border-radius: 18px;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  align-items: center;
  transition: all 0.25s ease;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.05);
}

.item:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.08);
}

@media (min-width: 768px) {
  .item {
    padding: 18px;
  }
}

.time {
  font-size: 20px;
  font-weight: 700;
  color: #111827;
}

.date {
  color: #3b82f6;
  font-size: 12px;
  margin-top: 2px;
}

.status {
  padding: 8px 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.status.hadir {
  background: #e0f2fe;
  color: #0369a1;
}

.status.wfa {
  background: #eef2ff;
  color: #4338ca;
}

.status.late {
  background: #fee2e2;
  color: #b91c1c;
}

.logout-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.btn-logout {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 18px;
  background: transparent;
  border: 1.5px solid #ef4444;
  color: #ef4444;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s ease;
}

.btn-logout:hover {
  background: #ef4444;
  color: #fff;
  transform: translateY(-1px);
}

.btn-logout:active {
  transform: scale(0.96);
}

.modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-box {
  background: #ffffff;
  border-radius: 18px;
  padding: 28px 24px;
  width: 100%;
  max-width: 340px;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.18);
  text-align: center;
  animation: slideUp 0.25s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-box p {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 22px;
}

.actions {
  display: flex;
  gap: 10px;
}

.cancel {
  flex: 1;
  padding: 11px 0;
  background: #6a65d8;
  color: #ffffff;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel:hover {
  background: #4338ca;
}

.confirm {
  flex: 1;
  padding: 11px 0;
  background: #f3f4f6;
  color: #6b7280;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.confirm:hover {
  background: #e5e7eb;
  color: #374151;
}
</style>
