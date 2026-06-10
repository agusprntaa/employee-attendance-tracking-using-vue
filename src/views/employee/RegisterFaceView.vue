<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from "vue";
import { useRouter } from "vue-router";

import { registerFaceAPI } from "@/services/attendance";

import { initImageEmbedder, getEmbedding } from "@/services/imageEmbedder";

const router = useRouter();

const streamRef = ref(null);

const videoRef = ref(null);

const loading = ref(false);

const capturedImage = ref(null);

async function startCamera() {
  try {
    streamRef.value = await navigator.mediaDevices.getUserMedia({
      video: true,
    });

    if (!videoRef.value) {
      return;
    }

    videoRef.value.srcObject = streamRef.value;

    // videoRef.value.srcObject = stream;
  } catch (error) {
    console.error(error);
    alert("Gagal mengakses kamera");
  }
}

function stopCamera() {
  if (!streamRef.value) return;

  streamRef.value.getTracks().forEach((track) => track.stop());

  streamRef.value = null;
}

function captureFace() {
  const video = videoRef.value;

  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext("2d");

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  capturedImage.value = canvas.toDataURL("image/jpeg");
}

function retakePhoto() {
  capturedImage.value = null;
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

async function saveEmbedding() {
  const img = await dataUrlToImage(capturedImage.value);

  await initImageEmbedder();

  const embedding = await getEmbedding(img);

  localStorage.setItem(
    "face_embedding",
    JSON.stringify(embedding.floatEmbedding),
  );
}

async function saveFace() {
  if (!capturedImage.value) return;

  loading.value = true;

  try {
    const formData = new FormData();

    const blob = dataUrlToBlob(capturedImage.value);

    const file = new File([blob], "face.jpg", {
      type: "image/jpeg",
    });

    console.log("FILE:", file);
    console.log("FILE SIZE:", file.size);
    console.log("FILE TYPE:", file.type);
    console.log("FILE:", file);
    console.log("FILE NAME:", file.name);
    console.log("FILE TYPE:", file.type);

    formData.append("face_image", file);

    for (const pair of formData.entries()) {
      console.log("FORM DATA:", pair[0], pair[1]);
    }

    await saveEmbedding();

    const response = await registerFaceAPI(formData);

    console.log("REGISTER RESPONSE:", response.data);

    // const user = JSON.parse(localStorage.getItem("user"));

    // if (user) {
    //   user.face_reference_path = "uploaded";

    //   localStorage.setItem("user", JSON.stringify(user));
    // }

    stopCamera();

    router.push("/employee/biodata");
  } catch (error) {
    console.log("REGISTER ERROR:", error.response?.data);

    console.log("REGISTER STATUS:", error.response?.status);

    alert(error.response?.data?.message || "Gagal menyimpan foto wajah");
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await nextTick();

  await startCamera();
});

onBeforeUnmount(() => {
  stopCamera();
});
</script>

<template>
  <div class="wrapper">
    <div class="header">
      <!-- <p>Face Enrollment</p> -->
      <h1>Upload Foto Wajah</h1>
    </div>

    <div class="status-card">
      <p>
        Foto ini akan digunakan sebagai referensi untuk proses verifikasi wajah
        saat check-in.
      </p>
    </div>

    <div class="camera-box">
      <video v-if="!capturedImage" ref="videoRef" autoplay muted playsinline />

      <img v-else :src="capturedImage" class="preview-image" />

      <div v-if="!capturedImage" class="frame" />
    </div>

    <button v-if="!capturedImage" class="action-btn" @click="captureFace">
      Ambil Foto
    </button>

    <template v-else>
      <button class="secondary-btn" @click="retakePhoto">Ambil Ulang</button>

      <button class="action-btn" @click="saveFace">
        {{ loading ? "Menyimpan..." : "Simpan Foto" }}
      </button>
    </template>
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
  border-radius: 28px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
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
  text-align: center;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.06);
}

.status-card p {
  margin: 0 0 8px;
  color: #0f172a;
  font-size: 14px;
  font-weight: 800;
  line-height: 1.5;
}

.action-btn {
  width: calc(100% - 32px);
  max-width: 420px;
  margin: 24px auto;
  height: 54px;
  border: 1px solid transparent;
  border-radius: 16px;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #ffffff;
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 12px 26px rgba(37, 99, 235, 0.24);
}

@media (min-width: 768px) {
  .camera-box,
  .status-card,
  .action-btn {
    max-width: 520px;
  }

  .header h1 {
    font-size: 32px;
  }
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.secondary-btn {
  width: calc(100% - 32px);
  max-width: 420px;
  margin: 16px auto 0;
  height: 54px;
  border: 1px solid #cbd5e1;
  border-radius: 16px;
  background: #ffffff;
  color: #0f172a;
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
}

.status-card {
  color: #475569;
}
</style>
