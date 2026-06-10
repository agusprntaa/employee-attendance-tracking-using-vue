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
  });

  date.value = d.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
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
      <!-- <img src="/loading.gif" class="image" /> -->

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
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(
      circle at top left,
      rgba(37, 99, 235, 0.12),
      transparent 30rem
    ),
    #f8fafc;
  color: #0f172a;
}

.content {
  width: 100%;
  max-width: 420px;
  padding: 24px 16px;
  text-align: center;
}

.image {
  width: 150px;
  margin: 0 auto 16px;
}

.title {
  color: #0f172a;
  margin-bottom: 20px;
  font-size: 24px;
  font-weight: 800;
}

.card {
  width: 100%;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.06);
  margin-bottom: 20px;
}

.card h1 {
  font-size: 32px;
  color: #2563eb;
  font-weight: 800;
}

.card p {
  margin-top: 6px;
  font-size: 14px;
  color: #6b7280;
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 12px;
  padding: 7px 12px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
}

.badge.wfo {
  background: #dbeafe;
  color: #1d4ed8;
}

.badge.wfa {
  background: #eff6ff;
  color: #2563eb;
}

.btn {
  width: 100%;
  min-height: 54px;
  border-radius: 16px;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #ffffff;
  border: 1px solid transparent;
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 12px 26px rgba(37, 99, 235, 0.24);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 16px 30px rgba(37, 99, 235, 0.28);
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
    min-height: 56px;
  }
}
</style>
