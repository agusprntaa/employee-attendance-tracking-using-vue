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

export const createBranchAdmin = (data) =>
  API.post("/api/global/admin-cabang", data);