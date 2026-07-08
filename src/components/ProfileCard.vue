<script setup>
import { ref, watch, onMounted } from "vue";
import { useRouter } from "vue-router";
import API from "@/services/api";

const props = defineProps({
  user: Object,
});

const router = useRouter();

const BASE_URL = import.meta.env.VITE_API_URL;

const imageError = ref(false);
const photoPreview = ref("");

function getInitials(name) {
  return name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const todayDate = new Date().toLocaleDateString("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

// bukan function endpoint dari be
// function getPhotoUrl(path) {
//   if (!path) return "";

//   // reset error kalau url berubah
//   imageError.value = false;

//   // kalau backend sudah full url
//   if (path.startsWith("http")) {
//     return path;
//   }

//   // hapus slash depan
//   const cleanPath = path.replace(/^\/+/, "");

//   // ubah backslash windows jadi slash normal
//   return `${BASE_URL}/${cleanPath.replace(/\\/g, "/")}`;
// }

async function loadPhoto(path) {
  try {
    if (!path) {
      photoPreview.value = "";
      return;
    }

    imageError.value = false;

    // kalau backend kirim old path
    const filename = path.replace(/\\/g, "/").split("/").pop();

    const endpoint = `/employee/profile/photo/view/${filename}`;

    const res = await API.get(endpoint, {
      responseType: "blob",
    });

    photoPreview.value = URL.createObjectURL(res.data);

  } catch (err) {
    imageError.value = true;

  }
}

watch(
  () => props.user?.photo_url,
  async (newPhoto) => {
    if (newPhoto) {
      await loadPhoto(newPhoto);
    }
  },
  {
    immediate: true,
  },
);

function goToBiodata() {
  router.push("/employee/biodata");
}

function goToChangePassword() {
  router.push("/employee/change-password");
}
</script>

<template>
  <article class="profile-card" v-if="user" @click="goToBiodata">
    <div class="top">
      <div class="avatar" aria-hidden="true">
        <img
          v-if="photoPreview && !imageError"
          :src="photoPreview"
          alt="Foto profil"
          @error="imageError = true"
        />

        <span v-else>
          {{ getInitials(user.name) }}
        </span>
      </div>

      <div class="info">
        <span class="badge">
          Divisi {{ user.division_name || "-" }}
        </span>

        <h3>{{ user.name }}</h3>

        <p>{{ todayDate }}</p>
      </div>
    </div>

    <div class="divider"></div>

    <button type="button" class="btn-change" @click.stop="goToChangePassword()">
      Ubah Password
    </button>
  </article>
</template>

<style scoped>
.profile-card {
  width: 100%;
  padding: 20px;
  margin-bottom: 0;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 24px;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.06);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.profile-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 20px 44px rgba(15, 23, 42, 0.08);
}

.top {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 62px;
  height: 62px;
  overflow: hidden;
  border: 4px solid #dbeafe;
  border-radius: 20px;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #ffffff;
  font-size: 18px;
  font-weight: 800;
  box-shadow: 0 12px 24px rgba(37, 99, 235, 0.22);
}

.avatar img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar span {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.info {
  flex: 1;
  min-width: 0;
}

.info h3 {
  margin: 7px 0 4px;
  color: #0f172a;
  font-size: 18px;
  font-weight: 800;
  line-height: 1.2;
  overflow-wrap: anywhere;
}

.info p {
  margin: 0;
  color: #64748b;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.45;
}

.badge {
  display: inline-flex;
  max-width: 100%;
  padding: 6px 10px;
  overflow: hidden;
  border-radius: 999px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 11px;
  font-weight: 800;
  line-height: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.divider {
  margin: 18px 0;
  border-top: 1px solid #e2e8f0;
}

.btn-change {
  width: 100%;
  min-height: 50px;
  padding: 0 16px;
  border: 1px solid transparent;
  border-radius: 16px;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #ffffff;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 12px 26px rgba(37, 99, 235, 0.22);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.btn-change:hover {
  transform: translateY(-1px);
  box-shadow: 0 16px 30px rgba(37, 99, 235, 0.28);
}

.btn-change:active {
  transform: scale(0.98);
}

@media (min-width: 768px) {
  .profile-card {
    padding: 22px;
  }

  .avatar {
    width: 72px;
    height: 72px;
    font-size: 22px;
  }
}

@media (max-width: 380px) {
  .top {
    align-items: flex-start;
  }

  .avatar {
    width: 56px;
    height: 56px;
    border-radius: 18px;
  }
}
</style>
