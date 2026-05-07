import API from './api'

// dashboard
export function getDashboardSummary(params) {
  return API.get('/admin-cabang/dashboard', { params })
}

// qrcode
export function getQRCode() {
  return API.get('/admin-cabang/qr/today')
}

export function refreshQRCode() {
  return API.post('/admin-cabang/qr/regenerate')
}

// employees
export function getEmployees(params) {
  return API.get('/admin-cabang/employees', { params })
}

export function getEmployeeDetail(id) {
  return API.get(`/admin-cabang/employees/${id}`)
}

export function addEmployee(data) {
  return API.post('/admin-cabang/employees', data)
}

export function updateEmployee(id, data) {
  return API.patch(`/admin-cabang/employees/${id}`, data)
}

export function deleteEmployee(id) {
  return API.delete(`/admin-cabang/employees/${id}`)
}

// attendance
export function getTodayAttendance(params) {
  return API.get('/admin-cabang/attendance/today', { params })
}

export function getEmployeeAttendance(id, params) {
  return API.get(`/admin-cabang/attendance/employee/${id}`, { params })
}

// reports
export function getReportsAttendance(params) {
  return API.get('/admin-cabang/reports/attendance', { params })
}

//scedules
export function getSchedules(params) {
  return API.get('/admin-cabang/schedules', { params })
}

// settings
export function getBranchSettings() {
  return API.get('/admin-cabang/settings')
}

export function updateBranchSettings(data) {
  return API.patch('/admin-cabang/settings', data)
}