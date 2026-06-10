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

  const parsedQR = JSON.parse(decodedText);

  console.log("PARSED QR:", parsedQR);
  try {
    // const parsedQR = JSON.parse(decodedText);

    // console.log("PARSED QR:", parsedQR);

    console.log("FACE TOKEN:", localStorage.getItem("face_token"));

    const payload = {
      work_type: "WFO",

      lat: latitude.value,
      lon: longitude.value,
      accuracy: accuracy.value,

      qr_token: parsedQR.token,
      branch_id: parsedQR.branch_id,

      face_token: localStorage.getItem("face_token"),
    };

    console.log("PAYLOAD:", payload);

    // const res = await checkInAPI(payload);
    const res = await checkInAPI(payload);

    console.log("LATITUDE:", latitude.value);
    console.log("LONGITUDE:", longitude.value);
    console.log("PARSED QR:", parsedQR);
    console.log("FACE TOKEN:", localStorage.getItem("face_token"));
    console.log("CHECKIN PAYLOAD:", payload);

    console.log("FULL RESPONSE:", res);

    console.log("RESPONSE DATA:", res.data);

    console.log("RESPONSE INNER DATA:", res.data?.data);

    console.log("RESPONSE STATUS:", res.status);

    localStorage.removeItem("face_token");

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

    const message = err.response?.data?.message;

    const code = err.response?.data?.code;

    if (code === "FACE_NOT_VERIFIED") {
      openPopup("Verifikasi wajah belum dilakukan");
    } else if (code === "QR_INVALID") {
      openPopup("QR tidak valid");
    } else if (code === "LOCATION_OUT_OF_RANGE") {
      openPopup("Anda berada di luar radius kantor");
    } else if (message === "TOKEN_INVALID") {
      openPopup("Token check in sudah expired");
    } else if (message === "Sudah check-in hari ini") {
      openPopup("Anda sudah check-in hari ini");
    } else {
      openPopup(message || "Check in gagal");
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
      <button type="button" class="back-btn" @click="goBack">
        <img src="/goBack.png" alt="" />
        <span>Kembali</span>
      </button>
    </div>

    <section class="page-heading">
      <!-- <p>Check In WFO</p> -->
      <h1>Scan QR Kantor</h1>
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
