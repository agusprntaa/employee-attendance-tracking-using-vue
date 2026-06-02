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
  <div class="bottom-nav">
    <button
      class="nav-item"
      :class="{
        active: route.path === '/employee/dashboard',
      }"
      @click="router.push('/employee/dashboard')"
    >
      <LayoutDashboard :size="22" />

      <!-- <span>Home</span> -->
    </button>

    <button
      class="nav-item"
      :class="{
        active: route.path === '/employee/calendar',
      }"
      @click="router.push('/employee/calendar')"
    >
      <CalendarDays :size="22" />

      <!-- <span>Kalender</span> -->
    </button>

    <button
      class="nav-item"
      :class="{
        active: route.path === '/employee/biodata',
      }"
      @click="router.push('/employee/biodata')"
    >
      <User :size="22" />

      <!-- <span>Profile</span> -->
    </button>

    <button class="nav-item" @click="showLogoutConfirm = true">
      <LogOut :size="22" />

      <!-- <span>Keluar</span> -->
    </button>
  </div>

  <div v-if="showLogoutConfirm" class="modal">
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
.bottom-nav {
  position: fixed;

  left: 50%;
  transform: translateX(-50%);

  width: calc(100% - 32px);
  max-width: 420px;

  bottom: 20px;

  height: 55px;

  background: linear-gradient(135deg, #4f46e5, #4338ca);

  border-radius: 24px;

  display: flex;
  align-items: center;
  justify-content: space-around;

  padding: 0 10px;

  z-index: 999;

  box-shadow:
    0 14px 32px rgba(79, 70, 229, 0.28),
    0 4px 12px rgba(0, 0, 0, 0.08);
}

.nav-item {
  flex: 1;

  height: 100%;

  border: none;
  background: transparent;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  gap: 5px;

  color: rgba(255, 255, 255, 0.72);

  cursor: pointer;

  border-radius: 24px;

  transition: all 0.22s ease;

  -webkit-tap-highlight-color: transparent;
}

.nav-item svg {
  stroke-width: 2.3;

  transition: all 0.22s ease;
}

.nav-item span {
  font-size: 11px;
  font-weight: 600;

  letter-spacing: 0.2px;
}

.nav-item:active {
  transform: scale(0.95);
}

.nav-item.active {
  color: #ffffff;

  background: rgba(255, 255, 255, 0.14);
}

.nav-item.active svg {
  transform: translateY(-1px) scale(1.05);
}

.modal {
  position: fixed;

  top: 0;
  left: 0;

  width: 100vw;
  height: 100vh;

  background: rgba(15, 23, 42, 0.45);

  display: flex;
  align-items: center;
  justify-content: center;

  z-index: 99999;

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

.modal-box {
  position: relative;

  margin: auto;
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

@media (min-width: 768px) {
  .bottom-nav {
    height: 62px;
  }

  .nav-item svg {
    width: 24px;
    height: 24px;
  }
}
</style>
