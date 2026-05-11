<script setup>
import { ref, onMounted } from "vue";
import AdminProfile from "@/components/AdminProfile.vue";

const modalMode = ref("add");

function openAdd() {
  modalMode.value = "add";
  modalError.value = "";

  form.value = {
    id: null,
    username: "",
    password: "",
    role: "karyawan",
    tipe: "cabang",
    position: "",
    division_id: null,
    status: "active",
  };

  showModal.value = true;
}

async function submitModal() {
  if (!form.value.username.trim()) {
    modalError.value = "Username wajib diisi";
    return;
  }

  if (modalMode.value === "add" && !form.value.password.trim()) {
    modalError.value = "Password wajib diisi";
    return;
  }

  modalLoading.value = true;
  modalError.value = "";

  try {
    if (modalMode.value === "add") {
      await addEmployee(form.value);
    } else {
      await updateEmployee(form.value.id, form.value);
    }

    closeModal();
    fetchEmployees();
  } catch (err) {
    modalError.value = err.response?.data?.message || "Gagal";
  } finally {
    modalLoading.value = false;
  }
}
</script>

<template>
  <div class="layout">
    <div class="main">
      <div class="header">
        <div>
          <h2>Global Admin Dashboard</h2>
          <p class="subtitle">Multi-branch attendance monitoring</p>
        </div>
        <AdminProfile :user="user" />
      </div>

      <div class="stats">
        <div class="card" @click="$router.push('/admin-pusat/employees')">
          <h2>1.247</h2>
          <p>Total Employees</p>
        </div>
        <div class="card">
          <h2>1.089</h2>
          <p>Present Today</p>
        </div>
        <div class="card">
          <h2>87.3%</h2>
          <p>Attendance Rate</p>
        </div>
        <div class="card">
          <h2>5</h2>
          <p>Total Branches</p>
        </div>
      </div>

      <div class="panels">
        <div class="panel">
          <div class="panel-header">
            <h3>Attendance per Branch</h3>
            <p>Current attendance vs capacity</p>
          </div>

          <div class="panel-body">
            <img src="/logo.png" />
          </div>
        </div>

        <div class="panel">
          <div class="panel-header">
            <h3>Work Mode Distribution</h3>
            <p>WFO vs WFA breakdown</p>
          </div>

          <div class="panel-body">
            <img src="/logo.png" />
          </div>
        </div>
      </div>

      <button class="btn-add" @click="openAdd">+ Add Admin Cabang</button>

      <div class="panel">
        <div class="panel-header">
          <h3>Branch Performance</h3>
          <p>Detailed attendance metrics by location</p>
        </div>

        <table>
          <thead>
            <tr>
              <th>Branch</th>
              <th>Total Employees</th>
              <th>Present</th>
              <th>Absent</th>
              <th>Rate</th>
              <th>WFO</th>
              <th>WFA</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Jakarta HQ</td>
              <td>320</td>
              <td>285</td>
              <td>35</td>
              <td>89.1%</td>
              <td>180</td>
              <td>105</td>
              <td>excelent</td>
            </tr>
          </tbody>
        </table>
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
  min-height: 100vh;
  background: #f3f4ff;
  font-family: "Segoe UI", sans-serif;
}

.main {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 28px 32px;
}

.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.header h2 {
  font-size: 30px;
  font-weight: 700;
  color: #111827;
  letter-spacing: -0.5px;
}

.subtitle {
  margin-top: 4px;
  font-size: 14px;
  color: #6b7280;
}

.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
}

.card {
  background: #ffffff;
  border: 1px solid #e8e8f0;
  border-radius: 18px;
  padding: 22px;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(79, 70, 229, 0.08);
}

.card h2 {
  font-size: 34px;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 10px;
  letter-spacing: -1px;
}

.card p {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
}

.card:nth-child(1) h2 {
  color: #1e1b4b;
}

.card:nth-child(2) h2 {
  color: #16a34a;
}

.card:nth-child(3) h2 {
  color: #d97706;
}

.card:nth-child(4) h2 {
  color: #4f46e5;
}

.panels {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  align-items: start;
}

.panel {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e8e8f0;
  overflow: hidden;
}

.panel-header {
  padding: 18px 22px;
  border-bottom: 1px solid #f3f4f6;
}

.panel-header h3 {
  font-size: 17px;
  font-weight: 700;
  color: #111827;
}

.panel-header p {
  margin-top: 4px;
  font-size: 13px;
  color: #6b7280;
}

.panel-body {
  min-height: 320px;
  padding: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fcfcff;
}

.panel-body img {
  width: 120px;
  opacity: 0.12;
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

.status {
  display: inline-flex;
  align-items: center;
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
}

.status.excellent {
  background: #dcfce7;
  color: #15803d;
}

.status.good {
  background: #dbeafe;
  color: #2563eb;
}

@media (max-width: 1100px) {
  .stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .panels {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 700px) {
  .main {
    padding: 20px;
  }

  .stats {
    grid-template-columns: 1fr;
  }

  .header {
    flex-direction: column;
    gap: 14px;
  }

  table {
    min-width: 900px;
  }

  .table-panel {
    overflow-x: auto;
  }
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

.card {
  cursor: pointer;
}
</style>
