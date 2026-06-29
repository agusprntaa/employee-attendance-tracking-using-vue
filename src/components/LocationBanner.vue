<script setup>
defineProps({
  isInRadius: Boolean,
  distance: Number,
  nearestOffice: Object,
});
</script>

<template>
  <div
    v-if="nearestOffice"
    class="banner"
    :class="isInRadius ? 'inside' : 'outside'"
  >
    <p class="status">
      {{ isInRadius ? "Dalam radius kantor" : "Di luar radius kantor" }}
    </p>

    <template v-if="!isInRadius">
      <p class="office">Kantor terdekat: {{ nearestOffice.name }}</p>

      <small class="distance" v-if="distance !== null && !isNaN(distance)">
        Jarak: {{ Math.round(distance) }} m
      </small>
    </template>
  </div>
</template>

<style scoped>
.banner {
  width: 100%;
  padding: 14px 16px;
  border-radius: 16px;
  margin-bottom: 16px;
  text-align: center;
  transition: all 0.25s ease;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.04);
}

.status {
  font-weight: 600;
  font-size: 14px;
  line-height: 1.4;
}

.office {
  margin-top: 6px;
  font-size: 13px;
  opacity: 0.85;
}

.distance {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  opacity: 0.7;
}

.inside {
  background: #e6f4ea;
  color: #2e7d32;
}

.outside {
  background: #f5eed1;
  color: #92400e;
}

@media (min-width: 640px) {
  .banner {
    padding: 16px 18px;
    border-radius: 18px;
  }

  .status {
    font-size: 15px;
  }

  .office {
    font-size: 14px;
  }

  .distance {
    font-size: 13px;
  }
}

@media (min-width: 1024px) {
  .banner {
    padding: 18px 20px;
    border-radius: 20px;
  }

  .status {
    font-size: 16px;
  }

  .office {
    font-size: 15px;
  }

  .distance {
    font-size: 14px;
  }
}

@media (min-width: 1200px) {
  .banner {
    padding: 22px 28px;

    display: flex;
    align-items: center;
    justify-content: space-between;

    text-align: left;
  }

  .office {
    margin-top: 0;
  }

  .distance {
    margin-top: 0;
  }
}
</style>
