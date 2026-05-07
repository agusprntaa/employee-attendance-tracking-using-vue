import API from './api'

// AUTH
export const loginAPI = (data) => {
  return API.post('/login', data)
}

export const refreshAPI = (refreshToken) => {
  return API.post('/refresh', {
    refresh_token: refreshToken
  })
}

export const logoutAPI = (refreshToken) => {
  return API.post('/logout', {
    refresh_token: refreshToken
  })
}

// USER
export const getProfileAPI = () => {
  return API.get('/employee/profile')
}

// ATTENDANCE
export const getTodayAttendanceAPI = () => {
  return API.get('/attendance/today')
}

export const checkInAPI = (data) => {
  return API.post('/attendance/checkin', data)
}

export const checkOutAPI = (data) => {
  return API.patch('/attendance/checkout', data)
}

export const getHistoryAPI = (page = 1, limit = 10) => {
  return API.get(`/attendance/history?page=${page}&limit=${limit}`)
}

// PASSWORD
export const changePasswordAPI = (data) => {
  return API.patch('/employee/change-password', data)
}