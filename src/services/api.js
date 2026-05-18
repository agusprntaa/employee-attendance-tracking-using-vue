import axios from 'axios'

const API = axios.create({
  baseURL: 'https://broadways-preaching-false.ngrok-free.dev',
  timeout: 10000
})

// const API = axios.create({
//   baseURL: 'https://aerobics-exemption-regime.ngrok-free.dev',
//   timeout: 10000
// })

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
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    
    if (
  status === 401 &&
  !error.config.url.includes('/login')
) {
  localStorage.removeItem('token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('user')

  window.location.href = '/'
}

    // if (status === 429) {
    //   alert('Terlalu banyak mencoba login, coba lagi nanti')
    // }

    return Promise.reject(error)
  }
)

export default API