<script setup>
import { ref, computed } from "vue";

import AdminSidebar from "@/components/AdminSidebar.vue";
import AdminProfile from "@/components/AdminProfile.vue";
import { useAuth } from "@/composables/useAuth";
import { onMounted } from "vue";

import {
  getLeaveSummary,
  getLeaveRequests,
  getLeaveDetail,
  updateLeaveStatus,
  getLeaveCalendar,
  getCalendarDetail,
  createHoliday,
  getRecentActivities,
} from "@/services/adminLeave";

const { user } = useAuth();

const leaveRequests = ref([]);

const calendarEvents = ref([]);

const currentDate = ref(new Date());

const selectedDate = ref(null);

const selectedEvents = ref([]);

const showCalendarModal = ref(false);

const adminNote = ref("");

const showHolidayModal = ref(false);

const showLeaveDetailModal = ref(false);

const selectedLeave = ref(null);

const holidayForm = ref({
  title: "",
  date: "",
  description: "",
});

const searchQuery = ref("");

const selectedStatus = ref("");

const leaveStats = ref({
  total: 0,
  pending: 0,
  approved: 0,
  rejected: 0,
});

const fetchSummary = async () => {
  try {
    console.log("[Leave Summary] Request");

    const { data } = await getLeaveSummary();

    console.log("[Leave Summary] Success", data);

    leaveStats.value = {
      total: data.data.total_requests,
      pending: data.data.pending,
      approved: data.data.approved,
      rejected: data.data.rejected,
    };
  } catch (error) {
    console.error("[Leave Summary] Error", error.response?.data || error);
  }
};

const fetchLeaveRequests = async () => {
  try {
    console.log("[Leave Requests] Request");

    const { data } = await getLeaveRequests({
      status: selectedStatus.value || undefined,
      page: 1,
      limit: 100,
    });

    console.log("[Leave Requests] Success", data);

    leaveRequests.value = data.data.data;
  } catch (error) {
    console.error("[Leave Requests] Error", error.response?.data || error);
  }
};

const fetchCalendar = async () => {
  try {
    console.log("[Calendar] Request");

    const { data } = await getLeaveCalendar({
      month: currentDate.value.getMonth() + 1,
      year: currentDate.value.getFullYear(),
    });

    console.log("[Calendar] Success", data);

    calendarEvents.value = data.data.dates;
    console.log("[Calendar Events Raw]", calendarEvents.value);
  } catch (error) {
    console.error("[Calendar] Error", error.response?.data || error);
  }
};

const recentActivities = ref([]);

function formatActivityTime(dateString) {
  const now = new Date();
  const date = new Date(dateString);

  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return `${diff} detik lalu`;
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;

  return `${Math.floor(diff / 86400)} hari lalu`;
}

const fetchRecentActivities = async () => {
  try {
    const { data } = await getRecentActivities(6);

    recentActivities.value = data.data.map((item) => ({
      id: item.id,
      title: item.message,
      time: formatActivityTime(item.created_at),
      type: item.type,
    }));

    console.log("[Recent Activities] Success", recentActivities.value);
  } catch (error) {
    console.error("[Recent Activities] Error", error.response?.data || error);
  }
};

const openDayModal = async (day) => {
  try {
    if (!day) return;

    const year = currentDate.value.getFullYear();

    const month = String(currentDate.value.getMonth() + 1).padStart(2, "0");

    const formattedDay = String(day).padStart(2, "0");

    const fullDate = `${year}-${month}-${formattedDay}`;

    console.log("[Calendar Detail] Request", fullDate);

    const { data } = await getCalendarDetail(fullDate);

    console.log("[Calendar Detail] Success", data);
    console.log("[Calendar Detail Full]", JSON.stringify(data, null, 2));

    selectedDate.value = fullDate;

    selectedEvents.value = [
      ...(data.data.holidays || []),
      ...(data.data.leaves || []),
    ];
    showCalendarModal.value = true;
  } catch (error) {
    console.error("[Calendar Detail] Error", error.response?.data || error);
  }
};

const monthYear = computed(() => {
  return currentDate.value.toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });
});

