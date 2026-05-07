<script setup>
import { useRouter } from "vue-router";

defineProps({
  user: Object,
});

const router = useRouter();

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

function goToChangePassword() {
  router.push("/employee/change-password");
}
</script>

<template>
  <div class="profile-card" v-if="user">
    <div class="top">
      <div class="avatar">
        {{ getInitials(user.name) }}
      </div>

      <div class="info">
        <span class="badge">DIVISI {{ user.division_name }}</span>
        <h3>{{ user.name }}</h3>
        <p>{{ todayDate }}</p>
      </div>
    </div>

    <div class="divider"></div>

    <button class="btn-change" @click="goToChangePassword">
      UBAH PASSWORD
    </button>
  </div>
</template>

<style scoped>
.profile-card {
  background: #ffffff;
  padding: 20px;
  border-radius: 20px;
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
  gap: 14px;
  align-items: center;
}

.avatar {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 18px;
  flex-shrink: 0;
  box-shadow: 0 6px 16px rgba(79, 70, 229, 0.25);
}

.info h3 {
  margin: 4px 0;
  font-size: 15px;
  font-weight: 600;
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
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.3px;
}

.divider {
  border-top: 1px dashed #e5e7eb;
  margin: 18px 0;
}

.btn-change {
  width: 100%;
  padding: 13px;
  border-radius: 14px;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: white;
  border: none;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: 0 6px 18px rgba(79, 70, 229, 0.25);
}

.btn-change:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 26px rgba(79, 70, 229, 0.35);
}

.btn-change:active {
  transform: scale(0.97);
}

@media (min-width: 1024px) {
  .profile-card {
    padding: 24px;
  }

  .avatar {
    width: 64px;
    height: 64px;
    font-size: 20px;
  }

  .info h3 {
    font-size: 16px;
  }

  .btn-change {
    padding: 15px;
  }
}
</style>
