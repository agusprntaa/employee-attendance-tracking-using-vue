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
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 11px;
}

.avatar {
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  display: grid;
  place-items: center;
  border: 2px solid rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  background: linear-gradient(135deg, #6b8cff, #4f46e5);
  color: #ffffff;
  box-shadow: 0 3px 10px rgba(79, 70, 229, 0.22);
  font-size: 14px;
  font-weight: 700;
}

.info {
  min-width: 0;
  max-width: 220px;
}

.name {
  margin: 0;
  overflow: hidden;
  color: #1e1b4b;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.role {
  display: block;
  margin-top: 1px;
  overflow: hidden;
  color: #6b7280;
  font-size: 11px;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 480px) {
  .profile {
    width: 100%;
    padding-top: 14px;
    border-top: 1px solid #e5e7eb;
  }

  .info {
    flex: 1;
    max-width: none;
  }
}
</style>