const daysInMonth = computed(() => {
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();

  return new Date(year, month + 1, 0).getDate();
});

const firstDay = computed(() => {
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();

  return new Date(year, month, 1).getDay();
});

const calendarDays = computed(() => {
  const days = [];

  for (let i = 0; i < firstDay.value; i++) {
    days.push(null);
  }

  for (let i = 1; i <= daysInMonth.value; i++) {
    days.push(i);
  }

  return days;
});

function getEvents(day) {
  if (!day) return [];

  const year = currentDate.value.getFullYear();
  const month = String(currentDate.value.getMonth() + 1).padStart(2, "0");
  const formattedDay = String(day).padStart(2, "0");

  const currentFullDate = `${year}-${month}-${formattedDay}`;

  return calendarEvents.value.filter((item) => item.date === currentFullDate);
}

async function prevMonth() {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() - 1,
    1,
  );

  await fetchCalendar();
}

async function nextMonth() {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() + 1,
    1,
  );

  await fetchCalendar();
}

const filteredLeaves = computed(() => {
  let data = [...leaveRequests.value];

  if (selectedStatus.value) {
    data = data.filter((item) => item.status === selectedStatus.value);
  }

  if (searchQuery.value) {
    data = data.filter((item) =>
      item.employee_name
        .toLowerCase()
        .includes(searchQuery.value.toLowerCase()),
    );
  }

  return data;
});

function formatDate(date) {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
  });
}

const openLeaveDetail = async (item) => {
  try {
    console.log("[Leave Detail] Request", item.id);

    const { data } = await getLeaveDetail(item.id);

    console.log("[Leave Detail] Success", data);

    selectedLeave.value = data.data;
    adminNote.value = data.data.note || "";

    showLeaveDetailModal.value = true;
  } catch (error) {
    console.error("[Leave Detail] Error", error.response?.data || error);
  }
};

function closeLeaveModal() {
  showLeaveDetailModal.value = false;

  selectedLeave.value = null;

  adminNote.value = "";
}

const approveLeave = async (id) => {
  try {
    console.log("[Approve Leave] Request", id);

    const response = await updateLeaveStatus(id, {
      status: "approved",
      note: adminNote.value,
    });

    console.log("[Approve Leave] Success", response.data);

    await fetchSummary();
    await fetchLeaveRequests();

    showLeaveDetailModal.value = false;
  } catch (error) {
    console.error("[Approve Leave] Error", error.response?.data || error);
  }
};

const rejectLeave = async (id) => {
  try {
    console.log("[Reject Leave] Request", id);

    const response = await updateLeaveStatus(id, {
      status: "rejected",
      note: adminNote.value,
    });

    console.log("[Reject Leave] Success", response.data);

    await fetchSummary();
    await fetchLeaveRequests();

    showLeaveDetailModal.value = false;
  } catch (error) {
    console.error("[Reject Leave] Error", error.response?.data || error);
  }
};

const saveHoliday = async () => {
  try {
    console.log("[Create Holiday] Request", holidayForm.value);

    const response = await createHoliday({
      name: holidayForm.value.title,
      date: holidayForm.value.date,
      description: holidayForm.value.description,
      category: "khusus",
    });

    console.log("[Create Holiday] Success", response.data);

    showHolidayModal.value = false;

    await fetchCalendar();
  } catch (error) {
    console.error("[Create Holiday] Error", error.response?.data || error);
  }
};

onMounted(async () => {
  try {
    console.log("========== LEAVE PAGE INIT ==========");

    await Promise.all([
      fetchSummary(),
      fetchLeaveRequests(),
      fetchCalendar(),
      fetchRecentActivities(),
    ]);
    console.log("========== LEAVE PAGE READY ==========");
  } catch (error) {
    console.error("[PAGE INIT ERROR]", error);
  }
});
</script>

