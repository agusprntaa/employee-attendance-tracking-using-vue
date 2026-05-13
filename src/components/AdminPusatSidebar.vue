<script setup>
import { useRouter, useRoute } from "vue-router";

const router = useRouter();
const route = useRoute();

function handleLogout() {
  localStorage.clear();

  router.replace("/login");
}
</script>

<template>
  <aside class="sidebar">
    <!-- <div class="logo-btw">
      <img src="/logo.png" />
    </div> -->
    <h2>ABSENT BTW</h2>

    <div class="nav">
      <button
        @click="router.push('/admin-pusat/dashboard')"
        :class="{ active: route.path === '/admin-pusat/dashboard' }"
      >
        Dashboard Admin Pusat
      </button>

      <button
        @click="router.push('/admin-pusat/employees')"
        :class="{ active: route.path === '/admin-pusat/employees' }"
      >
        Employee List
      </button>

      <button
        @click="router.push('/admin-pusat/attendanceToday')"
        :class="{ active: route.path === '/admin-pusat/attendanceToday' }"
      >
        Today Attendance
      </button>

      <button
        @click="router.push('/admin-pusat/branches')"
        :class="{ active: route.path === '/admin-pusat/branches' }"
      >
        Branches
      </button>

      <!-- <button>Schedules</button> -->
    </div>

    <div class="logout-wrap">
      <slot name="logout"></slot>
      <button class="btn-logout" @click="handleLogout">Logout</button>
    </div>
  </aside>
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
</style>
