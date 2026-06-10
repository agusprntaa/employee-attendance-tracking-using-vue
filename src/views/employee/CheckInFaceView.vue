<script setup>
import { ref, onMounted, watch } from "vue";
import { useRouter } from "vue-router";

import { useFaceRecognition } from "../../composables/ useFaceRecognition";

import { requestFaceTokenAPI, verifyFaceAPI } from "@/services/attendance";

import { initFaceLandmarker, detectFace } from "@/services/faceLandmarker";

import { estimateYaw } from "@/utils/headPose";

import {
  initImageEmbedder,
  getEmbedding,
  cosineSimilarity,
} from "@/services/imageEmbedder";

const router = useRouter();

function goBack() {
  router.back();
}

const token = ref("");
const frontendSimilarity = ref(null);

const videoRef = ref(null);

const yawValue = ref(0);

const loading = ref(false);

const verificationStarted = ref(false);

const showPopup = ref(false);

const popupMessage = ref("");

const popupType = ref("success");

// let timer = null;

const {
  faceDetected,
  capturedImage,
  currentStep,
  isCompleted,
  instructions,
  nextStep,
  resetLiveness,
  setCapturedImage,
} = useFaceRecognition();

onMounted(async () => {
  await startCamera();

  await initFaceLandmarker();

  detectLoop();
});
watch(isCompleted, async (value) => {
  if (!value) return;

  captureFace();

  const passed = await verifyFaceFrontend();

  if (!passed) {
    openPopup(
      `Wajah tidak sesuai. Similarity: ${(
        frontendSimilarity.value * 100
      ).toFixed(5)}%`,
    );
    resetLiveness();

    return;
  }

  await new Promise((resolve) => setTimeout(resolve, 2000));

  await verifyFace();
});

async function startCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: true,
  });

  videoRef.value.srcObject = stream;
}

async function startCheckIn() {
  loading.value = true;

  try {
    const response = await requestFaceTokenAPI();

    console.log("FACE TOKEN RESPONSE:", response.data);

    token.value = response.data.data.face_token;

    console.log("GENERATED TOKEN:", token.value);

    verificationStarted.value = true;
  } catch (error) {
    console.log("TOKEN ERROR:", error.response?.data);

    alert(error.response?.data?.message || "Gagal membuat token");
  } finally {
    loading.value = false;
  }
}
function detectLoop() {
  const video = videoRef.value;

  if (!video) {
    requestAnimationFrame(detectLoop);
    return;
  }

  if (video.videoWidth === 0 || video.videoHeight === 0) {
    requestAnimationFrame(detectLoop);
    return;
  }

  const result = detectFace(video);

  if (result?.faceLandmarks && result.faceLandmarks.length > 0) {
    faceDetected.value = true;

    const landmarks = result.faceLandmarks[0];

    yawValue.value = estimateYaw(landmarks);

    if (verificationStarted.value) {
      checkLiveness(yawValue.value);
    }
  } else {
    faceDetected.value = false;
  }

  requestAnimationFrame(detectLoop);
}

function checkLiveness(yaw) {
  if (currentStep.value === 0 && Math.abs(yaw) < 0.04) {
    nextStep();
    return;
  }

  if (currentStep.value === 1 && yaw < -0.08) {
    nextStep();
    return;
  }

  if (currentStep.value === 2 && yaw > 0.08) {
    nextStep();
    return;
  }

  if (currentStep.value === 3 && Math.abs(yaw) < 0.04) {
    nextStep();
  }
}

function captureFace() {
  const video = videoRef.value;

  const canvas = document.createElement("canvas");

  canvas.width = video.videoWidth;

  canvas.height = video.videoHeight;

  const ctx = canvas.getContext("2d");

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  setCapturedImage(canvas.toDataURL("image/jpeg"));
}

function dataUrlToBlob(dataUrl) {
  const arr = dataUrl.split(",");

  const mime = arr[0].match(/:(.*?);/)[1];

  const bstr = atob(arr[1]);

  let n = bstr.length;

  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new Blob([u8arr], {
    type: mime,
  });
}

async function dataUrlToImage(dataUrl) {
  const img = new Image();

  img.src = dataUrl;

  await new Promise((resolve) => {
    img.onload = resolve;
  });

  return img;
}

async function verifyFaceFrontend() {
  const saved = localStorage.getItem("face_embedding");

  if (!saved) {
    return true;
  }

  const img = await dataUrlToImage(capturedImage.value);

  await initImageEmbedder();

  const currentEmbedding = await getEmbedding(img);

  const similarity = cosineSimilarity(
    {
      floatEmbedding: JSON.parse(saved),
    },
    currentEmbedding,
  );

  frontendSimilarity.value = similarity;

  console.log("FRONTEND SIMILARITY:", similarity);

  return similarity > 0.75;
}

function openPopup(message, type = "success") {
  popupMessage.value = message;

  popupType.value = type;

  showPopup.value = true;

  setTimeout(() => {
    showPopup.value = false;
    popupMessage.value = "";
  }, 3000);
}

