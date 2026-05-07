import API from './api'

export function checkInAPI(data) {
  return API.post('/attendance/checkin', data) 
}

export function getAttendanceHistory(page = 1, limit = 10) {
  return API.get(`/attendance/history?page=${page}&limit=${limit}`)
}

export function getTodayAttendanceEmployee() {
  return API.get('/attendance/today')
}