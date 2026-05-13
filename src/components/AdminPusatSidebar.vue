<script setup>
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { logoutAPI } from "@/services/auth";

const router = useRouter();
const route = useRoute();

const showLogoutConfirm = ref(false);

// function handleLogout() {
//   localStorage.clear();

//   router.replace("/login");
// }

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
    showLogoutConfirm.value = false;

    localStorage.clear();

    window.location.href = "/";
  }
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
      <button class="btn-logout" @click="showLogoutConfirm = true">
        Logout
      </button>
    </div>
  </aside>
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

.sidebar .nav button {
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

.sidebar .nav button:hover {
  background: rgba(255, 255, 255, 0.07);
  color: rgba(255, 255, 255, 0.85);
}

.sidebar .nav button.active {
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
</style>
