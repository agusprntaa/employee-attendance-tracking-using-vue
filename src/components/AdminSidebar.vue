<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { logout } from "@/utils/logout";

const router = useRouter();
const route = useRoute();

const showLogoutConfirm = ref(false);
const showAttendanceMenu = ref(false);
const sidebarOpen = ref(false);

watch(
  () => route.path,
  (newPath) => {
    if (
      newPath === "/admin-cabang/absen-kantor" ||
      newPath === "/admin-cabang/absen-event"
    ) {
      showAttendanceMenu.value = true;
    } else {
      showAttendanceMenu.value = false;
    }
  },
  { immediate: true },
);

async function handleLogout() {
  showLogoutConfirm.value = false;

  await logout();
}

function navigateTo(path) {
  router.push(path);
  sidebarOpen.value = false;
}

function closeSidebar() {
  sidebarOpen.value = false;
}

function handleKeydown(event) {
  if (event.key === "Escape") {
    sidebarOpen.value = false;
    showLogoutConfirm.value = false;
  }
}

onMounted(() => {
  window.addEventListener("keydown", handleKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleKeydown);
});
</script>

<template>
  <button
    v-if="!sidebarOpen"
    type="button"
    class="sidebar-toggle"
    aria-label="Buka menu"
    :aria-expanded="sidebarOpen"
    @click="sidebarOpen = true"
  >
    <span></span>
    <span></span>
    <span></span>
  </button>

  <div v-if="sidebarOpen" class="sidebar-overlay" @click="closeSidebar"></div>

  <aside class="sidebar" :class="{ open: sidebarOpen }">
    <!-- <div class="logo-btw">
      <img src="/logo.png" />
    </div> -->
    <h2>ABSENT BTW</h2>

    <div class="nav">
      <button
        @click="navigateTo('/admin-cabang/dashboard')"
        :class="{ active: route.path === '/admin-cabang/dashboard' }"
      >
        Dashboard
      </button>

      <div class="menu-group">
        <button
          class="menu-parent"
          @click="showAttendanceMenu = !showAttendanceMenu"
        >
          <span>Absensi</span>

          <span class="arrow">
            {{ showAttendanceMenu ? "▾" : "▸" }}
          </span>
        </button>

        <div v-if="showAttendanceMenu" class="submenu">
          <button
            class="submenu-btn"
            @click="navigateTo('/admin-cabang/absen-kantor')"
            :class="{
              active: route.path === '/admin-cabang/absen-kantor',
            }"
          >
            Absensi Kantor
          </button>

          <button
            class="submenu-btn"
            @click="navigateTo('/admin-cabang/absen-event')"
            :class="{
              active: route.path === '/admin-cabang/absen-event',
            }"
          >
            Absensi Event
          </button>
        </div>
      </div>

      <button
        @click="navigateTo('/admin-cabang/employees')"
        :class="{ active: route.path === '/admin-cabang/employees' }"
      >
        Karyawan
      </button>

      <button
        @click="navigateTo('/admin-cabang/reports')"
        :class="{ active: route.path === '/admin-cabang/reports' }"
      >
        Laporan
      </button>

      <button
        @click="navigateTo('/admin-cabang/calendar')"
        :class="{ active: route.path === '/admin-cabang/calendar' }"
      >
        Kalender cuti
      </button>

      <button
        @click="navigateTo('/admin-cabang/settings')"
        :class="{ active: route.path === '/admin-cabang/settings' }"
      >
        Pengaturan
      </button>

      <!-- <button>Schedules</button> -->
    </div>

    <div class="logout-wrap">
      <slot name="logout"></slot>
      <button class="btn-logout" @click="showLogoutConfirm = true">
        Keluar
      </button>
    </div>
  </aside>
  <div
    v-if="showLogoutConfirm"
    class="modal"
    @click.self="showLogoutConfirm = false"
  >
    <div class="modal-box">
      <p>Yakin ingin keluar?</p>

      <div class="actions">
        <button class="cancel" @click="showLogoutConfirm = false">
          Tetap di sini
        </button>

        <button class="confirm" @click="handleLogout">Keluar</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sidebar {
  width: 240px;
  min-width: 240px;
  background: #1e1b4b;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
  height: 100vh;
  position: sticky;
  top: 0;
  overflow-y: auto;
  scrollbar-width: none;
  z-index: 1000;
}

