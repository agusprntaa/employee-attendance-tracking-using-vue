<script setup>
import { ref, onMounted, watch, computed } from "vue";
import { useAuth } from "@/composables/useAuth";

import AdminPusatSidebar from "@/components/AdminPusatSidebar.vue";
import AdminProfile from "@/components/AdminProfile.vue";

import {
  getBranchAdmins,
  addBranchAdmin,
  updateBranchAdmin,
  deleteBranchAdmin,
  getBranches,
} from "@/services/adminPusat";
import { getSafeErrorMessage } from "@/utils/errorMessage";

const { user } = useAuth();

const admins = ref([]);
const branches = ref([]);

const loading = ref(false);

const search = ref("");
const branchFilter = ref("");
const status = ref("");

const page = ref(1);
const limit = ref(10);

const meta = ref({
  total: 0,
  total_pages: 1,
});

const totalPages = computed(() => {
  return meta.value.total_pages || 1;
});

const showModal = ref(false);

const modalMode = ref("add");

const modalLoading = ref(false);

const modalError = ref("");

const form = ref({
  id: null,

  username: "",
  password: "",

  full_name: "",

  branch_name: "",

  status: "active",
});

const filteredAdmins = computed(() => {
  return admins.value.filter((admin) => {
    const matchSearch =
      admin.username?.toLowerCase().includes(search.value.toLowerCase()) ||
      admin.full_name?.toLowerCase().includes(search.value.toLowerCase()) ||
      admin.branch_name?.toLowerCase().includes(search.value.toLowerCase());

    const matchStatus =
      !status.value || admin.status?.toLowerCase() === status.value;

    const matchBranch =
      !branchFilter.value || admin.branch_name === branchFilter.value;

    return matchSearch && matchStatus && matchBranch;
  });
});

async function fetchAdmins() {
  try {
    loading.value = true;

    const res = await getBranchAdmins({
      page: page.value,
      limit: limit.value,
      search: search.value,
      status: status.value,
      branch: branchFilter.value,
    });
    // VALIDASI RESPONSE
    if (!res.data) {
      throw new Error("Response kosong dari backend");
    }

    if (!res.data.data) {
      throw new Error("data tidak ditemukan dari backend");
    }

    if (!Array.isArray(res.data.data.admins?.data)) {
      throw new Error("Format admin array backend tidak valid");
    }

    admins.value = res.data.data.admins.data.map((admin) => ({
      ...admin,

      status: admin.status?.toLowerCase() === "active" ? "active" : "inactive",
    }));

    meta.value.total = res.data.data.admins.total_data || 0;

    meta.value.total_pages = res.data.data.admins.total_pages || 1;
  } catch (err) {
    if (!err.response) {
    } else {
    }
  } finally {
    loading.value = false;
  }
}

async function fetchBranches() {
  try {
    const res = await getBranches();

    // endpoint branches pakai data.data
    branches.value = (res.data?.data?.data || []).map((branch, index) => ({
      ...branch,

      // temporary FE id
      id: index + 1,
    }));
  } catch (err) {}
}

onMounted(() => {
  fetchAdmins();
  fetchBranches();
});

watch(page, () => {
  fetchAdmins();
});

watch([search, status], () => {
  page.value = 1;
  fetchAdmins();
});

