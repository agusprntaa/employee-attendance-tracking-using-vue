<script setup>
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import API from "@/services/api";
import { getOnboardingStatusAPI } from "@/services/employee";

const router = useRouter();
const route = useRoute();

const oldPassword = ref("");
const newPassword = ref("");
const confirmPassword = ref("");

const error = ref("");
const loading = ref(false);

// toggle password
const showOld = ref(false);
const showNew = ref(false);
const showConfirm = ref(false);

// toast
const successMessage = ref("");
const showToast = ref(false);
const isForced = route.query.forced === "true";

async function handleSubmit() {
  if (loading.value) return;

  const oldPass = oldPassword.value.trim();
  const newPass = newPassword.value.trim();
  const confirmPass = confirmPassword.value.trim();

  if (!oldPass || !newPass || !confirmPass) {
    error.value = "Semua field wajib diisi";
    return;
  }

  if (newPass.length < 6) {
    error.value = "Password minimal 6 karakter";
    return;
  }

  if (newPass !== confirmPass) {
    error.value = "Konfirmasi password tidak cocok";
    return;
  }

  error.value = "";
  loading.value = true;

  try {
    await API.patch("/employee/change-password", {
      old_password: oldPass,
      new_password: newPass,
    });

    successMessage.value = "Password berhasil diubah";
    showToast.value = true;

    const user = JSON.parse(localStorage.getItem("user"));
    let employeeDestination = "/employee/dashboard";

    if (user.role === "karyawan") {
      const onboardingResponse = await getOnboardingStatusAPI();
      const onboardingStatus = onboardingResponse.data.data;
      localStorage.setItem("onboarding_status", JSON.stringify(onboardingStatus));
      employeeDestination = onboardingStatus.face_registered
        ? "/employee/dashboard"
        : "/employee/register-face";
    }

    setTimeout(() => {
      showToast.value = false;

      // clear force change password
      localStorage.setItem("must_change_password", "false");

      // redirect sesuai role
      if (user.role === "admin" && user.tipe === "pusat") {
        router.push("/admin-pusat/dashboard");

        return;
      }

      if (user.role === "admin" && user.tipe === "cabang") {
        router.push("/admin-cabang/dashboard");

        return;
      }

      //direct ke update biodata
      if (user.role === "karyawan") {
        router.push(employeeDestination);
        return;
      }
    }, 1500);
  } catch (err) {
    error.value = err.response?.data?.message || "Gagal mengubah password";
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
      <button v-if="!isForced" type="button" class="back-btn" @click="goBack">
        <img src="/goBack.png" alt="" />
        <span>Kembali</span>
      </button>
    </div>

    <div class="content">
      <div class="card">
        <div class="card-header">
          <!-- <p>Keamanan Akun</p> -->
          <h1>Ubah Password</h1>
          <span>Gunakan password yang kuat untuk menjaga keamanan akun.</span>
        </div>

        <p v-if="isForced" class="forced-info">
          Demi keamanan akun, Anda wajib mengganti password sebelum menggunakan
          sistem.
        </p>

        <div class="field">
          <label>Password lama</label>
          <div class="password-wrapper">
            <input
              :type="showOld ? 'text' : 'password'"
              v-model="oldPassword"
            />
            <img
              :src="showOld ? '/eye-show.png' : '/eye-hide.png'"
              class="toggle"
              @click="showOld = !showOld"
            />
          </div>
        </div>

        <div class="field">
          <label>Password baru</label>
          <div class="password-wrapper">
            <input
              :type="showNew ? 'text' : 'password'"
              v-model="newPassword"
            />
            <img
              :src="showNew ? '/eye-show.png' : '/eye-hide.png'"
              class="toggle"
              @click="showNew = !showNew"
            />
          </div>
        </div>

        <div class="field">
          <label>Konfirmasi password</label>
          <div class="password-wrapper">
            <input
              :type="showConfirm ? 'text' : 'password'"
              v-model="confirmPassword"
            />
            <img
              :src="showConfirm ? '/eye-show.png' : '/eye-hide.png'"
              class="toggle"
              @click="showConfirm = !showConfirm"
            />
          </div>
        </div>

        <p v-if="error" class="error">{{ error }}</p>

        <button class="btn" @click="handleSubmit" :disabled="loading">
          {{ loading ? "Menyimpan..." : "Ubah password" }}
        </button>
      </div>
    </div>

    <div v-if="showToast" class="toast">
      {{ successMessage }}
    </div>
  </div>
</template>

<style scoped>
.wrapper {
  min-height: 100vh;
  background:
    radial-gradient(
      circle at top left,
      rgba(37, 99, 235, 0.1),
      transparent 32rem
    ),
    #f8fafc;
  color: #0f172a;
}

.header {
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 480px;
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
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
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

.back-btn:active {
  transform: scale(0.97);
}

.content {
  display: flex;
  justify-content: center;
  padding: 0 16px 40px;
}

.card {
  width: 100%;
  max-width: 420px;
  padding: 28px 22px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(14px);
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.06);
}

.card-header {
  text-align: center;
  margin-bottom: 24px;
}

.card-header p {
  margin: 0 0 6px;
  color: #2563eb;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.card-header h1 {
  margin: 0;
  color: #0f172a;
  font-size: 24px;
  font-weight: 800;
  line-height: 1.2;
}

.card-header span {
  display: block;
  margin-top: 8px;
  color: #64748b;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.5;
}

.forced-info {
  margin-bottom: 22px;
  padding: 14px 16px;
  border-radius: 16px;
  background: #eff6ff;
  border: 1px solid rgba(37, 99, 235, 0.16);
  text-align: center;
  font-size: 12px;
  line-height: 1.7;
  color: #1d4ed8;
  font-weight: 700;
}

.field {
  margin-bottom: 18px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 800;
  color: #475569;
}

.password-wrapper {
  position: relative;
}

.password-wrapper input {
  width: 100%;
  height: 52px;
  padding: 0 48px 0 16px;
  border-radius: 16px;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  color: #0f172a;
  font-size: 14px;
  font-weight: 600;
  outline: none;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;
}

.password-wrapper input:focus {
  border-color: #2563eb;
  background: #ffffff;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
}

.password-wrapper input::placeholder {
  color: #94a3b8;
}

.toggle {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  width: 22px;
  height: 22px;
  cursor: pointer;
  opacity: 0.55;
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.toggle:hover {
  opacity: 1;
}

.toggle:active {
  transform: translateY(-50%) scale(0.92);
}

.btn {
  width: 100%;
  height: 52px;
  border-radius: 16px;
  border: 1px solid transparent;
  margin-top: 14px;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #ffffff;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 12px 26px rgba(37, 99, 235, 0.24);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    opacity 0.2s ease;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 16px 30px rgba(37, 99, 235, 0.28);
}

.btn:active {
  transform: scale(0.98);
}

.btn:disabled {
  opacity: 0.58;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.error {
  margin-top: 10px;
  padding: 12px 14px;
  border: 1px solid #fecaca;
  border-radius: 14px;
  background: #fef2f2;
  color: #dc2626;
  font-size: 13px;
  font-weight: 800;
  text-align: center;
  line-height: 1.5;
}

.toast {
  position: fixed;
  left: 50%;
  bottom: 26px;
  transform: translateX(-50%);
  z-index: 10000;
  background: rgba(15, 23, 42, 0.94);
  color: #ffffff;
  padding: 14px 22px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 800;
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.18);
  animation: slideUp 0.25s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;

    transform: translateX(-50%) translateY(16px);
  }

  to {
    opacity: 1;

    transform: translateX(-50%) translateY(0);
  }
}

@media (min-width: 640px) {
  .header {
    padding: 18px 24px;
  }

  .content {
    padding: 0 24px 48px;
  }
}

@media (max-width: 420px) {
  .back-btn span {
    display: none;
  }
}
</style>
