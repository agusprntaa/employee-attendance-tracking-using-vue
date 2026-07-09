<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { loginAPI } from "@/services/auth";
import { getOnboardingStatusAPI } from "@/services/employee";
import { getSafeErrorMessage } from "@/utils/errorMessage";

const router = useRouter();

const username = ref("");
const password = ref("");
const loading = ref(false);
const errorUsername = ref("");
const errorPassword = ref("");
const remember = ref(false);
const errorGlobal = ref("");
const showPassword = ref(false);
// const locationGranted = ref(false);
// const locationError = ref("");

onMounted(() => {
  const remembered = localStorage.getItem("rememberedLogin");

  if (remembered) {
    const data = JSON.parse(remembered);

    username.value = data.username || "";
    password.value = "";
    remember.value = true;
  }
});

// function requestLocation() {
//   locationError.value = "";

//   if (!navigator.geolocation) {
//     locationError.value = "Browser tidak mendukung lokasi";
//     return;
//   }

//   navigator.geolocation.getCurrentPosition(
//     (pos) => {
//       locationGranted.value = true;
//       locationError.value = "";
//     },
//     (err) => {
//       locationGranted.value = false;

//       if (err.code === 1) {
//         locationError.value = "Izin lokasi ditolak";
//       } else if (err.code === 2) {
//         locationError.value = "Lokasi tidak tersedia";
//       } else {
//         locationError.value = "Gagal mengambil lokasi";
//       }
//     },
//     {
//       enableHighAccuracy: true,
//       timeout: 7000,
//     },
//   );
// }