function formatDate(date) {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function adminCode(id) {
  return "ADM" + String(id).padStart(3, "0");
}

function openAdd() {
  modalMode.value = "add";

  modalError.value = "";

  form.value = {
    id: null,
    username: "",
    full_name: "",
    password: "",
    branch_name: "",
    status: "active",
  };

  showModal.value = true;
}

function openEdit(admin) {
  modalMode.value = "edit";

  modalError.value = "";

  form.value = {
    id: admin.id,
    username: admin.username,
    full_name: admin.full_name || "",
    password: "",
    branch_name: admin.branch_name,
    status: admin.status?.toLowerCase(),
  };

  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
}

async function submitModal() {
  if (!form.value.username.trim()) {
    modalError.value = "Username wajib diisi";
    return;
  }

  // ADD
  if (modalMode.value === "add") {
    if (!form.value.password.trim()) {
      modalError.value = "Password wajib diisi";
      return;
    }

    if (form.value.password.length < 6) {
      modalError.value = "Password minimal 6 karakter";
      return;
    }
  }

  // EDIT
  if (
    modalMode.value === "edit" &&
    form.value.password &&
    form.value.password.length < 6
  ) {
    modalError.value = "Password minimal 6 karakter";

    return;
  }

  if (!form.value.branch_name) {
    modalError.value = "Pilih cabang terlebih dahulu";
    return;
  }

  try {
    modalLoading.value = true;

    modalError.value = "";

    if (modalMode.value === "add") {
      await addBranchAdmin({
        username: form.value.username,

        full_name: form.value.full_name,

        password: form.value.password,

        role: "admin_cabang",

        branch_name: form.value.branch_name,

        status: form.value.status,
      });
      //branch name
      // await addBranchAdmin({
      //   username: form.value.username,

      //   full_name: form.value.full_name,

      //   password: form.value.password,

      //   role: "admin_cabang",

      //   branch_name: branches.value.find((b) => b.id === form.value.branch_id)
      //     ?.branch_name,

      //   status: form.value.status,
      // });
    } else {
      await updateBranchAdmin(form.value.id, {
        username: form.value.username,

        full_name: form.value.full_name,

        password: form.value.password || undefined,

        // branch_id: form.value.branch_id,
        //branch name
        branch_name: form.value.branch_name,

        status: form.value.status,
      });
    }

    closeModal();

    fetchAdmins();
  } catch (err) {
    modalError.value = getSafeErrorMessage(
      err,
      "Terjadi kesalahan pada server",
    );
  } finally {
    modalLoading.value = false;
  }
}

async function handleDelete(id) {
  if (!confirm("Hapus admin cabang?")) return;

  try {
    await deleteBranchAdmin(id);

    fetchAdmins();
  } catch (err) {}
}
</script>

<template>
  <div class="layout">
    <AdminPusatSidebar />

    <main class="main">
      <div class="header">
        <div>
          <h2>Admin Cabang</h2>

          <p class="subtitle">Kelola admin cabang seluruh perusahaan</p>
        </div>

        <AdminProfile :user="user" />
      </div>

      <div class="panel">
        <div class="toolbar">
          <div class="search-wrap">
            <input v-model="search" placeholder="Cari admin cabang..." />
          </div>

          <select v-model="status">
            <option value="">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>

          <select v-model="branchFilter">
            <option value="">Semua Cabang</option>

            <option
              v-for="branch in branches"
              :key="branch.branch_id"
              :value="branch.branch_name"
            >
              {{ branch.branch_name }}
            </option>
          </select>

          <button class="btn-add" @click="openAdd">+ Tambah Admin</button>
        </div>

        <!-- <div style="padding: 12px; font-size: 12px">
          <p>TOTAL ADMINS: {{ admins.length }}</p>

          <p>FILTERED ADMINS: {{ filteredAdmins.length }}</p>

          <p>PAGINATED ADMINS: {{ paginatedAdmins.length }}</p>

          <pre>{{ admins }}</pre>
        </div> -->
        <div class="table-region">
          <p class="mobile-table-hint">
            ↔ Geser tabel ke samping untuk melihat data lebih lengkap
          </p>

          <div class="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Nama Lengkap</th>
                  <th>Cabang</th>
                  <th>Status</th>
                  <th>Tanggal Dibuat</th>
                  <th>Aksi</th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="admin in filteredAdmins" :key="admin.id">
                  <td>{{ adminCode(admin.id) }}</td>

                  <td class="bold">
                    {{ admin.username }}
                  </td>

                  <td>
                    {{ admin.full_name || "-" }}
                  </td>

                  <td class="highlight">
                    {{ admin.branch_name || "-" }}
                  </td>

                  <td>
                    <span :class="['badge', admin.status?.toLowerCase()]">
                      {{ admin.status === "active" ? "Aktif" : "Nonaktif" }}
                    </span>
                  </td>

                  <td>
                    {{ formatDate(admin.created_at) }}
                  </td>

                  <td class="actions">
                    <button @click="openEdit(admin)">
                      <img src="/edit.png" class="action-icon" />
                    </button>

                    <button @click="handleDelete(admin.id)">
                      <img src="/delete.png" class="action-icon" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="pagination">
          <span class="pagination-info">
            Menampilkan
            {{ filteredAdmins.length }}
            dari
            {{ meta.total }}
            admin
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

    <!-- MODAL -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-box">
        <div class="modal-header">
          <h3>
            {{ modalMode === "add" ? "Tambah Admin" : "Edit Admin" }}
          </h3>

          <button class="modal-close" @click="closeModal">✕</button>
        </div>

        <div class="modal-body">
          <p v-if="modalError" class="modal-error">
            {{ modalError }}
          </p>

          <div class="form-group">
            <label>Username</label>

            <input v-model="form.username" />
          </div>

          <div class="form-group">
            <label>Nama Lengkap</label>

            <input
              v-model="form.full_name"
              placeholder="Masukkan nama lengkap"
            />
          </div>

          <div class="form-group">
            <label>
              {{ modalMode === "add" ? "Password" : "Password Baru" }}
            </label>

            <input
              type="password"
              v-model="form.password"
              :placeholder="
                modalMode === 'add'
                  ? 'Masukkan password'
                  : 'Kosongkan jika tidak ingin mengubah password'
              "
            />
          </div>

          <div class="form-group">
            <label>Cabang</label>

            <select v-model="form.branch_name">
              <option :value="null">Pilih Cabang</option>

              <option
                v-for="branch in branches"
                :key="branch.id"
                :value="branch.branch_name"
              >
                {{ branch.branch_name }}
              </option>
            </select>
          </div>

          <div v-if="modalMode === 'edit'" class="form-group">
            <label>Status</label>

            <select v-model="form.status">
              <option value="active">Aktif</option>

              <option value="inactive">Nonaktif</option>
            </select>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="closeModal">Batal</button>

          <button
            class="btn-submit"
            @click="submitModal"
            :disabled="modalLoading"
          >
            {{
              modalLoading
                ? "Menyimpan..."
                : modalMode === "add"
                  ? "Tambah"
                  : "Simpan"
            }}
          </button>
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

.table-region {
  min-width: 0;
}

.mobile-table-hint {
  display: none;
}

.table-scroll {
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
}

.table-scroll table {
  width: 100%;
  min-width: 900px;
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
  font-size: 14px;
  color: #374151;
  border-bottom: 1px solid #f9fafb;
}

tbody tr:hover {
  background: #fafafe;
}

tbody tr:last-child td {
  border-bottom: none;
}

td.bold {
  font-weight: 600;
  color: #1e1b4b;
}

td.highlight {
  color: #4f46e5;
  font-weight: 600;
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

/* modal delete */
.modal-body p {
  font-size: 13px;
  color: #374151;
  line-height: 1.5;
}

.btn-delete {
  padding: 9px 24px;
  background: #dc2626;
  color: #fff;
  border: none;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-delete:hover {
  background: #b91c1c;
  box-shadow: 0 4px 14px rgba(220, 38, 38, 0.3);
}

.modal-footer {
  padding: 16px 24px 20px;
  border-top: 1px solid #f3f4f6;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.modal-box {
  animation: scaleIn 0.2s ease;
}

@keyframes scaleIn {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
