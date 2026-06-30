<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { registerFaceAPI } from "@/services/employee";
import {
  destroyFaceLandmarker,
  detectFace,
  initFaceLandmarker,
} from "@/services/faceLandmarker";
import { captureVideoFrame, evaluateFaceFrame } from "@/utils/faceQuality";

const POSES = [
  { key: "front", title: "Hadap lurus", instruction: "Hadapkan wajah lurus ke kamera" },
  { key: "left", title: "Hadap kiri", instruction: "Putar kepala sekitar 30° ke kiri" },
  { key: "right", title: "Hadap kanan", instruction: "Putar kepala sekitar 30° ke kanan" },
  { key: "up", title: "Lihat atas", instruction: "Dongakkan kepala sedikit" },
  { key: "down", title: "Lihat bawah", instruction: "Tundukkan kepala sedikit" },
];

const router = useRouter();
const videoRef = ref(null);
const streamRef = ref(null);
const currentIndex = ref(0);
const photos = ref({});
const previewUrl = ref("");
const quality = ref({ ready: false, message: "Menyiapkan kamera..." });
const stable = ref(false);
const loading = ref(false);
const errorMessage = ref("");

let animationFrame = null;
let readySince = 0;
let lastAnalysisAt = 0;

const currentPose = computed(() => POSES[currentIndex.value]);
const isLastPose = computed(() => currentIndex.value === POSES.length - 1);
const progress = computed(() => ((currentIndex.value + 1) / POSES.length) * 100);

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

function resetStability() {
  readySince = 0;
  stable.value = false;
}

function detectionLoop(timestamp = 0) {
  const video = videoRef.value;

  if (!previewUrl.value && video?.readyState >= 2 && timestamp - lastAnalysisAt > 120) {
    lastAnalysisAt = timestamp;
    const detection = detectFace(video);
    quality.value = evaluateFaceFrame(video, detection, currentPose.value.key);

    if (quality.value.ready) {
      if (!readySince) readySince = performance.now();
      stable.value = performance.now() - readySince >= 800;
      if (!stable.value) quality.value = { ...quality.value, message: "Tahan posisi sebentar..." };
    } else {
      resetStability();
    }
  }

  animationFrame = requestAnimationFrame(detectionLoop);
}

async function capturePhoto() {
  if (!stable.value || loading.value) return;

  try {
    errorMessage.value = "";
    const file = await captureVideoFrame(videoRef.value, `${currentPose.value.key}.jpg`);

    if (file.size > 5 * 1024 * 1024) {
      throw new Error("Ukuran foto melebihi 5MB");
    }

    photos.value = { ...photos.value, [currentPose.value.key]: file };
    previewUrl.value = URL.createObjectURL(file);
  } catch (error) {
    errorMessage.value = error.message || "Gagal mengambil foto";
  }
}

function retakePhoto() {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  previewUrl.value = "";
  const nextPhotos = { ...photos.value };
  delete nextPhotos[currentPose.value.key];
  photos.value = nextPhotos;
  quality.value = { ready: false, message: "Periksa kembali posisi wajah" };
  resetStability();
}

function nextPose() {
  if (!photos.value[currentPose.value.key]) return;
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  previewUrl.value = "";
  currentIndex.value += 1;
  quality.value = { ready: false, message: currentPose.value.instruction };
  resetStability();
}

function resetRegistration() {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  previewUrl.value = "";
  currentIndex.value = 0;
  photos.value = {};
  quality.value = { ready: false, message: POSES[0].instruction };
  resetStability();
}

async function submitRegistration() {
  if (POSES.some((pose) => !photos.value[pose.key]) || loading.value) return;

  loading.value = true;
  errorMessage.value = "";

  try {
    const formData = new FormData();
    POSES.forEach((pose) => formData.append(pose.key, photos.value[pose.key]));
    await registerFaceAPI(formData);

    const storedStatus = JSON.parse(localStorage.getItem("onboarding_status") || "{}");
    localStorage.setItem(
      "onboarding_status",
      JSON.stringify({ ...storedStatus, face_registered: true }),
    );

    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (user) {
      localStorage.setItem("user", JSON.stringify({ ...user, face_registered: true }));
    }

    router.replace("/employee/dashboard");
  } catch (error) {
    const code = error.response?.data?.code;
    errorMessage.value =
      code === "INVALID_FORMAT"
        ? error.response?.data?.message
        : "Gagal memproses foto. Pastikan wajah terlihat jelas di setiap foto, lalu ulangi semua pose.";

    if (code === "INCOMPLETE_POSES" || code === "INTERNAL_ERROR") {
      resetRegistration();
    }
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  localStorage.removeItem("face_embedding");
  localStorage.removeItem("face_token");

  try {
    await initFaceLandmarker();
    await startCamera();
    detectionLoop();
  } catch (error) {
    errorMessage.value =
      error.name === "NotAllowedError"
        ? "Izin kamera ditolak. Aktifkan izin kamera untuk mendaftarkan wajah."
        : "Kamera atau pendeteksi wajah gagal dimuat.";
  }
});

