<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  faceCheckInAPI,
  requestFaceTokenAPI,
  requestEventFaceTokenAPI,
  verifyFaceAPI,
} from "@/services/attendance";
import {
  destroyFaceLandmarker,
  detectFace,
  initFaceLandmarker,
} from "@/services/faceLandmarker";
import { captureVideoFrame, evaluateFaceFrame } from "@/utils/faceQuality";
import { useLocation } from "@/composables/useLocation";

const router = useRouter();
const route = useRoute();
const eventId = computed(() => Number(route.query.eventId) || null);
const isEventAttendance = computed(() => eventId.value !== null);
const { latitude, longitude, getCurrentLocation } = useLocation();

const videoRef = ref(null);
const streamRef = ref(null);
const faceToken = ref("");
const pauseDetection = ref(false);
const expiresAt = ref(0);
const remainingSeconds = ref(0);
const verificationStarted = ref(false);
const faceVerified = ref(false);
const stable = ref(false);
const quality = ref({ ready: false, message: "Menyiapkan kamera..." });
const loading = ref(false);
const blocked = ref(false);
const message = ref("");
const messageType = ref("info");
const previewUrl = ref("");

let animationFrame = null;
let countdownTimer = null;
let readySince = 0;
let lastAnalysisAt = 0;

const formattedCountdown = computed(() => {
  const minutes = Math.floor(remainingSeconds.value / 60);
  const seconds = remainingSeconds.value % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
});

function showMessage(text, type = "error") {
  message.value = text;
  messageType.value = type;
}

async function startCamera() {
  streamRef.value = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: "user",
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
    audio: false,
  });
  await nextTick();
  videoRef.value.srcObject = streamRef.value;
  await videoRef.value.play();
}

function stopCamera() {
  streamRef.value?.getTracks().forEach((track) => track.stop());
  streamRef.value = null;
}

function resetQuality() {
  readySince = 0;
  stable.value = false;
  quality.value = {
    ...quality.value,
    message: "Mendeteksi wajah...",
  };
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  previewUrl.value = "";
}

function detectionLoop(timestamp = 0) {
  const video = videoRef.value;
  if (
    !pauseDetection.value &&
    !previewUrl.value &&
    video?.readyState >= 2 &&
    timestamp - lastAnalysisAt > 120
  ) {
    lastAnalysisAt = timestamp;
    quality.value = evaluateFaceFrame(video, detectFace(video), null, false);
    if (quality.value.ready) {
      if (!readySince) readySince = performance.now();

      stable.value = performance.now() - readySince >= 500;

      if (!stable.value) {
        quality.value = {
          ...quality.value,
          message: "Tahan posisi sebentar...",
        };
      } else if (
        verificationStarted.value &&
        !faceVerified.value &&
        !loading.value
      ) {
        captureAndVerify();
      }
    } else {
      readySince = 0;
      stable.value = false;
    }
  }
  animationFrame = requestAnimationFrame(detectionLoop);
}

function startCountdown(expiresIn) {
  clearInterval(countdownTimer);
  expiresAt.value = Date.now() + expiresIn * 1000;

  const update = () => {
    remainingSeconds.value = Math.max(
      0,
      Math.ceil((expiresAt.value - Date.now()) / 1000),
    );
    if (remainingSeconds.value === 0) {
      clearInterval(countdownTimer);
      faceToken.value = "";
      verificationStarted.value = false;
      faceVerified.value = false;
      resetQuality();

      showMessage("Wajah tidak dikenali. Coba posisikan wajah kembali.");
    }
  };

  update();
  countdownTimer = setInterval(update, 1000);
}

async function beginVerification() {
  if (loading.value || blocked.value) return;
  loading.value = true;
  message.value = "";
  resetQuality();

  try {
    const response = isEventAttendance.value
      ? await requestEventFaceTokenAPI(eventId.value)
      : await requestFaceTokenAPI();
    faceToken.value = response.data.data.face_token;
    verificationStarted.value = true;
    faceVerified.value = false;
    startCountdown(Number(response.data.data.expires_in || 120));
  } catch (error) {
    handleError(error, "token");
  } finally {
    loading.value = false;
  }
}

async function captureAndVerify() {
  if (!stable.value || !faceToken.value || loading.value) return;
  loading.value = true;
  message.value = "";

  try {
    const file = await captureVideoFrame(videoRef.value, "face-checkin.jpg");
    // previewUrl.value = URL.createObjectURL(file);
    const formData = new FormData();
    formData.append("face_token", faceToken.value);
    formData.append("face_image", file);

    const response = await verifyFaceAPI(formData);
    if (!response.data.data.verified)
      throw new Error("Wajah belum terverifikasi");

    faceToken.value = response.data.data.face_token;
    faceVerified.value = true;
    showMessage("Wajah terverifikasi. Mengambil lokasi...", "success");
    await finishCheckIn();
  } catch (error) {
    handleError(error, "verify");
  } finally {
    loading.value = false;
  }
}

