import axios from 'axios'
import { refreshAPI } from './auth'
import { logout } from '@/utils/logout'
import { getSafeErrorMessage } from '@/utils/errorMessage'

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 50000
})

// const API = axios.create({
//   baseURL: 'https://broadways-preaching-false.ngrok-free.dev',
//   timeout: 10000
// })

async function refreshAccessToken() {
  const refreshToken =
    localStorage.getItem('refresh_token')

  if (!refreshToken) {
    throw new Error('No refresh token')
  }

  const res = await refreshAPI(refreshToken)

  const newAccessToken =
    res.data.data.token

  localStorage.setItem(
    'token',
    newAccessToken
  )

  return newAccessToken
}

function showSessionExpiredPopup() {
  alert(
    'Sesi login telah berakhir. Silakan login kembali.'
  )
}

// request interceptor
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')

    if (token && config.url !== '/login') {
      config.headers.Authorization = `Bearer ${token}`
    }
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`
    // }

    // ngrok free
    config.headers['ngrok-skip-browser-warning'] = 'true'

    return config
  },
  (error) => Promise.reject(error)
)

// response interceptor
// API.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     const status = error.response?.status
    
//     if (
//   status === 401 &&
//   !error.config.url.includes('/login')
// ) {
//   localStorage.removeItem('token')
//   localStorage.removeItem('refresh_token')
//   localStorage.removeItem('user')

//   window.location.href = '/'
// }

//     // if (status === 429) {
//     //   alert('Terlalu banyak mencoba login, coba lagi nanti')
//     // }

//     return Promise.reject(error)
//   }
// )

API.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest =
      error.config

    error.userMessage = getSafeErrorMessage(error)

    if (!originalRequest) {
      return Promise.reject(error)
    }

    const status =
      error.response?.status

    const errorCode =
      error.response?.data?.code

    // ACCESS TOKEN EXPIRED
    if (
      status === 401 &&
      errorCode !== 'FACE_MISMATCH' &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/login') &&
      !originalRequest.url?.includes('/refresh')
    ) {
      originalRequest._retry = true

      try {
        const newAccessToken =
          await refreshAccessToken()

        originalRequest.headers.Authorization =
          `Bearer ${newAccessToken}`

        return API(originalRequest)
      } catch (refreshError) {
        localStorage.removeItem('token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')

        window.location.href = '/'

        refreshError.userMessage = getSafeErrorMessage(
          refreshError,
          'Sesi login telah berakhir. Silakan login kembali.'
        )

        return Promise.reject(refreshError)
      }
    }

    // SESSION EXPIRED
    if (
      errorCode === 'SESSION_EXPIRED'
    ) {
      // localStorage.removeItem('token')
      // localStorage.removeItem('refresh_token')
      // localStorage.removeItem('user')

      // window.location.href = '/'

      showSessionExpiredPopup()

await logout()
    }

    return Promise.reject(error)
  }
)

export default API
