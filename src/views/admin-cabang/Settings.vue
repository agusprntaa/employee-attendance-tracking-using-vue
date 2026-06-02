<script setup>
import { ref, onMounted } from "vue";

import AdminSidebar from "@/components/AdminSidebar.vue";
import AdminProfile from "@/components/AdminProfile.vue";

import { useAuth } from "@/composables/useAuth";

import {
  getBranchSettings,
  updateBranchSettings,
} from "@/services/adminCabang";

const { user, loadUser } = useAuth();

const loading = ref(false);
const saving = ref(false);

const successMessage = ref("");
const errorMessage = ref("");

// FORM
const form = ref({
  branch_name: "",
  address: "",
  latitude: "",
  longitude: "",
  radius_meter: 100,

  // working hours
  start_time: "",
  end_time: "",
  late_threshold_min: 15,
  checkin_cutoff_min: 120,
  work_days: "1,2,3,4,5",

  // security
  auto_refresh_qr: true,
  require_admin_approval: false,

  // notifications
  admin_email: "",
  email_notifications: true,
  late_arrival_alerts: true,
  weekly_reports: false,
});

// FETCH SETTINGS
async function fetchSettings() {
  try {
    loading.value = true;

    const res = await getBranchSettings();

    console.log("SETTINGS:", res.data);

    const data = res.data.data;

    form.value = {
      branch_name: data.branch_information?.branch_name || "",

      address: data.branch_information?.address || "",

      latitude: data.branch_information?.latitude || "",

      longitude: data.branch_information?.longitude || "",

      radius_meter: data.branch_information?.radius_meter || 100,

      // working hours
      start_time: data.working_hours?.start_time?.slice(0, 5) || "",

      end_time: data.working_hours?.end_time?.slice(0, 5) || "",

      late_threshold_min: data.working_hours?.late_threshold_min || 15,

      checkin_cutoff_min: data.working_hours?.checkin_cutoff_min || 120,

      work_days: data.working_hours?.work_days || "1,2,3,4,5",

      // security
      auto_refresh_qr: data.security?.auto_refresh_qr ?? false,

      require_admin_approval: data.security?.require_admin_approval ?? false,

      // notifications
      admin_email: data.notifications?.admin_email || "",

      email_notifications: data.notifications?.email_notifications ?? false,

      late_arrival_alerts: data.notifications?.late_arrival_alerts ?? false,

      weekly_reports: data.notifications?.weekly_reports ?? false,
    };
  } catch (err) {
    console.error("SETTINGS ERROR:", err);

    errorMessage.value = err.response?.data?.message || "Gagal memuat settings";
  } finally {
    loading.value = false;
  }
}

async function saveSettings() {
  try {
    saving.value = true;

    successMessage.value = "";
    errorMessage.value = "";

    await updateBranchSettings({
      branch_name: form.value.branch_name,

      address: form.value.address,

      latitude: Number(form.value.latitude),

      longitude: Number(form.value.longitude),

      radius_meter: Number(form.value.radius_meter),

      start_time: form.value.start_time + ":00",

      end_time: form.value.end_time + ":00",

      late_threshold_min: Number(form.value.late_threshold_min),

      checkin_cutoff_min: Number(form.value.checkin_cutoff_min),

      work_days: form.value.work_days,

      // security
      auto_refresh_qr: form.value.auto_refresh_qr,

      require_admin_approval: form.value.require_admin_approval,

      // notifications
      admin_email: form.value.admin_email,

      email_notifications: form.value.email_notifications,

      late_arrival_alerts: form.value.late_arrival_alerts,

      weekly_reports: form.value.weekly_reports,
    });

    successMessage.value = "Settings berhasil disimpan";
  } catch (err) {
    console.error("SAVE SETTINGS ERROR:", err);

    if (err.message === "Network Error") {
      errorMessage.value = "Tidak dapat terhubung ke server";

      return;
    }

    errorMessage.value =
      err.response?.data?.message || "Gagal menyimpan settings";
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  loadUser();
  fetchSettings();
});
</script>