async function finishCheckIn() {
  if (!faceVerified.value || !faceToken.value) return;
  loading.value = true;

  try {
    if (isEventAttendance.value) {
      sessionStorage.setItem(
        "event_attendance_flow",
        JSON.stringify({
          eventId: eventId.value,
          eventName: route.query.eventName || "Event",
          faceToken: faceToken.value,
          expiresAt: expiresAt.value,
        }),
      );
      clearInterval(countdownTimer);
      stopCamera();
      router.replace("/employee/scan-event");
      return;
    }

    const locationAvailable = await getCurrentLocation();
    if (
      !locationAvailable ||
      latitude.value == null ||
      longitude.value == null
    ) {
      throw new Error("Lokasi tidak tersedia. Aktifkan GPS lalu coba lagi.");
    }

    const response = await faceCheckInAPI({
      face_token: faceToken.value,
      latitude: latitude.value,
      longitude: longitude.value,
    });
    const result = response.data.data;
    clearInterval(countdownTimer);

    router.replace({
      path: "/employee/success",
      query: {
        type: "face",
        time: result.check_in,
        date: result.date,
        status: result.status,
        lateMinutes: result.late_minutes,
      },
    });
  } catch (error) {
    handleError(error, "checkin");
  } finally {
    loading.value = false;
  }
}

function handleError(error, stage) {
  const code = error.response?.data?.code;
  const fallback =
    error.response?.data?.message || error.message || "Proses check-in gagal";

  if (code === "FACE_NOT_REGISTERED") {
    const status = JSON.parse(
      localStorage.getItem("onboarding_status") || "{}",
    );
    localStorage.setItem(
      "onboarding_status",
      JSON.stringify({ ...status, face_registered: false }),
    );
    router.replace("/employee/register-face");
    return;
  }

  if (["TOKEN_INVALID", "TOKEN_EXPIRED", "TOKEN_USED"].includes(code)) {
    clearInterval(countdownTimer);
    faceToken.value = "";
    verificationStarted.value = false;
    faceVerified.value = false;
    resetQuality();
    showMessage("Token sudah tidak berlaku. Tekan Coba Lagi.");
    return;
  }

  if (code === "FACE_MISMATCH") {
    pauseDetection.value = true;
    stable.value = false;

    showMessage("Wajah tidak dikenali. Ambil foto ulang sebelum waktu habis.");

    setTimeout(() => {
      resetQuality();
      message.value = "";
      pauseDetection.value = false;
    }, 3000);

    return;
  }

  if (["NO_FACE_DETECTED", "MULTIPLE_FACES"].includes(code)) {
    resetQuality();
    showMessage(
      code === "MULTIPLE_FACES"
        ? "Pastikan hanya satu wajah di kamera."
        : "Wajah tidak terdeteksi. Foto ulang.",
    );
    return;
  }

  if (code === "MAX_ATTEMPT_EXCEEDED") {
    blocked.value = true;
    verificationStarted.value = false;
    showMessage("Terlalu banyak percobaan gagal. Hubungi HR.");
    return;
  }

  if (code === "ALREADY_CHECKED_IN") {
    blocked.value = true;
    verificationStarted.value = false;
    showMessage("Kamu sudah check-in hari ini.", "info");
    return;
  }

  if (code === "TOKEN_NOT_VERIFIED") {
    faceVerified.value = false;
    resetQuality();
    showMessage("Verifikasi wajah perlu diulang.");
    return;
  }

  if (code === "OUTSIDE_RADIUS") {
    showMessage("Kamu berada di luar area kantor yang diizinkan.");
    return;
  }

  if (code === "NOT_EVENT_PARTICIPANT") {
    blocked.value = true;
    showMessage("Kamu tidak terdaftar sebagai peserta event.");
    return;
  }

  if (code === "EVENT_EXPIRED") {
    blocked.value = true;
    showMessage("Event sudah selesai atau belum berlangsung.");
    return;
  }

  if (code === "ALREADY_ATTENDED_EVENT") {
    blocked.value = true;
    showMessage("Kamu sudah melakukan absensi pada event ini.");
    return;
  }

  showMessage(fallback);
  if (stage === "verify") resetQuality();
}

onMounted(async () => {
  localStorage.removeItem("face_embedding");
  localStorage.removeItem("face_token");
  try {
    await initFaceLandmarker();
    await startCamera();
    detectionLoop();
  } catch (error) {
    showMessage(
      error.name === "NotAllowedError"
        ? "Izin kamera ditolak. Aktifkan izin kamera untuk check-in."
        : "Kamera atau pendeteksi wajah gagal dimuat.",
    );
  }
});

