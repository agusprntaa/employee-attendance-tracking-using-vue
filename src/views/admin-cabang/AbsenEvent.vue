<script setup>
import { ref, computed, onMounted, watch } from "vue";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useRouter } from "vue-router";
import { useAuth } from "@/composables/useAuth";
import {
  createEvent,
  updateEvent,
  deleteEvent,
  getEvents,
} from "@/services/adminCabangEvent";
import AdminSidebar from "@/components/AdminSidebar.vue";
import AdminProfile from "@/components/AdminProfile.vue";
import { LMap, LTileLayer, LMarker, LCircle } from "@vue-leaflet/vue-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const { user, loadUser } = useAuth();
const router = useRouter();

const loading = ref(false);

const search = ref("");

const page = ref(1);
const limit = ref(10);

const showEventModal = ref(false);

const employeeSearch = ref("");

const selectAllEmployees = ref(false);

const eventForm = ref({
  name: "",
  description: "",
  location: "",
  latitude: "",
  longitude: "",
  radius: "",
  start_date: "",
  end_date: "",
  start_time: "",
  end_time: "",
});

const showAddModal = ref(false);
const showDeleteModal = ref(false);

const selectedEvent = ref(null);
const isEdit = ref(false);

const errors = ref({
  name: "",
  description: "",
  location: "",
  latitude: "",
  longitude: "",
  radius_meter: "",
  start_date: "",
  end_date: "",
  start_time: "",
  end_time: "",
});

const events = ref([]);
const mapZoom = ref(15);

const mapCenter = ref([-8.670458, 115.212629]);
const markerPosition = computed(() => [
  Number(eventForm.value.latitude || -8.670458),
  Number(eventForm.value.longitude || 115.212629),
]);
function updateLocation(lat, lng) {
  eventForm.value.latitude = lat.toFixed(6);
  eventForm.value.longitude = lng.toFixed(6);

  mapCenter.value = [lat, lng];
}

function resolveEventStatus(event) {
  if (event.status) return event.status;
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const startDate = event.start_date || event.date;
  const endDate = event.end_date || event.date;
  if (startDate && today < startDate) return "Belum Dimulai";
  if (endDate && today > endDate) return "Selesai";
  return "Berlangsung";
}

const summary = computed(() => ({
  total_event: events.value.length,

  active_event: events.value.filter((e) => e.status === "Berlangsung").length,

  upcoming_event: events.value.filter((e) => e.status === "Belum Dimulai")
    .length,

  finished_event: events.value.filter((e) => e.status === "Selesai").length,
}));

const filteredEvents = computed(() => {
  return events.value.filter((item) =>
    item.name.toLowerCase().includes(search.value.toLowerCase()),
  );
});

const totalPages = computed(() =>
  Math.ceil(filteredEvents.value.length / limit.value),
);

const paginatedEvents = computed(() => {
  const start = (page.value - 1) * limit.value;

  return filteredEvents.value.slice(start, start + limit.value);
});

function openAdd() {
  isEdit.value = false;
  eventForm.value = {
    name: "",
    description: "",
    location: "",
    latitude: "",
    longitude: "",
    radius: "",
    start_date: "",
    end_date: "",
    start_time: "",
    end_time: "",
  };

  errors.value = {
    name: "",
    description: "",
    location: "",
    latitude: "",
    longitude: "",
    radius_meter: "",
    start_date: "",
    end_date: "",
    start_time: "",
    end_time: "",
  };

  mapCenter.value = [-8.670458, 115.212629];

  mapZoom.value = 15;

  showEventModal.value = true;
}

