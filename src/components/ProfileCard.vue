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

    console.log("PROFILE CARD FETCH:", `${BASE_URL}${endpoint}`);

    const res = await API.get(endpoint, {
      responseType: "blob",
    });

    photoPreview.value = URL.createObjectURL(res.data);

    console.log("%cPROFILE CARD IMAGE SUCCESS", "color:green;font-weight:bold");
  } catch (err) {
    imageError.value = true;

    console.log("%cPROFILE CARD IMAGE FAILED", "color:red;font-weight:bold");

    console.log(err);
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
  <div class="profile-card" v-if="user" @click="goToBiodata">
    <div class="top">
      <div class="avatar">
        <img
          v-if="photoPreview && !imageError"
          :src="photoPreview"
          alt="profile"
          @error="imageError = true"
        />

        <span v-else>
          {{ getInitials(user.name) }}
        </span>
      </div>

      <div class="info">
        <span class="badge">
          DIVISI
          {{ user.division_name }}
        </span>

        <h3>{{ user.name }}</h3>

        <p>{{ todayDate }}</p>
      </div>
    </div>

    <div class="divider"></div>

    <button class="btn-change" @click.stop="goToChangePassword()">
      UBAH PASSWORD
    </button>
  </div>
</template>

<style scoped>
.profile-card {
  cursor: pointer;

  background: #ffffff;

  padding: 20px;

  border-radius: 24px;

  margin-bottom: 18px;

  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);

  transition: all 0.25s ease;
}

.profile-card:hover {
  transform: translateY(-2px);

  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.08);
}

.top {
  display: flex;
  align-items: center;

  gap: 14px;
}

.avatar {
  width: 60px;
  height: 60px;

  border-radius: 50%;

  overflow: hidden;

  flex-shrink: 0;

  background: linear-gradient(135deg, #6366f1, #4f46e5);

  display: flex;
  align-items: center;
  justify-content: center;

  color: white;

  font-size: 18px;
  font-weight: 700;

  box-shadow: 0 6px 16px rgba(79, 70, 229, 0.25);
}

.avatar img {
  width: 100%;
  height: 100%;

  object-fit: cover;

  display: block;
}

.avatar span {
  width: 100%;
  height: 100%;

  display: flex;
  align-items: center;
  justify-content: center;
}

.info {
  flex: 1;
}

.info h3 {
  margin: 5px 0;

  font-size: 16px;
  font-weight: 700;

  color: #111827;
}

.info p {
  font-size: 12px;

  color: #6b7280;
}

.badge {
  display: inline-block;

  background: #eef2ff;
  color: #4338ca;

  padding: 5px 10px;

  border-radius: 999px;

  font-size: 10px;
  font-weight: 700;

  letter-spacing: 0.4px;
}

.divider {
  border-top: 1px dashed #e5e7eb;

  margin: 18px 0;
}

.btn-change {
  width: 100%;

  border: none;

  padding: 14px;

  border-radius: 16px;

  background: linear-gradient(135deg, #6366f1, #4f46e5);

  color: white;

  font-size: 13px;
  font-weight: 700;

  cursor: pointer;

  transition: all 0.25s ease;

  box-shadow: 0 6px 18px rgba(79, 70, 229, 0.25);
}

.btn-change:hover {
  transform: translateY(-2px);

  box-shadow: 0 10px 26px rgba(79, 70, 229, 0.35);
}

.btn-change:active {
  transform: scale(0.98);
}

@media (min-width: 1024px) {
  .profile-card {
    padding: 24px;
  }

  .avatar {
    width: 68px;
    height: 68px;

    font-size: 20px;
  }

  .info h3 {
    font-size: 17px;
  }

  .btn-change {
    padding: 15px;
  }
}
</style>
