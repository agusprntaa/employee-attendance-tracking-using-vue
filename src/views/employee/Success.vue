<script setup>
import { useRouter, useRoute } from "vue-router";
import { ref, onMounted } from "vue";

const router = useRouter();
const route = useRoute();

const time = ref("-");
const date = ref("-");
const type = ref("wfo");

onMounted(() => {
  const checkTime = route.query.time;
  type.value = route.query.type || "wfo";

  //if (!checkTime) {
  //return router.replace('/employee/dashboard')
  //}

  const d = new Date(checkTime);

  time.value = d.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });

  date.value = d.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
});

function goBack() {
  router.push("/employee/dashboard");
}
</script>

<template>
  <div class="wrapper">
    <div class="content">
      <img src="/success.png" class="image" />

      <h2 class="title">
        {{ type === "wfa" ? "WFA Berhasil" : "Absen Sukses" }}
      </h2>

      <div class="card">
        <h1>{{ time }}</h1>
        <p>{{ date }}</p>

        <span class="badge" :class="type">
          {{ type.toUpperCase() }}
        </span>
      </div>

      <button class="btn" @click="goBack">Done</button>
    </div>
  </div>
</template>

<style scoped>
.wrapper {
  min-height: 100vh;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
}

.content {
  width: 100%;
  max-width: 420px;
  padding: 20px;
  text-align: center;
}

.image {
  width: 160px;
  margin: 0 auto 16px;
}

.title {
  color: #4f46e5;
  margin-bottom: 20px;
  font-weight: 600;
}

.card {
  width: 100%;
  background: white;
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
  margin-bottom: 20px;
}

.card h1 {
  font-size: 32px;
  color: #4f46e5;
}

.card p {
  margin-top: 6px;
  font-size: 14px;
  color: #6b7280;
}

.badge {
  display: inline-block;
  margin-top: 12px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.badge.wfo {
  background: #dbeafe;
  color: #1d4ed8;
}

.badge.wfa {
  background: #e0e7ff;
  color: #3730a3;
}

.btn {
  width: 100%;
  padding: 16px;
  border-radius: 14px;
  background: #4f46e5;
  color: white;
  border: none;
  font-weight: 600;
}

@media (min-width: 1024px) {
  .content {
    max-width: 480px;
    padding: 30px;
  }

  .image {
    width: 180px;
  }

  .card {
    padding: 28px;
  }

  .card h1 {
    font-size: 36px;
  }

  .btn {
    padding: 18px;
  }
}
</style>
