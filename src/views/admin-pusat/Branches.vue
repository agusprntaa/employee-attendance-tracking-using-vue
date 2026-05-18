<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import adminPusatSidebar from "@/components/AdminPusatSidebar.vue";

import { getAllBranches, createBranch } from "@/services/adminPusat";

const router = useRouter();

const loading = ref(false);

const pageError = ref("");
const formError = ref("");

const successMessage = ref("");

const branches = ref([]);

const search = ref("");

const showAddModal = ref(false);

const form = ref({
  branch_name: "",
  address: "",
  latitude: "",
  longitude: "",
  radius_meter: 200,
  status: "Active",
});

async function fetchBranches() {
  loading.value = true;

  try {
    const res = await getAllBranches();

    console.log("BRANCHES:", res.data);

    branches.value = res.data.data.data || [];
  } catch (err) {
    console.error("BRANCH ERROR:", err);

    console.log("DETAIL ERROR:", err.response?.data);

    pageError.value =
      err.response?.data?.message || "Gagal mengambil data branch, cek backend";
  } finally {
    loading.value = false;
  }
}

const filteredBranches = computed(() => {
  return branches.value.filter((branch) =>
    branch.branch_name?.toLowerCase().includes(search.value.toLowerCase()),
  );
});

function getStatusClass(status) {
  if (status === "Active") {
    return "active";
  }

  return "inactive";
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    // timeZone: "Asia/Makassar",
  });
}

async function handleAddBranch() {
  console.log("ADD BRANCH PAYLOAD:", {
    branch_name: form.value.branch_name,
    address: form.value.address,
    latitude: Number(form.value.latitude),
    longitude: Number(form.value.longitude),
    radius_meter: Number(form.value.radius_meter),
    status: form.value.status,
  });
  try {
    await createBranch({
      branch_name: form.value.branch_name,
      address: form.value.address,
      latitude: Number(form.value.latitude),
      longitude: Number(form.value.longitude),
      radius_meter: Number(form.value.radius_meter),
      status: form.value.status,
    });

    successMessage.value = "Branch berhasil ditambahkan";

    showAddModal.value = false;

    form.value = {
      branch_name: "",
      address: "",
      latitude: "",
      longitude: "",
      radius_meter: 200,
      status: "Active",
    };

    fetchBranches();
  } catch (err) {
    console.error("ADD BRANCH ERROR:", err);

    console.log("DETAIL ERROR:", err.response?.data);

    formError.value =
      err.response?.data?.message || "Gagal menambahkan branch, cek backend";
  }
}

function goBack() {
  router.back();
}

onMounted(() => {
  fetchBranches();
});
</script>

<template>
  <div class="branches-page">
    <adminPusatSidebar />
    <div class="content">
      <div class="page-header">
        <div>
          <h1>Branch Management</h1>

          <p>Manage all branch locations and information</p>
        </div>

        <div class="header-actions">
          <button
            class="add-btn"
            @click="
              showAddModal = true;
              formError = '';
              successMessage = '';
            "
          >
            + Add Branch
          </button>

          <button class="back-btn" @click="goBack">×</button>
        </div>
      </div>

      <div v-if="successMessage" class="success-box">
        {{ successMessage }}
      </div>

      <div v-if="pageError" class="error-global">
        {{ pageError }}
      </div>

      <div class="summary-grid">
        <div class="summary-card blue">
          <span>Total Branches</span>

          <h2>
            {{ branches.length }}
          </h2>
        </div>

        <div class="summary-card green">
          <span>Active Branches</span>

          <h2>
            {{ branches.filter((b) => b.status === "Active").length }}
          </h2>
        </div>

        <div class="summary-card purple">
          <span>Total Employees</span>

          <h2>
            {{
              branches.reduce((sum, branch) => sum + branch.total_employees, 0)
            }}
          </h2>
        </div>
      </div>

      <div class="toolbar">
        <input
          v-model="search"
          type="text"
          placeholder="Search branch..."
          class="search-input"
        />
      </div>

      <div v-if="loading" class="loading-state">Loading branches...</div>

      <div v-else class="table-card">
        <table>
          <thead>
            <tr>
              <th>Branch ID</th>
              <th>Branch Name</th>
              <th>Address</th>
              <th>Employees</th>
              <th>Attendance</th>
              <th>Radius</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="branch in filteredBranches" :key="branch.branch_id">
              <td>{{ branch.branch_id }}</td>

              <td>
                {{ branch.branch_name }}
              </td>

              <td>
                {{ branch.address }}
              </td>

              <td>
                {{ branch.total_employees }}
              </td>

              <td>
                {{
                  branch.attendance_rate_30d != null
                    ? Math.round(branch.attendance_rate_30d) + "%"
                    : "0%"
                }}
              </td>

              <td>
                {{ branch.radius_meter ? branch.radius_meter + "m" : "-" }}
              </td>

              <td>
                <span
                  class="status-badge"
                  :class="getStatusClass(branch.status)"
                >
                  {{ branch.status }}
                </span>
              </td>

              <td>
                {{ formatDate(branch.created_date) }}
              </td>
            </tr>

            <tr v-if="!filteredBranches.length">
              <td colspan="8" class="empty-table">No branch data found</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div
      v-if="showAddModal"
      class="modal-overlay"
      @click.self="showAddModal = false"
    >
      <div class="modal-box">
        <div class="modal-header">
          <h3>Add Branch</h3>

          <button class="modal-close" @click="showAddModal = false">✕</button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label>Branch Name</label>

            <input
              v-model="form.branch_name"
              type="text"
              placeholder="Input branch name"
            />
          </div>

          <div class="form-group">
            <label>Address</label>

            <input
              v-model="form.address"
              type="text"
              placeholder="Input branch address"
            />
          </div>

          <div class="form-group">
            <label>Latitude</label>

            <input
              v-model="form.latitude"
              type="text"
              placeholder="-8.670458"
            />
          </div>

          <div class="form-group">
            <label>Longitude</label>

            <input
              v-model="form.longitude"
              type="text"
              placeholder="115.212629"
            />
          </div>

          <div class="form-group">
            <label>Radius Meter</label>

            <input v-model="form.radius_meter" type="text" placeholder="200" />
          </div>

          <div class="form-group">
            <label>Status</label>

            <select v-model="form.status">
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

            <div v-if="formError" class="error-box">
              {{ formError }}
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="showAddModal = false">
            Cancel
          </button>

          <button class="btn-submit" @click="handleAddBranch">
            Save Branch
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.branches-page {
  min-height: 100vh;
  background: #f8fafc;
  display: flex;
}

