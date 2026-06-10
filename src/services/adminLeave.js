import API from "./api";

// SUMMARY
export const getLeaveSummary = () =>
  API.get("/admin-cabang/leave/summary");

// REQUEST LIST
export const getLeaveRequests = (params) =>
  API.get("/admin-cabang/leave/requests", { params });

// DETAIL
export const getLeaveDetail = (id) =>
  API.get(`/admin-cabang/leave/requests/${id}`);

// APPROVE / REJECT
export const updateLeaveStatus = (id, payload) =>
  API.patch(`/admin-cabang/leave/${id}/status`, payload);

// CALENDAR
export const getLeaveCalendar = (params) =>
  API.get("/admin-cabang/leave/calendar", { params });

// CALENDAR DETAIL
export const getCalendarDetail = (date) =>
  API.get("/admin-cabang/leave/calendar/detail", {
    params: { date },
  });

// HOLIDAYS
export const getHolidays = (params) =>
  API.get("/admin-cabang/holidays", { params });

export const createHoliday = (payload) =>
  API.post("/admin-cabang/holidays", payload);

export const deleteHoliday = (id) =>
  API.delete(`/admin-cabang/holidays/${id}`);

// RECENT ACTIVITY

export function getRecentActivities(
  limit = 6
) {
  return API.get(
    "/admin-cabang/leave/recent-activity",
    {
      params: {
        limit,
      },
    }
  );
}