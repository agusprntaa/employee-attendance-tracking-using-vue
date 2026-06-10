<script setup>
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import API from "@/services/api";

import {
  getProfileAPI,
  uploadProfilePhotoAPI,
  updateProfileAPI,
} from "@/services/auth";

import { LayoutDashboard, CalendarDays, User, LogOut } from "lucide-vue-next";

import { logout } from "@/utils/logout";
import EmployeeBottomNav from "@/components/EmployeeBottomNav.vue";

const router = useRouter();
const route = useRoute();

const isSetup = route.query.setup === "true";

const BASE_URL = import.meta.env.VITE_API_URL;

const loading = ref(false);
const uploading = ref(false);

const success = ref("");
const error = ref("");

const imageError = ref(false);

const photoPreview = ref("");

const user = ref({
  name: "",
  division_name: "",
  branch_name: "",
  email: "",
  address: "",
  phone: "",
  birth_date: "",
  status: "",
  photo_url: "",
});

onMounted(async () => {
  try {
    const res = await getProfileAPI();

    console.log("RAW ERROR:", res.data.data);

    user.value = res.data.data;

    if (user.value.photo_url) {
      await loadPhoto(user.value.photo_url);
    }
  } catch (err) {
    console.log("PROFILE ERROR:", err);
    error.value = "Gagal mengambil profile";
  }
});

async function loadPhoto(path) {
  try {
    imageError.value = false;

    if (!path) {
      photoPreview.value = "";
      return;
    }

    let finalPath = path;

    // kalau backend masih kirim old path:
    // /uploads/photos/xxx.png
    if (path.includes("/uploads/photos/")) {
      const fileName = path.split("/").pop();

      finalPath = `/employee/profile/photo/view/${fileName}`;
    }

    // kalau backend sudah kirim full url
    if (finalPath.startsWith("http")) {
      finalPath = finalPath.replace(BASE_URL, "");
    }

    console.log("RAW PHOTO PATH:", path);

    console.log("FINAL API PATH:", finalPath);

    console.log("FETCH URL:", `${BASE_URL}${finalPath}`);

    const res = await API.get(finalPath, {
      responseType: "blob",
    });

    console.log("%cIMAGE FETCH SUCCESS", "color: green; font-weight: bold");

    photoPreview.value = URL.createObjectURL(res.data);
  } catch (err) {
    imageError.value = true;

    console.log("%cIMAGE FETCH FAILED", "color:red;font-weight:bold");

    console.log(err);

    console.log("CHECK BACKEND RESPONSE photo_url");
  }
}

