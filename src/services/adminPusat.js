import API from "./api";

// DASHBOARD
export const getGlobalDashboard = () =>
  API.get("/global/dashboard");

// EMPLOYEES
export const getAllEmployees = (params) =>
  API.get("/global/employees", {
    params,
  });

export const getEmployeeDetail = (id) =>
  API.get(`/global/employees/${id}`);

// ATTENDANCE
export const getTodayAttendance = (params) =>
  API.get("/global/attendance/today", {
    params,
  });

export const getAttendanceAnalytics = (
  period = "weekly",
) =>
  API.get(
    "/global/attendance/analytics",
    {
      params: { period },
    },
  );

// BRANCHES
export const getAllBranches = (params) =>
  API.get("/global/branches", {
    params,
  });

export const getBranchDetail = (id) =>
  API.get(`/global/branches/${id}`);

export const createBranch = (data) =>
  API.post("/global/branches", data);

// GET ADMIN CABANG
export function getBranchAdmins(
  page = 1,
  limit = 10
) {
  return API.get(
    `/global/branch-admin?page=${page}&limit=${limit}`
  );
}

export function addBranchAdmin(payload) {
  return API.post("/global/branch-admin", payload);
}

export function updateBranchAdmin(id, payload) {
  return API.put(
    `/global/branch-admin/${id}`,
    payload
  );
}

export function deleteBranchAdmin(id) {
  return API.delete(`/global/branch-admin/${id}`);
}

export function getBranches() {
  return API.get("/global/branches");
}
