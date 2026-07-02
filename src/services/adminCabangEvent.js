import API from "./api";

// CREATE EVENT
export function createEvent(data) {
  return API.post("/admin-cabang/events", data);
}

// GET LIST EVENT
export function getEvents(params) {
  return API.get("/admin-cabang/events", {
    params,
  });
}

// DETAIL EVENT
export function getEventDetail(id) {
  return API.get(`/admin-cabang/events/${id}`);
}

// UPDATE EVENT
export function updateEvent(id, data) {
  return API.put(`/admin-cabang/events/${id}`, data);
}

// DELETE EVENT
export function deleteEvent(id) {
  return API.delete(`/admin-cabang/events/${id}`);
}

// GET QR EVENT
export function getEventQR(id) {
  return API.get(`/admin-cabang/events/${id}/qr`);
}

// GET PESERTA EVENT
export function getEventParticipants(id) {
  return API.get(`/admin-cabang/events/${id}/participants`);
}

// DATA ABSENSI EVENT BERDASARKAN TANGGAL
export function getEventAttendance(id, date) {
  return API.get(`/admin-cabang/events/${id}/attendance`, {
    params: date ? { date } : undefined,
  });
}

// TAMBAH PESERTA EVENT
export function addParticipants(id, employeeIds) {
  return API.post(
    `/admin-cabang/events/${id}/participants`,
    {
      employee_ids: employeeIds,
    },
  );
}

// TAMBAH SEMUA PESERTA
export function addAllParticipants(id) {
  return API.post(
    `/admin-cabang/events/${id}/participants/select-all`,
  );
}

// HAPUS PESERTA
export function deleteParticipant(eventId, employeeId) {
  return API.delete(
    `/admin-cabang/events/${eventId}/participants/${employeeId}`,
  );
}