function getInitials(name) {
  return name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function handleImageError() {
  imageError.value = true;
  console.log("Profile image load failed, displaying initials");
}

async function handlePhoto(event) {
  const file = event.target.files[0];

  if (!file) return;

  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  if (!allowedTypes.includes(file.type)) {
    error.value = "Format harus JPG, PNG, atau WEBP";
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    error.value = "Ukuran maksimal 2MB";
    return;
  }

  error.value = "";

  // preview local instant
  photoPreview.value = URL.createObjectURL(file);

  try {
    uploading.value = true;

    const formData = new FormData();

    formData.append("photo", file);

    const res = await uploadProfilePhotoAPI(formData);

    console.log("UPLOAD RESPONSE:", res.data);

    const latestUser = JSON.parse(localStorage.getItem("user"));

    latestUser.photo_url = res.data.data.photo_url;

    localStorage.setItem("user", JSON.stringify(latestUser));

    user.value.photo_url = res.data.data.photo_url;

    // reload image dari backend
    await loadPhoto(user.value.photo_url);

    success.value = "Foto profile berhasil diperbarui";
  } catch (err) {
    console.log("%cUPLOAD ERROR", "color:red;font-weight:bold");

    console.log(err);

    error.value = err.response?.data?.message || "Upload foto gagal";
  } finally {
    uploading.value = false;
  }
}

async function saveProfile() {
  try {
    loading.value = true;

    success.value = "";
    error.value = "";

    const payload = {
      name: user.value.name,
      email: user.value.email,
      phone: user.value.phone,
      address: user.value.address,
      birth_date: user.value.birth_date,
    };

    console.log("UPDATE PAYLOAD:", payload);

    const res = await updateProfileAPI(payload);

    console.log("UPDATE RESPONSE:", res.data);

    user.value = {
      ...user.value,
      ...res.data.data,
    };

    // update localstorage
    const oldUser = JSON.parse(localStorage.getItem("user"));

    localStorage.setItem(
      "user",
      JSON.stringify({
        ...oldUser,
        ...res.data.data,
      }),
    );

    success.value = "Biodata berhasil diperbarui";
    if (isSetup) {
      setTimeout(() => {
        router.push("/employee/dashboard");
      }, 1200);
    }
  } catch (err) {
    console.log("%cUPDATE PROFILE ERROR", "color:red;font-weight:bold");

    console.log(err);

    error.value = err.response?.data?.message || "Gagal menyimpan perubahan";
  } finally {
    loading.value = false;
  }
}

function goBack() {
  router.back();
}

async function handleLogout() {
  await logout();
}
</script>

<template>
  <div class="wrapper">
    <div class="header">
      <button
        v-if="!isSetup"
        type="button"
        class="back-btn"
        @click="goBack"
      >
        <img src="/goBack.png" alt="" />
        <span>Kembali</span>
      </button>
    </div>

    <div class="content">
      <div v-if="isSetup" class="setup-info">
        <strong>Lengkapi biodata</strong>
        <span>Lengkapi biodata Anda sebelum menggunakan sistem.</span>
      </div>

      <div class="profile-card">
        <div class="avatar-section">
          <div class="avatar">
            <img
              v-if="photoPreview && !imageError"
              :src="photoPreview"
              alt="profile"
              @load="console.log('IMAGE SUCCESS')"
              @error="handleImageError"
            />

            <span v-else>
              {{ getInitials(user.name) }}
            </span>
          </div>

          <label class="upload-btn">
            {{ uploading ? "Mengunggah..." : "Upload Foto" }}

            <input
              type="file"
              hidden
              accept=".jpg,.jpeg,.png,.webp"
              @change="handlePhoto"
            />
          </label>

          <h2>{{ user.name }}</h2>

          <p>{{ user.division_name }}</p>

          <span class="status active">{{ user.status }}</span>
        </div>

        <div class="info-section">
          <div class="field">
            <label>Nama Lengkap</label>

            <input
              type="text"
              v-model="user.name"
              placeholder="Masukkan nama lengkap"
            />
          </div>

          <div class="field">
            <label>Email</label>

            <input
              type="email"
              v-model="user.email"
              placeholder="Masukkan email"
            />
          </div>

          <div class="field">
            <label>Nomor Telepon</label>

            <input
              type="text"
              v-model="user.phone"
              placeholder="Masukkan nomor telepon"
            />
          </div>

          <div class="field">
            <label>Tanggal Lahir</label>

            <input type="date" v-model="user.birth_date" />
          </div>

          <div class="field">
            <label>Divisi</label>

            <input type="text" v-model="user.division_name" disabled />
          </div>

          <div class="field">
            <label>Cabang</label>

            <input type="text" v-model="user.branch_name" disabled />
          </div>

          <div class="field full">
            <label>Alamat</label>

            <textarea
              v-model="user.address"
              placeholder="Masukkan alamat lengkap"
            ></textarea>
          </div>
        </div>
      </div>

      <p v-if="success" class="success">
        {{ success }}
      </p>

      <p v-if="error" class="error">
        {{ error }}
      </p>

      <button class="save-btn" @click="saveProfile" :disabled="loading">
        {{ loading ? "Menyimpan..." : "Simpan Perubahan" }}
      </button>
    </div>
  </div>
  <EmployeeBottomNav />
</template>

<style scoped>
.wrapper {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(37, 99, 235, 0.1), transparent 32rem),
    #f8fafc;
  color: #0f172a;
  padding-bottom: 112px;
}