function validateForm() {
  errors.value = {
    name: "",
    description: "",
    location: "",
    latitude: "",
    longitude: "",
    radius_meter: "",
    start_date: "",
    end_date: "",
    start_time: "",
    end_time: "",
  };

  let valid = true;

  if (!eventForm.value.name.trim()) {
    errors.value.name = "Nama event wajib diisi";
    valid = false;
  }

  if (!eventForm.value.description.trim()) {
    errors.value.description = "Deskripsi wajib diisi";
    valid = false;
  }

  if (!eventForm.value.location.trim()) {
    errors.value.location = "Lokasi wajib diisi";
    valid = false;
  }

  if (!eventForm.value.latitude) {
    errors.value.latitude = "Latitude wajib diisi";
    valid = false;
  }

  if (!eventForm.value.longitude) {
    errors.value.longitude = "Longitude wajib diisi";
    valid = false;
  }

  if (!eventForm.value.radius) {
    errors.value.radius_meter = "Radius wajib diisi";
    valid = false;
  }

  if (!eventForm.value.start_date) {
    errors.value.start_date = "Tanggal mulai wajib diisi";
    valid = false;
  }

  if (!eventForm.value.end_date) {
    errors.value.end_date = "Tanggal selesai wajib diisi";
    valid = false;
  }

  if (
    eventForm.value.start_date &&
    eventForm.value.end_date &&
    eventForm.value.end_date < eventForm.value.start_date
  ) {
    errors.value.end_date = "Tanggal selesai tidak boleh sebelum tanggal mulai";
    valid = false;
  }

  if (!eventForm.value.start_time) {
    errors.value.start_time = "Jam mulai wajib diisi";
    valid = false;
  }

  if (!eventForm.value.end_time) {
    errors.value.end_time = "Jam selesai wajib diisi";
    valid = false;
  }

  return valid;
}

