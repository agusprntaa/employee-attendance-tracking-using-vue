<script setup>
import { ref, onMounted, watch, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuth } from "@/composables/useAuth";
import AdminSidebar from "@/components/AdminSidebar.vue";
import AdminProfile from "@/components/AdminProfile.vue";

import {
  getEmployees,
  addEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeDetail,
} from "@/services/adminCabang";

const { user } = useAuth();
const BASE_URL = import.meta.env.VITE_API_URL;

const employees = ref([]);
const loading = ref(false);

const search = ref("");
const status = ref("");

const page = ref(1);
const limit = ref(10);

const meta = ref({
  total: 0,
  total_pages: 1,
});

const totalPages = computed(() => {
  return Math.ceil(meta.value.total / limit.value);
});

const showModal = ref(false);
const modalMode = ref("add");
const modalLoading = ref(false);
const modalError = ref("");

const showDeleteModal = ref(false);
const showCredentialModal = ref(false);

const showDetailModal = ref(false);
const detailLoading = ref(false);

const selectedEmployee = ref(null);

const generatedCredential = ref({
  username: "",
  temp_password: "",
});
const selectedId = ref(null);

const form = ref({
  id: null,
  full_name: "",
  username: "",
  password: "",
  role: "karyawan",
  tipe: "cabang",
  division_id: null,
  status: "active",
});

async function fetchEmployees() {
  loading.value = true;
  try {
    const res = await getEmployees({
      search: search.value || undefined,
      status: status.value || undefined,
      page: page.value,
      limit: limit.value,
    });

    console.log("FETCH EMPLOYEES:", res.data.data.data);

    // employees.value = res.data.data.data;
    employees.value = res.data.data.data.map((emp) => ({
      ...emp,

      status: emp.status?.toLowerCase() === "active" ? "active" : "inactive",
    }));
    meta.value = res.data.data.pagination;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
}

onMounted(fetchEmployees);
watch(page, () => {
  fetchEmployees();
});

watch([search, status], () => {
  page.value = 1;
  fetchEmployees();
});

function handleFilter() {
  page.value = 1;
  fetchEmployees();
}

function formatDate(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Makassar",
  });
}

function empCode(id) {
  return "EMP" + String(id).padStart(3, "0");
}

function openAdd() {
  modalMode.value = "add";
  modalError.value = "";

  form.value = {
    id: null,
    full_name: "",
    username: "",
    password: "",
    role: "karyawan",
    tipe: "cabang",
    division_id: null,
    status: "active",
  };

  showModal.value = true;
}

async function openDetail(empId) {
  try {
    detailLoading.value = true;

    showDetailModal.value = true;

    const res = await getEmployeeDetail(empId);

    console.log("EMPLOYEE DETAIL:", res.data);

    selectedEmployee.value = res.data.data;
  } catch (err) {
    console.log(err);
  } finally {
    detailLoading.value = false;
  }
}

function openEdit(emp) {
  modalMode.value = "edit";
  modalError.value = "";

  form.value = {
    id: emp.id,
    full_name: emp.full_name,
    username: emp.username,
    password: "",
    role: emp.role,
    tipe: emp.tipe,
    division_id: emp.division_id,
    status: emp.status?.toLowerCase(),
  };

  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
}

function closeCredentialModal() {
  showCredentialModal.value = false;

  generatedCredential.value = {
    username: "",
    temp_password: "",
  };

  closeModal();
}

