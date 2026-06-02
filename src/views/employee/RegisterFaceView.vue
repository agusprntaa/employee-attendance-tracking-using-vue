<script setup>
import { ref, onMounted, watch } from "vue";
import { useFaceRecognition } from "../../composables/ useFaceRecognition";
import { registerFaceAPI } from "@/services/attendance";

import { initFaceLandmarker, detectFace } from "@/services/faceLandmarker";
import { estimateYaw } from "@/utils/headPose";
const videoRef = ref(null);
const yawValue = ref(0);
const countdown = ref(10);
const verificationStarted = ref(false);
let faceDetector = null;
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

async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
    });

    videoRef.value.srcObject = stream;
  } catch (error) {
    console.error(error);
  }
}

function startVerification() {
  resetLiveness();

  verificationStarted.value = true;

  countdown.value = 10;

  startTimer();
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
  // STEP 1
  if (currentStep.value === 0 && Math.abs(yaw) < 0.04) {
    nextStep();

    return;
  }

  // STEP 2
  if (currentStep.value === 1 && yaw < -0.08) {
    nextStep();

    return;
  }

  // STEP 3
  if (currentStep.value === 2 && yaw > 0.08) {
    nextStep();

    return;
  }

  // STEP 4
  if (currentStep.value === 3 && Math.abs(yaw) < 0.04) {
    nextStep();

    return;
  }
}

function captureFace() {
  const video = videoRef.value;

  const canvas = document.createElement("canvas");

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext("2d");

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const image = canvas.toDataURL("image/jpeg");

  setCapturedImage(image);
}

async function saveFace() {
  localStorage.setItem("registered_face", capturedImage.value);

  alert("Wajah berhasil disimpan");

  console.log("FACE SAVED");
}

onMounted(async () => {
  await startCamera();

  faceDetector = await initFaceLandmarker();

  detectLoop();
});

watch(isCompleted, (value) => {
  console.log("isCompleted:", value);

  if (!value) return;

  clearInterval(timer);

  if (!capturedImage.value) {
    captureFace();
  }

  verificationStarted.value = false;
});

watch(currentStep, () => {
  if (verificationStarted.value && !isCompleted.value) {
    startTimer();
  }
});

function startTimer() {
  clearInterval(timer);

  countdown.value = 10;

  timer = setInterval(() => {
    countdown.value--;

    if (countdown.value <= 0) {
      clearInterval(timer);

      countdown.value = 10;

      verificationStarted.value = false;

      setCapturedImage(null);

      alert("Waktu habis, ulangi verifikasi");

      resetLiveness();
    }
  }, 1000);
}
</script>

<template>
  <div class="wrapper">
    <div class="header">
      <h2>Registrasi Wajah</h2>
    </div>

    <div class="camera-box">
      <video ref="videoRef" autoplay playsinline muted></video>

      <div class="frame"></div>
    </div>

    <div class="status-card">
      <p v-if="faceDetected">✓ Wajah Terdeteksi</p>

      <p v-else>✗ Wajah Tidak Terdeteksi</p>

      <template v-if="verificationStarted && !isCompleted">
        <p class="instruction">
          {{ instructions[currentStep] }}
        </p>

        <p class="countdown">
          Sisa waktu:
          {{ countdown }} detik
        </p>

        <p class="step">
          Langkah
          {{ currentStep + 1 }}
          / 4
        </p>

        <div class="progress">
          <div
            class="progress-fill"
            :style="{
              width: `${((currentStep + 1) / 4) * 100}%`,
            }"
          />
        </div>
      </template>

      <template v-if="isCompleted && capturedImage">
        <p class="success">✓ Verifikasi Berhasil</p>
      </template>
    </div>

    <img v-if="capturedImage" :src="capturedImage" class="preview" />

    <button
      v-if="!verificationStarted && !capturedImage"
      class="action-btn"
      @click="startVerification"
    >
      Mulai Verifikasi
    </button>

    <button v-if="capturedImage" class="action-btn" @click="saveFace">
      Simpan Wajah
    </button>
  </div>
</template>

<style scoped>
.wrapper {
  min-height: 100vh;

  background: #f5f7fb;

  display: flex;
  flex-direction: column;

  padding-bottom: 40px;
}

.header {
  padding: 32px 20px 20px;

  text-align: center;

  color: white;

  background: linear-gradient(135deg, #4f46e5, #4338ca);
}

.header h2 {
  font-size: 24px;
  font-weight: 700;

  margin-bottom: 6px;
}

.start-section {
  width: calc(100% - 32px);

  max-width: 420px;

  margin: 24px auto 0;

  text-align: center;
}

.hint {
  margin-top: 12px;

  color: #6b7280;

  font-size: 14px;
}

.camera-box {
  position: relative;

  width: calc(100% - 32px);

  max-width: 420px;

  aspect-ratio: 3 / 4;

  margin: 24px auto;

  border-radius: 28px;

  overflow: hidden;

  background: #000;

  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.12);
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

  border: 3px solid white;

  border-radius: 28px;

  top: 50%;
  left: 50%;

  transform: translate(-50%, -50%);
}

.status-card {
  width: calc(100% - 32px);

  max-width: 420px;

  margin: 0 auto;

  padding: 20px;

  border-radius: 24px;

  background: white;

  text-align: center;

  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
}

.status-card p {
  margin-bottom: 8px;
}

.action-btn {
  width: calc(100% - 32px);

  max-width: 420px;

  margin: 24px auto;

  height: 54px;

  border: none;

  border-radius: 18px;

  background: linear-gradient(135deg, #4f46e5, #4338ca);

  color: white;

  font-size: 15px;
  font-weight: 700;

  cursor: pointer;

  box-shadow: 0 10px 24px rgba(79, 70, 229, 0.25);
}

.preview {
  width: calc(100% - 32px);

  max-width: 420px;

  margin: 24px auto 0;

  border-radius: 24px;

  overflow: hidden;

  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
}

.progress {
  width: 100%;

  height: 8px;

  background: #e5e7eb;

  border-radius: 999px;

  overflow: hidden;

  margin-top: 10px;
}

.progress-fill {
  height: 100%;

  background: #22c55e;

  transition: width 0.3s ease;
}

@media (min-width: 768px) {
  .camera-box,
  .status-card,
  .action-btn,
  .preview,
  .start-section {
    max-width: 520px;
  }

  .header h2 {
    font-size: 28px;
  }
}
</style>