<template>
  <div class="layout">
    <AdminSidebar />

    <main class="main">
      <div class="header">
        <div>
          <h1>Manajemen Cuti</h1>

          <p class="subtitle">Kelola pengajuan cuti dan kalender karyawan</p>
        </div>

        <AdminProfile :user="user" />
      </div>

      <div class="stats-grid">
        <div class="card">
          <!-- <div class="stats-icon blue"></div> -->

          <h2>{{ leaveStats.total }}</h2>

          <p>Total Pengajuan Cuti</p>
        </div>

        <div class="card">
          <!-- <div class="stats-icon yellow"></div> -->

          <h2>{{ leaveStats.pending }}</h2>

          <p>Menunggu Persetujuan</p>
        </div>

        <div class="card">
          <!-- <div class="stats-icon green"></div> -->

          <h2>{{ leaveStats.approved }}</h2>

          <p>Cuti Disetujui</p>
        </div>

        <div class="card">
          <!-- <div class="stats-icon red"></div> -->

          <h2>{{ leaveStats.rejected }}</h2>

          <p>Cuti Ditolak</p>
        </div>
      </div>

      <div class="calendar-section">
        <div class="calendar-card">
          <div class="calendar-header">
            <h2>{{ monthYear }}</h2>

            <div class="calendar-nav">
              <button @click="prevMonth">‹</button>

              <button @click="nextMonth">›</button>
            </div>
          </div>

          <div class="weekdays">
            <span>Minggu</span>
            <span>Senin</span>
            <span>Selasa</span>
            <span>Rabu</span>
            <span>Kamis</span>
            <span>Jumat</span>
            <span>Sabtu</span>
          </div>

          <div class="calendar-grid">
            <div
              v-for="(day, index) in calendarDays"
              @click="openDayModal(day)"
              :key="index"
              class="day"
            >
              <span v-if="day">{{ day }}</span>

              <div v-if="getEvents(day).length" class="event-dots">
                <span
                  v-for="(event, i) in getEvents(day)"
                  :key="i"
                  class="dot"
                  :class="
                    event.category === 'khusus'
                      ? 'office_holiday'
                      : event.category === 'nasional'
                        ? 'holiday'
                        : 'employee'
                  "
                />
              </div>
            </div>
          </div>

          <div class="legend">
            <div class="legend-item">
              <span class="legend-dot employee"></span>

              <p>Cuti Karyawan</p>
            </div>

            <div class="legend-item">
              <span class="legend-dot holiday"></span>

              <p>Libur Nasional</p>
            </div>

            <div class="legend-item">
              <span class="legend-dot office_holiday"></span>
              <p>Libur Kantor</p>
            </div>
          </div>
        </div>

        <div class="activity-card">
          <h2>Aktivitas Terbaru</h2>

          <div v-if="!recentActivities.length">
            <p>Aktivitas belum tersedia</p>
          </div>

          <div
            v-for="item in recentActivities"
            :key="item.id"
            class="activity-item"
          >
            <div class="activity-icon" :class="item.type"></div>

            <div>
              <h4>{{ item.title }}</h4>

              <p>{{ item.time }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="table-card">
        <div class="table-header">
          <h2>Daftar Pengajuan Cuti</h2>

          <div class="table-actions">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cari karyawan..."
            />
            <select v-model="selectedStatus">
              <option value="">Semua Status</option>

              <option value="pending">Menunggu</option>

              <option value="approved">Disetujui</option>

              <option value="rejected">Ditolak</option>
            </select>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Nama Karyawan</th>
              <th>Divisi</th>
              <th>Jenis Cuti</th>
              <th>Tanggal</th>
              <th>Hari</th>
              <th>Alasan</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="item in filteredLeaves" :key="item.id">
              <td>{{ item.employee_name }}</td>

              <td>{{ item.division_name }}</td>

              <td>{{ item.leave_type }}</td>

              <td>
                {{ formatDate(item.start_date) }}
                -
                {{ formatDate(item.end_date) }}
              </td>

              <td>{{ item.total_days }}</td>

              <td class="reason">
                {{ item.reason }}
              </td>

              <td>
                <span class="status" :class="item.status">
                  {{
                    item.status === "approved"
                      ? "Disetujui"
                      : item.status === "rejected"
                        ? "Ditolak"
                        : "Menunggu"
                  }}
                </span>
              </td>

              <td>
                <div class="actions">
                  <button class="view-btn" @click="openLeaveDetail(item)">
                    Detail
                  </button>
                  <button
                    v-if="item.status === 'pending'"
                    class="approve-btn"
                    @click="approveLeave(item.id)"
                  >
                    Setujui
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="showCalendarModal" class="modal-overlay">
          <div class="calendar-modal">
            <div class="modal-header">
              <h2>Detail Kalender</h2>

              <button class="close-btn" @click="showCalendarModal = false">
                ✕
              </button>
            </div>

            <p class="modal-date">
              {{ selectedDate }}
            </p>

            <div v-if="selectedEvents.length">
              <div
                v-for="(event, index) in selectedEvents"
                :key="index"
                class="event-item"
              >
                <div
                  class="event-badge"
                  :class="
                    event.category === 'khusus'
                      ? 'office_holiday'
                      : event.category === 'nasional'
                        ? 'holiday'
                        : 'employee'
                  "
                ></div>
                <div>
                  <template v-if="event.employee_name">
                    <h4>{{ event.employee_name }}</h4>

                    <p>{{ event.leave_type }}</p>
                  </template>

                  <template v-else>
                    <h4>{{ event.name }}</h4>

                    <p v-if="event.category === 'khusus'">Libur Kantor</p>

                    <p v-else>Libur Nasional</p>
                  </template>
                </div>
              </div>
            </div>

            <div v-else class="empty-state">
              <p>Tidak ada cuti dan tidak ada hari libur.</p>

              <button class="add-holiday-btn" @click="showHolidayModal = true">
                + Tambahkan Hari Libur
              </button>
            </div>
          </div>
        </div>
        <div v-if="showHolidayModal" class="modal-overlay">
          <div class="holiday-modal">
            <div class="modal-header">
              <h2>Tambah Hari Libur</h2>

              <button class="close-btn" @click="showHolidayModal = false">
                ✕
              </button>
            </div>

            <div class="form-group">
              <label>Nama Hari Libur</label>

              <input
                v-model="holidayForm.title"
                type="text"
                placeholder="Masukkan nama hari libur"
              />
            </div>

            <div class="form-group">
              <label>Tanggal</label>

              <input v-model="holidayForm.date" type="date" />
            </div>

            <div class="form-group">
              <label>Deskripsi</label>

              <textarea
                v-model="holidayForm.description"
                rows="4"
                placeholder="Masukkan deskripsi"
              />
            </div>

            <div class="modal-actions">
              <button class="cancel-btn" @click="showHolidayModal = false">
                Batal
              </button>

              <button class="save-btn" @click="saveHoliday">Simpan</button>
            </div>
          </div>
        </div>
        <div v-if="showLeaveDetailModal" class="modal-overlay">
          <div class="leave-detail-modal">
            <div class="leave-detail-header">
              <h2>Detail Pengajuan Cuti</h2>

              <button class="close-btn" @click="closeLeaveModal()">✕</button>
            </div>

            <div v-if="selectedLeave" class="leave-detail-content">
              <div class="detail-grid">
                <div class="detail-item">
                  <p>Nama Karyawan</p>

                  <h4>
                    {{ selectedLeave.employee_name }}
                  </h4>
                </div>

                <div class="detail-item">
                  <p>Divisi</p>

                  <h4>
                    {{ selectedLeave.division_name }}
                  </h4>
                </div>

                <div class="detail-item">
                  <p>Jenis Cuti</p>

                  <h4>
                    {{ selectedLeave.leave_type }}
                  </h4>
                </div>

                <div class="detail-item">
                  <p>Durasi</p>

                  <h4>
                    {{ selectedLeave.total_days }}
                    Hari
                  </h4>
                </div>

                <div class="detail-item">
                  <p>Tanggal Mulai</p>

                  <h4>
                    {{ formatDate(selectedLeave.start_date) }}
                  </h4>
                </div>

                <div class="detail-item">
                  <p>Tanggal Selesai</p>

                  <h4>
                    {{ formatDate(selectedLeave.end_date) }}
                  </h4>
                </div>
              </div>

              <div class="reason-section">
                <p>Alasan</p>

                <div class="reason-box">
                  {{ selectedLeave.reason }}
                </div>
              </div>

              <div class="reason-section">
                <p>Catatan Admin</p>

                <textarea
                  v-model="adminNote"
                  rows="4"
                  placeholder="Masukkan catatan admin"
                  class="note-textarea"
                  :disabled="selectedLeave?.status !== 'pending'"
                />
              </div>

              <div class="status-section">
                <p>Status</p>

                <span class="status" :class="selectedLeave.status">
                  {{
                    selectedLeave.status === "approved"
                      ? "Disetujui"
                      : selectedLeave.status === "rejected"
                        ? "Ditolak"
                        : "Menunggu"
                  }}
                </span>
              </div>
            </div>

            <div
              v-if="selectedLeave?.status === 'pending'"
              class="detail-actions"
            >
              <button class="detail-close-btn" @click="closeLeaveModal">
                Tutup
              </button>

              <button
                class="detail-reject-btn"
                @click="rejectLeave(selectedLeave.id)"
              >
                Tolak
              </button>

              <button
                class="detail-approve-btn"
                @click="approveLeave(selectedLeave.id)"
              >
                Setujui
              </button>
            </div>
            <div v-else class="detail-actions">
              <button class="detail-close-btn" @click="closeLeaveModal">
                Tutup
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.layout {
  display: flex;
  min-height: 100vh;
  background: #f0f2ff;
  font-family: "Segoe UI", sans-serif;
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 28px 52px;
  gap: 24px;
  overflow-y: auto;
}

.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.header h1 {
  font-size: 24px;
  font-weight: 700;
  color: #1e1b4b;
  letter-spacing: -0.3px;
}

.subtitle {
  font-size: 13px;
  color: #6b7280;
  margin-top: 3px;
  font-weight: 400;
}

/* STATS */

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

.card {
  background: #ffffff;
  border-radius: 14px;
  padding: 20px 20px 18px;
  border: 1px solid #e8e8f0;
  transition:
    box-shadow 0.2s,
    transform 0.2s;
  cursor: default;
}

.card:hover {
  box-shadow: 0 4px 20px rgba(79, 70, 229, 0.1);
  transform: translateY(-2px);
}

.card h2 {
  font-size: 30px;
  font-weight: 700;
  color: #1e1b4b;
  letter-spacing: -0.5px;
  line-height: 1;
  margin-bottom: 8px;
}

.card p {
  font-size: 12px;
  font-weight: 500;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.card:nth-child(1) h2 {
  color: #1e1b4b;
}
/* .card:nth-child(2) h2 {
  color: #16a34a;
}
.card:nth-child(3) h2 {
  color: #d97706;
}
.card:nth-child(4) h2 {
  color: #4f46e5;
} */
.card:nth-child(2) h2 {
  color: #d97706;
}

.card:nth-child(3) h2 {
  color: #16a34a;
}

.card:nth-child(4) h2 {
  color: #dc2626;
}
.card:nth-child(5) h2 {
  color: #dc2626;
}

.stats-icon {
  width: 68%;
  height: 68px;
  border-radius: 14px;
  margin-bottom: 24px;
  margin-top: 24px;
}

/* .stats-icon.blue {
  background: #dbeafe;
}

.stats-icon.yellow {
  background: #fef3c7;
}

.stats-icon.green {
  background: #dcfce7;
}

.stats-icon.red {
  background: #fee2e2;
} */

.stats-card h2 {
  font-size: 30px;
  font-weight: 700;
  color: #1e1b4b;
  line-height: 1;
  margin-bottom: 8px;
}

.stats-card p {
  font-size: 12px;
  font-weight: 500;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.calendar-section {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 20px;
  align-items: start;
}

.calendar-card,
.activity-card,
.table-card {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e8e8f0;
  overflow: hidden;
}

.calendar-card {
  padding: 22px;
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.calendar-header h2 {
  font-size: 22px;
  font-weight: 700;
  color: #1e1b4b;
}

.calendar-nav {
  display: flex;
  gap: 8px;
}

.calendar-nav button {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  color: #4b5563;
  cursor: pointer;
  transition: 0.16s ease;
  font-size: 18px;
}

.calendar-nav button:hover {
  border-color: #4f46e5;
  color: #4f46e5;
  background: #eef2ff;
}

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-top: 24px;
}

.weekdays span {
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  margin-top: 16px;
}

.day {
  aspect-ratio: 1;
  border-radius: 14px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  transition: 0.16s ease;
}

.day:hover {
  background: #f5f7ff;
}

.event-dots {
  position: absolute;
  bottom: 8px;
  display: flex;
  gap: 4px;
}

.dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
}

.dot.cuti_approved,
.dot.employee {
  background: #ef4444;
}

.dot.hari_libur,
.dot.holiday {
  background: #22c55e;
}

.dot.office_holiday {
  background: #3b82f6;
}

.legend-dot.office_holiday {
  background: #3b82f6;
}

.event-badge.office_holiday {
  background: #3b82f6;
}

.legend {
  display: flex;
  gap: 18px;
  margin-top: 20px;
  padding-top: 18px;
  border-top: 1px solid #f3f4f6;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
}

.legend-dot.employee {
  background: #ef4444;
}

.legend-dot.holiday {
  background: #22c55e;
}

.legend-item p {
  font-size: 12px;
  color: #6b7280;
}

.activity-card {
  padding: 20px;
  height: fit-content;
  align-self: start;
  max-height: 650px;
  overflow-y: auto;
}

.activity-card h2 {
  font-size: 18px;
  font-weight: 700;
  color: #1e1b4b;
  margin-bottom: 16px;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 0;
  border-bottom: 1px solid #eef2f7;
}
s.activity-item > div {
  flex: 1;
  min-width: 0;
}
.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  flex-shrink: 0;
}

.activity-icon.approved {
  background: #dcfce7;
}

.activity-icon.rejected {
  background: #fee2e2;
}

.activity-icon.pending {
  background: #fef3c7;
}

.activity-item h4 {
  font-size: 13px;
  font-weight: 600;
  color: #111827;
  line-height: 1.45;

  margin: 0 0 4px;

  word-break: break-word;
  white-space: normal;
}

.activity-item p {
  margin: 0;
  font-size: 12px;
  color: #94a3b8;
}

.activity-card > div > p {
  text-align: center;
  padding: 20px 0;
  color: #94a3b8;
  font-size: 13px;
}

.table-card {
  overflow: hidden;
  padding-bottom: 20px;
}

.table-header {
  padding: 18px 22px;
  border-bottom: 1px solid #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.table-header h2 {
  font-size: 20px;
  font-weight: 700;
  color: #1e1b4b;
}

.table-actions {
  display: flex;
  gap: 10px;
}

.table-actions input {
  width: 240px;
}

.table-actions input,
.table-actions select {
  padding: 9px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 9px;
  font-size: 13px;
  background: #f9fafb;
  outline: none;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}

.table-actions input:focus,
.table-actions select:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  background: #fff;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead tr {
  background: #f8f8ff;
}