async function submitModal() {
  if (!form.value.full_name.trim()) {
    modalError.value = "Nama lengkap wajib diisi";
    return;
  }

  if (!form.value.username.trim()) {
    modalError.value = "Username wajib diisi";
    return;
  }

  // if (modalMode.value === "add" && !form.value.password.trim()) {
  //   if (modalMode.value === "add" && form.value.password.length < 6) {
  //     modalError.value = "Password minimal 6 karakter";
  //     return;
  //   }
  //   modalError.value = "Password wajib diisi";
  //   return;
  // }

  modalLoading.value = true;
  modalError.value = "";

  try {
    // ADD EMPLOYEE
    if (modalMode.value === "add") {
      const payload = {
        full_name: form.value.full_name,
        username: form.value.username,
        password: form.value.password,
        role: form.value.role,
        tipe: form.value.tipe,
        division_id: form.value.division_id,
        status: form.value.status,
      };

      console.log("[FE] Add employee payload:", payload);

      const res = await addEmployee(payload);

      console.log("[BE] Add employee success:", res.data);

      generatedCredential.value = {
        username: res.data.data.username,
        temp_password: res.data.data.temp_password,
      };

      showCredentialModal.value = true;
    } else {
      // EDIT EMPLOYEE
      const payload = {
        full_name: form.value.full_name,
        username: form.value.username,
        role: form.value.role,
        tipe: form.value.tipe,
        division_id: form.value.division_id,
        status: form.value.status,
      };

      await updateEmployee(form.value.id, payload);

      employees.value = employees.value.map((emp) => {
        if (emp.id === form.value.id) {
          return {
            ...emp,

            full_name: payload.full_name,
            username: payload.username,
            role: payload.role,
            tipe: payload.tipe,
            division_id: payload.division_id,
            status: payload.status?.toLowerCase(),
          };
        }

        return emp;
      });
    }

    fetchEmployees();

    if (modalMode.value !== "add") {
      closeModal();
    }
  } catch (err) {
    // BACKEND ERROR
    if (err.response) {
      console.error("[BE ERROR]", {
        status: err.response.status,
        code: err.response.data?.code,
        message: err.response.data?.message,
      });

      modalError.value = err.response.data?.message || "Backend error";

      // NETWORK / CORS
    } else if (err.request) {
      console.error(
        "[NETWORK ERROR] Backend tidak dapat diakses / CORS / ngrok",
      );

      modalError.value = "Backend tidak dapat diakses";

      // FRONTEND ERROR
    } else {
      console.error("[FE ERROR]", err.message);

      modalError.value = "Terjadi kesalahan pada frontend";
    }
  } finally {
    modalLoading.value = false;
  }
}

async function handleToggle(emp) {
  await updateEmployee(emp.id, {
    ...emp,
    status: emp.status === "active" ? "inactive" : "active",
  });
  fetchEmployees();
}

async function handleDelete(id) {
  selectedId.value = id;

  showDeleteModal.value = true;
}

function cancelDelete() {
  showDeleteModal.value = false;

  selectedId.value = null;
}

async function confirmDelete() {
  try {
    await deleteEmployee(selectedId.value);

    fetchEmployees();

    showDeleteModal.value = false;

    selectedId.value = null;
  } catch (err) {
    console.log(err);
  }
}
</script>

