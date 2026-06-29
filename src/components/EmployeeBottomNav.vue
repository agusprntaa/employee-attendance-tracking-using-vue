<script setup>
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";

import { LayoutDashboard, CalendarDays, User, LogOut } from "lucide-vue-next";

import { logout } from "@/utils/logout";

const router = useRouter();
const route = useRoute();

const showLogoutConfirm = ref(false);

async function handleLogout() {
  showLogoutConfirm.value = false;

  await logout();
}
</script>

<template>
  <nav class="bottom-nav" aria-label="Navigasi karyawan">
    <button
      type="button"
      class="nav-item"
      :class="{ active: route.path === '/employee/dashboard' }"
      aria-label="Dashboard"
      @click="router.push('/employee/dashboard')"
    >
      <LayoutDashboard :size="21" />
      <span>Home</span>
    </button>

    <button
      type="button"
      class="nav-item"
      :class="{ active: route.path === '/employee/calendar' }"
      aria-label="Kalender"
      @click="router.push('/employee/calendar')"
    >
      <CalendarDays :size="21" />
      <span>Kalender</span>
    </button>

    <button
      type="button"
      class="nav-item"
      :class="{ active: route.path === '/employee/biodata' }"
      aria-label="Profil"
      @click="router.push('/employee/biodata')"
    >
      <User :size="21" />
      <span>Profil</span>
    </button>

    <button
      type="button"
      class="nav-item danger"
      aria-label="Keluar"
      @click="showLogoutConfirm = true"
    >
      <LogOut :size="21" />
      <span>Keluar</span>
    </button>
  </nav>

  <div
    v-if="showLogoutConfirm"
    class="modal"
    role="dialog"
    aria-modal="true"
    aria-labelledby="employee-logout-title"
  >
    <div class="modal-box">
      <h3 id="employee-logout-title">Yakin ingin keluar?</h3>

      <div class="actions">
        <button type="button" class="cancel" @click="showLogoutConfirm = false">
          Tetap di sini
        </button>

        <button type="button" class="confirm" @click="handleLogout">
          Keluar
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bottom-nav {
  position: fixed;
  left: 50%;
  bottom: calc(14px + env(safe-area-inset-bottom));
  z-index: 999;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  align-items: center;
  width: calc(100% - 28px);
  max-width: 460px;
  min-height: 68px;
  padding: 8px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow:
    0 18px 42px rgba(15, 23, 42, 0.12),
    0 4px 14px rgba(15, 23, 42, 0.06);
  backdrop-filter: blur(16px);
  transform: translateX(-50%);
}

.nav-item {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  min-height: 52px;
  border: none;
  border-radius: 18px;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease;
  -webkit-tap-highlight-color: transparent;
}

.nav-item svg {
  flex-shrink: 0;
  stroke-width: 2.4;
}

.nav-item span {
  max-width: 100%;
  overflow: hidden;
  font-size: 11px;
  font-weight: 800;
  line-height: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-item:hover {
  background: #f8fafc;
  color: #2563eb;
}

.nav-item:active {
  transform: scale(0.96);
}

.nav-item.active {
  background: #eff6ff;
  color: #2563eb;
}

.nav-item.danger:hover {
  color: #dc2626;
  background: #fef2f2;
}

.modal {
  position: fixed;
  inset: 0;
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(15, 23, 42, 0.48);
  backdrop-filter: blur(6px);
}

.modal-box {
  width: 100%;
  max-width: 380px;
  padding: 24px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 24px;
  background: #ffffff;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.2);
  animation: slideUp 0.24s ease;
}

.modal-box h3 {
  margin: 0 0 18px;
  color: #0f172a;
  font-size: 18px;
  font-weight: 800;
  text-align: center;
}

.actions {
  display: flex;
  gap: 10px;
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
  background: #dc2626;
  color: #ffffff;
  box-shadow: 0 10px 22px rgba(220, 38, 38, 0.2);
}

.cancel:hover,
.confirm:hover {
  transform: translateY(-1px);
}

.cancel:hover {
  background: #f8fafc;
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

@media (min-width: 768px) {
  .bottom-nav {
    min-height: 72px;
  }
}

@media (max-width: 360px) {
  .bottom-nav {
    width: calc(100% - 20px);
    padding: 6px;
  }

  .nav-item span {
    font-size: 10px;
  }
}
</style>
