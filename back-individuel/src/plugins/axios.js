import axios from 'axios'
import { useUserStore } from '@/stores/user'
import router from '@/router/index'
import { useToast } from 'vuestic-ui'

export function setupAxios() {
  const userStore = useUserStore()
  const toast = useToast()

  // injecte le token si déjà présent
  if (userStore.token) {
    axios.defaults.headers.common.Authorization = `Bearer ${userStore.token}`
  }

  axios.interceptors.response.use(
    res => res,
    err => {
      const url = err.config?.url || ''
      // si cest l appel /admin/login, on le laisse passer pour que
      // le catch dans Login.vue gère l affichage du message d erreur de connexion
      if (url.endsWith('/admin/login') || url.endsWith('/admin/me')) {
        return Promise.reject(err)
      }
      // sinon, pour tous les autres 401 ( token plus bon ) on redirige vers login
      if (err.response?.status === 401) {
        userStore.clearUser()
        router.push('/')
        toast.init({ message: "Votre accès n'était plus sécurisé. Vous avez été déconnecté.", position: 'top-center' })

      }
      return Promise.reject(err)
    }
  )
}