async function login() {
  if (loading.value) return;
  errorUsername.value = "";
  errorPassword.value = "";
  errorGlobal.value = "";

  if (!username.value.trim()) {
    errorUsername.value = "Username wajib diisi";
    return;
  }

  if (!password.value.trim()) {
    errorPassword.value = "Password wajib diisi";
    return;
  }

  // if (!locationGranted.value) {
  //   locationError.value = "Izin lokasi diperlukan";
  //   return;
  // }
  loading.value = true;

  try {
    const res = await loginAPI({
      username: username.value.trim(),
      password: password.value.trim(),
    });

    if (!res.data?.data) {
      errorGlobal.value = "Terjadi kesalahan pada server. Silakan coba lagi.";
      return;
    }

    const {
      token,
      refresh_token,
      user,
      must_change_password,
      temp_password,
      expires_in,
    } = res.data.data;

    //mengubah error handle baru
    if (!token || !refresh_token) {
      errorGlobal.value = "Token login tidak ditemukan dari backend.";
      return;
    }

    // simpan auth
    localStorage.setItem("token", token);

    localStorage.setItem("refresh_token", refresh_token);

    localStorage.setItem("user", JSON.stringify(user));

    localStorage.setItem("must_change_password", must_change_password);

    // Remove data left by the old, unsafe frontend-embedding implementation.
    localStorage.removeItem("face_embedding");
    localStorage.removeItem("face_token");

    // remember me
    if (remember.value) {
      localStorage.setItem(
        "rememberedLogin",
        JSON.stringify({
          username: username.value,
        }),
      );
    } else {
      localStorage.removeItem("rememberedLogin");
    }

    //direct token
    if (must_change_password || temp_password) {
      router.push("/employee/change-password");
      return;
    }

    // redirect sesuai role & tipe
    if (user.role === "admin" && user.tipe === "pusat") {
      router.push("/admin-pusat/dashboard");
    } else if (user.role === "admin" && user.tipe === "cabang") {
      router.push("/admin-cabang/dashboard");
    } else if (user.role === "karyawan") {
      const onboardingResponse = await getOnboardingStatusAPI();
      const onboardingStatus = onboardingResponse.data.data;
      localStorage.setItem(
        "onboarding_status",
        JSON.stringify(onboardingStatus),
      );

      if (onboardingStatus.must_change_password) {
        localStorage.setItem("must_change_password", "true");
        router.push("/employee/change-password");
        return;
      }

      if (!onboardingStatus.face_registered) {
        router.push("/employee/register-face");
        return;
      }

      router.push("/employee/dashboard");
    } else {
      errorGlobal.value = "Role user tidak sesuai sistem. backend.";
    }
  } catch (err) {
    //mengubah error handle baru
    if (err.response?.status === 429) {
      errorGlobal.value =
        "Terlalu banyak mencoba login. Coba lagi beberapa menit lagi.";
      return;
    }

    if (err.message === "Network Error") {
      errorGlobal.value = "Tidak dapat terhubung ke server.";

      return;
    }

    if (err.response?.status === 401) {
      errorGlobal.value = "Username atau password salah";

      return;
    }

    errorGlobal.value = getSafeErrorMessage(err, "Login gagal");
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="container">
    <div class="card">
      <h2>ABSENSI KARYAWAN</h2>

      <!-- <div
        class="location-box"
        :class="{ active: locationGranted }"
        @click="requestLocation"
      >
        <span>
          {{ locationGranted ? "✓ Lokasi aktif" : "Klik untuk izin lokasi" }}
        </span>
      </div>
      <p v-if="locationError" class="error">{{ locationError }}</p> -->

      <label for="username">Username</label>

      <input
        id="username"
        name="username"
        autocomplete="username"
        v-model="username"
        type="text"
        placeholder="Masukkan username"
      />
      <p v-if="errorUsername" class="error">{{ errorUsername }}</p>

      <label for="password">Password</label>

      <div class="password-wrapper">
        <input
          id="password"
          name="password"
          autocomplete="current-password"
          :type="showPassword ? 'text' : 'password'"
          v-model="password"
          placeholder="Masukkan password"
          @keydown.enter.prevent="login"
        />

        <img
          :src="showPassword ? '/eye-show.png' : '/eye-hide.png'"
          class="toggle"
          @click="showPassword = !showPassword"
        />
      </div>

      <label class="remember">
        <input type="checkbox" v-model="remember" />
        <span>Ingat saya</span>
      </label>

      <button type="button" @click.prevent="login" :disabled="loading">
        {{ loading ? "Loading..." : "Sign In" }}
      </button>

      <p v-if="errorGlobal" class="error global-error">{{ errorGlobal }}</p>
    </div>
  </div>
</template>

<style scoped>
.container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f3f4f6;
  padding: 20px;
}

.card {
  width: 100%;
  max-width: 420px;
  background: #ffffff;
  padding: 32px 28px;
  border-radius: 24px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
}

h2 {
  text-align: center;
  margin-bottom: 24px;
  font-weight: 700;
  font-size: 24px;
}

.location-box {
  background: #e5e7eb;
  padding: 10px;
  border-radius: 10px;
  margin-bottom: 8px;
  cursor: pointer;
  text-align: center;
  transition: background 0.2s;
}

.location-box.active {
  background: #d1fae5;
}

.location-box span {
  font-size: 12px;
  color: gray;
}

.location-box.active span {
  color: #065f46;
}

label {
  display: block;
  font-size: 14px;
  margin-bottom: 6px;
  margin-top: 12px;
}

input[type="text"],
input[type="email"],
input[type="password"] {
  width: 100%;
  padding: 14px;
  border-radius: 14px;
  border: 1px solid #ddd;
  font-size: 14px;
  box-sizing: border-box;
}

.remember {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
  cursor: pointer;
  font-size: 14px;
  color: #374151;
}

.remember input {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

button {
  width: 100%;
  padding: 16px;
  margin-top: 24px;
  border: none;
  border-radius: 14px;
  background: #4f46e5;
  color: white;
  font-weight: 600;
  cursor: pointer;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error {
  color: #dc2626;
  font-size: 12px;
  margin-top: 4px;
}

.global-error {
  text-align: center;
  margin-top: 12px;
}

.password-wrapper {
  position: relative;
  margin-top: 12px;
}

.password-wrapper input {
  width: 100%;
  padding-right: 42px;
}

.toggle {
  position: absolute;
  right: 10px;
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
</style>
