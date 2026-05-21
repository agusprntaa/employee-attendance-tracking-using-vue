<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";

import { getProfileAPI, uploadProfilePhotoAPI } from "@/services/auth";

const router = useRouter();

const BASE_URL = import.meta.env.VITE_API_URL;

const loading = ref(false);
const uploading = ref(false);

const error = ref("");
const success = ref("");

const imageError = ref(false);

const photoPreview = ref("");
const photoFile = ref(null);

const user = ref({
  name: "",
  email: "",
  phone: "",
  address: "",

  username: "",
  division_name: "",
  branch_name: "",

  photo_url: "",
});

onMounted(async () => {
  try {
    const res = await getProfileAPI();

    console.log("PROFILE:", res.data);

    const data = res.data.data;

    user.value = {
      ...user.value,
      ...data,
    };

    if (data.photo_url) {
      photoPreview.value = getPhotoUrl(data.photo_url);
    }
  } catch (err) {
    console.log(err);

    error.value = "Gagal mengambil data profile";
  }
});

//bukan function endpoint ngrok dri be
// function getPhotoUrl(path) {
//   if (!path) return "";

//   // reset error kalau url berubah
//   imageError.value = false;

//   // kalau backend sudah full url
//   if (path.startsWith("http")) {
//     return path;
//   }

//   // hapus slash depan
//   const cleanPath = path.replace(/^\/+/, "");

//   // ubah backslash windows jadi slash normal
//   return `${BASE_URL}/${cleanPath.replace(/\\/g, "/")}`;
// }

function getPhotoUrl(path) {
  if (!path) return "";

  imageError.value = false;

  // kalau backend sudah full url
  if (path.startsWith("http")) {
    return path;
  }

  // ambil nama file saja
  const filename = path
    .replace(/\\/g, "/")
    .split("/")
    .pop();

  return `${BASE_URL}/employee/profile/photo/view/${filename}`;
}

function handleImageLoaded() {
  console.log("%cIMAGE SUCCESS", "color: green; font-weight: bold");

  console.log("IMAGE URL:", photoPreview.value);
}