.sidebar-toggle,
.sidebar-overlay {
  display: none;
}

.sidebar::-webkit-scrollbar {
  display: none;
}

.sidebar h2 {
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 0.5px;
  padding: 28px 24px 26px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: #1e1b4b;
}

.sidebar .nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 20px 16px;
  overflow-y: auto;
}

.sidebar button {
  width: 100%;
  padding: 12px 18px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: rgba(255, 255, 255, 0.55);
  font-size: 14px;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  transition:
    background 0.18s,
    color 0.18s;
  letter-spacing: 0.2px;
}

.sidebar button:hover {
  background: rgba(255, 255, 255, 0.07);
  color: rgba(255, 255, 255, 0.85);
}

.sidebar button.active {
  background: #4f46e5;
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(79, 70, 229, 0.45);
}

.sidebar .logout-wrap {
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.sidebar .btn-logout {
  width: 100%;
  padding: 12px 18px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  background: transparent;
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  transition: all 0.18s;
}

.sidebar .btn-logout:hover {
  background: rgba(239, 68, 68, 0.12);
  border-color: rgba(239, 68, 68, 0.4);
  color: #fca5a5;
}

/* logo btw */
.logo-btw {
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-btw img {
  width: 100px;
  height: auto;
  object-fit: contain;
}

.modal {
  position: fixed;
  inset: 0;

  background: rgba(15, 23, 42, 0.45);

  display: flex;
  align-items: center;
  justify-content: center;

  z-index: 9999;

  backdrop-filter: blur(2px);
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

.modal-box p {
  font-size: 15px;
  font-weight: 600;

  color: #111827;

  margin-bottom: 22px;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.actions button {
  min-width: 120px;
  height: 42px;
  padding: 0 18px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.18s ease;
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

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.96);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.menu-group {
  display: flex;
  flex-direction: column;
}

.menu-parent {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.arrow {
  font-size: 12px;
}

.submenu {
  display: flex;
  flex-direction: column;
  gap: 4px;

  margin-left: 16px;
  margin-top: 4px;
}

.submenu-btn {
  font-size: 13px !important;
  padding: 10px 14px !important;
  color: rgba(255, 255, 255, 0.65) !important;
}

.submenu-btn.active {
  background: #4f46e5;
  color: white !important;
}

@media (max-width: 1024px) {
  .sidebar-toggle {
    position: fixed;
    top: 16px;
    left: 16px;
    z-index: 1100;
    display: inline-flex;
    width: 44px;
    height: 44px;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 5px;
    border: 1px solid rgba(30, 27, 75, 0.12);
    border-radius: 12px;
    background: #ffffff;
    box-shadow: 0 10px 25px rgba(15, 23, 42, 0.12);
    cursor: pointer;
  }

  .sidebar-toggle span {
    width: 20px;
    height: 2px;
    border-radius: 999px;
    background: #1e1b4b;
  }

  .sidebar-overlay {
    position: fixed;
    inset: 0;
    z-index: 999;
    display: block;
    background: rgba(15, 23, 42, 0.45);
    animation: fadeIn 0.2s ease;
  }

  .sidebar {
    position: fixed;
    inset: 0 auto 0 0;
    transform: translateX(-100%);
    transition: transform 0.24s ease;
    box-shadow: 20px 0 45px rgba(15, 23, 42, 0.22);
  }

  .sidebar.open {
    transform: translateX(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}
</style>
