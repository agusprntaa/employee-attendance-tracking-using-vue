<script setup>
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import API from "@/services/api";

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

    setTimeout(() => {
      showToast.value = false;

      // clear force change password
      localStorage.setItem("must_change_password", "false");

      const user = JSON.parse(localStorage.getItem("user"));

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
        router.push("/employee/biodata?setup=true");

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
      <img v-if="!isForced" src="/goBack.png" class="back" @click="goBack" />
    </div>

    <div class="content">
      <div class="card">
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

  background: linear-gradient(180deg, #eef2ff 0%, #f8fafc 35%, #ffffff 100%);
}

.header {
  height: 64px;

  background: transparent;

  display: flex;
  align-items: center;

  padding: 0 20px;
}

.back {
  width: 42px;
  height: 42px;

  padding: 10px;

  border-radius: 14px;

  background: #4f46e5;

  box-shadow: 0 8px 18px rgba(79, 70, 229, 0.24);

  cursor: pointer;

  object-fit: contain;

  transition:
    transform 0.18s ease,
    background 0.18s ease,
    box-shadow 0.18s ease;
}

.back:hover {
  background: #4338ca;

  box-shadow: 0 12px 24px rgba(79, 70, 229, 0.3);
}

.back:active {
  transform: scale(0.92);
}

.content {
  display: flex;
  justify-content: center;

  padding: 10px 20px 40px;
}

.card {
  width: 100%;
  max-width: 380px;

  background: rgba(255, 255, 255, 0.92);

  backdrop-filter: blur(14px);

  padding: 28px 22px;

  border-radius: 28px;

  border: 1px solid rgba(255, 255, 255, 0.7);

  box-shadow:
    0 10px 40px rgba(79, 70, 229, 0.08),
    0 2px 10px rgba(15, 23, 42, 0.04);
}

h2 {
  text-align: center;

  margin-bottom: 24px;

  font-size: 24px;
  font-weight: 700;

  color: #111827;
}

.forced-info {
  margin-top: -6px;
  margin-bottom: 22px;

  padding: 14px 16px;

  border-radius: 16px;

  background: #eef2ff;

  border: 1px solid #c7d2fe;

  text-align: center;

  font-size: 12px;
  line-height: 1.7;

  color: #4338ca;
}

.field {
  margin-bottom: 18px;
}

label {
  display: block;

  margin-bottom: 8px;

  font-size: 13px;
  font-weight: 600;

  color: #374151;
}

.password-wrapper {
  position: relative;
}

.password-wrapper input {
  width: 100%;

  height: 52px;

  padding: 0 48px 0 16px;

  border-radius: 16px;

  border: 1px solid #e5e7eb;

  background: #ffffff;

  font-size: 14px;

  color: #111827;

  outline: none;

  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;
}

.password-wrapper input:focus {
  border-color: #6366f1;

  background: #ffffff;

  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.12);
}

.password-wrapper input::placeholder {
  color: #9ca3af;
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

  border: none;

  margin-top: 14px;

  background: linear-gradient(135deg, #6366f1, #4f46e5);

  color: white;

  font-size: 14px;
  font-weight: 700;

  cursor: pointer;

  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    opacity 0.2s ease;

  box-shadow: 0 10px 24px rgba(79, 70, 229, 0.22);
}

.btn:hover {
  transform: translateY(-2px);

  box-shadow: 0 14px 32px rgba(79, 70, 229, 0.28);
}

.btn:active {
  transform: scale(0.98);
}

.btn:disabled {
  opacity: 0.5;

  cursor: not-allowed;
}

.error {
  margin-top: 10px;

  font-size: 12px;

  color: #dc2626;

  text-align: center;

  line-height: 1.5;
}

.toast {
  position: fixed;

  left: 50%;
  bottom: 26px;

  transform: translateX(-50%);

  background: #10b981;

  color: white;

  padding: 14px 22px;

  border-radius: 16px;

  font-size: 13px;
  font-weight: 600;

  box-shadow: 0 10px 30px rgba(16, 185, 129, 0.28);

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
</style>