<template>
  <div class="layout">
    <AdminSidebar />

    <main class="main">
      <div class="header">
        <div>
          <h2>Karyawan</h2>
          <p class="subtitle">Kelola karyawan di cabang Anda</p>
        </div>
        <AdminProfile :user="user" />
      </div>

      <div class="panel">
        <div class="toolbar">
          <div class="search-wrap">
            <input v-model="search" placeholder="Cari Karyawan..." />
          </div>

          <select v-model="status">
            <option value="">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>

          <button class="btn-add" @click="openAdd">+ Tambah Karyawan</button>
        </div>

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Nama Lengkap</th>
              <th>Divisi</th>
              <th>Status</th>
              <th>Tanggal Dibuat</th>
              <th>Aksi</th>
            </tr>
          </thead>

          <tbody>
            <!-- <tr v-for="emp in employees" :key="emp.id"> -->
            <tr
              v-for="emp in employees"
              :key="emp.id"
              class="employee-row"
              @click="openDetail(emp.id)"
            >
              <td>{{ empCode(emp.id) }}</td>
              <td class="bold">{{ emp.username || "-" }}</td>
              <!-- <td>
                <span class="employee-name" @click="openDetail(emp.id)">
              </td> -->

              <td>{{ emp.full_name || "-" }}</td>

              <!-- <span class="employee-tooltip">
                    Klik untuk melihat detail karyawan
                  </span> -->
              <!-- </span> -->
              <!-- </td> -->
              <td class="highlight">{{ emp.division_name || "-" }}</td>

              <td>
                <span :class="['badge', emp.status?.toLowerCase()]">
                  {{ emp.status === "active" ? "Aktif" : "Nonaktif" }}
                </span>
              </td>

              <td>{{ formatDate(emp.created_at) }}</td>

              <td class="actions">
                <button @click.stop="openEdit(emp)">
                  <img src="/edit.png" class="action-icon" />
                </button>

                <button @click.stop="handleDelete(emp.id)">
                  <img src="/delete.png" class="action-icon" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="pagination">
          <span class="pagination-info">
            Menampilkan {{ employees.length }} dari {{ meta.total }} Karyawan
          </span>

          <div class="pagination-controls">
            <button :disabled="page <= 1" @click="page--">‹</button>

            <button
              v-for="p in totalPages"
              :key="p"
              :class="{ active: p === page }"
              @click="page = p"
            >
              {{ p }}
            </button>

            <button :disabled="page >= totalPages" @click="page++">›</button>
          </div>
        </div>
      </div>
    </main>

    <div
      v-if="showDeleteModal"
      class="modal-overlay"
      @click.self="cancelDelete"
    >
      <div class="modal-box">
        <div class="modal-header">
          <h3>Konfirmasi Hapus</h3>
          <button class="modal-close" @click="cancelDelete">✕</button>
        </div>

        <div class="modal-body">
          <p>Yakin ingin menghapus karyawan ini?</p>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="cancelDelete">Batal</button>
          <button class="btn-delete" @click="confirmDelete">Hapus</button>
        </div>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-box">
        <div class="modal-header">
          <h3>
            {{ modalMode === "add" ? "Tambah Karyawan" : "Edit Karyawan" }}
          </h3>
          <button class="modal-close" @click="closeModal">✕</button>
        </div>

        <div class="modal-body">
          <p v-if="modalError" class="modal-error">{{ modalError }}</p>

          <div class="form-group">
            <label>Nama Lengkap</label>
            <input
              v-model="form.full_name"
              placeholder="Masukkan nama lengkap"
            />
          </div>

          <div class="form-group">
            <label>Username</label>
            <input v-model="form.username" placeholder="Masukkan username" />
          </div>

          <!-- <div class="form-group">
            <label>Password</label>
            <input v-model="form.password" type="password" />
          </div> -->

          <div v-if="modalMode === 'add'" class="password-note">
            Password default akan digunakan saat login pertama. Karyawan wajib
            mengganti password setelah berhasil login.
          </div>

          <div class="form-group">
            <label>Divisi</label>

            <select v-model.number="form.division_id">
              <option :value="null">Pilih Divisi</option>
              <option :value="1">IT</option>
              <option :value="2">HR</option>
              <option :value="3">Marketing</option>
            </select>
          </div>

          <div v-if="modalMode === 'edit'" class="form-group">
            <label>Status</label>

            <select v-model="form.status">
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </div>

          <!-- <div class="form-group">
            <label>Position</label>
            <input v-model="form.position" />
          </div> -->
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="closeModal">Batal</button>
          <button class="btn-submit" @click="submitModal">
            {{ modalMode === "add" ? "Tambah" : "Simpan" }}
          </button>
        </div>
      </div>
    </div>
    <div v-if="showCredentialModal" class="modal-overlay">
      <div class="credential-modal">
        <h2>KARYAWAN</h2>

        <div class="credential-group">
          <label>Username</label>

          <div class="credential-box">
            {{ generatedCredential.username }}
          </div>
        </div>

        <div class="credential-group">
          <label>Password Sementara</label>

          <div class="credential-box">
            {{ generatedCredential.temp_password }}
          </div>
        </div>

        <p class="password-note">
          Pop up ini hanya muncul satu kali. Simpan username dan password
          sebelum ditutup.
        </p>

        <button class="credential-btn" @click="closeCredentialModal">
          Selesai
        </button>
      </div>
    </div>
    <div
      v-if="showDetailModal"
      class="modal-overlay"
      @click.self="showDetailModal = false"
    >
      <div class="detail-modal">
        <div class="modal-header">
          <h3>Detail Karyawan</h3>

          <button class="modal-close" @click="showDetailModal = false">
            ✕
          </button>
        </div>

        <div v-if="detailLoading" class="detail-loading">Memuat data...</div>

        <div v-else-if="selectedEmployee" class="detail-body">
          <div class="detail-profile">
            <img
              v-if="selectedEmployee.photo_url"
              :src="`${BASE_URL}/${selectedEmployee.photo_url}`"
              class="detail-photo"
            />

            <div v-else class="detail-avatar">
              {{ selectedEmployee.full_name?.[0] }}
            </div>

            <h2>
              {{ selectedEmployee.full_name }}
            </h2>

            <p>
              {{ selectedEmployee.division_name }}
            </p>
          </div>

          <div class="detail-grid">
            <div class="detail-item">
              <label>Username</label>

              <span>
                {{ selectedEmployee.username || "-" }}
              </span>
            </div>

            <div class="detail-item">
              <label>Role</label>

              <span>
                {{ selectedEmployee.role || "-" }}
              </span>
            </div>

            <div class="detail-item">
              <label>Tipe</label>

              <span>
                {{ selectedEmployee.tipe || "-" }}
              </span>
            </div>

            <div class="detail-item">
              <label>Status</label>

              <span>
                {{
                  selectedEmployee.status === "active"
                    ? "Aktif"
                    : selectedEmployee.status === "inactive"
                      ? "Nonaktif"
                      : "-"
                }}
              </span>
            </div>

            <div class="detail-item">
              <label>Divisi</label>

              <span>
                {{ selectedEmployee.division_name || "-" }}
              </span>
            </div>

            <div class="detail-item">
              <label>Cabang</label>

              <span>
                {{ selectedEmployee.branch_name || "-" }}
              </span>
            </div>

            <div class="detail-item full">
              <label>Dibuat Pada</label>

              <span>
                {{ formatDate(selectedEmployee.created_at) }}
              </span>
            </div>
          </div>
        </div>
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
  background: #f0f2ff;
  font-family: "Segoe UI", sans-serif;
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 28px 32px;
  gap: 24px;
}

