<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { useLocation } from "@/composables/useLocation";
import { checkInEventAPI } from "@/services/attendance";
import { getSafeErrorMessage } from "@/utils/errorMessage";
const router = useRouter();

const loading = ref(false);
const error = ref("");
const scanned = ref(false);

const popupMessage = ref("");
const showPopup = ref(false);

const scannerActive = ref(false);
const attendanceFlow = ref(null);
const eventId = ref(null);
const eventName = ref("");

const { latitude, longitude, getCurrentLocation } = useLocation();

let codeReader = null;
let restartTimeout = null;
let videoElement = null;

onMounted(async () => {
  videoElement = document.getElementById("video");
  const flow = JSON.parse(sessionStorage.getItem("event_attendance_flow"));
  if (!flow) {
    router.replace("/employee/dashboard");
    return;
  }

  if (Date.now() > flow.expiresAt) {
    sessionStorage.removeItem("event_attendance_flow");
    router.replace("/employee/checkin-face");
    return;
  }
  attendanceFlow.value = flow;
  eventId.value = flow.eventId;
  eventName.value = flow.eventName;
  const ok = await getCurrentLocation();
  if (!ok) {
    error.value = "Gagal mengambil lokasi";
    return;
  }

  startScanner();
});

onUnmounted(() => {
  stopScanner();
});

async function getBackCameraId() {
  const devices = await BrowserMultiFormatReader.listVideoInputDevices();

  if (!devices.length) return undefined;

  const backCamera = devices.find((device) => {
    const label = device.label.toLowerCase();

    return (
      label.includes("back") ||
      label.includes("rear") ||
      label.includes("environment")
    );
  });

  return backCamera?.deviceId || devices[0].deviceId;
}

// START SCAN
async function startScanner() {
  if (scannerActive.value) return;

  scannerActive.value = true;

  codeReader = new BrowserMultiFormatReader();

  try {
    const cameraId = await getBackCameraId();

    await codeReader.decodeFromVideoDevice(cameraId, videoElement, (result) => {
      if (result && scannerActive.value && !loading.value && !scanned.value) {
        handleScan(result.getText());
      }
    });
  } catch (err) {
    try {
      await codeReader.decodeFromVideoDevice(
        undefined,
        videoElement,
        (result) => {
          if (
            result &&
            scannerActive.value &&
            !loading.value &&
            !scanned.value
          ) {
            handleScan(result.getText());
          }
        },
      );
    } catch (e) {
      error.value = "Gagal mengakses kamera";
    }
  }
}

// STOP SCAN
function stopScanner() {
  scannerActive.value = false;

  if (restartTimeout) {
    clearTimeout(restartTimeout);
    restartTimeout = null;
  }

  try {
    if (videoElement?.srcObject) {
      const tracks = videoElement.srcObject.getTracks();

      tracks.forEach((track) => {
        track.stop();
      });

      videoElement.srcObject = null;
    }

    codeReader?.reset();
    codeReader = null;
  } catch (e) {}
}

function openPopup(message) {
  popupMessage.value = message;

  showPopup.value = true;

  setTimeout(() => {
    showPopup.value = false;
    popupMessage.value = "";
  }, 5000);
}

function retryScanner() {
  const flow = JSON.parse(sessionStorage.getItem("event_attendance_flow"));

  if (!flow) {
    router.replace("/employee/dashboard");
    return;
  }
  attendanceFlow.value = flow;
  scanned.value = false;
  loading.value = false;
  error.value = "";
  stopScanner();
  startScanner();
}

// HANDLE SCAN
async function handleScan(decodedText) {
  if (scanned.value) return;

  scanned.value = true;
  loading.value = true;

  stopScanner();

  try {
    const payload = {
      event_id: attendanceFlow.value.eventId,
      face_token: attendanceFlow.value.faceToken,
      qr_token: decodedText.trim(),
      latitude: latitude.value,
      longitude: longitude.value,
    };
    const res = await checkInEventAPI(payload);
    router.push({
      path: "/employee/success",
      query: {
        type: "event",
        time: res.data.data.check_in,
        date: res.data.data.date,
        eventName: res.data.data.event_name,
      },
    });

    sessionStorage.removeItem("event_attendance_flow");
  } catch (err) {
    const code = err.response?.data?.code;
    if (code === "TOKEN_NOT_VERIFIED") {
      openPopup("Verifikasi wajah harus dilakukan kembali.");
      sessionStorage.removeItem("event_attendance_flow");
      router.replace("/employee/checkin-face");
      return;
    }
    if (code === "TOKEN_EXPIRED") {
      openPopup("Sesi verifikasi wajah sudah habis.");
      sessionStorage.removeItem("event_attendance_flow");
      router.replace("/employee/checkin-face");
      return;
    }
    if (code === "TOKEN_INVALID") {
      openPopup("Token verifikasi tidak valid.");
      sessionStorage.removeItem("event_attendance_flow");
      router.replace("/employee/checkin-face");
      return;
    }

    if (code === "QR_TOKEN_INVALID" || code === "QR_NOT_EVENT_TYPE") {
      openPopup("QR Event tidak valid atau sudah kedaluwarsa.");
      scanned.value = false;
      return;
    }

    if (code === "TOKEN_USED") {
      openPopup("Token verifikasi sudah digunakan.");
      sessionStorage.removeItem("event_attendance_flow");
      router.replace("/employee/checkin-face");
      return;
    }

    if (code === "OUTSIDE_RADIUS") {
      openPopup("Anda berada di luar radius event.");
      scanned.value = false;
      return;
    }

    if (code === "ALREADY_ATTENDED_EVENT") {
      openPopup("Anda sudah melakukan absensi pada event ini.");
      scanned.value = false;
      return;
    }
    openPopup(getSafeErrorMessage(err, "Check in gagal."));
    scanned.value = false;
  } finally {
    loading.value = false;
  }
}

