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

//dummy face recognition
export async function registerFaceAPI(formData) {
  console.log("REGISTER FACE");

  console.log(formData);

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        data: {
          success: true,
          message: "Face registered",
        },
      });
    }, 1500);
  });
}

export async function requestFaceTokenAPI() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        data: {
          face_token: "dummy-face-token",
        },
      });
    }, 1000);
  });
}

export async function verifyFaceAPI(formData) {
  console.log(formData);

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        data: {
          success: true,
          confidence: 92,
        },
      });
    }, 1500);
  });
}