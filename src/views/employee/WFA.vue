<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useLocation } from "@/composables/useLocation";
import { checkInAPI } from "@/services/attendance";
import LocationBanner from "@/components/LocationBanner.vue";

const router = useRouter();

const note = ref("");
const error = ref("");
const loading = ref(false);

const {
  latitude,
  longitude,
  accuracy,
  isInRadius,
  distance,
  nearestOffice,
  getCurrentLocation,
} = useLocation();

onMounted(async () => {
  await getCurrentLocation();
});

async function submitWFA() {
  if (loading.value) return;

  const text = note.value.trim();

  if (!text) {
    error.value = "Catatan wajib diisi";
    return;
  }

  if (text.length < 10) {
    error.value = "Minimal 10 karakter";
    return;
  }

  if (text.length > 200) {
    error.value = "Maksimal 200 karakter";
    return;
  }

  error.value = "";
  loading.value = true;

  try {
    await checkInAPI({
      work_type: "WFA",
      wfa_reason: text,
    });

    router.push({
      path: "/employee/success",
      query: {
        type: "wfa",
        time: new Date().toISOString(),
      },
    });
  } catch (err) {
    error.value = err.response?.data?.message || "Gagal submit WFA";
  } finally {
    loading.value = false;
  }
}

function goBack() {
  router.back();
}
</script>

<template>
  <div class="wrapper">
    <div class="header">
      <img src="/goBack.png" class="back" @click="goBack" />
    </div>

    <div class="content">
      <LocationBanner
        :isInRadius="isInRadius"
        :distance="distance"
        :nearestOffice="nearestOffice"
      />

      <div class="map-box">
        <iframe
          v-if="latitude && longitude"
          :src="`https://www.google.com/maps?q=${latitude},${longitude}&z=17&output=embed`"
        ></iframe>
      </div>

      <div class="form">
        <h3>Catatan / Alasan</h3>

        <textarea
          v-model="note"
          maxlength="200"
          placeholder="Jelaskan alasan anda bekerja di lokasi ini..."
        ></textarea>

        <p v-if="error" class="error">{{ error }}</p>

        <p class="counter">{{ note.trim().length }}/200</p>
      </div>

      <button
        class="btn"
        @click="submitWFA"
        :disabled="loading || note.trim().length < 1"
      >
        {{ loading ? "Mengirim..." : "Kirim" }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.wrapper {
  min-height: 100vh;
  background: #f3f4f6;
}

.header {
  height: 60px;
  background: #4f46e5;
  display: flex;
  align-items: center;
  padding: 0 20px;
}

.content {
  width: 100%;
  max-width: 640px;
  margin: 0 auto;
  padding: 20px;
}

@media (min-width: 1024px) {
  .content {
    max-width: 820px;
    padding: 30px 40px;
  }
}

.back {
  width: 24px;
  cursor: pointer;
}

.map-box {
  margin-top: 16px;
  border-radius: 16px;
  overflow: hidden;
}

iframe {
  width: 100%;
  height: 220px;
  border: none;
  display: block;
}

@media (min-width: 1024px) {
  iframe {
    height: 280px;
  }
}

.form {
  margin-top: 20px;
}

textarea {
  width: 100%;
  height: 140px;
  border-radius: 16px;
  border: none;
  padding: 16px;
  margin-top: 10px;
  background: #e5e7eb;
  resize: none;
  outline: none;
}

@media (min-width: 1024px) {
  textarea {
    height: 160px;
  }
}

.btn {
  width: 100%;
  margin-top: 24px;
  padding: 16px;
  border-radius: 14px;
  background: #4f46e5;
  color: white;
  border: none;
  font-weight: 600;
}

@media (min-width: 1024px) {
  .btn {
    padding: 18px;
  }
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error {
  color: #dc2626;
  font-size: 12px;
  margin-top: 6px;
}

.counter {
  font-size: 12px;
  text-align: right;
  margin-top: 6px;
  color: #6b7280;
}
</style>
