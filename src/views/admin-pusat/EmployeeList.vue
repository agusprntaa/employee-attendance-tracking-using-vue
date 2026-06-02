<script setup>
import { ref, computed, onMounted, watch } from "vue";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useRouter } from "vue-router";
import { getAllEmployees } from "@/services/adminPusat";
import adminPusatSidebar from "@/components/AdminPusatSidebar.vue";

const router = useRouter();

const search = ref("");
const status = ref("");

const currentPage = ref(1);
const itemsPerPage = 10;

const employees = ref([]);

const loading = ref(false);

const errorMessage = ref("");
const successMessage = ref("");

const filteredEmployees = computed(() => {
  return employees.value.filter((emp) => {
    const matchSearch =
      emp.name.toLowerCase().includes(search.value.toLowerCase()) ||
      String(emp.id).includes(search.value);
    const matchStatus = !status.value || emp.status === status.value;

    return matchSearch && matchStatus;
  });
});

const totalPages = computed(() => {
  return Math.ceil(filteredEmployees.value.length / itemsPerPage);
});

const paginatedEmployees = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;

  return filteredEmployees.value.slice(start, start + itemsPerPage);
});

function formatDate(date) {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

async function fetchEmployees() {
  loading.value = true;

  try {
    const res = await getAllEmployees({
      limit: 999,
    });

    console.log("EMPLOYEES:", res.data);

    employees.value = res.data.data.data.map((emp) => ({
      id: emp.employee_id,

      name: emp.full_name,

      position: emp.position || "-",

      branch: emp.branch || "-",

      status: emp.status?.toLowerCase() === "active" ? "aktif" : "nonaktif",

      created_at: emp.created_date,
    }));

    console.log("ADMIN PUSAT EMP:", res.data.data.data);
  } catch (err) {
    console.error("EMPLOYEE ERROR:", err);

    console.log("DETAIL ERROR:", err.response?.data);

    errorMessage.value =
      err.response?.data?.message ||
      "Gagal mengambil data employee, cek backend";
  } finally {
    loading.value = false;
  }
}

function exportExcel() {
  try {
    const data = filteredEmployees.value.map((emp) => ({
      ID: emp.id,
      Nama: emp.name,
      Jabatan: emp.position,
      Cabang: emp.branch,
      Status: emp.status,
      Dibuat: formatDate(emp.created_at),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "Employees");

    XLSX.writeFile(wb, "employees.xlsx");

    successMessage.value = "Excel berhasil di-export";
    errorMessage.value = "";
  } catch (err) {
    console.error("EXPORT EXCEL ERROR:", err);

    errorMessage.value = "Gagal export Excel, cek data atau library";
  }
}
function exportPDF() {
  try {
    const doc = new jsPDF();

    const rows = filteredEmployees.value.map((emp) => [
      emp.id,
      emp.name,
      emp.position,
      emp.branch,
      emp.status,
      formatDate(emp.created_at),
    ]);

    autoTable(doc, {
      head: [["ID", "Nama", "Jabatan", "Cabang", "Status", "Dibuat"]],
      body: rows,
    });

    doc.save("employees.pdf");

    successMessage.value = "PDF berhasil di-export";
    errorMessage.value = "";
  } catch (err) {
    console.error("EXPORT PDF ERROR:", err);

    errorMessage.value = "Gagal export PDF, cek data atau library";
  }
}

onMounted(() => {
  fetchEmployees();
});

watch([search, status], () => {
  currentPage.value = 1;
});
</script>

<template>
  <div class="page">
    <adminPusatSidebar />
    <div class="content">
      <div class="header">
        <div>
          <h1>Daftar Karyawan</h1>
          <p>Kelola dan lihat seluruh data karyawan</p>
        </div>

        <button
          class="close-btn"
          @click="router.push('/admin-pusat/dashboard')"
        >
          ×
        </button>
      </div>

      <div v-if="errorMessage" class="error-box">
        {{ errorMessage }}
      </div>

      <div v-if="successMessage" class="success-box">
        {{ successMessage }}
      </div>

      <div class="table-card">
        <div class="toolbar">
          <input v-model="search" type="text" placeholder="Cari karyawan..." />

          <select v-model="status">
            <option value="">Semua Status</option>
            <option value="aktif">Aktif</option>
            <option value="nonaktif">Nonaktif</option>
          </select>
          <div class="export">
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
          </div>
        </div>

        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID Karyawan</th>
                <th>Nama Lengkap</th>
                <th>Posisi</th>
                <th>Cabang</th>
                <th>Status</th>
                <th>Tanggal Dibuat</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="emp in paginatedEmployees" :key="emp.id">
                <td>{{ emp.id }}</td>
                <td>{{ emp.name }}</td>
                <td>{{ emp.position }}</td>
                <td>{{ emp.branch }}</td>

                <td>
                  <span class="status" :class="emp.status.toLowerCase()">
                    {{ emp.status }}
                  </span>
                </td>

                <td>
                  {{ formatDate(emp.created_at) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="footer">
          <p>
            Menampilkan
            {{ (currentPage - 1) * itemsPerPage + 1 }}-{{
              Math.min(currentPage * itemsPerPage, filteredEmployees.length)
            }}
            dari
            {{ filteredEmployees.length }}
            data
          </p>

          <div v-if="totalPages > 1" class="pagination">
            <button
              class="nav-btn"
              :disabled="currentPage === 1"
              @click="currentPage--"
            >
              ‹
            </button>

            <button
              v-for="page in totalPages"
              :key="page"
              class="page-number"
              :class="{
                active: currentPage === page,
              }"
              @click="currentPage = page"
            >
              {{ page }}
            </button>

            <button
              class="nav-btn"
              :disabled="currentPage === totalPages"
              @click="currentPage++"
            >
              ›
            </button>
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

.page {
  min-height: 100vh;
  background: #f0f2ff;
  font-family: "Segoe UI", sans-serif;

  display: flex;
}

.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;

  margin-bottom: 22px;
}

.header h1 {
  font-size: 24px;
  font-weight: 700;
  color: #1e1b4b;
  letter-spacing: -0.3px;
}

.header p {
  font-size: 13px;
  color: #6b7280;
  margin-top: 3px;
  font-weight: 400;
}

.close-btn {
  width: 40px;
  height: 40px;

  border: 1px solid #e8e8f0;
  background: white;

  border-radius: 12px;

  font-size: 22px;
  color: #6b7280;

  cursor: pointer;

  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #f5f3ff;
  color: #4f46e5;
}

.table-card {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e8e8f0;
  overflow-x: hidden;
  overflow: visible;
}

.toolbar {
  display: flex;
  gap: 10px;
  padding: 16px 22px;
  align-items: center;
  border-bottom: 1px solid #f3f4f6;
}

.toolbar input {
  flex: 1;
  min-width: 320px;
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
}

.export-actions {
  display: flex;
  gap: 8px;
}

.export {
  display: flex;
  align-items: center;
}

.btn-export {
  padding: 8px 14px;
  border-radius: 10px;
  border: 1.5px solid #4f46e5;
  background: transparent;
  color: #4f46e5;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  letter-spacing: 0.2px;
}

.btn-export:hover {
  background: #4f46e5;
  color: white;
  box-shadow: 0 4px 14px rgba(79, 70, 229, 0.25);
}

.btn-export:active {
  transform: scale(0.96);
}

.btn-export.excel {
  border-color: #16a34a;
  color: #16a34a;
}

.btn-export.excel:hover {
  background: #16a34a;
  color: white;
  box-shadow: 0 4px 14px rgba(22, 163, 74, 0.3);
}

.btn-export.pdf {
  border-color: #dc2626;
  color: #dc2626;
}

.btn-export.pdf:hover {
  background: #dc2626;
  color: white;
  box-shadow: 0 4px 14px rgba(220, 38, 38, 0.3);
}

.table-wrapper {
  overflow-x: auto;
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

  font-size: 12px;
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

.status {
  display: inline-flex;
  align-items: center;

  padding: 4px 10px;

  border-radius: 20px;

  font-size: 11px;
  font-weight: 600;
}

.status.aktif {
  background: #dcfce7;
  color: #15803d;
}

.status.nonaktif {
  background: #fee2e2;
  color: #b91c1c;
}

.footer {
  display: flex;
  justify-content: space-between;
  align-items: center;

  padding: 18px 22px 20px;

  border-top: 1px solid #f3f4f6;
}

.footer p {
  font-size: 13px;
  color: #6b7280;
}

.pagination {
  display: flex;
  align-items: center;
  gap: 10px;
}

.page-number,
.nav-btn {
  width: 38px;
  height: 38px;

  border: none;
  background: transparent;

  border-radius: 12px;

  font-weight: 600;

  cursor: pointer;

  transition: all 0.2s ease;
}

.page-number.active {
  background: #0f172a;
  color: white;
}

.page-number:hover,
.nav-btn:hover {
  background: #eef2ff;
}

.nav-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.export-actions {
  display: flex;
  gap: 10px;
}

.btn-export {
  position: relative;

  padding: 8px 14px;
  border-radius: 10px;
  border: 1.5px solid #4f46e5;

  background: transparent;
  color: #4f46e5;

  font-size: 12px;
  font-weight: 600;

  cursor: pointer;

  transition: all 0.2s ease;
  letter-spacing: 0.2px;
}

.tooltip {
  position: absolute;
  top: -8px;
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

.btn-export:hover .tooltip {
  opacity: 1;
  visibility: visible;
}

.btn-export:hover .tooltip {
  opacity: 1;
  visibility: visible;
}
.content {
  flex: 1;
  padding: 28px 32px;
}

.error-box {
  margin-bottom: 18px;

  padding: 14px 18px;

  border-radius: 14px;

  background: #fee2e2;
  color: #b91c1c;

  border: 1px solid #fecaca;

  font-size: 14px;
  font-weight: 500;
}

.success-box {
  margin-bottom: 18px;

  padding: 14px 18px;

  border-radius: 14px;

  background: #dcfce7;
  color: #15803d;

  border: 1px solid #bbf7d0;

  font-size: 14px;
  font-weight: 500;
}
</style>