.content {
  flex: 1;
  padding: 32px;
  overflow-x: auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  margin-bottom: 28px;
}

.page-header h1 {
  font-size: 32px;
  font-weight: 700;

  color: #0f172a;
}

.page-header p {
  margin-top: 8px;

  color: #64748b;
  font-size: 15px;
}

.back-btn {
  width: 40px;
  height: 40px;

  border: 1px solid #e2e8f0;
  background: white;

  border-radius: 12px;

  font-size: 22px;

  cursor: pointer;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);

  gap: 20px;

  margin-bottom: 28px;
}

.summary-card {
  padding: 24px;

  border-radius: 24px;

  border: 1px solid #eef2ff;
}

.summary-card span {
  font-size: 14px;
  color: #64748b;
}

.summary-card h2 {
  margin-top: 10px;

  font-size: 38px;
  font-weight: 700;
}

.summary-card.blue {
  background: #eef2ff;
  color: #4338ca;
}

.summary-card.green {
  background: #ecfdf5;
  color: #059669;
}

.summary-card.purple {
  background: #f5f3ff;
  color: #7c3aed;
}

.toolbar {
  margin-bottom: 24px;
}

.search-input {
  width: 320px;
  height: 48px;

  border: 1px solid #dbe2ea;
  border-radius: 14px;

  padding: 0 16px;

  font-size: 14px;

  outline: none;
}

.search-input:focus {
  border-color: #4f46e5;

  box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.08);
}

.table-card {
  background: white;

  border-radius: 24px;

  overflow: hidden;

  border: 1px solid #eef2ff;
}

table {
  width: 100%;

  border-collapse: collapse;
}

thead {
  background: #f8fafc;
}

th {
  padding: 18px 22px;

  text-align: left;

  font-size: 13px;
  font-weight: 700;

  color: #64748b;

  text-transform: uppercase;
}

td {
  padding: 22px;

  border-top: 1px solid #f1f5f9;

  font-size: 14px;

  color: #0f172a;
}

.status-badge {
  padding: 8px 14px;

  border-radius: 999px;

  font-size: 12px;
  font-weight: 600;
}

.status-badge.active {
  background: #dcfce7;
  color: #15803d;
}

.status-badge.inactive {
  background: #fee2e2;
  color: #dc2626;
}

.loading-state {
  padding: 80px;

  text-align: center;

  color: #64748b;
}

.empty-table {
  text-align: center;

  padding: 50px;

  color: #94a3b8;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.add-btn {
  height: 42px;
  padding: 0 18px;

  border: none;
  border-radius: 12px;

  background: #4f46e5;
  color: white;

  font-size: 14px;
  font-weight: 600;

  cursor: pointer;

  transition: 0.2s;
}

.add-btn:hover {
  background: #4338ca;
}

.modal-overlay {
  position: fixed;
  inset: 0;

  background: rgba(15, 23, 42, 0.45);

  display: flex;
  align-items: center;
  justify-content: center;

  z-index: 999;
}

.modal-box {
  background: #ffffff;
  border-radius: 18px;

  width: 100%;
  max-width: 460px;

  overflow: hidden;

  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);

  animation: scaleIn 0.2s ease;
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

.modal-footer {
  padding: 16px 24px 20px;

  border-top: 1px solid #f3f4f6;

  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-cancel {
  padding: 9px 20px;

  background: transparent;

  border: 1.5px solid #e5e7eb;
  border-radius: 9px;

  color: #6b7280;

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

.error-box {
  margin-top: 4px;

  font-size: 12px;
  font-weight: 500;

  color: #dc2626;

  line-height: 1.4;
}

.success-box {
  margin-bottom: 20px;

  padding: 14px 18px;

  border-radius: 14px;

  background: #dcfce7;
  color: #15803d;

  border: 1px solid #bbf7d0;

  font-size: 14px;
  font-weight: 500;
}

.error-global {
  margin-bottom: 20px;

  padding: 14px 18px;

  border-radius: 14px;

  background: #fee2e2;
  color: #b91c1c;

  border: 1px solid #fecaca;

  font-size: 14px;
  font-weight: 500;
}
</style>
