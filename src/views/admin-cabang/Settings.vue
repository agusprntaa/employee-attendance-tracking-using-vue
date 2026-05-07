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
const saveSuccess = ref(false);

// FORM STATE
const form = ref({
  branch_name: "",
  branch_code: "",
  start_time: "",
  end_time: "",
  late_threshold_min: 15,
  auto_refresh_qr: false,
  require_approval: false,
  admin_email: "",
  email_notif: false,
  late_alert: false,
  weekly_report: false,
});

// FETCH
async function fetchSettings() {
  loading.value = true;
  try {
    const res = await getBranchSettings();
    const data = res.data.data;

    form.value = {
      branch_name: data.branch_name ?? "",
      branch_code: data.branch_code ?? "",
      start_time: data.start_time ?? "",
      end_time: data.end_time ?? "",
      late_threshold_min: data.late_threshold_min ?? 15,
      auto_refresh_qr: data.auto_refresh_qr ?? false,
      require_approval: data.require_approval ?? false,
      admin_email: data.admin_email ?? "",
      email_notif: data.email_notif ?? false,
      late_alert: data.late_alert ?? false,
      weekly_report: data.weekly_report ?? false,
    };
  } catch (err) {
    console.error("FETCH SETTINGS ERROR:", err);
  } finally {
    loading.value = false;
  }
}

// SAVE
async function saveSettings() {
  if (saving.value) return;

  saving.value = true;
  saveSuccess.value = false;

  try {
    await updateBranchSettings({
      ...form.value,
      late_threshold_min: Number(form.value.late_threshold_min),
    });

    saveSuccess.value = true;
    setTimeout(() => (saveSuccess.value = false), 2500);
  } catch (err) {
    console.error("SAVE SETTINGS ERROR:", err);
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
          <h2>Settings</h2>
          <p class="subtitle">Configure branch and system settings</p>
        </div>
        <AdminProfile :user="user" />
      </div>

      <div v-if="loading" class="loading">Loading...</div>

      <template v-else>
        <div class="section">
          <div class="section-header">
            <h3>Branch Information</h3>
          </div>

          <div class="section-body grid-2">
            <div class="field">
              <label>Branch Name</label>
              <input v-model="form.branch_name" />
            </div>

            <div class="field">
              <label>Branch Code</label>
              <input v-model="form.branch_code" />
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-header">
            <h3>Working Hours</h3>
          </div>

          <div class="section-body grid-3">
            <div class="field">
              <label>Start Time</label>
              <input type="time" v-model="form.start_time" />
            </div>

            <div class="field">
              <label>End Time</label>
              <input type="time" v-model="form.end_time" />
            </div>

            <div class="field">
              <label>Late Threshold (minutes)</label>
              <input type="number" v-model="form.late_threshold_min" />
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-header">
            <h3>Security & QR Code</h3>
          </div>

          <div class="section-body">
            <div class="toggle-row">
              <div>
                <p class="toggle-label">Auto-refresh QR Code</p>
                <p class="toggle-desc">
                  Automatically regenerate QR every hour
                </p>
              </div>
              <label class="switch">
                <input type="checkbox" v-model="form.auto_refresh_qr" />
                <span></span>
              </label>
            </div>

            <div class="toggle-row">
              <div>
                <p class="toggle-label">Require Admin Approval</p>
                <p class="toggle-desc">Require approval for changes</p>
              </div>
              <label class="switch">
                <input type="checkbox" v-model="form.require_approval" />
                <span></span>
              </label>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-header">
            <h3>Notifications</h3>
          </div>

          <div class="section-body">
            <div class="field">
              <label>Admin Email</label>
              <input type="email" v-model="form.admin_email" />
            </div>

            <div class="toggle-row">
              <span>Email Notifications</span>
              <label class="switch">
                <input type="checkbox" v-model="form.email_notif" />
                <span></span>
              </label>
            </div>

            <div class="toggle-row">
              <span>Late Arrival Alerts</span>
              <label class="switch">
                <input type="checkbox" v-model="form.late_alert" />
                <span></span>
              </label>
            </div>

            <div class="toggle-row">
              <span>Weekly Reports</span>
              <label class="switch">
                <input type="checkbox" v-model="form.weekly_report" />
                <span></span>
              </label>
            </div>
          </div>
        </div>
      </template>

      <div class="save-bar">
        <span v-if="saveSuccess" class="success">Saved</span>

        <button class="btn-save" @click="saveSettings">
          {{ saving ? "Saving..." : "Save Settings" }}
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
  font-size: 12px;
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
  font-size: 11px;
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
</style>