.header {
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 1120px;
  min-height: 72px;
  margin: 0 auto;
  padding: 16px;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 14px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.92);
  color: #2563eb;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.back-btn img {
  width: 18px;
  height: 18px;
  object-fit: contain;
  filter: invert(37%) sepia(89%) saturate(2342%) hue-rotate(213deg)
    brightness(96%) contrast(92%);
}

.back-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.08);
}

.setup-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 16px;
  padding: 16px;
  border: 1px solid rgba(37, 99, 235, 0.14);
  border-radius: 20px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 14px;
  line-height: 1.5;
}

.setup-info strong {
  color: #0f172a;
  font-size: 15px;
  font-weight: 800;
}

.content {
  width: 100%;
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 16px 40px;
}

.profile-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 24px;
  padding: 20px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.06);
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-bottom: 22px;
  border-bottom: 1px solid #e2e8f0;
}

.avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 128px;
  height: 128px;
  overflow: hidden;
  border: 5px solid #dbeafe;
  border-radius: 28px;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  box-shadow: 0 16px 32px rgba(37, 99, 235, 0.22);
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar span {
  color: #ffffff;
  font-size: 34px;
  font-weight: 800;
}

.upload-btn {
  margin-top: 18px;
  padding: 11px 16px;
  border-radius: 999px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;
}

.upload-btn:hover {
  background: #dbeafe;
  transform: translateY(-1px);
}

.upload-btn:active {
  transform: scale(0.97);
}

.avatar-section h2 {
  margin: 20px 0 0;
  color: #0f172a;
  font-size: 24px;
  font-weight: 800;
  line-height: 1.2;
  text-align: center;
  overflow-wrap: anywhere;
}

.avatar-section p {
  margin: 8px 0 0;
  color: #64748b;
  font-size: 14px;
  font-weight: 700;
  text-align: center;
}

.status {
  margin-top: 16px;
  padding: 8px 13px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  text-transform: capitalize;
}

.status.active {
  background: #dcfce7;
  color: #15803d;
}

.info-section {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
}

.field.full {
  grid-column: 1 / -1;
}

.field label {
  margin-bottom: 8px;
  color: #475569;
  font-size: 13px;
  font-weight: 800;
}

.field input,
.field textarea {
  width: 100%;
  padding: 15px 16px;
  border: 1px solid #cbd5e1;
  border-radius: 16px;
  background: #f8fafc;
  color: #0f172a;
  font-size: 14px;
  font-weight: 600;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.field input:focus,
.field textarea:focus {
  border-color: #2563eb;
  background: #ffffff;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
}

.field input:disabled {
  background: #f1f5f9;
  color: #64748b;
  cursor: not-allowed;
}

.field textarea {
  min-height: 130px;
  resize: vertical;
}

.success,
.error {
  margin-top: 18px;
  padding: 14px 18px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 800;
  line-height: 1.5;
}

.success {
  background: #dcfce7;
  color: #15803d;
}

.error {
  background: #fee2e2;
  color: #dc2626;
}

.save-btn {
  width: 100%;
  min-height: 54px;
  margin-top: 24px;
  border: 1px solid transparent;
  border-radius: 16px;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #ffffff;
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 12px 26px rgba(37, 99, 235, 0.24);
  transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
}

.save-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 16px 30px rgba(37, 99, 235, 0.28);
}

.save-btn:active {
  transform: scale(0.98);
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

@media (min-width: 720px) {
  .header {
    padding: 18px 24px;
  }

  .content {
    padding: 0 24px 48px;
  }

  .info-section {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 960px) {
  .profile-card {
    grid-template-columns: 300px minmax(0, 1fr);
    gap: 28px;
    padding: 28px;
  }

  .avatar-section {
    padding-right: 28px;
    padding-bottom: 0;
    border-right: 1px solid #e2e8f0;
    border-bottom: none;
  }
}

@media (max-width: 420px) {
  .back-btn span {
    display: none;
  }

  .profile-card {
    padding: 18px;
  }

  .avatar {
    width: 112px;
    height: 112px;
  }

  .avatar-section h2 {
    font-size: 22px;
  }

  .field input,
  .field textarea {
    padding: 15px 16px;
  }

  .save-btn {
    height: 54px;
  }
}
</style>
