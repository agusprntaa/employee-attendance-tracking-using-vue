import { createRouter, createWebHistory } from 'vue-router'

import Login from '../views/auth/Login.vue'

const routes = [
  {
    path: '/',
    name: 'Login',
    component: Login
  },
  {
    path: '/forbidden',
    name: 'Forbidden',
    component: () => import('../views/error/Forbidden.vue')
  },
  {
    path: '/not-found',
    name: 'NotFound',
    component: () => import('../views/error/NotFound.vue')
  },

  // ADMIN PUSAT
  {
    path: '/admin-pusat/dashboard',
    name: 'AdminPusatDashboard',
    component: () => import('../views/admin-pusat/Dashboard.vue')
  },

  {
  path: "/admin-pusat/employees",
  name: 'AdminPusatEmployeeList',
  component: () => import('../views/admin-pusat/EmployeeList.vue')
  },

  {
    path: '/admin-pusat/branches',
    name: 'AdminPusatBranches',
    component: () => import('../views/admin-pusat/Branches.vue')
  },

  {
    path: '/admin-pusat/attendanceToday',
    name: 'AdminPusatAttendanceToday',
    component: () => import('../views/admin-pusat/AttendanceToday.vue')
  },

  {
    path: '/admin-pusat/AdminCabang',
    name: 'AdminPusatAdminCabang',
    component: () => import('../views/admin-pusat/AdminCabang.vue')
  },

  // {
  //   path: '/admin-pusat/absen-event',
  //   name: 'AdminPusatAbsenEvent',
  //   component: () => import('../views/admin-pusat/AbsenEvent.vue')
  // },

  // {
  //   path: '/admin-pusat/absen-kantor',
  //   name: 'AdminPusatAbsenKantor',
  //   component: () => import('../views/admin-pusat/AbsenKantor.vue')
  // },

  // ADMIN CABANG
  {
    path: '/admin-cabang/dashboard',
    name: 'AdminCabangDashboard',
    component: () => import('../views/admin-cabang/Dashboard.vue')
  },

  {
    path: '/admin-cabang/employees',
    name: 'AdminCabangEmployees',
    component: () => import('../views/admin-cabang/Employees.vue')
  },
  
  {
    path: '/admin-cabang/reports',
    name: 'AdminCabangReports',
    component: () => import('../views/admin-cabang/Reports.vue')
  },

  {
    path: '/admin-cabang/settings',
    name: 'AdminCabangSettings',
    component: () => import('../views/admin-cabang/Settings.vue')
  },

  {
    path: '/admin-cabang/calendar',
    name: 'AdminCabangCalendar',
    component: () => import('../views/admin-cabang/Calendar.vue')
  },

  {
    path: '/admin-cabang/absen-event',
    name: 'AdminCabangAbsenEvent',
    component: () => import('../views/admin-cabang/AbsenEvent.vue')
  },

  {
    path: '/admin-cabang/absen-kantor',
    name: 'AdminCabangAbsenKantor',
    component: () => import('../views/admin-cabang/AbsenKantor.vue')
  },

   {
    path: '/admin-cabang/event-detail/:id',    
    name: 'AdminCabangEventDetail',
    component: () => import('../views/admin-cabang/EventDetail.vue')
  },

  // EMPLOYEE
  {
    path: '/employee/dashboard',
    name: 'EmployeeDashboard',
    component: () => import('../views/employee/Dashboard.vue')
  },

  {
    path: '/employee/change-password',
    name: 'ChangePassword',
    component: () => import('../views/employee/ChangePassword.vue')
  },

  {
    path: '/employee/wfa',
    name: 'WFA',
    component: () => import('../views/employee/WFA.vue')
  },

  {
    path: '/employee/scan-event',
    name: 'ScanEventQR',
    component: () => import('../views/employee/ScanQR.vue')
  },

  {
    path: '/employee/success',
    name: 'Success',
    component: () => import('../views/employee/Success.vue')
  },

  {
    path: '/employee/calendar',
    name: 'Calendar',
    component: () => import('../views/employee/Calendar.vue')
  },

  {
    path: '/employee/biodata',
    name: 'Biodata',
    component: () => import('../views/employee/Biodata.vue')
  },

{
  path: "/employee/register-face",
  name: "RegisterFace",
  component: () =>
    import("../views/employee/RegisterFaceView.vue"),
},
{
  path: "/employee/checkin-face",
  name: "CheckInFace",
  component: () =>
    import("../views/employee/CheckInFaceView.vue"),
},
  {
    path: '/:pathMatch(.*)*',
    name: 'FallbackNotFound',
    component: () => import('../views/error/NotFound.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

function toBoolean(value) {
  return value === true || value === 1 || value === "1" || value === "true";
}

// guard router role, tipe
router.beforeEach((to) => {
  const token = localStorage.getItem("token");

  if (to.name === "NotFound" || to.name === "FallbackNotFound") {
    return true;
  }

  const mustChangePassword =
    localStorage.getItem("must_change_password") === "true";

  let user = null;

  try {
    user = JSON.parse(
      localStorage.getItem("user")
    );
  } catch {
    user = null;
  }

  // BELUM LOGIN
  if (!token || !user) {
    if (to.name === "Forbidden") {
      return "/";
    }

    if (to.path !== "/") {
      return "/";
    }

    return true;
  }

  const isEmployee =
    user.role === "karyawan";

  const isAdminPusat =
    user.role === "admin" &&
    user.tipe === "pusat";

  const isAdminCabang =
    user.role === "admin" &&
    user.tipe === "cabang";

  let onboardingStatus = null;

  try {
    onboardingStatus = JSON.parse(localStorage.getItem("onboarding_status"));
  } catch {
    onboardingStatus = null;
  }

  const faceRegistered =
    onboardingStatus?.face_registered !== undefined
      ? toBoolean(onboardingStatus.face_registered)
      : toBoolean(user.face_registered);

// const faceRegistered =
//   !!user.face_reference_path;

// const profileCompleted =
//   user.profile_completed === true;

  if (
    isEmployee &&
    mustChangePassword &&
    to.path !== "/employee/change-password"
  ) {
    return "/employee/change-password";
  }

  if (
    isEmployee &&
    !mustChangePassword &&
    faceRegistered === false &&
    to.path !== "/employee/register-face"
  ) {
    return "/employee/register-face";
  }

  // if (
  //   isEmployee &&
  //   !mustChangePassword &&
  //   faceRegistered &&
  //   !profileCompleted &&
  //   to.path !== "/employee/biodata"
  // ) {
  //   return "/employee/biodata";
  // }

  if (to.path === "/") {
    if (isAdminPusat) {
      return "/admin-pusat/dashboard";
    }

    if (isAdminCabang) {
      return "/admin-cabang/dashboard";
    }

    if (isEmployee) {
      return "/employee/dashboard";
    }
  }

  if (
    to.path.startsWith("/admin-pusat") &&
    !isAdminPusat
  ) {
    return "/forbidden";
  }

  if (
    to.path.startsWith("/admin-cabang") &&
    !isAdminCabang
  ) {
    return "/forbidden";
  }

  if (
    to.path.startsWith("/employee") &&
    !isEmployee
  ) {
    return "/forbidden";
  }

  return true;
});

export default router