<template>
  <div class="layout">
    <AdminSidebar />

    <main class="main">
      <div class="header">
        <div>
          <h2>Pengaturan</h2>
          <p class="subtitle">Atur konfigurasi cabang</p>
        </div>

        <AdminProfile :user="user" />
      </div>

      <div v-if="loading" class="loading">Memuat...</div>

      <template v-else>
        <div class="section">
          <div class="section-header">
            <h3>Informasi Cabang</h3>
          </div>

          <div class="section-body grid-2">
            <div class="field">
              <label>Nama Cabang</label>
              <input v-model="form.branch_name" disabled />
            </div>

            <div class="field">
              <label>Alamat</label>
              <textarea v-model="form.address" disabled />
            </div>

            <div class="grid-2">
              <div class="field">
                <label>Latitude</label>
                <input type="number" v-model="form.latitude" disabled />
              </div>

              <div class="field">
                <label>Longitude</label>
                <input type="number" v-model="form.longitude" disabled />
              </div>
            </div>

            <div class="field">
              <label> Radius Absensi (meter) </label>

              <input type="number" v-model="form.radius_meter" disabled />
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-header">
            <h3>Jam Kerja</h3>
          </div>

          <div class="section-body grid-3">
            <div class="field">
              <label>Jam Masuk</label>

              <input type="time" v-model="form.start_time" />
            </div>

            <div class="field">
              <label>Jam Pulang</label>

              <input type="time" v-model="form.end_time" />
            </div>

            <div class="field">
              <label> Batas Keterlambatan (menit) </label>

              <input type="number" v-model="form.late_threshold_min" />
            </div>

            <div class="field">
              <label> Maksimal Keterlambatan Check-In </label>

              <input type="number" v-model="form.checkin_cutoff_min" />
            </div>

            <div class="field">
              <label>Hari Kerja</label>

              <input v-model="form.work_days" placeholder="1,2,3,4,5" />
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-header">
            <h3>Keamanan & QR</h3>
          </div>

          <div class="section-body">
            <div class="toggle-row">
              <div>
                <p class="toggle-label">Refresh QR Otomatis</p>
                <p class="toggle-desc">QR akan diperbarui otomatis</p>
              </div>

              <label class="switch">
                <input type="checkbox" v-model="form.auto_refresh_qr" />
                <span></span>
              </label>
            </div>

            <div class="toggle-row">
              <div>
                <p class="toggle-label">Perlu Persetujuan Admin</p>
                <p class="toggle-desc">
                  Perubahan memerlukan persetujuan admin
                </p>
              </div>

              <label class="switch">
                <input type="checkbox" v-model="form.require_admin_approval" />
                <span></span>
              </label>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-header">
            <h3>Notifikasi</h3>
          </div>

          <div class="section-body">
            <div class="field">
              <label>Email Admin</label>

              <input type="email" v-model="form.admin_email" />
            </div>

            <div class="toggle-row">
              <span>Notifikasi Email</span>
              <label class="switch">
                <input type="checkbox" v-model="form.email_notifications" />
                <span></span>
              </label>
            </div>

            <div class="toggle-row">
              <span>Peringatan Keterlambatan</span>
              <label class="switch">
                <input type="checkbox" v-model="form.late_arrival_alerts" />
                <span></span>
              </label>
            </div>

            <div class="toggle-row">
              <span>Laporan Mingguan</span>
              <label class="switch">
                <input type="checkbox" v-model="form.weekly_reports" />
                <span></span>
              </label>
            </div>
          </div>
        </div>
      </template>

      <div class="save-bar">
        <span v-if="successMessage" class="success">
          {{ successMessage }}
        </span>

        <span v-if="errorMessage" class="error">
          {{ errorMessage }}
        </span>

        <button class="btn-save" @click="saveSettings" :disabled="saving">
          {{ saving ? "Menyimpan..." : "Simpan Pengaturan" }}
        </button>
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
  height: 100vh;
  background: #f0f2ff;
  font-family: "Segoe UI", sans-serif;
  overflow: hidden;
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 28px 32px;
  gap: 24px;
}

.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.header h2 {
  font-size: 22px;
  font-weight: 700;
}

.subtitle {
  font-size: 13px;
  color: #6b7280;
}

.section {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
}

.section-header {
  padding: 16px 20px;
  border-bottom: 1px solid #f3f4f6;
}

.section-header h3 {
  font-size: 14px;
  font-weight: 600;
}

.section-body {
  padding: 18px 20px;
}

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.grid-3 {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field label {
  font-size: 13px;
  color: #6b7280;
}

input {
  height: 38px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  font-size: 13px;
}

input:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.toggle-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f3f4f6;
}

.toggle-label {
  font-size: 13px;
  font-weight: 500;
}

.toggle-desc {
  font-size: 12px;
  color: #9ca3af;
}

.switch {
  width: 42px;
  height: 22px;
  position: relative;
}

.switch input {
  display: none;
}

.switch span {
  position: absolute;
  inset: 0;
  background: #d1d5db;
  border-radius: 20px;
}

.switch span::before {
  content: "";
  position: absolute;
  width: 16px;
  height: 16px;
  left: 3px;
  top: 3px;
  background: #fff;
  border-radius: 50%;
  transition: 0.2s;
}

.switch input:checked + span {
  background: #4f46e5;
}

.switch input:checked + span::before {
  transform: translateX(20px);
}

.save-bar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
}

.btn-save {
  background: #4f46e5;
  color: #fff;
  padding: 10px 18px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
}

.btn-save:hover {
  background: #4338ca;
}

.success {
  font-size: 12px;
  color: #16a34a;
}

/* textarea */
textarea {
  width: 100%;
  min-height: 90px;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  background: #fff;
  font-size: 13px;
  font-family: "Segoe UI", sans-serif;
  color: #111827;
  resize: vertical;
  outline: none;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

textarea:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

/* textarea field */
.field textarea {
  width: 100%;
}

/* disabled input */
input:disabled {
  background: #f9fafb;
  color: #6b7280;
  cursor: not-allowed;
}

/* fix nested grid spacing */
.section-body .grid-2,
.section-body .grid-3 {
  width: 100%;
}

/* field consistency */
.field input,
.field textarea {
  width: 100%;
}

/* responsive */
@media (max-width: 900px) {
  .grid-2,
  .grid-3 {
    grid-template-columns: 1fr;
  }

  .main {
    padding: 22px;
  }

  .save-bar {
    justify-content: stretch;
  }

  .btn-save {
    width: 100%;
  }
}
</style>
