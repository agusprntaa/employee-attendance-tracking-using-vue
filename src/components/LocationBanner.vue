<script setup>
defineProps({
  isInRadius: Boolean,
  distance: Number,
  nearestOffice: Object,
});
</script>

<template>
  <aside
    v-if="nearestOffice"
    class="banner"
    :class="isInRadius ? 'inside' : 'outside'"
  >
    <div class="status-dot" aria-hidden="true"></div>

    <div class="banner-content">
      <p class="status">
        {{ isInRadius ? "Dalam radius kantor" : "Di luar radius kantor" }}
      </p>

      <template v-if="!isInRadius">
        <p class="office">Kantor terdekat: {{ nearestOffice.name }}</p>

        <small class="distance" v-if="distance !== null && !isNaN(distance)">
          Jarak {{ Math.round(distance) }} m
        </small>
      </template>
    </div>
  </aside>
</template>

<style scoped>
.banner {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
  padding: 16px;
  margin-bottom: 16px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.06);
}

.status-dot {
  flex-shrink: 0;
  width: 12px;
  height: 12px;
  margin-top: 4px;
  border-radius: 999px;
}

.banner-content {
  min-width: 0;
}

.status {
  margin: 0;
  color: #0f172a;
  font-size: 14px;
  font-weight: 800;
  line-height: 1.35;
}

.office {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.45;
}

.distance {
  display: inline-flex;
  margin-top: 8px;
  padding: 5px 9px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
}

.inside {
  border-color: rgba(22, 163, 74, 0.16);
}

.inside .status-dot {
  background: #16a34a;
  box-shadow: 0 0 0 5px rgba(22, 163, 74, 0.12);
}

.inside .distance {
  background: #dcfce7;
  color: #15803d;
}

.outside {
  border-color: rgba(217, 119, 6, 0.18);
}

.outside .status-dot {
  background: #d97706;
  box-shadow: 0 0 0 5px rgba(217, 119, 6, 0.12);
}

.outside .distance {
  background: #fef3c7;
  color: #b45309;
}

@media (min-width: 640px) {
  .banner {
    padding: 18px;
    border-radius: 22px;
  }

  .status {
    font-size: 15px;
  }
}
</style>
