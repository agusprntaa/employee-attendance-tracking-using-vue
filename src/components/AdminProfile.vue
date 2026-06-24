<script setup>
defineProps({
  user: Object,
});

function formatRole(role) {
  if (role === "admin_cabang") return "Admin Cabang";
  if (role === "super_admin") return "Admin Pusat";
  if (role === "admin") return "Admin";
  return role;
}

function getInitial(name) {
  return name?.charAt(0)?.toUpperCase() || "A";
}
</script>

<template>
  <div class="profile" v-if="user">
    <div class="avatar">
      {{ getInitial(user.name) }}
    </div>

    <div class="info">
      <p class="name">{{ user.name }}</p>
      <small class="role">
        {{ formatRole(user.role) }}
        <span v-if="user.branch_name"> • {{ user.branch_name }} </span>
      </small>
    </div>
  </div>
</template>

<style scoped>
.profile {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6b8cff, #4f46e5);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

.name {
  font-size: 13px;
  font-weight: 600;
}

.role {
  font-size: 11px;
  color: #6b7280;
}
</style>
