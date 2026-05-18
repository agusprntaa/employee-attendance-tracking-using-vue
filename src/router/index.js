import { createRouter, createWebHistory } from 'vue-router'

import Login from '../views/auth/Login.vue'

const routes = [
  {
    path: '/',
    name: 'Login',
    component: Login
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
    path: '/employee/scan',
    name: 'ScanQR',
    component: () => import('../views/employee/ScanQR.vue')
  },

  {
    path: '/employee/success',
    name: 'Success',
    component: () => import('../views/employee/Success.vue')
  },

  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// guard router role
// router.beforeEach((to, from, next) => {


//   const user = localStorage.getItem('user')

//   if (!user) {
//     console.log('masuk not if ini')
//     next({
//       path: '/'
//     })
//   }

//     if (to.path.startsWith('/admin-pusat') && user.role !== 'super_admin') {
//        next({ path: '/' })
//      }

//      if (to.path.startsWith('/admin-cabang') && user.role !== 'admin_cabang') {
//        next({ path: '/' })
//      }

//      if (to.path.startsWith('/employee') && user.role !== 'karyawan') {
//        next({ path: '/' })
//     }
// next()
  
//  })

//guard router role, tipe
router.beforeEach((to) => {
  const token = localStorage.getItem("token");

  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch (error) {
    user = null;
  }

  if (!token || !user) {
    if (to.path !== "/") {
      return "/";
    }

    return true;
  }

  //auto dashboard selama masih ada token di local storage

  // if (to.path === "/") {
  //   if (
  //     user.role === "admin" &&
  //     user.tipe === "pusat"
  //   ) {
  //     return "/admin-pusat/dashboard";
  //   }

  //   if (
  //     user.role === "admin" &&
  //     user.tipe === "cabang"
  //   ) {
  //     return "/admin-cabang/dashboard";
  //   }

  //   if (user.role === "karyawan") {
  //     return "/employee/dashboard";
  //   }

  //   return "/";
  // }

  if (
    to.path.startsWith("/admin-pusat") &&
    !(
      user.role === "admin" &&
      user.tipe === "pusat"
    )
  ) {
    return "/";
  }

  if (
    to.path.startsWith("/admin-cabang") &&
    !(
      user.role === "admin" &&
      user.tipe === "cabang"
    )
  ) {
    return "/";
  }

  if (
    to.path.startsWith("/employee") &&
    user.role !== "karyawan"
  ) {
    return "/";
  }

  return true;
});

export default router