.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.header h2 {
  font-size: 24px;
  font-weight: 700;
  color: #1e1b4b;
  letter-spacing: -0.3px;
}

.header .subtitle {
  font-size: 13px;
  color: #6b7280;
  margin-top: 3px;
  font-weight: 400;
}

.panel {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e8e8f0;
  overflow: hidden;
}

.toolbar {
  display: flex;
  gap: 10px;
  padding: 16px 22px;
  align-items: center;
  border-bottom: 1px solid #f3f4f6;
  flex-wrap: wrap;
}

.search-wrap {
  flex: 1;
  min-width: 180px;
}

.toolbar input {
  width: 100%;
  padding: 9px 14px 9px 36px;
  border: 1px solid #e5e7eb;
  border-radius: 9px;
  font-size: 13px;
  color: #374151;
  background: #f9fafb
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' fill='none' viewBox='0 0 24 24'%3E%3Ccircle cx='11' cy='11' r='8' stroke='%239CA3AF' stroke-width='2'/%3E%3Cpath d='M21 21l-4.35-4.35' stroke='%239CA3AF' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E")
    no-repeat 12px center;
  outline: none;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}

.toolbar input:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  background-color: #fff;
}

.toolbar select {
  padding: 9px 32px 9px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 9px;
  font-size: 13px;
  color: #374151;
  background: #f9fafb;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%236B7280' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  cursor: pointer;
  outline: none;
  transition: border-color 0.15s;
}

.toolbar select:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.toolbar button {
  padding: 9px 18px;
  background: #4f46e5;
  color: #fff;
  border: none;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition:
    background 0.15s,
    transform 0.1s;
  white-space: nowrap;
}

.toolbar button:hover {
  background: #4338ca;
}

.toolbar button:active {
  transform: scale(0.97);
}

.btn-add {
  padding: 9px 18px;
  background: transparent !important;
  color: #4f46e5 !important;
  border: 1.5px solid #4f46e5 !important;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 600 !important;
  cursor: pointer;
  transition: all 0.2s ease !important;
  white-space: nowrap;
}

.btn-add:hover {
  background: #4f46e5 !important;
  color: #fff !important;
  box-shadow: 0 4px 14px rgba(79, 70, 229, 0.25);
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
  padding: 13px 22px;
  font-size: 13px;
  color: #374151;
  border-bottom: 1px solid #f9fafb;
}

tbody tr:hover {
  background: #fafafe;
}

tbody tr:last-child td {
  border-bottom: none;
}

.employee-row {
  cursor: pointer;

  transition:
    background 0.18s ease,
    color 0.18s ease;
}

.employee-row:hover {
  background: #f5f7ff;
}

.employee-click {
  font-weight: 600;

  color: #1e1b4b;
}

td.bold {
  font-weight: 600;
  color: #1e1b4b;
}

.employee-name {
  position: relative;

  display: inline-flex;
  align-items: center;

  font-weight: 600;

  color: #1e1b4b;

  cursor: pointer;

  transition: all 0.18s ease;
}

.employee-name:hover {
  color: #4f46e5;

  text-decoration: underline;
}

.employee-tooltip {
  position: absolute;

  top: -10px;
  left: 50%;

  transform: translate(-50%, -100%);

  background: #111827;
  color: white;

  padding: 6px 10px;

  border-radius: 8px;

  font-size: 11px;

  white-space: nowrap;

  opacity: 0;
  visibility: hidden;

  transition: 0.18s ease;

  pointer-events: none;

  z-index: 9999;
}

