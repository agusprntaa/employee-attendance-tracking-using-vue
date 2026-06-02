<script setup>
import { ref, onMounted, watch } from "vue";
import { useRouter } from "vue-router";

import { useFaceRecognition } from "../../composables/ useFaceRecognition";

import { requestFaceTokenAPI, verifyFaceAPI } from "@/services/attendance";

import { initFaceLandmarker, detectFace } from "@/services/faceLandmarker";

import { estimateYaw } from "@/utils/headPose";

const router = useRouter();

const registeredFace = ref(null);
const hasRegisteredFace = ref(false);

const token = ref("");

const videoRef = ref(null);

const yawValue = ref(0);

const loading = ref(false);

const verificationStarted = ref(false);

let timer = null;

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
  registeredFace.value = localStorage.getItem("registered_face");

  hasRegisteredFace.value = !!registeredFace.value;

  await startCamera();

  await initFaceLandmarker();

  detectLoop();
});

watch(isCompleted, async (value) => {
  if (!value) return;

  captureFace();

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

    token.value = response.data.face_token;

    verificationStarted.value = true;
  } finally {
    loading.value = false;
  }
}

function detectLoop() {
  if (!videoRef.value) {
    requestAnimationFrame(detectLoop);
    return;
  }

  const result = detectFace(videoRef.value);

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

//dummy
async function verifyFace() {
  const formData = new FormData();

  formData.append("face_image", capturedImage.value);

  const response = await verifyFaceAPI(formData);

  if (response.data.success) {
    alert(`Verifikasi berhasil (${response.data.confidence}%)`);

    setTimeout(() => {
      router.push("/employee/scan");
    }, 1000);
  }
}
</script>

<template>
  <div class="wrapper">
    <div class="header">
      <h2>Verifikasi Wajah</h2>
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

    <button
      v-if="!verificationStarted"
      class="action-btn"
      @click="startCheckIn"
    >
      {{ loading ? "Meminta Token..." : "Mulai Verifikasi" }}
    </button>

    <img v-if="capturedImage" :src="capturedImage" class="preview" />
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
  justify-content: center;

  color: white;
}

.camera-box {
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

  width: 240px;
  height: 320px;

  border: 3px solid white;

  top: 50%;
  left: 50%;

  transform: translate(-50%, -50%);

  border-radius: 20px;
}

.status-card {
  width: 90%;

  max-width: 420px;

  margin: 0 auto;

  background: white;

  border-radius: 14px;

  padding: 16px;

  text-align: center;

  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
}

.action-btn {
  width: 90%;
  max-width: 420px;

  margin: 20px auto;

  padding: 14px;

  border: none;

  border-radius: 14px;

  background: #4f46e5;

  color: white;

  font-weight: 600;

  cursor: pointer;
}

.preview {
  width: 90%;

  max-width: 420px;

  margin: 20px auto;

  border-radius: 16px;
}
</style>
