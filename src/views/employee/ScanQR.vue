<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { useLocation } from "@/composables/useLocation";
import { checkInAPI } from "@/services/attendance";
import { useAuth } from "@/composables/useAuth";

const router = useRouter();
const { user, loadUser } = useAuth();

const loading = ref(false);
const error = ref("");
const scanned = ref(false);

const popupMessage = ref("");
const showPopup = ref(false);

const scannerActive = ref(false);

const { latitude, longitude, accuracy, getCurrentLocation } = useLocation();

let codeReader = null;
let restartTimeout = null;
let videoElement = null;

onMounted(async () => {
  videoElement = document.getElementById("video");
  await loadUser();
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

// START SCAN
async function startScanner() {
  if (scannerActive.value) return;

  scannerActive.value = true;

  codeReader = new BrowserMultiFormatReader();

  try {
    await codeReader.decodeFromVideoDevice(
      undefined,
      videoElement,
      (result) => {
        if (result && scannerActive.value && !loading.value && !scanned.value) {
          handleScan(result.getText());
        }
      },
    );
  } catch (err) {
    console.error(err);
    error.value = "Gagal mengakses kamera";
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

    codeReader = null;
  } catch (e) {
    console.warn("Scanner stop error", e);
  }
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
  stopScanner();

  scanned.value = false;

  startScanner();
}
// HANDLE SCAN
async function handleScan(decodedText) {
  if (scanned.value) return;

  scanned.value = true;
  loading.value = true;

  stopScanner();

  console.log("QR RESULT:", decodedText);
  try {
    const parsedQR = JSON.parse(decodedText);

    console.log("PARSED QR:", parsedQR);

    const payload = {
      work_type: "WFO",
      lat: latitude.value,
      lon: longitude.value,
      accuracy: accuracy.value,
      qr_token: parsedQR.token,
      branch_id: parsedQR.branch_id,
    };

    console.log("PAYLOAD:", payload);

    // const res = await checkInAPI(payload);
    const res = await checkInAPI(payload);

    console.log("FULL RESPONSE:", res);

    console.log("RESPONSE DATA:", res.data);

    console.log("RESPONSE INNER DATA:", res.data?.data);

    console.log("RESPONSE STATUS:", res.status);

    router.push({
      path: "/employee/success",
      query: {
        type: "wfo",
        time: res.data.data.check_in,
      },
    });
  } catch (err) {
    console.log("FULL ERROR:", err);

    console.log("ERROR RESPONSE:", err.response);

    console.log("ERROR DATA:", err.response?.data);

    console.log("ERROR CODE:", err.response?.data?.code);

    console.log("ERROR MESSAGE:", err.response?.data?.message);

    const code = err.response?.data?.code;

    if (code === "NOT_WORK_DAY") {
      openPopup("Hari ini bukan jadwal kerja");
    } else if (code === "GPS_ACCURACY_LOW") {
      openPopup("GPS tidak akurat");
    } else if (code === "OUT_OF_RADIUS") {
      openPopup("Di luar radius kantor");
    } else if (code === "BRANCH_MISMATCH") {
      openPopup("QR bukan milik cabang anda");
    } else if (code === "CUTOFF_EXCEEDED") {
      openPopup("Jam check-in sudah lewat");
    } else if (code === "EMPLOYEE_DATA_INCOMPLETE") {
      openPopup("Data employee belum lengkap");
    } else {
      openPopup(err.response?.data?.message || err.message || "Check-in gagal");
    }

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
      <img src="/goBack.png" class="back" @click="goBack" />
    </div>

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
  background: #f3f4f6;
  display: flex;
  flex-direction: column;
}

.header {
  height: 60px;
  background: #4f46e5;
  display: flex;
  align-items: center;
  padding: 0 30px;
}

.back {
  width: 24px;
  cursor: pointer;
}

.error {
  background: #fee2e2;
  color: #b91c1c;
  padding: 10px;
  margin: 10px;
  border-radius: 10px;
  text-align: center;
}

.scan-box {
  position: relative;
  margin: 40px auto;
  width: 90%;
  max-width: 420px;
  aspect-ratio: 3 / 4;
  height: auto;
  border-radius: 20px;
  overflow: hidden;
  background: black;
}

video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.frame {
  position: absolute;
  width: 220px;
  height: 220px;
  border: 3px solid white;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 12px;
}

.scan-status {
  width: 70%;
  margin: auto;
  margin-top: 40px;
  padding: 14px;
  display: flex;
  justify-content: center;
  gap: 10px;
  border-radius: 20px;
  background: white;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
  font-size: 14px;
}

.spinner {
  animation: spin 1s linear infinite;
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

  border-radius: 16px;

  background: #fee2e2;
  color: #b91c1c;

  font-size: 14px;
  font-weight: 600;
  text-align: center;

  z-index: 9999;

  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);

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
  margin: 20px auto;

  padding: 12px 20px;

  border: none;
  border-radius: 12px;

  background: #4f46e5;
  color: white;

  font-size: 14px;
  font-weight: 600;

  cursor: pointer;
}
</style>
