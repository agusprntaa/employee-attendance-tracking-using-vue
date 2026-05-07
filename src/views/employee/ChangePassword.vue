<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import API from "@/services/api";

const router = useRouter();

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
      router.back();
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
      <img src="/goBack.png" class="back" @click="goBack" />
    </div>

    <div class="content">
      <div class="card">
        <h2>UBAH PASSWORD</h2>

        <div class="field">
          <label>Password lama</label>
          <div class="password-wrapper">
            <input
              :type="showOld ? 'text' : 'password'"
              v-model="oldPassword"
            />
            <img
              :src="showOld ? '/eye-hide.png' : '/eye-show.png'"
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
              :src="showNew ? '/eye-hide.png' : '/eye-show.png'"
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
              :src="showConfirm ? '/eye-hide.png' : '/eye-show.png'"
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
  display: flex;
  justify-content: center;
  padding: 40px 20px;
}

.card {
  width: 100%;
  max-width: 360px;
  background: white;
  padding: 28px 22px;
  border-radius: 22px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08);
}

h2 {
  text-align: center;
  margin-bottom: 24px;
  font-weight: 700;
}

.field {
  margin-bottom: 16px;
}

label {
  font-size: 13px;
  font-weight: 500;
}

.password-wrapper {
  position: relative;
}

.password-wrapper input {
  width: 100%;
  padding: 14px;
  padding-right: 42px;
  border-radius: 14px;
  border: none;
  margin-top: 6px;
  background: #eef2ff;
  outline: none;
}

.toggle {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  cursor: pointer;
  opacity: 0.7;
}

.toggle:hover {
  opacity: 1;
}

.btn {
  width: 100%;
  padding: 14px;
  border-radius: 16px;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: white;
  border: none;
  margin-top: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: 0 6px 18px rgba(79, 70, 229, 0.25);
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(79, 70, 229, 0.35);
}

.btn:active {
  transform: scale(0.97);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error {
  color: #dc2626;
  font-size: 12px;
  margin-top: 8px;
  text-align: center;
}

.toast {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  background: #10b981;
  color: white;
  padding: 14px 22px;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translate(-50%, 20px);
    opacity: 0;
  }
  to {
    transform: translate(-50%, 0);
    opacity: 1;
  }
}
</style>
