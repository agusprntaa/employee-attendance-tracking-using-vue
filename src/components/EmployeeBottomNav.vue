<script setup>
import { useRouter, useRoute } from "vue-router";

import { LayoutDashboard, CalendarDays, User, LogOut } from "lucide-vue-next";

import { logout } from "@/utils/logout";

const router = useRouter();
const route = useRoute();

async function handleLogout() {
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

    <button class="nav-item" @click="handleLogout">
      <LogOut :size="22" />

      <!-- <span>Keluar</span> -->
    </button>
  </div>
</template>

<style scoped>
.bottom-nav {
  position: fixed;

  left: 16px;
  right: 16px;
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

  backdrop-filter: blur(10px);
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
</style>