onBeforeUnmount(() => {
  clearInterval(countdownTimer);
  if (animationFrame) cancelAnimationFrame(animationFrame);
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  stopCamera();
  destroyFaceLandmarker();
});
</script>

<template>
  <main class="page">
    <section class="card">
      <header>
        <button class="back" type="button" @click="router.back()">
          ← Kembali
        </button>
        <p class="eyebrow">
          {{ isEventAttendance ? "Absensi event" : "Absensi kantor" }}
        </p>
        <h1>Verifikasi Wajah</h1>
        <p v-if="isEventAttendance" class="event-name">
          {{ route.query.eventName || "Event" }}
        </p>
      </header>

      <div
        v-if="verificationStarted"
        class="timer"
        :class="{ urgent: remainingSeconds <= 20 }"
      >
        Sisa waktu <strong>{{ formattedCountdown }}</strong>
      </div>

      <div class="camera-box">
        <video
          ref="videoRef"
          v-show="!previewUrl"
          autoplay
          muted
          playsinline
        ></video>
        <div v-if="!previewUrl" class="face-guide"></div>
      </div>

      <p
        v-if="verificationStarted && !previewUrl"
        class="quality"
        :class="{ ready: stable }"
      >
        {{ stable ? "✓ Foto siap diverifikasi" : quality.message }}
      </p>
      <p v-else-if="!verificationStarted" class="quality">Tekan Mulai...</p>

      <p v-if="message" class="message" :class="messageType" role="alert">
        {{ message }}
      </p>

      <button
        v-if="!verificationStarted && !blocked"
        class="primary"
        :disabled="loading"
        @click="beginVerification"
      >
        {{
          loading
            ? "Meminta Token..."
            : faceToken
              ? "Coba Lagi"
              : "Mulai Verifikasi"
        }}
      </button>

      <!-- <button
        v-else-if="verificationStarted && !faceVerified"
        class="primary"
        :disabled="!stable || loading"
        @click="captureAndVerify"
      >
        {{ loading ? "Memverifikasi..." : "Ambil & Verifikasi Foto" }}
      </button> -->

      <div
        v-else-if="verificationStarted && !faceVerified"
        class="quality ready"
      >
        {{ loading ? "Memverifikasi wajah..." : quality.message }}
      </div>

      <button
        v-else-if="faceVerified"
        class="primary"
        :disabled="loading"
        @click="finishCheckIn"
      >
        {{ loading ? "Memeriksa Lokasi..." : "Coba Kirim Lokasi Lagi" }}
      </button>

      <button
        v-if="blocked"
        class="secondary"
        @click="router.replace('/employee/dashboard')"
      >
        Kembali ke Dashboard
      </button>
    </section>
  </main>
</template>

<style scoped>
.page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px 16px;
  background: #f1f5f9;
  color: #0f172a;
}
.card {
  width: min(100%, 520px);
  padding: 24px;
  border-radius: 28px;
  background: white;
  box-shadow: 0 20px 55px rgba(15, 23, 42, 0.12);
}
.back {
  min-height: auto;
  padding: 0;
  border: 0;
  background: transparent;
  color: #2563eb;
  cursor: pointer;
  font-weight: 700;
}
.eyebrow {
  margin: 20px 0 5px;
  color: #2563eb;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
h1 {
  margin: 0;
  font-size: 28px;
}
header p:last-child {
  color: #64748b;
  line-height: 1.5;
}
.timer {
  margin: 14px 0;
  padding: 10px 14px;
  border-radius: 12px;
  background: #dbeafe;
  color: #1d4ed8;
  text-align: center;
}
.timer.urgent {
  background: #fee2e2;
  color: #b91c1c;
}
.camera-box {
  position: relative;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border-radius: 22px;
  background: #020617;
}
.camera-box video,
.camera-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.face-guide {
  position: absolute;
  inset: 10% 23%;
  border: 3px solid rgba(255, 255, 255, 0.9);
  border-radius: 48%;
  box-shadow: 0 0 0 999px rgba(2, 6, 23, 0.18);
}
.quality {
  min-height: 24px;
  margin: 12px 0;
  color: #b45309;
  text-align: center;
  font-weight: 700;
}
.quality.ready {
  color: #15803d;
}
.message {
  padding: 12px;
  border-radius: 12px;
  background: #fee2e2;
  color: #b91c1c;
}
.message.success {
  background: #dcfce7;
  color: #15803d;
}
.message.info {
  background: #e0f2fe;
  color: #0369a1;
}
.primary,
.secondary {
  width: 100%;
  min-height: 52px;
  border: 0;
  border-radius: 14px;
  font-weight: 800;
  cursor: pointer;
}
.primary {
  background: #2563eb;
  color: white;
}
.secondary {
  background: #e2e8f0;
  color: #0f172a;
}
button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>