function handleImageError(event) {
  imageError.value = true;

  console.log("%cIMAGE FAILED", "color: red; font-weight: bold");

  console.log("FAILED URL:", event.target.currentSrc);

  if (event.target.currentSrc.includes("ngrok")) {
    console.log(
      "%cCHECK BACKEND / NGROK STATIC FILE",
      "color: orange; font-weight: bold",
    );

    console.log("Kemungkinan static image backend belum public.");
  } else {
    console.log(
      "%cCHECK FRONTEND URL BUILDER",
      "color: orange; font-weight: bold",
    );
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

  photoFile.value = file;

  photoPreview.value = URL.createObjectURL(file);

  try {
    uploading.value = true;

    const formData = new FormData();

    formData.append("photo", file);

    const res = await uploadProfilePhotoAPI(formData);

    console.log("UPLOAD:", res.data);

    user.value.photo_url = res.data.data.photo_url;

    photoPreview.value = getPhotoUrl(res.data.data.photo_url);

    success.value = "Foto profile berhasil diupload";
  } catch (err) {
    console.log(err);

    error.value = "Upload foto gagal";
  } finally {
    uploading.value = false;
  }
}

function removePhoto() {
  photoPreview.value = "";
  photoFile.value = null;
}

async function submitProfile() {
  if (loading.value) return;

  if (
    !user.value.name.trim() ||
    !user.value.email.trim() ||
    !user.value.phone.trim() ||
    !user.value.address.trim()
  ) {
    error.value = "Semua field wajib diisi";

    return;
  }

  loading.value = true;

  error.value = "";
  success.value = "";

  try {
    console.log("PROFILE UPDATE:", {
      name: user.value.name,
      email: user.value.email,
      phone: user.value.phone,
      address: user.value.address,
    });

    // CONNECT API UPDATE PROFILE DISINI

    await new Promise((resolve) => setTimeout(resolve, 1000));

    localStorage.setItem("profile_completed", "true");

    success.value = "Profile berhasil diperbarui";

    setTimeout(() => {
      router.push("/employee/dashboard");
    }, 1200);
  } catch (err) {
    console.log(err);

    error.value = "Gagal menyimpan profile";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="wrapper">
    <div class="content">
      <div class="card">
        <div class="header">
          <h1>Lengkapi Profil</h1>

          <p>Lengkapi biodata anda sebelum menggunakan sistem absensi.</p>
        </div>

        <!-- PHOTO -->
        <div class="photo-section">
          <div class="avatar">
            <img
              v-if="photoPreview && !imageError"
              :src="photoPreview"
              alt="profile"
              @load="handleImageLoaded"
              @error="handleImageError"
            />

            <span v-else> {{ getInitials(user.name) || "?" }} </span>
          </div>

          <div class="photo-actions">
            <label class="upload-btn">
              {{ uploading ? "Uploading..." : "Upload Foto" }}

              <input
                type="file"
                hidden
                accept=".jpg,.jpeg,.png,.webp"
                @change="handlePhoto"
              />
            </label>

            <button v-if="photoPreview" class="remove-btn" @click="removePhoto">
              Hapus
            </button>
          </div>
        </div>

        <!-- FORM -->
        <div class="form-grid">
          <div class="field">
            <label>Nama Lengkap</label>

            <input
              v-model="user.name"
              type="text"
              placeholder="Masukkan nama lengkap"
            />
          </div>

          <div class="field">
            <label>Email</label>

            <input
              v-model="user.email"
              type="email"
              placeholder="Masukkan email"
            />
          </div>

          <div class="field">
            <label>Nomor Telepon</label>

            <input
              v-model="user.phone"
              type="text"
              placeholder="Masukkan nomor telepon"
            />
          </div>

          <div class="field full">
            <label>Alamat</label>

            <textarea
              v-model="user.address"
              placeholder="Masukkan alamat lengkap"
            ></textarea>
          </div>
        </div>

        <!-- READONLY -->
        <div class="readonly-box">
          <h3>Informasi Kantor</h3>

          <div class="readonly-grid">
            <div class="readonly-item">
              <span>Username</span>
              <p>{{ user.username }}</p>
            </div>

            <div class="readonly-item">
              <span>Divisi</span>
              <p>
                {{ user.division_name }}
              </p>
            </div>

            <div class="readonly-item">
              <span>Cabang</span>
              <p>
                {{ user.branch_name }}
              </p>
            </div>
          </div>
        </div>

        <p v-if="success" class="success">
          {{ success }}
        </p>

        <p v-if="error" class="error">
          {{ error }}
        </p>

        <button class="submit-btn" @click="submitProfile" :disabled="loading">
          {{ loading ? "Menyimpan..." : "Simpan Profil" }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wrapper {
  min-height: 100vh;
  background: #f5f7fb;

  padding: 30px 20px;
}

.content {
  width: 100%;
  max-width: 950px;

  margin: 0 auto;
}

.card {
  background: white;

  border-radius: 32px;

  padding: 32px;

  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
}

.header h1 {
  font-size: 32px;

  color: #111827;

  margin-bottom: 10px;
}

.header p {
  color: #6b7280;

  font-size: 14px;

  margin-bottom: 32px;
}

.photo-section {
  display: flex;
  align-items: center;

  gap: 24px;

  margin-bottom: 32px;
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

.photo-actions {
  display: flex;
  flex-direction: column;

  gap: 12px;
}

.upload-btn {
  background: linear-gradient(135deg, #6366f1, #4f46e5);

  color: white;

  padding: 12px 18px;

  border-radius: 14px;

  cursor: pointer;

  font-size: 13px;
  font-weight: 700;

  width: fit-content;

  transition: all 0.25s ease;

  box-shadow: 0 6px 18px rgba(79, 70, 229, 0.25);
}

.upload-btn:hover {
  transform: translateY(-2px);

  box-shadow: 0 10px 26px rgba(79, 70, 229, 0.35);
}

.remove-btn {
  border: none;

  background: #fee2e2;
  color: #dc2626;

  padding: 12px 18px;

  border-radius: 14px;

  cursor: pointer;

  font-size: 14px;
  font-weight: 600;
}

.form-grid {
  display: grid;

  grid-template-columns: 1fr 1fr;

  gap: 20px;
}

.field {
  display: flex;
  flex-direction: column;
}

.field.full {
  grid-column: span 2;
}

.field label {
  margin-bottom: 8px;

  font-size: 13px;
  font-weight: 600;

  color: #374151;
}

.field input,
.field textarea {
  width: 100%;

  border: none;

  background: #f3f4f6;

  border-radius: 16px;

  padding: 15px 16px;

  outline: none;

  font-size: 14px;
}

.field textarea {
  resize: none;

  min-height: 120px;
}

.readonly-box {
  margin-top: 32px;

  padding: 24px;

  border-radius: 24px;

  background: #f9fafb;
}

.readonly-box h3 {
  margin-bottom: 20px;

  font-size: 18px;

  color: #111827;
}

.readonly-grid {
  display: grid;

  grid-template-columns: repeat(3, 1fr);

  gap: 18px;
}

.readonly-item span {
  font-size: 12px;

  color: #6b7280;
}

.readonly-item p {
  margin-top: 6px;

  font-size: 15px;
  font-weight: 600;

  color: #111827;
}

.success {
  margin-top: 20px;

  color: #16a34a;

  font-size: 13px;
}

.error {
  margin-top: 20px;

  color: #dc2626;

  font-size: 13px;
}

.submit-btn {
  width: 100%;

  margin-top: 28px;

  border: none;

  border-radius: 18px;

  padding: 16px;

  background: linear-gradient(135deg, #6366f1, #4f46e5);

  color: white;

  font-size: 15px;
  font-weight: 700;

  cursor: pointer;

  transition: all 0.25s ease;

  box-shadow: 0 6px 18px rgba(79, 70, 229, 0.25);
}

.submit-btn:hover {
  transform: translateY(-2px);

  box-shadow: 0 10px 26px rgba(79, 70, 229, 0.35);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.card {
  transition: all 0.25s ease;
}

.card:hover {
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .card {
    padding: 24px;
  }

  .photo-section {
    flex-direction: column;

    text-align: center;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .field.full {
    grid-column: span 1;
  }

  .readonly-grid {
    grid-template-columns: 1fr;
  }

  .header h1 {
    font-size: 26px;
  }
}
</style>
