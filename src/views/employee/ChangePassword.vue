<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { changePasswordAPI } from "@/services/auth";
import { getOnboardingStatusAPI } from "@/services/employee";
import { logout } from "@/utils/logout";
import { getFieldError } from "@/utils/errorMessage";

const router = useRouter();

const currentPassword = ref("");
const newPassword = ref("");
const confirmPassword = ref("");
const showCurrent = ref(false);
const showNew = ref(false);
const showConfirm = ref(false);
const loading = ref(false);
const error = ref("");
const success = ref("");

const mustChangePassword = computed(
  () => localStorage.getItem("must_change_password") === "true",
);

function validateForm() {
  if (!currentPassword.value.trim()) {
    return "Password lama wajib diisi";
  }

  if (!newPassword.value.trim()) {
    return "Password baru wajib diisi";
  }

  if (newPassword.value.length < 6) {
    return "Password baru minimal 6 karakter";
  }

  if (newPassword.value === currentPassword.value) {
    return "Password baru tidak boleh sama dengan password lama";
  }

  if (newPassword.value !== confirmPassword.value) {
    return "Konfirmasi password tidak sesuai";
  }

  return "";
}

async function redirectAfterPasswordChanged() {
  try {
    const response = await getOnboardingStatusAPI();
    const onboardingStatus = response.data.data;

    localStorage.setItem(
      "onboarding_status",
      JSON.stringify(onboardingStatus),
    );

    if (!onboardingStatus.face_registered) {
      router.push("/employee/register-face");
      return;
    }
  } catch (err) {
    router.push("/employee/dashboard");
    return;
  }

  router.push("/employee/dashboard");
}

async function submitChangePassword() {
  if (loading.value) return;

  error.value = "";
  success.value = "";

  const validationMessage = validateForm();

  if (validationMessage) {
    error.value = validationMessage;
    return;
  }

  loading.value = true;

  try {
    await changePasswordAPI({
      current_password: currentPassword.value,
      new_password: newPassword.value,
      new_password_confirmation: confirmPassword.value,
    });

    localStorage.setItem("must_change_password", "false");

    const user = JSON.parse(localStorage.getItem("user") || "{}");

    localStorage.setItem(
      "user",
      JSON.stringify({
        ...user,
        must_change_password: false,
      }),
    );

    success.value = "Password berhasil diubah";

    setTimeout(() => {
      redirectAfterPasswordChanged();
    }, 700);
  } catch (err) {
    error.value = getFieldError(
      err,
      ["current_password", "old_password", "password", "new_password"],
      "Gagal mengubah password",
    );
  } finally {
    loading.value = false;
  }
}

function goBack() {
  if (mustChangePassword.value) {
    logout();
    return;
  }

  router.back();
}
</script>

<template>
  <div class="wrapper">
    <div class="header">
      <button type="button" class="back-btn" @click="goBack">
        <img src="/goBack.png" alt="" />
        <span>{{ mustChangePassword ? "Kembali Login" : "Kembali" }}</span>
      </button>
    </div>

    <main class="content">
      <section class="page-heading">
        <h1>Ubah Password</h1>
        <p v-if="mustChangePassword">
          Anda perlu mengganti password sebelum melanjutkan.
        </p>
      </section>

      <form class="form-card" @submit.prevent="submitChangePassword">
        <label>
          <span>Password Lama</span>
          <div class="password-field">
            <input
              v-model="currentPassword"
              :type="showCurrent ? 'text' : 'password'"
              autocomplete="current-password"
              placeholder="Masukkan password lama"
            />
            <button type="button" @click="showCurrent = !showCurrent">
              <img :src="showCurrent ? '/eye-show.png' : '/eye-hide.png'" alt="" />
            </button>
          </div>
        </label>

        <label>
          <span>Password Baru</span>
          <div class="password-field">
            <input
              v-model="newPassword"
              :type="showNew ? 'text' : 'password'"
              autocomplete="new-password"
              placeholder="Minimal 6 karakter"
            />
            <button type="button" @click="showNew = !showNew">
              <img :src="showNew ? '/eye-show.png' : '/eye-hide.png'" alt="" />
            </button>
          </div>
        </label>

        <label>
          <span>Konfirmasi Password Baru</span>
          <div class="password-field">
            <input
              v-model="confirmPassword"
              :type="showConfirm ? 'text' : 'password'"
              autocomplete="new-password"
              placeholder="Ulangi password baru"
            />
            <button type="button" @click="showConfirm = !showConfirm">
              <img :src="showConfirm ? '/eye-show.png' : '/eye-hide.png'" alt="" />
            </button>
          </div>
        </label>

        <p v-if="error" class="message error">{{ error }}</p>
        <p v-if="success" class="message success">{{ success }}</p>

        <button type="submit" class="submit-btn" :disabled="loading">
          {{ loading ? "Menyimpan..." : "Simpan Password" }}
        </button>
      </form>
    </main>
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
  max-width: 560px;
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
}

.back-btn img {
  width: 18px;
  height: 18px;
  object-fit: contain;
  filter: invert(37%) sepia(89%) saturate(2342%) hue-rotate(213deg)
    brightness(96%) contrast(92%);
}

.content {
  width: 100%;
  max-width: 560px;
  margin: 0 auto;
  padding: 0 16px 96px;
}

.page-heading {
  margin-bottom: 18px;
}

.page-heading h1 {
  margin: 0;
  color: #0f172a;
  font-size: 28px;
  font-weight: 900;
}

.page-heading p {
  margin: 8px 0 0;
  color: #64748b;
  font-size: 14px;
  line-height: 1.5;
}

.form-card {
  display: grid;
  gap: 16px;
  padding: 18px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 20px 48px rgba(15, 23, 42, 0.08);
}

label {
  display: grid;
  gap: 8px;
}

label span {
  color: #334155;
  font-size: 13px;
  font-weight: 800;
}

.password-field {
  display: flex;
  align-items: center;
  min-height: 48px;
  border: 1px solid #cbd5e1;
  border-radius: 14px;
  background: #ffffff;
  overflow: hidden;
}

.password-field:focus-within {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.password-field input {
  flex: 1;
  min-width: 0;
  height: 48px;
  padding: 0 14px;
  border: none;
  outline: none;
  background: transparent;
  color: #0f172a;
  font-size: 14px;
}

.password-field button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border: none;
  background: transparent;
  cursor: pointer;
}

.password-field img {
  width: 20px;
  height: 20px;
  opacity: 0.68;
}

.message {
  margin: 0;
  padding: 12px 14px;
  border-radius: 14px;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.45;
}

.message.error {
  background: #fef2f2;
  color: #dc2626;
}

.message.success {
  background: #ecfdf5;
  color: #047857;
}

.submit-btn {
  min-height: 50px;
  border: none;
  border-radius: 14px;
  background: #2563eb;
  color: #ffffff;
  font-size: 15px;
  font-weight: 900;
  cursor: pointer;
  box-shadow: 0 14px 28px rgba(37, 99, 235, 0.22);
}

.submit-btn:disabled {
  cursor: not-allowed;
  opacity: 0.68;
}
</style>