//verify
async function verifyFace() {
  const formData = new FormData();

  formData.append("face_token", token.value);

  const blob = dataUrlToBlob(capturedImage.value);

  const file = new File([blob], "face.jpg", {
    type: "image/jpeg",
  });

  console.log("VERIFY FILE:", file);
  console.log("VERIFY FILE NAME:", file.name);
  console.log("VERIFY FILE SIZE:", file.size);
  console.log("VERIFY FILE TYPE:", file.type);

  formData.append("face_image", file);
  try {
    const response = await verifyFaceAPI(formData);

    if (response.data.data.verified) {
      localStorage.setItem("face_token", token.value);

      openPopup(
        `Wajah berhasil diverifikasi (${Math.round(
          response.data.data.confidence_score * 100,
        )}%)`,
        "success",
      );

      setTimeout(() => {
        router.push("/employee/scan");
      }, 1500);
    }
  } catch (error) {
    const code = error.response?.data?.code;

    const message = error.response?.data?.message;

    if (error.response?.data?.code === "FACE_MISMATCH") {
      openPopup("Wajah tidak dikenali, coba lagi", "error");
    } else {
      openPopup(message || "Verifikasi gagal", "error");
    }

    resetLiveness();
  }
}
</script>

<template>
  <div class="wrapper">
    <div class="header">
      <button type="button" class="back-btn" @click="goBack">
        <img src="/goBack.png" alt="" />
      </button>
      <p>Face Verification</p>
      <h1>Verifikasi Wajah</h1>
    </div>

    <div class="camera-box">
      <video ref="videoRef" autoplay muted playsinline></video>

      <div class="frame"></div>
    </div>

    <div class="status-card">
      <p v-if="faceDetected">✓ Wajah Terdeteksi</p>

      <p v-else>✗ Wajah Tidak Terdeteksi</p>

      <p v-if="verificationStarted">
        {{ instructions[currentStep] }}
      </p>
    </div>

    <div v-if="frontendSimilarity !== null" class="similarity-box">
      Similarity:
      {{ (frontendSimilarity * 100).toFixed(2) }}%
    </div>

    <button
      v-if="!verificationStarted"
      class="action-btn"
      @click="startCheckIn"
    >
      {{ loading ? "Meminta Token..." : "Mulai Verifikasi" }}
    </button>

    <div v-if="showPopup" class="popup" :class="popupType">
      {{ popupMessage }}
    </div>
    <img v-if="capturedImage" :src="capturedImage" class="preview" />
  </div>
</template>

<style scoped>
.wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding-bottom: 40px;
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
  width: calc(100% - 32px);
  max-width: 520px;
  margin: 28px auto 18px;
}

.header p {
  margin: 0 0 6px;
  color: #2563eb;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.header h1 {
  margin: 0;
  color: #0f172a;
  font-size: 28px;
  font-weight: 800;
  line-height: 1.15;
}

.camera-box {
  position: relative;
  width: calc(100% - 32px);
  max-width: 420px;
  aspect-ratio: 3 / 4;
  margin: 0 auto 18px;
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
  width: 65%;
  height: 75%;
  border: 3px solid rgba(255, 255, 255, 0.92);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 28px;
  box-shadow: 0 0 0 999px rgba(15, 23, 42, 0.16);
}

.status-card {
  width: calc(100% - 32px);
  max-width: 420px;
  margin: 0 auto;
  padding: 18px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.92);
  color: #0f172a;
  text-align: center;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.06);
}

.status-card p {
  margin: 0;
  font-size: 14px;
  font-weight: 800;
  line-height: 1.5;
}

.status-card p + p {
  margin-top: 8px;
  color: #64748b;
  font-weight: 700;
}

.action-btn {
  width: calc(100% - 32px);
  max-width: 420px;
  min-height: 54px;
  margin: 20px auto;
  border: 1px solid transparent;
  border-radius: 16px;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #ffffff;
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 12px 26px rgba(37, 99, 235, 0.24);
}

.preview {
  width: calc(100% - 32px);
  max-width: 420px;
  margin: 20px auto;
  border-radius: 24px;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.1);
}

@media (min-width: 768px) {
  .camera-box,
  .status-card,
  .action-btn,
  .preview,
  .header {
    max-width: 520px;
  }
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
  margin-bottom: 10px;
}

.back-btn img {
  width: 18px;
  height: 18px;
  object-fit: contain;
  filter: invert(37%) sepia(89%) saturate(2342%) hue-rotate(213deg)
    brightness(96%) contrast(92%);
}

.similarity-box {
  margin-top: 12px;
  padding: 12px;
  border-radius: 12px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  text-align: center;
  font-weight: 600;
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

  color: #fff;

  font-size: 14px;
  font-weight: 700;

  text-align: center;

  z-index: 9999;

  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.18);
}

.popup.success {
  background: #16a34a;
}

.popup.error {
  background: #dc2626;
}
</style>