.employee-name:hover .employee-tooltip {
  opacity: 1;
  visibility: visible;
}

.employee-name:hover {
  color: #4f46e5;

  text-decoration: underline;
}

td.highlight {
  color: #4f46e5;
  font-weight: 500;
}

/* ===== BADGE ===== */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.3px;
  text-transform: capitalize;
}

.badge.active {
  background: #dcfce7;
  color: #15803d;
}

.badge.inactive {
  background: #fee2e2;
  color: #b91c1c;
}

td.actions {
  display: flex;
  gap: 6px;
  align-items: center;
}

td.actions button {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  color: #6b7280;
}

td.actions button:hover:nth-child(1) {
  background: #e0e7ff;
  border-color: #4f46e5;
  color: #4f46e5;
}

td.actions button:hover:nth-child(2) {
  background: #fef9c3;
  border-color: #d97706;
  color: #d97706;
}

td.actions button:hover:nth-child(3) {
  background: #fee2e2;
  border-color: #dc2626;
  color: #dc2626;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 14px;
  padding: 18px 24px;
  border-top: 1px solid #f3f4f6;
}

.pagination-controls {
  margin-left: auto;
  padding-right: 8px;
}

.pagination-info {
  font-size: 12px;
  color: #9ca3af;
}

.pagination-controls {
  display: flex;
  gap: 6px;
}

.pagination-controls button {
  min-width: 32px;
  height: 32px;
  padding: 0 10px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  color: #374151;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.pagination-controls button:hover {
  border-color: #4f46e5;
  color: #4f46e5;
  background: #eef2ff;
}

.pagination-controls button.active {
  background: #4f46e5;
  color: #fff;
  border-color: #4f46e5;
}

.pagination-controls button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-box {
  background: #ffffff;
  border-radius: 18px;
  width: 100%;
  max-width: 460px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  animation: slideUp 0.25s ease;
  overflow: hidden;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  padding: 20px 24px 16px;
  border-bottom: 1px solid #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header h3 {
  font-size: 16px;
  font-weight: 700;
  color: #1e1b4b;
}

