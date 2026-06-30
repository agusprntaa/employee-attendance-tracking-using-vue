import API from './api'

export function checkInAPI(data) {
  return API.post('/attendance/checkin', data) 
}

// export function getAttendanceHistory(page = 1, limit = 10) {
//   return API.get(`/attendance/history?page=${page}&limit=${limit}`)
// }

export const getAttendanceHistory = (
  limit = 10
) => {
  return API.get(
    `/attendance/history?limit=${limit}`
  );
};

export function getTodayAttendanceEmployee() {
  return API.get('/attendance/today')
}

export const checkoutAttendance = (data) =>
  API.patch("/attendance/checkout", data);

// STEP 1 - GENERATE FACE TOKEN
export function requestFaceTokenAPI() {
  return API.post("/attendance/face-token");
}

// STEP 2 - VERIFY FACE
export function verifyFaceAPI(formData) {
  return API.post("/attendance/verify-face", formData);
}

// STEP 3 - CHECK IN AFTER THE FACE TOKEN HAS BEEN VERIFIED
export function faceCheckInAPI(data) {
  return API.post("/attendance/checkin", data);
}

// EVENT ATTENDANCE - INDEPENDENT FROM DAILY FACE CHECK-IN
export function checkInQrAPI(data) {
  return API.post("/attendance/checkin-qr", data);
}
