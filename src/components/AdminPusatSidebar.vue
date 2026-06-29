<script setup>
import { ref, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { logout } from "@/utils/logout";
const router = useRouter();
const route = useRoute();

const showLogoutConfirm = ref(false);

const showMobileMenu = ref(false);

watch(
  () => route.fullPath,
  () => {
    showMobileMenu.value = false;
  },
);

// function handleLogout() {
//   localStorage.clear();

//   router.replace("/login");
// }

//logout
// async function handleLogout() {
//   try {
//     const refresh = localStorage.getItem("refresh_token");

//     if (refresh) {
//       await logoutAPI(refresh);
//     }
//   } catch (err) {
//     console.error("LOGOUT ERROR:", err);
//   } finally {
//     showLogoutConfirm.value = false;

//     localStorage.clear();

//     window.location.href = "/";
//   }
// }
async function handleLogout() {
  showLogoutConfirm.value = false;
  showMobileMenu.value = false;

  await logout();
}
</script>

<template>
  <header class="mobile-topbar" v-if="$route.meta?.showSidebar !== false">
    <button
      class="menu-toggle"
      type="button"
      aria-label="Buka menu navigasi"
      aria-controls="admin-navigation"
      :aria-expanded="showMobileMenu"
      @click="showMobileMenu = true"
    >
      <span></span>
      <span></span>
      <span></span>
    </button>

    <span class="mobile-brand">ABSENSI BTW</span>
  </header>

  <div
    v-if="showMobileMenu"
    class="sidebar-overlay"
    aria-hidden="true"
    @click="showMobileMenu = false"
  />

  <aside
    id="admin-navigation"
    class="sidebar"
    :class="{ open: showMobileMenu }"
    aria-label="Navigasi admin pusat"
  >
    <!-- <div class="logo-btw">
      <img src="/logo.png" />
    </div> -->
    <div class="sidebar-brand">
      <h2>ABSENSI BTW</h2>

      <button
        class="menu-close"
        type="button"
        aria-label="Tutup menu"
        @click="showMobileMenu = false"
      >
        ✕
      </button>
    </div>
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
        Daftar Karyawan
      </button>

      <button
        @click="router.push('/admin-pusat/attendanceToday')"
        :class="{ active: route.path === '/admin-pusat/attendanceToday' }"
      >
        Absensi Hari Ini
      </button>

      <button
        @click="router.push('/admin-pusat/branches')"
        :class="{ active: route.path === '/admin-pusat/branches' }"
      >
        Cabang
      </button>

      <button
        @click="router.push('/admin-pusat/AdminCabang')"
        :class="{ active: route.path === '/admin-pusat/AdminCabang' }"
      >
        Admin Cabang
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
  <div v-if="showLogoutConfirm" class="modal" role="presentation">
    <div
      class="modal-box"
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-title"
    >
      <p id="logout-title">Yakin ingin keluar?</p>
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
.mobile-topbar,
.menu-close {
  display: none;
}
.sidebar {
  position: sticky;
  top: 0;
  z-index: 100;
  height: 100vh;
  height: 100dvh;
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

.sidebar-brand {
  min-height: 82px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.sidebar-brand h2 {
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

.sidebar .nav button:focus-visible,
.btn-logout:focus-visible,
.menu-toggle:focus-visible,
.menu-close:focus-visible,
.actions button:focus-visible {
  outline: 3px solid rgba(165, 180, 252, 0.9);
  outline-offset: 2px;
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

@media (max-width: 768px) {
  .mobile-topbar {
    position: sticky;
    top: 0;
    z-index: 900;

    min-height: 64px;

    display: grid;
    grid-template-columns: 44px minmax(0, 1fr) 44px;

    align-items: center;

    gap: 10px;

    padding: 0 16px;

    background: #1e1b4b;

    border-bottom: 1px solid rgba(255, 255, 255, 0.1);

    box-shadow: 0 5px 20px rgba(30, 27, 75, 0.18);
  }

  .menu-toggle {
    grid-column: 1;
  }

  .mobile-brand {
    grid-column: 2;

    color: #fff;

    font-size: 18px;

    font-weight: 700;

    text-align: center;

    overflow: hidden;

    text-overflow: ellipsis;

    white-space: nowrap;
  }

  .menu-toggle,
  .menu-close {
    width: 44px;
    height: 44px;

    border: 1px solid rgba(255, 255, 255, 0.14);

    border-radius: 10px;

    background: rgba(255, 255, 255, 0.06);

    color: #fff;

    cursor: pointer;
  }

  .menu-toggle {
    display: flex;

    flex-direction: column;

    justify-content: center;

    align-items: center;

    gap: 5px;
  }

  .menu-toggle span {
    width: 19px;

    height: 2px;

    background: white;

    border-radius: 999px;
  }

  .menu-close {
    display: grid;

    place-items: center;

    font-size: 17px;
  }

  .sidebar-overlay {
    position: fixed;

    inset: 0;

    display: block;

    z-index: 999;

    background: rgba(15, 23, 42, 0.52);

    backdrop-filter: blur(2px);
  }

  .sidebar {
    position: fixed;

    top: 0;

    left: 0;

    bottom: 0;

    width: min(84vw, 300px);

    min-width: 0;

    transform: translateX(-105%);

    visibility: hidden;

    transition:
      transform 0.22s ease,
      visibility 0.22s ease;

    z-index: 1000;

    box-shadow: 18px 0 48px rgba(15, 23, 42, 0.24);
  }

  .sidebar.open {
    transform: translateX(0);

    visibility: visible;
  }

  .sidebar-brand {
    min-height: 72px;

    padding-inline: 18px 14px;
  }

  .sidebar-brand h2 {
    font-size: 18px;
  }

  .sidebar .nav {
    padding-top: 16px;
  }
}

@media (max-width: 380px) {
  .mobile-topbar {
    padding-inline: 14px;
  }

  .modal-box {
    padding: 24px 18px 18px;
  }

  .actions {
    flex-direction: column;
  }
}

@media (prefers-reduced-motion: reduce) {
  .sidebar,
  .modal-box {
    animation: none;
    transition: none;
  }
}
</style>