.modal-close {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: none;
  background: #f3f4f6;
  color: #6b7280;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}

.modal-close:hover {
  background: #fee2e2;
  color: #dc2626;
}

.modal-body {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-group label {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.form-group input,
.form-group select {
  padding: 10px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 9px;
  font-size: 13px;
  color: #374151;
  background: #f9fafb;
  outline: none;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}

.form-group input:focus,
.form-group select:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  background: #fff;
}

.modal-error {
  font-size: 12px;
  color: #dc2626;
  background: #fee2e2;
  padding: 8px 12px;
  border-radius: 8px;
}

.modal-footer {
  padding: 16px 24px 20px;
  border-top: 1px solid #f3f4f6;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.btn-cancel {
  padding: 9px 20px;
  background: transparent;
  border: 1.5px solid #e5e7eb;
  color: #6b7280;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-cancel:hover {
  border-color: #9ca3af;
  color: #374151;
}

.btn-submit {
  padding: 9px 24px;
  background: #4f46e5;
  color: #fff;
  border: none;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 0.15s,
    box-shadow 0.15s;
}

.btn-submit:hover {
  background: #4338ca;
  box-shadow: 0 4px 14px rgba(79, 70, 229, 0.3);
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ===== DELETE MODAL ===== */
.modal-body p {
  font-size: 13px;

  color: #4b5563;

  line-height: 1.6;
}

.btn-delete {
  padding: 10px 22px;

  border: none;
  border-radius: 10px;

  background: #e0e7ff;

  color: #4338ca;

  font-size: 13px;
  font-weight: 600;

  cursor: pointer;

  transition:
    background 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;
}

.btn-delete:hover {
  background: #c7d2fe;

  box-shadow: 0 6px 18px rgba(79, 70, 229, 0.18);
}

.btn-delete:active {
  transform: scale(0.97);
}

.btn-cancel {
  padding: 10px 20px;

  border-radius: 10px;

  border: none;

  background: #4f46e5;

  color: #ffffff;

  font-size: 13px;
  font-weight: 600;

  cursor: pointer;

  transition: all 0.18s ease;
}

.btn-cancel:hover {
  background: #4338ca;

  box-shadow: 0 6px 18px rgba(79, 70, 229, 0.22);
}

.btn-cancel:active {
  transform: scale(0.97);
}

.modal-footer {
  padding: 18px 24px 22px;

  border-top: 1px solid #f3f4f6;

  display: flex;
  align-items: center;
  justify-content: flex-end;

  gap: 10px;
}

.modal-box {
  animation: scaleIn 0.2s ease;
}

@keyframes scaleIn {
  from {
    transform: scale(0.96);
    opacity: 0;
  }

  to {
    transform: scale(1);
    opacity: 1;
  }
}

.password-note {
  padding: 12px 14px;

  border-radius: 12px;

  background: #eef2ff;

  color: #4338ca;

  font-size: 12px;

  line-height: 1.6;

  border: 1px solid #c7d2fe;
}

.credential-modal {
  width: 100%;
  max-width: 440px;

  background: #ffffff;

  border-radius: 18px;

  padding: 24px;

  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);

  animation: scaleIn 0.2s ease;
}

.credential-modal h2 {
  text-align: center;

  font-size: 20px;
  font-weight: 700;

  color: #1e1b4b;

  margin-bottom: 22px;
}

.credential-group {
  margin-bottom: 18px;
}

.credential-group label {
  display: block;

  margin-bottom: 6px;

  font-size: 12px;
  font-weight: 600;

  color: #374151;

  text-transform: uppercase;

  letter-spacing: 0.4px;
}

.credential-box {
  width: 100%;

  padding: 12px 14px;

  border-radius: 10px;

  background: #f9fafb;

  border: 1px solid #e5e7eb;

  font-size: 13px;
  font-weight: 700;

  color: #111827;

  word-break: break-all;
}

.password-note {
  margin-top: 4px;

  padding: 12px 14px;

  border-radius: 12px;

  background: #eef2ff;

  border: 1px solid #c7d2fe;

  color: #4338ca;

  font-size: 12px;

  line-height: 1.6;
}

.credential-btn {
  width: 100%;

  margin-top: 20px;

  padding: 12px;

  border: none;
  border-radius: 10px;

  background: #4f46e5;

  color: white;

  font-size: 13px;
  font-weight: 600;

  cursor: pointer;

  transition:
    background 0.15s,
    box-shadow 0.15s;
}

.credential-btn:hover {
  background: #4338ca;

  box-shadow: 0 4px 14px rgba(79, 70, 229, 0.25);
}

.detail-modal {
  width: 100%;
  max-width: 460px;

  background: #ffffff;

  border-radius: 18px;

  overflow: hidden;

  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);

  animation: scaleIn 0.2s ease;
}

.detail-body {
  padding: 22px 24px;
}

.detail-profile {
  display: flex;
  flex-direction: column;
  align-items: center;

  text-align: center;

  margin-bottom: 24px;
}

.detail-photo,
.detail-avatar {
  width: 82px;
  height: 82px;

  border-radius: 50%;

  margin-bottom: 12px;

  object-fit: cover;
}

.detail-avatar {
  background: linear-gradient(135deg, #6366f1, #4f46e5);

  color: white;

  display: flex;
  align-items: center;
  justify-content: center;

  font-size: 28px;
  font-weight: 700;

  box-shadow: 0 8px 20px rgba(79, 70, 229, 0.22);
}

.detail-profile h2 {
  font-size: 18px;
  font-weight: 700;

  color: #1e1b4b;

  line-height: 1.4;
}

.detail-profile p {
  margin-top: 4px;

  font-size: 13px;

  color: #6b7280;
}

.detail-grid {
  display: grid;

  grid-template-columns: 1fr 1fr;

  gap: 12px;
}

.detail-item {
  display: flex;
  flex-direction: column;

  gap: 5px;
}

.detail-item.full {
  grid-column: span 2;
}

.detail-item label {
  font-size: 10px;
  font-weight: 700;

  text-transform: uppercase;

  letter-spacing: 0.5px;

  color: #9ca3af;

  padding-left: 2px;
}

.detail-item span {
  padding: 11px 13px;

  border-radius: 12px;

  background: #f9fafb;

  border: 1px solid #eef2f7;

  color: #111827;

  font-size: 13px;
  font-weight: 500;

  line-height: 1.4;

  min-height: 44px;

  display: flex;
  align-items: center;
}

.detail-loading {
  padding: 36px 20px;

  text-align: center;

  font-size: 13px;

  color: #6b7280;
}

@media (max-width: 640px) {
  .detail-modal {
    width: calc(100% - 24px);
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }

  .detail-item.full {
    grid-column: span 1;
  }
}
</style>