onBeforeUnmount(() => {
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
        <p class="eyebrow">Registrasi wajah</p>
        <h1>Foto {{ currentIndex + 1 }} dari {{ POSES.length }}</h1>
        <p class="subtitle">Kelima foto akan dikirim bersamaan dan diproses aman oleh server.</p>
        <div class="progress"><span :style="{ width: `${progress}%` }"></span></div>
      </header>

      <div class="steps" aria-label="Progress pose wajah">
        <span
          v-for="(pose, index) in POSES"
          :key="pose.key"
          :class="{ active: index === currentIndex, done: Boolean(photos[pose.key]) }"
        >
          {{ index + 1 }}
        </span>
      </div>

      <div class="instruction">
        <strong>{{ currentPose.title }}</strong>
        <span>{{ currentPose.instruction }}</span>
      </div>

      <div class="camera-box">
        <video ref="videoRef" v-show="!previewUrl" autoplay muted playsinline></video>
        <img v-if="previewUrl" :src="previewUrl" alt="Pratinjau foto wajah" />
        <div v-if="!previewUrl" class="face-guide"></div>
      </div>

      <p v-if="!previewUrl" class="quality" :class="{ ready: stable }">
        {{ stable ? "✓ Foto siap diambil" : quality.message }}
      </p>
      <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>

      <button
        v-if="!previewUrl"
        class="primary"
        :disabled="!stable || loading"
        @click="capturePhoto"
      >
        Ambil Foto
      </button>

      <div v-else class="actions">
        <button class="secondary" :disabled="loading" @click="retakePhoto">Ambil Ulang</button>
        <button
          v-if="!isLastPose"
          class="primary"
          :disabled="loading"
          @click="nextPose"
        >
          Pose Berikutnya
        </button>
        <button v-else class="primary" :disabled="loading" @click="submitRegistration">
          {{ loading ? "Mengirim 5 Foto..." : "Daftarkan Wajah" }}
        </button>
      </div>
    </section>
  </main>
</template>

<style scoped>
.page { min-height: 100vh; display: grid; place-items: center; padding: 24px 16px; background: #f1f5f9; color: #0f172a; }
.card { width: min(100%, 520px); padding: 24px; border-radius: 28px; background: white; box-shadow: 0 20px 55px rgba(15, 23, 42, .12); }
.eyebrow { margin: 0 0 6px; color: #2563eb; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; }
h1 { margin: 0; font-size: 28px; }
.subtitle { margin: 8px 0 16px; color: #64748b; line-height: 1.5; }
.progress { height: 6px; overflow: hidden; border-radius: 999px; background: #e2e8f0; }
.progress span { display: block; height: 100%; border-radius: inherit; background: #2563eb; transition: width .25s ease; }
.steps { display: flex; justify-content: space-between; margin: 18px 0; }
.steps span { display: grid; width: 32px; height: 32px; place-items: center; border-radius: 50%; background: #e2e8f0; color: #64748b; font-weight: 800; }
.steps .active { outline: 3px solid #bfdbfe; background: #2563eb; color: white; }
.steps .done { background: #16a34a; color: white; }
.instruction { display: flex; justify-content: space-between; gap: 16px; margin-bottom: 12px; }
.instruction span { color: #64748b; text-align: right; }
.camera-box { position: relative; aspect-ratio: 4 / 3; overflow: hidden; border-radius: 22px; background: #020617; }
.camera-box video, .camera-box img { width: 100%; height: 100%; object-fit: cover; }
.face-guide { position: absolute; inset: 10% 23%; border: 3px solid rgba(255,255,255,.9); border-radius: 48%; box-shadow: 0 0 0 999px rgba(2,6,23,.18); }
.quality { min-height: 24px; margin: 12px 0; color: #b45309; text-align: center; font-weight: 700; }
.quality.ready { color: #15803d; }
.error { padding: 12px; border-radius: 12px; background: #fee2e2; color: #b91c1c; }
.actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
button { min-height: 50px; border: 0; border-radius: 14px; font-weight: 800; cursor: pointer; }
button:disabled { cursor: not-allowed; opacity: .5; }
.primary { width: 100%; background: #2563eb; color: white; }
.secondary { background: #e2e8f0; color: #0f172a; }
@media (max-width: 480px) { .card { padding: 18px; } .instruction { flex-direction: column; gap: 4px; } .instruction span { text-align: left; } }
</style>
