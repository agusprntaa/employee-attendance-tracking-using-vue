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

    <span class="mobile-brand">ABSENT BTW</span>
  </header>

  <div
    v-if="showMobileMenu"
    class="sidebar-overlay"
    aria-hidden="true"
    @click="showMobileMenu = false"
  ></div>

  <aside
    id="admin-navigation"
    class="sidebar"
    :class="{ open: showMobileMenu }"
    aria-label="Navigasi admin cabang"
  >
    <div class="sidebar-brand">
      <h2>ABSENT BTW</h2>

      <button
        class="menu-close"
        type="button"
        aria-label="Tutup menu navigasi"
        @click="showMobileMenu = false"
      >
        ✕
      </button>
    </div>

    <nav class="nav" aria-label="Menu utama">
      <button
        type="button"
        @click="router.push('/admin-cabang/dashboard')"
        :class="{ active: route.path === '/admin-cabang/dashboard' }"
      >
        Dashboard
      </button>

      <button
        type="button"
        @click="router.push('/admin-cabang/employees')"
        :class="{ active: route.path === '/admin-cabang/employees' }"
      >
        Karyawan
      </button>

      <button
        type="button"
        @click="router.push('/admin-cabang/reports')"
        :class="{ active: route.path === '/admin-cabang/reports' }"
      >
        Laporan
      </button>

      <button
        type="button"
        @click="router.push('/admin-cabang/calendar')"
        :class="{ active: route.path === '/admin-cabang/calendar' }"
      >
        Kalender cuti
      </button>

      <button
        type="button"
        @click="router.push('/admin-cabang/settings')"
        :class="{ active: route.path === '/admin-cabang/settings' }"
      >
        Pengaturan
      </button>
    </nav>

    <div class="logout-wrap">
      <slot name="logout"></slot>
      <button
        type="button"
        class="btn-logout"
        @click="showLogoutConfirm = true"
      >
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
.mobile-topbar,
.menu-close {
  display: none;
}

.sidebar {
  position: sticky;
  top: 0;
  z-index: 100;
  width: 240px;
  min-width: 240px;
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #1e1b4b;
  color: #ffffff;
}

.sidebar-brand {
  min-height: 82px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 0 0 auto;
  padding: 0 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.09);
}

.sidebar-brand h2 {
  margin: 0;
  color: #ffffff;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 20px 16px;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: none;
}

.nav::-webkit-scrollbar {
  display: none;
}

.nav button,
.btn-logout {
  width: 100%;
  min-height: 44px;
  padding: 11px 16px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: transparent;
  color: rgba(255, 255, 255, 0.66);
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
  letter-spacing: 0.1px;
  text-align: left;
  cursor: pointer;
  transition:
    background-color 160ms ease,
    border-color 160ms ease,
    color 160ms ease,
    box-shadow 160ms ease;
}

.nav button:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
}

.nav button.active {
  border-color: rgba(255, 255, 255, 0.08);
  background: #4f46e5;
  color: #ffffff;
  box-shadow: 0 6px 18px rgba(15, 11, 71, 0.34);
}

.nav button:focus-visible,
.btn-logout:focus-visible,
.menu-toggle:focus-visible,
.menu-close:focus-visible,
.actions button:focus-visible {
  outline: 3px solid rgba(165, 180, 252, 0.9);
  outline-offset: 2px;
}

.logout-wrap {
  flex: 0 0 auto;
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.09);
}

.btn-logout {
  border-color: rgba(255, 255, 255, 0.14);
  color: rgba(255, 255, 255, 0.65);
}

.btn-logout:hover {
  border-color: rgba(248, 113, 113, 0.48);
  background: rgba(239, 68, 68, 0.12);
  color: #fecaca;
}

.sidebar-overlay {
  display: none;
}

.modal {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(15, 23, 42, 0.56);
  backdrop-filter: blur(3px);
}

.modal-box {
  width: min(100%, 360px);
  padding: 28px 24px 24px;
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 24px 64px rgba(15, 23, 42, 0.22);
  text-align: center;
  animation: modal-enter 180ms ease-out;
}

.modal-box p {
  margin: 0 0 22px;
  color: #111827;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.5;
}

.actions {
  display: flex;
  gap: 10px;
}

.actions button {
  flex: 1;
  min-width: 0;
  min-height: 42px;
  padding: 10px 14px;
  border: 1px solid transparent;
  border-radius: 10px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition:
    background-color 160ms ease,
    border-color 160ms ease;
}

.cancel {
  background: #4f46e5;
  color: #ffffff;
}

.cancel:hover {
  background: #4338ca;
}

.confirm {
  border-color: #e5e7eb !important;
  background: #ffffff;
  color: #b91c1c;
}

.confirm:hover {
  border-color: #fecaca !important;
  background: #fef2f2;
}

@keyframes modal-enter {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (max-width: 1024px) and (min-width: 769px) {
  .sidebar {
    width: 216px;
    min-width: 216px;
  }

  .sidebar-brand {
    padding-inline: 18px;
  }

  .sidebar-brand h2 {
    font-size: 18px;
  }

  .nav,
  .logout-wrap {
    padding-inline: 12px;
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
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    background: #1e1b4b;
    box-shadow: 0 5px 20px rgba(30, 27, 75, 0.18);
  }

  .menu-toggle {
    grid-column: 1;
  }

  .mobile-brand {
    grid-column: 2;
    overflow: hidden;
    text-align: center;
    text-overflow: ellipsis;
    white-space: nowrap;

    color: #ffffff;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 0.4px;
  }

  .menu-toggle,
  .menu-close {
    width: 44px;
    height: 44px;
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.06);
    color: #ffffff;
    cursor: pointer;
  }

  .menu-toggle {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 5px;
  }

  .menu-toggle span {
    width: 19px;
    height: 2px;
    border-radius: 999px;
    background: #ffffff;
  }

  .menu-close {
    display: grid;
    place-items: center;
    flex: 0 0 44px;
    font-size: 17px;
  }

  .sidebar-overlay {
    position: fixed;
    inset: 0;
    z-index: 999;
    display: block;
    background: rgba(15, 23, 42, 0.52);
    backdrop-filter: blur(2px);
  }

  .sidebar {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    z-index: 1000;
    width: min(84vw, 300px);
    min-width: 0;
    height: 100vh;
    height: 100dvh;
    box-shadow: 18px 0 48px rgba(15, 23, 42, 0.24);
    transform: translateX(-105%);
    visibility: hidden;
    transition:
      transform 220ms ease,
      visibility 220ms ease;
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

  .nav {
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