th {
  padding: 11px 22px;
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  text-align: left;
  border-bottom: 1px solid #f3f4f6;
}

td {
  padding: 16px 22px;
  font-size: 13px;
  color: #374151;
  border-bottom: 1px solid #f9fafb;
  vertical-align: middle;
}

tbody tr:hover {
  background: #fafafe;
}

.reason {
  max-width: 250px;
  /* max-width: 180px; */
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* STATUS */

.status {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.3px;
}

.status.pending {
  background: #fef3c7;
  color: #b45309;
}

.status.approved {
  background: #dcfce7;
  color: #15803d;
}

.status.rejected {
  background: #fee2e2;
  color: #dc2626;
}

/* ACTION */

.actions {
  display: flex;
  gap: 8px;
}

.view-btn,
.approve-btn {
  border: none;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.16s ease;
}

.view-btn {
  background: #eef2ff;
  color: #4f46e5;
}

.view-btn:hover {
  background: #e0e7ff;
}

.approve-btn {
  background: #dcfce7;
  color: #15803d;
}

.approve-btn:hover {
  background: #bbf7d0;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.calendar-modal,
.holiday-modal {
  width: 100%;
  max-width: 620px;
  background: #ffffff;
  border-radius: 20px;
  padding: 26px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.18);
  animation: modalFade 0.2s ease;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 22px;
}

.modal-header h2 {
  font-size: 22px;
  font-weight: 700;
  color: #111827;
}

.close-btn {
  width: 38px;
  height: 38px;
  border: none;
  border-radius: 12px;
  background: #f3f4f6;
  cursor: pointer;
  font-size: 15px;
}

.modal-date {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 24px;
}

.event-item {
  display: flex;
  gap: 14px;
  padding: 14px;
  border-radius: 14px;
  background: #f9fafb;
  margin-bottom: 12px;
}

.event-badge {
  width: 12px;
  height: 12px;
  border-radius: 999px;
  margin-top: 6px;
}

.event-badge.employee {
  background: #ef4444;
}

.event-badge.holiday {
  background: #22c55e;
}

.event-badge.hari_libur {
  background: #22c55e;
}

.event-badge.cuti_approved {
  background: #ef4444;
}

.event-item h4 {
  font-size: 15px;
  color: #111827;
  margin-bottom: 4px;
}

.event-item p {
  font-size: 13px;
  color: #6b7280;
}

.empty-state {
  text-align: center;
  padding: 34px 0;
}

.empty-state p {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 18px;
}

.add-holiday-btn,
.save-btn {
  border: none;
  background: #4f46e5;
  color: white;
  height: 46px;
  padding: 0 20px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.form-group {
  margin-bottom: 18px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.form-group input,
.form-group textarea {
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 13px 14px;
  font-size: 14px;
  outline: none;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 26px;
}

.cancel-btn {
  border: none;
  background: #f3f4f6;
  color: #374151;
  height: 46px;
  padding: 0 20px;
  border-radius: 12px;
  cursor: pointer;
}

@keyframes modalFade {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.leave-detail-modal {
  width: 100%;
  max-width: 560px;
  /* max-width: 460px; */

  background: #ffffff;

  border-radius: 18px;

  overflow: hidden;

  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);

  animation: scaleIn 0.2s ease;
}

.leave-detail-header {
  padding: 20px 24px 16px;
  border-bottom: 1px solid #f3f4f6;

  display: flex;
  align-items: center;
  justify-content: space-between;
}

.leave-detail-header h2 {
  font-size: 16px;
  font-weight: 700;
  color: #1e1b4b;
}

.leave-detail-content {
  padding: 20px 24px;
}

.detail-grid {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.detail-item p,
.reason-section p,
.status-section p {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 10px;
}

.detail-item h4 {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  line-height: 1.5;
}

.reason-section {
  margin-top: 28px;
}

.reason-box {
  background: #f9fafb;
  border-radius: 16px;
  padding: 18px;
  font-size: 15px;
  color: #111827;
  line-height: 1.6;
}

.status-section {
  margin-top: 28px;
}

.detail-actions {
  padding: 16px 24px 20px;
  border-top: 1px solid #f3f4f6;
  display: flex;
  gap: 10px;
}

.detail-close-btn,
.detail-reject-btn,
.detail-approve-btn {
  flex: 1;
  height: 44px;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.18s ease;
}

.detail-close-btn {
  background: #f3f4f6;
  color: #374151;
}

.detail-close-btn:hover {
  background: #e5e7eb;
}

.detail-reject-btn {
  background: #d21f1f;
  color: white;
}

.detail-reject-btn:hover {
  background: #b61b1b;
}

.detail-approve-btn {
  background: #4f46e5;
  color: white;
}

.detail-approve-btn:hover {
  background: #3029b1;
}

.note-textarea {
  width: 100%;

  min-height: 100px;

  padding: 14px;

  border: 1px solid #e5e7eb;

  border-radius: 12px;

  resize: vertical;

  font-size: 14px;

  outline: none;
}

.note-textarea:focus {
  border-color: #4f46e5;
}

.today {
  background: #6079ca;
  border: 2px solid #4f46e5;
}

.activity-icon.pending {
  background: #dfcc7f;
}

.activity-icon.submit {
  background: #376fb9;
}

.activity-icon.approved {
  background: #dcfce7;
}

.activity-icon.rejected {
  background: #d18282;
}
</style>
