// front-quasar/src/config/api.ts
import axios from 'axios'

// Configuration de l'URL de base
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

// Configuration globale d'axios
axios.defaults.baseURL = API_URL
axios.defaults.withCredentials = true // Important pour les cookies
axios.defaults.headers.common['Content-Type'] = 'application/json'

// Intercepteur pour gérer les erreurs globalement
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.status, error.response?.data)
    return Promise.reject(error)
  }
)

// Export de l'instance configurée
export default axios

// Export de l'URL de base pour d'autres usages
export { API_URL }