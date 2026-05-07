import { ref } from 'vue'

const user = ref(null)

export function useAuth() {

  function loadUser() {
    const userRaw = localStorage.getItem('user')
    if (userRaw) {
      user.value = JSON.parse(userRaw)
    }
  }

  function setUser(data) {
    user.value = data
    localStorage.setItem('user', JSON.stringify(data))
  }

  function logout() {
    user.value = null
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }

  return {
    user,
    loadUser,
    setUser,
    logout
  }
}