async function submitEvent() {
  if (!validateForm()) return;
  try {
    loading.value = true;

    const payload = {
      name: eventForm.value.name,
      description: eventForm.value.description,
      location: eventForm.value.location,
      latitude: Number(eventForm.value.latitude),
      longitude: Number(eventForm.value.longitude),
      radius_meter: Number(eventForm.value.radius),
      start_date: eventForm.value.start_date,
      end_date: eventForm.value.end_date,
      start_time: eventForm.value.start_time,
      end_time: eventForm.value.end_time,
    };

    if (isEdit.value) {
      await updateEvent(selectedEvent.value.id, payload);
    } else {
      await createEvent(payload);
    }
    await fetchEvents();
    showEventModal.value = false;
    isEdit.value = false;
    selectedEvent.value = null;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
}

async function fetchEvents() {
  try {
    loading.value = true;

    const res = await getEvents();

    events.value = (res.data.data || []).map((event) => ({
      ...event,
      status: resolveEventStatus(event),
    }));
  } catch (err) {
    console.log(err);
  } finally {
    loading.value = false;
  }
}

function openDelete(item) {
  selectedEvent.value = item;

  showDeleteModal.value = true;
}

async function confirmDelete() {
  if (!selectedEvent.value || loading.value) return;
  try {
    loading.value = true;
    await deleteEvent(selectedEvent.value.id);
    showDeleteModal.value = false;
    selectedEvent.value = null;
    await fetchEvents();
  } catch (err) {
    console.error("DELETE EVENT ERROR:", err.response?.data || err);
  } finally {
    loading.value = false;
  }
}

function goDetail(item) {
  router.push(`/admin-cabang/event-detail/${item.id}`);
}

function editEvent(item) {
  isEdit.value = true;

  selectedEvent.value = item;

  eventForm.value = {
    name: item.name,
    description: item.description,
    location: item.location,
    latitude: item.latitude,
    longitude: item.longitude,
    radius: item.radius_meter,
    start_date: item.start_date,
    end_date: item.end_date,
    start_time: item.start_time,
    end_time: item.end_time,
  };
  mapCenter.value = [Number(item.latitude), Number(item.longitude)];

  mapZoom.value = 17;

  showEventModal.value = true;
}

function exportExcel() {
  if (!events.value.length) {
    alert("Tidak ada data event");
    return;
  }
  const data = events.value.map((item) => ({
    ID: item.id,
    Nama: item.name,
    Lokasi: item.location,
    "Tanggal Mulai": item.start_date || item.date,
    "Tanggal Selesai": item.end_date || item.date,
    Mulai: item.start_time,
    Selesai: item.end_time,
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Event");
  XLSX.writeFile(wb, "event.xlsx");
}
function exportPDF() {
  if (!events.value.length) {
    alert("Tidak ada data event");
    return;
  }
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("Daftar Event", 14, 16);
  doc.setFontSize(10);
  doc.text(new Date().toLocaleDateString("id-ID"), 14, 24);
  const rows = events.value.map((item) => [
    item.id,
    item.name,
    item.location,
    item.start_date || item.date,
    item.end_date || item.date,
    item.start_time,
    item.end_time,
  ]);
  autoTable(doc, {
    startY: 30,
    head: [
      [
        "ID",
        "Nama Event",
        "Lokasi",
        "Mulai",
        "Selesai",
        "Jam Mulai",
        "Jam Selesai",
      ],
    ],
    body: rows,
    styles: {
      fontSize: 9,
    },
    headStyles: {
      fillColor: [79, 70, 229],
    },
  });
  doc.save("event.pdf");
}

watch(
  () => [eventForm.value.latitude, eventForm.value.longitude],
  ([lat, lng]) => {
    if (!lat || !lng) return;

    mapCenter.value = [Number(lat), Number(lng)];
  },
);

onMounted(async () => {
  loadUser();

  await fetchEvents();
});
</script>

<template>
  <div class="layout">
    <AdminSidebar />

    <main class="main">
      <div class="header">
        <div>
          <h2>Absensi Event</h2>
          <p class="subtitle">Kelola seluruh event absensi karyawan</p>
        </div>

        <AdminProfile :user="user" />
      </div>

      <!-- SUMMARY -->
      <section class="stats">
        <div class="card">
          <h2>{{ summary.total_event }}</h2>
          <p>Total Event</p>
        </div>

        <div class="card">
          <h2>{{ summary.active_event }}</h2>
          <p>Event Berlangsung</p>
        </div>

        <div class="card">
          <h2>{{ summary.upcoming_event }}</h2>
          <p>Event Akan Datang</p>
        </div>

        <div class="card">
          <h2>{{ summary.finished_event }}</h2>
          <p>Event Selesai</p>
        </div>
      </section>

      <!-- PANEL -->
      <section class="panel">
        <!-- TOOLBAR -->
        <div class="toolbar">
          <div class="search-wrap">
            <input v-model="search" type="text" placeholder="Cari event..." />
          </div>
          <div class="export-actions">
            <button class="btn-export excel" @click="exportExcel">
              Excel

              <span class="tooltip"> Export ke Excel </span>
            </button>

            <button class="btn-export pdf" @click="exportPDF">
              PDF

              <span class="tooltip"> Export ke PDF </span>
            </button>
          </div>

          <button class="btn-add" @click="openAdd">+ Tambah Event</button>
        </div>

        <!-- TABLE -->
        <div class="table-region">
          <p class="mobile-table-hint" aria-hidden="true">
            Geser tabel ke samping untuk melihat kolom lainnya
          </p>

          <div
            class="table-scroll"
            tabindex="0"
            role="region"
            aria-label="Daftar event"
          >
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nama Event</th>
                  <th>Lokasi</th>
                  <th>Tanggal</th>
                  <th>Total Peserta</th>
                  <th>Hadir</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="item in paginatedEvents" :key="item.id">
                  <td>EVT-{{ item.id }}</td>
                  <td class="bold">
                    {{ item.name }}
                  </td>
                  <td>
                    {{ item.location }}
                  </td>
                  <td>
                    {{ item.start_date || item.date }}
                    <template
                      v-if="item.end_date && item.end_date !== item.start_date"
                    >
                      s/d {{ item.end_date }}
                    </template>
                  </td>
                  <td>
                    {{ item.total_participants ?? item.total_employee ?? 0 }}
                  </td>
                  <td>
                    {{ item.total_present ?? item.present ?? 0 }}
                  </td>
                  <td>
                    <span class="badge" :class="item.status">
                      {{ item.status }}
                    </span>
                  </td>
                  <td class="actions">
                    <button
                      class="action-btn detail"
                      @click.stop="goDetail(item)"
                    >
                      <img
                        src="/public/eye-show.png"
                        class="action-icon"
                        alt="Detail"
                      />

                      <span class="action-tooltip"> Detail Event </span>
                    </button>

                    <button
                      class="action-btn edit"
                      @click.stop="editEvent(item)"
                    >
                      <img
                        src="/public/edit.png"
                        class="action-icon"
                        alt="Edit"
                      />

                      <span class="action-tooltip"> Edit Event </span>
                    </button>

                    <button
                      class="action-btn delete"
                      @click.stop="openDelete(item)"
                    >
                      <img
                        src="/public//delete.png"
                        class="action-icon"
                        alt="Delete"
                      />

                      <span class="action-tooltip"> Hapus Event </span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <!-- PAGINATION -->
        <div class="pagination">
          <span class="pagination-info">
            Menampilkan
            {{ paginatedEvents.length }}
            dari
            {{ filteredEvents.length }}
            event
          </span>
          <div class="pagination-controls">
            <button :disabled="page === 1" @click="page--">‹</button>
            <button
              v-for="p in totalPages"
              :key="p"
              :class="{ active: p === page }"
              @click="page = p"
            >
              {{ p }}
            </button>
            <button :disabled="page === totalPages" @click="page++">›</button>
          </div>
        </div>
      </section>

      <div v-if="showDeleteModal" class="modal-overlay">
        <div class="modal-box">
          <div class="modal-header">
            <h3>Hapus Event</h3>
          </div>
          <div class="modal-body">
            <p>Yakin ingin menghapus event ini?</p>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" @click="showDeleteModal = false">
              Batal
            </button>
            <button class="btn-delete" @click="confirmDelete">Hapus</button>
          </div>
        </div>
      </div>
    </main>
  </div>
  <div
    v-if="showEventModal"
    class="modal-overlay"
    @click.self="showEventModal = false"
  >
    <div class="modal-box event-modal">
      <div class="modal-header">
        <div class="modal-title">
          <h3>
            {{ isEdit ? "Edit Event" : "Tambah Event" }}
          </h3>
          <p>
            {{
              isEdit
                ? "Perbarui informasi event."
                : "Lengkapi informasi event sebelum disimpan."
            }}
          </p>
        </div>

        <button
          class="modal-close"
          @click="showEventModal = false"
          aria-label="Tutup"
        >
          ✕
        </button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>Nama Event</label>

          <input
            v-model="eventForm.name"
            :class="{ 'input-error': errors.name }"
            placeholder="Masukkan nama event"
          />

          <small v-if="errors.name" class="error-text">
            {{ errors.name }}
          </small>
        </div>
        <div class="form-group">
          <label>Deskripsi</label>

          <textarea
            v-model="eventForm.description"
            rows="3"
            :class="{ 'input-error': errors.description }"
            placeholder="Deskripsi event"
          ></textarea>

          <small v-if="errors.description" class="error-text">
            {{ errors.description }}
          </small>
        </div>
        <div class="form-group">
          <label>Lokasi</label>

          <input
            v-model="eventForm.location"
            :class="{ 'input-error': errors.location }"
            placeholder="Contoh: Jl. Merdeka No.123"
          />

          <small v-if="errors.location" class="error-text">
            {{ errors.location }}
          </small>
        </div>
        <div class="form-group">
          <label>Preview Lokasi Event</label>

          <div class="map-wrapper">
            <LMap
              :zoom="mapZoom"
              :center="mapCenter"
              style="height: 320px"
              @click="(e) => updateLocation(e.latlng.lat, e.latlng.lng)"
            >
              <LTileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <LMarker
                :lat-lng="markerPosition"
                :draggable="true"
                @moveend="
                  (e) =>
                    updateLocation(
                      e.target.getLatLng().lat,
                      e.target.getLatLng().lng,
                    )
                "
              />

              <LCircle
                :lat-lng="markerPosition"
                :radius="Number(eventForm.radius || 100)"
              />
            </LMap>
          </div>

          <small class="helper-text">
            Klik peta atau geser marker untuk menentukan lokasi absensi.
          </small>
        </div>
        <div class="coordinate-grid">
          <div class="form-group">
            <label>Latitude</label>

            <input
              type="number"
              step="0.000001"
              v-model="eventForm.latitude"
              :class="{ 'input-error': errors.latitude }"
              placeholder="-8.670458"
            />

            <small v-if="errors.latitude" class="error-text">
              {{ errors.latitude }}
            </small>
          </div>

          <div class="form-group">
            <label>Longitude</label>

            <input
              type="number"
              step="0.000001"
              v-model="eventForm.longitude"
              :class="{ 'input-error': errors.longitude }"
              placeholder="115.212629"
            />

            <small v-if="errors.longitude" class="error-text">
              {{ errors.longitude }}
            </small>
          </div>
        </div>

        <div class="form-group">
          <label>Radius (Meter)</label>

          <input
            type="number"
            v-model="eventForm.radius"
            :class="{ 'input-error': errors.radius_meter }"
            placeholder="Contoh: 100"
          />

          <small v-if="errors.radius_meter" class="error-text">
            {{ errors.radius_meter }}
          </small>
        </div>

        <div class="date-grid">
          <div class="form-group">
            <label>Tanggal Mulai</label>

            <input
              type="date"
              v-model="eventForm.start_date"
              :class="{ 'input-error': errors.start_date }"
            />

            <small v-if="errors.start_date" class="error-text">
              {{ errors.start_date }}
            </small>
          </div>

          <div class="form-group">
            <label>Tanggal Selesai</label>

            <input
              type="date"
              v-model="eventForm.end_date"
              :class="{ 'input-error': errors.end_date }"
            />

            <small v-if="errors.end_date" class="error-text">
              {{ errors.end_date }}
            </small>
          </div>
        </div>

        <div class="form-group">
          <label>Jam Mulai</label>

          <input
            type="time"
            v-model="eventForm.start_time"
            :class="{ 'input-error': errors.start_time }"
          />

          <small v-if="errors.start_time" class="error-text">
            {{ errors.start_time }}
          </small>
        </div>

        <div class="form-group">
          <label>Jam Selesai</label>

          <input
            type="time"
            v-model="eventForm.end_time"
            :class="{ 'input-error': errors.end_time }"
          />

          <small v-if="errors.end_time" class="error-text">
            {{ errors.end_time }}
          </small>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-cancel" @click="showEventModal = false">
          Batal
        </button>

        <button class="btn-submit" :disabled="loading" @click="submitEvent">
          {{ loading ? "Menyimpan..." : isEdit ? "Simpan" : "Simpan Event" }}
        </button>
      </div>
    </div>
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
  background: #f4f6fb;
}

.main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 28px 32px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.header h2 {
  font-size: 28px;
  font-weight: 700;
  color: #1e1b4b;
}

.subtitle {
  margin-top: 4px;
  font-size: 14px;
  color: #6b7280;
}

.stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
}

.card {
  padding: 22px;
  border-radius: 18px;
  background: white;
  border: 1px solid #eef2ff;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.05);
}

.card h2 {
  margin-bottom: 8px;
  color: #4338ca;
  font-size: 34px;
  font-weight: 700;
}

.card p {
  color: #6b7280;
  font-size: 13px;
}

.panel {
  overflow-x: hidden;
  overflow-y: visible;
  border: 1px solid #e8e8f0;
  border-radius: 18px;
  background: #ffffff;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 22px;
  border-bottom: 1px solid #edf0f4;
  overflow: visible;
  position: relative;
  z-index: 5;
}

.search-wrap {
  flex: 1;
  min-width: 200px;
}

.toolbar input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #d8deea;
  border-radius: 10px;
  outline: none;
  font-size: 13px;
}

.toolbar input:focus {
  border-color: #4f46e5;
}

.export-actions {
  display: flex;
  gap: 10px;
}

.btn-export {
  position: relative;
  height: 40px;
  padding: 0 16px;
  border-radius: 10px;
  border: 1.5px solid #4f46e5;
  background: transparent;
  color: #4f46e5;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
}

.btn-export.excel {
  border-color: #16a34a;
  color: #16a34a;
}

.btn-export.excel:hover {
  background: #16a34a;
  color: white;
}

.btn-export.pdf {
  border-color: #dc2626;
  color: #dc2626;
}

.btn-export.pdf:hover {
  background: #dc2626;
  color: white;
}

.tooltip {
  position: absolute;
  top: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  padding: 6px 10px;
  border-radius: 8px;
  background: #111827;
  color: #fff;
  font-size: 11px;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: 0.2s;
  z-index: 9999;
}

.btn-export:hover .tooltip {
  opacity: 1;
  visibility: visible;
}

.btn-add {
  height: 40px;
  padding: 0 18px;
  border: none;
  border-radius: 10px;
  background: #4f46e5;
  color: white;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-add:hover {
  background: #2f299a;
  box-shadow: 0 6px 16px rgba(79, 70, 229, 0.25);
}

.btn-add:active {
  transform: scale(0.98);
}
.table-region {
  min-width: 0;
  position: relative;
}

.mobile-table-hint {
  display: none;
}

.table-scroll {
  overflow-x: auto;
  scrollbar-width: thin;
}

table {
  width: 100%;
  min-width: 980px;
  border-collapse: separate;
  border-spacing: 0;
}

thead {
  background: #f8f9fd;
}

th {
  padding: 14px 18px;
  border-bottom: 1px solid #edf0f4;
  color: #6b7280;
  font-size: 12px;
  font-weight: 700;
  text-align: left;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

td {
  padding: 15px 18px;
  border-bottom: 1px solid #f1f3f7;
  font-size: 13px;
  color: #374151;
}

tbody tr:hover {
  background: #fafbff;
}

.bold {
  font-weight: 600;
  color: #1f2937;
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.badge.Berlangsung {
  background: #dcfce7;
  color: #15803d;
}

.badge.Selesai {
  background: #e0e7ff;
  color: #4338ca;
}

.badge.Belum\ Dimulai {
  background: #fef3c7;
  color: #b45309;
}

.actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-btn {
  position: relative;

  width: 32px;
  height: 32px;

  display: flex;
  align-items: center;
  justify-content: center;

  border: 1px solid #e5e7eb;
  border-radius: 8px;

  background: #ffffff;

  cursor: pointer;

  transition: all 0.18s ease;
}

.action-icon {
  width: 16px;
  height: 16px;
  object-fit: contain;
}

.action-btn.detail:hover {
  background: #eef2ff;
  border-color: #4f46e5;
}

.action-btn.edit:hover {
  background: #fff7ed;
  border-color: #f59e0b;
}

.action-btn.delete:hover {
  background: #fef2f2;
  border-color: #ef4444;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 22px;
}

.pagination-info {
  font-size: 13px;
  color: #6b7280;
}

.pagination-controls {
  display: flex;
  gap: 8px;
}

.pagination-controls button {
  width: 36px;
  height: 36px;
  border: 1px solid #d8deea;
  border-radius: 10px;
  background: white;
  cursor: pointer;
}

.pagination-controls button.active {
  background: #4f46e5;
  color: white;
  border-color: #4f46e5;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(3px);
}

.modal-box {
  width: 100%;
  max-width: 480px;
  max-height: calc(100vh - 48px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 24px 64px rgba(15, 23, 42, 0.18);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 24px;
  border-bottom: 1px solid #eef2f7;
}

.modal-title h3 {
  margin: 0;
  color: #111827;
  font-size: 22px;
  font-weight: 700;
}

.modal-title p {
  margin-top: 6px;
  color: #6b7280;
  font-size: 13px;
  line-height: 1.5;
}

.modal-body {
  flex: 1;

  display: flex;
  flex-direction: column;
  gap: 16px;

  padding: 22px 24px;

  overflow-y: auto;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  color: #374151;
  font-size: 12px;
  font-weight: 600;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 11px 14px;
  border: 1px solid #d8deea;
  border-radius: 10px;
  font-size: 13px;
  outline: none;
  resize: vertical;
}

.form-group input:focus,
.form-group textarea:focus {
  border-color: #4f46e5;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 18px 24px;
  border-top: 1px solid #eef2f7;
}

.btn-submit,
.btn-cancel,
.btn-delete {
  min-width: 110px;
  height: 42px;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.btn-submit {
  background: #4f46e5;
  color: white;
}

.btn-submit:hover {
  background: #4338ca;
}

.btn-cancel {
  background: #eef2ff;
  color: #4338ca;
}

.btn-cancel:hover {
  background: #dbe4ff;
}

.btn-delete {
  background: #fee2e2;
  color: #dc2626;
}

.btn-delete:hover {
  background: #fecaca;
}

@media (max-width: 1024px) {
  .main {
    padding: 24px;
  }

  .stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .layout {
    flex-direction: column;
  }

  .main {
    padding: 18px 16px 28px;
    gap: 18px;
  }

  .header {
    flex-direction: column;
    gap: 16px;
  }

  .toolbar {
    flex-direction: column;
    align-items: stretch;
    padding: 16px;
  }

  .search-wrap {
    width: 100%;
    min-width: 0;
  }

  .toolbar button {
    width: 100%;
  }

  .mobile-table-hint {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    border-bottom: 1px solid #edf0f4;
    background: #fafbff;
    color: #6b7280;
    font-size: 11px;
  }

  .mobile-table-hint::before {
    content: "↔";
    color: #4f46e5;
    font-size: 15px;
  }

  .table-scroll {
    scroll-snap-type: x proximity;
  }

  .pagination {
    flex-direction: column;
    align-items: flex-start;
    gap: 14px;
  }

  .pagination-controls {
    width: 100%;
    overflow-x: auto;
    padding-bottom: 4px;
  }
}

@media (max-width: 480px) {
  .main {
    padding: 16px 12px 24px;
  }

  .stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .card {
    min-height: 108px;
    padding: 16px;
  }

  .card h2 {
    margin: 0 0 8px;
    font-size: 28px;
  }

  .card p {
    font-size: 11px;
    line-height: 1.4;
  }

  .panel {
    border-radius: 14px;
  }

  .modal-overlay {
    padding: 12px;
  }

  .modal-box {
    max-height: calc(100dvh - 24px);
    border-radius: 16px;
  }

  .event-modal {
    width: min(92vw, 760px);
    max-width: 760px;
    max-height: calc(100vh - 48px);
  }

  .modal-body {
    padding: 18px;
  }

  .modal-footer {
    flex-direction: column;
  }

  .btn-submit,
  .btn-cancel,
  .btn-delete {
    width: 100%;
  }
}

@media (max-width: 360px) {
  .main {
    padding-inline: 10px;
  }

  .stats {
    gap: 8px;
  }

  .card {
    padding: 14px;
    min-height: 102px;
  }

  .card h2 {
    font-size: 24px;
  }

  .card p {
    font-size: 10px;
  }
}

.modal-close {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: #6b7280;
  font-size: 18px;
  cursor: pointer;
  transition: 0.2s;
}

.modal-close:hover {
  background: #f3f4f6;
  color: #111827;
}

.modal-close:active {
  transform: scale(0.95);
}

.action-tooltip {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  padding: 6px 10px;
  border-radius: 8px;
  background: #111827;
  color: white;
  font-size: 11px;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: 0.18s;
  z-index: 9999;
}

.action-tooltip::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent;
  border-top-color: #111827;
}

.action-btn:hover .action-tooltip {
  opacity: 1;
  visibility: visible;
}

.input-error {
  border-color: #ef4444 !important;
  background: #fef2f2;
}

.input-error:focus {
  border-color: #ef4444 !important;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
}

.error-text {
  margin-top: 4px;
  color: #dc2626;
  font-size: 12px;
  font-weight: 500;
}

.date-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.map-wrapper {
  overflow: hidden;
  border: 1px solid #dbe3f0;
  border-radius: 14px;
}

.helper-text {
  margin-top: 8px;
  color: #64748b;
  font-size: 12px;
}
</style>
