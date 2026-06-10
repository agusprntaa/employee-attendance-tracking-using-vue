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

  if (text.length < 20) {
    error.value = "Minimal 20 karakter";
    return;
  }

  if (text.length > 200) {
    error.value = "Maksimal 200 karakter";
    return;
  }

  error.value = "";
  loading.value = true;

  try {
    const res = await checkInAPI({
      work_type: "WFA",
      wfa_reason: text,
    });

    console.log("FULL RESPONSE:", res);

    console.log("DATA:", res.data);

    console.log("INNER DATA:", res.data.data);

    router.push({
      path: "/employee/success",
      query: {
        type: "wfa",
        time: res.data.data.check_in,
      },
    });
  } catch (err) {
    console.log("FULL ERROR:", err);

    const code = err.response?.data?.code;

    if (code === "NOT_WORK_DAY") {
      error.value = "Hari ini bukan jadwal kerja";
      return;
    }

    if (code === "CUTOFF_EXCEEDED") {
      error.value = "Jam check-in sudah lewat";
      return;
    }

    if (code === "EMPLOYEE_DATA_INCOMPLETE") {
      error.value = "Data employee belum lengkap";
      return;
    }

    if (code === "WFA_REASON_TOO_SHORT") {
      error.value = "Alasan minimal 20 karakter";
      return;
    }

    error.value = err.response?.data?.message || "WFA gagal";
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
      <button type="button" class="back-btn" @click="goBack">
        <img src="/goBack.png" alt="" />
        <span>Kembali</span>
      </button>
    </div>

    <div class="content">
      <section class="page-heading">
        <!-- <p>Work From Anywhere</p> -->
        <h1>Pengajuan WFA</h1>
      </section>

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
        <div class="form-heading">
          <h3>Catatan / Alasan</h3>
          <span>{{ note.trim().length }}/200</span>
        </div>

        <textarea
          v-model="note"
          maxlength="200"
          placeholder="Jelaskan alasan anda bekerja di lokasi ini..."
        ></textarea>

        <p v-if="error" class="error">{{ error }}</p>
      </div>

      <button
        type="button"
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
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 820px;
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
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.back-btn img {
  width: 18px;
  height: 18px;
  object-fit: contain;
  filter: invert(37%) sepia(89%) saturate(2342%) hue-rotate(213deg)
    brightness(96%) contrast(92%);
}

.back-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.08);
}

.content {
  width: 100%;
  max-width: 820px;
  margin: 0 auto;
  padding: 0 16px 112px;
}

.page-heading {
  margin-bottom: 16px;
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

.map-box {
  overflow: hidden;
  margin-top: 16px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 24px;
  background: #ffffff;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.06);
}

iframe {
  width: 100%;
  height: 240px;
  border: none;
  display: block;
}

.form {
  margin-top: 20px;
  padding: 20px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.06);
}

.form-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.form-heading h3 {
  margin: 0;
  color: #0f172a;
  font-size: 18px;
  font-weight: 800;
}

.form-heading span {
  flex-shrink: 0;
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
}

textarea {
  width: 100%;
  min-height: 150px;
  padding: 15px 16px;
  border: 1px solid #cbd5e1;
  border-radius: 16px;
  background: #f8fafc;
  color: #0f172a;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.5;
  resize: vertical;
  outline: none;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;
}

textarea:focus {
  border-color: #2563eb;
  background: #ffffff;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
}

.btn {
  width: 100%;
  margin-top: 24px;
  min-height: 54px;
  border: 1px solid transparent;
  border-radius: 16px;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #ffffff;
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 12px 26px rgba(37, 99, 235, 0.24);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    opacity 0.2s ease;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 16px 30px rgba(37, 99, 235, 0.28);
}

.btn:disabled {
  opacity: 0.58;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.error {
  margin: 12px 0 0;
  padding: 12px 14px;
  border: 1px solid #fecaca;
  border-radius: 14px;
  background: #fef2f2;
  color: #dc2626;
  font-size: 13px;
  font-weight: 800;
  line-height: 1.5;
}

@media (min-width: 768px) {
  .header {
    padding: 18px 24px;
  }

  .content {
    padding: 0 24px 124px;
  }

  iframe {
    height: 300px;
  }
}

@media (max-width: 420px) {
  .back-btn span {
    display: none;
  }
}
</style>
