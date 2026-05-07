<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { useLocation } from "@/composables/useLocation";
import { checkInAPI } from "@/services/attendance";

const router = useRouter();

const loading = ref(false);
const error = ref("");
const scanned = ref(false);

const { latitude, longitude, accuracy, getCurrentLocation } = useLocation();

let codeReader = null;
let videoElement = null;

onMounted(async () => {
  videoElement = document.getElementById("video");

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
  codeReader = new BrowserMultiFormatReader();

  try {
    await codeReader.decodeFromVideoDevice(
      undefined,
      videoElement,
      (result) => {
        if (result) {
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
  try {
    if (videoElement && videoElement.srcObject) {
      const tracks = videoElement.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
      videoElement.srcObject = null;
    }

    codeReader = null;
  } catch (e) {
    console.warn("Scanner stop error", e);
  }
}

// HANDLE SCAN
async function handleScan(decodedText) {
  if (scanned.value) return;

  scanned.value = true;
  loading.value = true;

  stopScanner();

  try {
    let qrData;

    try {
      qrData = JSON.parse(decodedText);
    } catch {
      throw new Error("QR tidak valid");
    }

    if (!qrData.token || !qrData.branch_id) {
      throw new Error("QR tidak sesuai format");
    }

    const payload = {
      work_type: "WFO",
      lat: latitude.value,
      lon: longitude.value,
      accuracy: accuracy.value,
      qr_token: qrData.token,
      branch_id: qrData.branch_id,
    };

    const res = await checkInAPI(payload);

    router.push({
      path: "/employee/success",
      query: {
        type: "wfo",
        time: res.data.data.check_in,
      },
    });
  } catch (err) {
    console.error(err);

    alert(err.response?.data?.message || err.message || "Check-in gagal");

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
  height: 500px;
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
  background: white;
  border-radius: 12px;
  display: flex;
  justify-content: center;
  gap: 10px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
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
</style>
