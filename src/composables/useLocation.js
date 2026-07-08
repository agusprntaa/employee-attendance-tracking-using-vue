import { ref } from 'vue'
import { getDistance } from '@/utils/geo'
import { OFFICE_LOCATIONS } from '@/config/location'

export function useLocation() {
  const latitude = ref(null)
  const longitude = ref(null)
  const accuracy = ref(null)

  const distance = ref(0)
  const isInRadius = ref(false)
  const nearestOffice = ref(null)

  const error = ref('')
  const loading = ref(false)

  function calculateNearestOffice() {
    let minDistance = Infinity
    let selectedOffice = null

    for (const office of OFFICE_LOCATIONS) {
      const dist = getDistance(
        office.lat,
        office.lon,
        latitude.value,
        longitude.value
      )

      if (dist < minDistance) {
        minDistance = dist
        selectedOffice = office
      }
    }

    distance.value = minDistance
    nearestOffice.value = selectedOffice

    // validasi radius
    if (accuracy.value > 50) {
      isInRadius.value = false
      error.value = 'Lokasi tidak akurat'
    } else {
      isInRadius.value = minDistance <= selectedOffice.radius
    }
  }

  function getCurrentLocation() {
    loading.value = true
    error.value = ''

    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        error.value = 'Browser tidak mendukung lokasi'
        loading.value = false
        resolve(false)
        return
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          latitude.value = pos.coords.latitude
          longitude.value = pos.coords.longitude
          accuracy.value = pos.coords.accuracy

          calculateNearestOffice()

          loading.value = false
          resolve(true)
        },
        (err) => {
          if (err.code === 1) error.value = 'Izin lokasi ditolak'
          else if (err.code === 2) error.value = 'Lokasi tidak tersedia'
          else error.value = 'Gagal mengambil lokasi'

          loading.value = false
          resolve(false)
        },
        {
          enableHighAccuracy: true,
          timeout: 7000
        }
      )
    })
  }

  return {
    latitude,
    longitude,
    accuracy,
    distance,
    isInRadius,
    nearestOffice,
    error,
    loading,
    getCurrentLocation
  }
}
