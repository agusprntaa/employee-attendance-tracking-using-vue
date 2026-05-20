<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";

import { getProfileAPI, uploadProfilePhotoAPI } from "@/services/auth";

const router = useRouter();

const BASE_URL = import.meta.env.VITE_API_URL;

const loading = ref(false);
const uploading = ref(false);

const success = ref("");
const error = ref("");

const imageError = ref(false);

const photoPreview = ref("");
const photoFile = ref(null);

const user = ref({
  name: "",
  division_name: "",
  branch_name: "",
  email: "",
  address: "",
  phone: "",
  status: "",
  photo_url: "",
});

onMounted(async () => {
  try {
    const res = await getProfileAPI();

    user.value = res.data.data;

    if (user.value.photo_url) {
      photoPreview.value = getPhotoUrl(user.value.photo_url);
    }
  } catch (err) {
    console.log(err);

    error.value = "Gagal mengambil profile";
  }
});

function getPhotoUrl(path) {
  if (!path) return "";

  // reset error kalau url berubah
  imageError.value = false;

  // kalau backend sudah full url
  if (path.startsWith("http")) {
    return path;
  }

  // hapus slash depan
  const cleanPath = path.replace(/^\/+/, "");

  // ubah backslash windows jadi slash normal
  return `${BASE_URL}/${cleanPath.replace(/\\/g, "/")}`;
}

function handleImageLoaded() {
  console.log("%cIMAGE SUCCESS", "color: green; font-weight: bold");

  console.log("IMAGE URL:", photoPreview.value);
}

function handleImageError(event) {
  imageError.value = true;

  console.log("%cIMAGE FAILED", "color: red; font-weight: bold");

  console.log("FAILED URL:", event.target.currentSrc);

  // cek apakah kemungkinan ngrok
  if (event.target.currentSrc.includes("ngrok")) {
    console.log(
      "%cCHECK BACKEND / NGROK STATIC FILE",
      "color: orange; font-weight: bold",
    );

    console.log(
      "Kemungkinan static image belum bisa diakses publik atau terkena ngrok warning page.",
    );
  } else {
    console.log(
      "%cCHECK FRONTEND URL BUILDER",
      "color: orange; font-weight: bold",
    );

    console.log("Kemungkinan URL image dari frontend salah.");
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

  photoPreview.value = URL.createObjectURL(file);

  try {
    uploading.value = true;

    const formData = new FormData();

    formData.append("photo", file);

    // INI PENTING
    const res = await uploadProfilePhotoAPI(formData);

    console.log("UPLOAD RESPONSE:", res.data);

    console.log("FINAL URL:", getPhotoUrl(res.data.data.photo_url));

    user.value.photo_url = res.data.data.photo_url;

    photoPreview.value = getPhotoUrl(res.data.data.photo_url);

    success.value = "Foto profile berhasil diperbarui";
  } catch (err) {
    console.log("UPLOAD ERROR:", err);

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

    console.log("DATA UPDATE:", {
      name: user.value.name,
      email: user.value.email,
      address: user.value.address,
      phone: user.value.phone,
    });

    // CONNECT API UPDATE PROFILE DISINI

    await new Promise((resolve) => setTimeout(resolve, 1000));

    success.value = "Biodata berhasil diperbarui";
  } catch (err) {
    console.log(err);

    error.value = "Gagal menyimpan perubahan";
  } finally {
    loading.value = false;
  }
}

function goBack() {
  router.back();
}
</script>

<template>
  <div class="wrapper">
    <div class="header">
      <img src="/goBack.png" class="back" @click="goBack" />
    </div>

    <div class="content">
      <div class="profile-card">
        <!-- LEFT -->
        <div class="avatar-section">
          <div class="avatar">
            <img
              v-if="photoPreview && !imageError"
              :src="photoPreview"
              alt="profile"
              @load="handleImageLoaded"
              @error="handleImageError"
            />

            <span v-else>
              {{ getInitials(user.name) }}
            </span>
          </div>

          <label class="upload-btn">
            {{ uploading ? "Uploading..." : "Upload Foto" }}

            <input
              type="file"
              hidden
              accept=".jpg,.jpeg,.png,.webp"
              @change="handlePhoto"
            />
          </label>

          <h2>{{ user.name }}</h2>

          <p>{{ user.division_name }}</p>

          <span class="status active"> Aktif </span>
        </div>

        <!-- RIGHT -->
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
</template>

<style scoped>
.wrapper {
  min-height: 100vh;
  background: #f5f7fb;
}

.header {
  height: 60px;
  background: #4f46e5;

  display: flex;
  align-items: center;

  padding: 0 20px;
}

.back {
  width: 22px;
  cursor: pointer;
}

.content {
  width: 100%;
  max-width: 1100px;

  margin: 0 auto;

  padding: 30px 20px;
}

.profile-card {
  background: white;

  border-radius: 28px;

  padding: 32px;

  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);

  display: grid;
  grid-template-columns: 320px 1fr;

  gap: 32px;
}

