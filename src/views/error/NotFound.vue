<script setup>
import { useRouter } from "vue-router";

const router = useRouter();
</script>

<template>
  <main class="error-page">
    <section class="error-card">
      <p class="code">404</p>
      <h1>Halaman tidak ditemukan</h1>
      <p class="message">
        Alamat yang Anda buka tidak tersedia atau sudah dipindahkan.
      </p>
      <button type="button" @click="router.replace('/')">
        Kembali ke Beranda
      </button>
    </section>
  </main>
</template>

<style scoped>
.error-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background: #f8fafc;
  color: #0f172a;
}

.error-card {
  width: 100%;
  max-width: 420px;
  padding: 32px;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  background: #ffffff;
  text-align: center;
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.08);
}

.code {
  color: #4f46e5;
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.12em;
}

h1 {
  margin-top: 10px;
  font-size: 28px;
}

.message {
  margin: 12px 0 24px;
  color: #64748b;
  line-height: 1.6;
}

button {
  min-height: 44px;
  border: 0;
  border-radius: 10px;
  padding: 0 18px;
  background: #4f46e5;
  color: #ffffff;
  font-weight: 700;
  cursor: pointer;
}
</style>