// BACK
function goBack() {
  stopScanner();
  router.back();
}
</script>

<template>
  <div class="wrapper">
    <div class="header">
      <button type="button" class="back-btn" @click="goBack">
        <img src="/goBack.png" alt="" />
        <span>Kembali</span>
      </button>
    </div>

    <section class="page-heading">
      <!-- <p>Check In WFO</p> -->
      <h1>Scan QR Event</h1>
    </section>

    <div v-if="error" class="error">
      {{ error }}
    </div>

    <div class="scan-box">
      <video id="video" autoplay muted playsinline></video>
      <div class="frame"></div>
    </div>

    <div class="scan-status">
      <span class="spinner">⟳</span>
      <span>{{ loading ? "Memproses..." : "Scanning..." }}</span>
    </div>

    <button v-if="!loading && scanned" class="retry-btn" @click="retryScanner">
      Scan ulang
    </button>

    <div v-if="showPopup" class="popup">
      {{ popupMessage }}
    </div>
  </div>
</template>

<style scoped>
.wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(
      circle at top left,
      rgba(37, 99, 235, 0.1),
      transparent 32rem
    ),
    #f8fafc;
  color: #0f172a;
  padding-bottom: 40px;
}

.header {
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 520px;
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

.page-heading {
  width: calc(100% - 32px);
  max-width: 520px;
  margin: 0 auto 16px;
}

.page-heading p {
  margin: 0 0 6px;
  color: #2563eb;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.page-heading h1 {
  margin: 0;
  color: #0f172a;
  font-size: 28px;
  font-weight: 800;
  line-height: 1.15;
}

.error {
  width: calc(100% - 32px);
  max-width: 520px;
  margin: 0 auto 16px;
  padding: 12px 14px;
  border: 1px solid #fecaca;
  border-radius: 14px;
  background: #fef2f2;
  color: #dc2626;
  font-size: 13px;
  font-weight: 800;
  line-height: 1.5;
  text-align: center;
}

.scan-box {
  position: relative;
  margin: 0 auto;
  width: calc(100% - 32px);
  max-width: 420px;
  aspect-ratio: 3 / 4;
  height: auto;
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 28px;
  overflow: hidden;
  background: #020617;
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.16);
}

video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.frame {
  position: absolute;
  width: 62%;
  aspect-ratio: 1;
  border: 3px solid rgba(255, 255, 255, 0.92);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 24px;
  box-shadow: 0 0 0 999px rgba(15, 23, 42, 0.18);
}

.scan-status {
  width: calc(100% - 32px);
  max-width: 420px;
  margin: 18px auto 0;
  padding: 14px 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.92);
  color: #0f172a;
  font-size: 14px;
  font-weight: 800;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.06);
}

.spinner {
  animation: spin 1s linear infinite;
  color: #2563eb;
}

@keyframes spin {
  100% {
    transform: rotate(360deg);
  }
}

.popup {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 32px);
  max-width: 420px;
  padding: 14px 18px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.94);
  color: #ffffff;
  font-size: 14px;
  font-weight: 800;
  text-align: center;
  z-index: 9999;
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.18);
  animation: popupSlide 0.25s ease;
}

@keyframes popupSlide {
  from {
    opacity: 0;
    transform: translate(-50%, -10px);
  }

  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

@media (min-width: 768px) {
  .popup {
    font-size: 15px;
    padding: 16px 22px;
  }
}

.retry-btn {
  width: calc(100% - 32px);
  max-width: 420px;
  min-height: 50px;
  margin: 20px auto 0;
  border: 1px solid transparent;
  border-radius: 16px;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #ffffff;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 12px 26px rgba(37, 99, 235, 0.24);
}

@media (max-width: 420px) {
  .back-btn span {
    display: none;
  }
}
</style>
