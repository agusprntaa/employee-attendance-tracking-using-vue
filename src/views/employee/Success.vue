<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

const type = computed(() => route.query.type || "face");
const status = computed(() => route.query.status || "");
const lateMinutes = computed(() => Number(route.query.lateMinutes || 0));
const eventName = computed(() => route.query.eventName || "");

const time = computed(() => {
  const value = route.query.time;
  if (!value) return "-";
  if (/^\d{2}:\d{2}/.test(value)) return value.slice(0, 5);
  return new Date(value).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
});

const date = computed(() => {
  const value = route.query.date;
  const parsed = value ? new Date(`${value}T00:00:00`) : new Date();
  return parsed.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
});

const title = computed(() => {
  if (type.value === "wfa") return "WFA Berhasil";
  if (type.value === "event") return "Absen Event Berhasil";
  return "Check-in Berhasil";
});
</script>

<template>
  <main class="wrapper">
    <section class="content">
      <img src="/success.png" class="image" alt="Berhasil" />
      <h1>{{ title }}</h1>

      <div class="card">
        <strong class="time">{{ time }}</strong>
        <p>{{ date }}</p>
        <p v-if="eventName" class="event-name">{{ eventName }}</p>
        <p v-if="status === 'LATE'" class="late-info">
          Terlambat {{ lateMinutes }} menit
        </p>
        <span class="badge" :class="[type, status]">{{
          status || type.toUpperCase()
        }}</span>
      </div>

      <button @click="router.replace('/employee/dashboard')">Selesai</button>
    </section>
  </main>
</template>

<style scoped>
.wrapper {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px 16px;
  background: #f1f5f9;
  color: #0f172a;
}
.content {
  width: min(100%, 440px);
  text-align: center;
}
.image {
  width: 150px;
  margin-bottom: 12px;
}
h1 {
  margin: 0 0 20px;
  font-size: 28px;
}
.card {
  padding: 26px;
  margin-bottom: 18px;
  border-radius: 24px;
  background: white;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);
}
.time {
  display: block;
  color: #2563eb;
  font-size: 36px;
}
.card p {
  margin: 8px 0 0;
  color: #64748b;
}
.card .event-name {
  color: #0f172a;
  font-weight: 800;
}
.card .late-info {
  color: #b91c1c;
  font-weight: 800;
}
.badge {
  display: inline-flex;
  margin-top: 14px;
  padding: 7px 12px;
  border-radius: 999px;
  background: #dbeafe;
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 800;
}
.badge.ON_TIME {
  background: #dcfce7;
  color: #15803d;
}
.badge.LATE {
  background: #fee2e2;
  color: #b91c1c;
}
button {
  width: 100%;
  min-height: 54px;
  border: 0;
  border-radius: 14px;
  background: #2563eb;
  color: white;
  font-weight: 800;
  cursor: pointer;
}
</style>
