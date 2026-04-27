import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

// Attach JWT on every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('execos_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401/403 globally - clear bad tokens and redirect to login
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401 || err.response?.status === 403) {
      localStorage.removeItem('execos_token')
      localStorage.removeItem('execos_user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export default api
