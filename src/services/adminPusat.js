import API from "./api";

// DASHBOARD
export const getGlobalDashboard = () =>
  API.get("/api/global/dashboard");

// EMPLOYEES
export const getAllEmployees = (params) =>
  API.get("/api/global/employees", {
    params,
  });

export const getEmployeeDetail = (id) =>
  API.get(`/api/global/employees/${id}`);

// ATTENDANCE
export const getTodayAttendance = (params) =>
  API.get("/api/global/attendance/today", {
    params,
  });

export const getAttendanceAnalytics = (
  period = "weekly",
) =>
  API.get(
    "/api/global/attendance/analytics",
    {
      params: { period },
    },
  );

// BRANCHES
export const getAllBranches = (params) =>
  API.get("/api/global/branches", {
    params,
  });

export const getBranchDetail = (id) =>
  API.get(`/api/global/branches/${id}`);

export const createBranch = (data) =>
  API.post("/api/global/branches", data);

// export const createBranchAdmin = (data) =>
//   API.post("/api/global/admin-cabang", data);

// GET ADMIN CABANG
export function getBranchAdmins(
  page = 1,
  limit = 10
) {
  return API.get(
    `/api/global/branch-admin?page=${page}&limit=${limit}`
  );
}

export function addBranchAdmin(payload) {
  return API.post("/api/global/branch-admin", payload);
}

export function updateBranchAdmin(id, payload) {
  return API.put(
    `/api/global/branch-admin/${id}`,
    payload
  );
}

export function deleteBranchAdmin(id) {
  return API.delete(`/api/global/branch-admin/${id}`);
}

export function getBranches() {
  return API.get("/api/global/branches");
}