.avatar-section {
  border-right: 1px solid #e5e7eb;

  padding-right: 32px;

  display: flex;
  flex-direction: column;
  align-items: center;
}

.avatar {
  width: 140px;
  height: 140px;

  border-radius: 50%;

  overflow: hidden;

  background: linear-gradient(135deg, #6366f1, #4f46e5);

  display: flex;
  align-items: center;
  justify-content: center;

  box-shadow: 0 12px 30px rgba(79, 70, 229, 0.2);
}

.avatar img {
  width: 100%;
  height: 100%;

  object-fit: cover;
}

.avatar span {
  color: white;

  font-size: 36px;
  font-weight: 700;
}

.upload-btn {
  margin-top: 18px;

  background: #eef2ff;
  color: #4338ca;

  padding: 10px 18px;

  border-radius: 999px;

  font-size: 13px;
  font-weight: 600;

  cursor: pointer;

  transition: 0.2s;
}

.upload-btn:hover {
  background: #4f46e5;
  color: white;
}

.avatar-section h2 {
  margin-top: 20px;

  font-size: 24px;
  font-weight: 700;

  color: #111827;
}

.avatar-section p {
  margin-top: 6px;

  font-size: 14px;

  color: #6b7280;
}

.status {
  margin-top: 18px;

  padding: 8px 18px;

  border-radius: 999px;

  font-size: 12px;
  font-weight: 700;
}

.status.active {
  background: #dcfce7;
  color: #166534;
}

.info-section {
  display: grid;

  grid-template-columns: 1fr 1fr;

  gap: 22px;
}

.field {
  display: flex;
  flex-direction: column;
}

.field.full {
  grid-column: span 2;
}

.field label {
  font-size: 13px;
  font-weight: 600;

  color: #6b7280;

  margin-bottom: 8px;
}

.field input,
.field textarea {
  width: 100%;

  border: none;

  background: #f3f4f6;

  border-radius: 16px;

  padding: 15px 18px;

  font-size: 14px;

  color: #111827;

  outline: none;
}

.field input:disabled {
  background: #e5e7eb;
  color: #6b7280;
}

.field textarea {
  resize: none;
  min-height: 120px;
}

.success {
  margin-top: 18px;

  color: #16a34a;

  font-size: 14px;
  font-weight: 500;
}

.error {
  margin-top: 18px;

  color: #dc2626;

  font-size: 14px;
  font-weight: 500;
}

.save-btn {
  width: 100%;

  margin-top: 20px;

  border: none;

  background: #4f46e5;
  color: white;

  padding: 16px;

  border-radius: 18px;

  font-size: 15px;
  font-weight: 600;

  cursor: pointer;

  transition: 0.2s;
}

.save-btn:hover {
  background: #4338ca;
}

.save-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

@media (max-width: 900px) {
  .profile-card {
    grid-template-columns: 1fr;
  }

  .avatar-section {
    border-right: none;

    border-bottom: 1px solid #e5e7eb;

    padding-right: 0;
    padding-bottom: 24px;
  }

  .info-section {
    grid-template-columns: 1fr;
  }

  .field.full {
    grid-column: span 1;
  }
}

@media (max-width: 640px) {
  .content {
    padding: 20px 16px;
  }

  .profile-card {
    padding: 22px;
    border-radius: 24px;
  }

  .avatar {
    width: 110px;
    height: 110px;
  }

  .avatar-section h2 {
    font-size: 20px;
  }
}
</style>
