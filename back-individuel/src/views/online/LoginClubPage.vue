<template>
  <div class="login-wrapper">
    <!-- si utilisateur deja connecté -->
    <div v-if="loggedIn" class="already-logged">
      <p>Bonjour {{ userStore.firstName }} {{ userStore.lastName }}, vous êtes déjà connecté.</p>
      <VaButton color="primary" @click="goNext" style="margin: 10px;">
        Continuer
      </VaButton>
      <!-- bouton déconnexion -->
      <VaButton color="danger" text @click="logout" style="margin: 10px;">
        Se déconnecter
      </VaButton>
    </div>

    <!-- sinon, afficher le formulaire de connexion -->
    <VaCard v-else class="login-card">
      <img src="@/assets/logo.png" alt="logo" class="logo" />
      <h1 class="title">NIPPON KEMPO</h1>

      <VaForm @submit.prevent="login">
        <VaInput v-model="email" type="text" label="Nom d'utilisateur"
          placeholder="Entrez votre nom d'utilisateur du club" class="username-input mb-3">
          <template #prependInner>
            <VaIcon name="person" color="primary" size="22px" />
          </template>
        </VaInput>

        <VaInput v-model="password" :type="showPassword ? 'text' : 'password'" label="Mot de passe"
          placeholder="Entrez votre mot de passe" class="password-input">
          <template #prependInner>
            <VaIcon name="lock" color="primary" size="22px" />
          </template>
          <template #appendInner>
            <VaButton icon size="small" class="eye-button" @click="togglePassword">
              <VaIcon :name="showPassword ? 'visibility_off' : 'visibility'" />
            </VaButton>
          </template>
        </VaInput>

        <div class="text-right mt-2 mb-2">
          <a>Mot de passe oublié ?</a>
        </div>

        <VaButton block color="primary" class="mt-4" :disabled="!email || !password" type="submit">
          Se connecter
        </VaButton>
      </VaForm>
    </VaCard>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { useToast } from 'vuestic-ui'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const toast = useToast()
const userStore = useUserStore()

// champs
const email = ref('')
const password = ref('')
const showPassword = ref(false)

// vrai si token présent et valide par le serveur
const loggedIn = ref(false)

onMounted(async () => {
  if (userStore.token) {
    // 1) injecte le token dans l axios
    axios.defaults.headers.common.Authorization = `Bearer ${userStore.token}`
    try {
      // 2) verif /admin/me
      const { data } = await axios.get('http://localhost:3000/admin/me')
      // si succès, hydrate le store avec les données
      userStore.setUser(data);
      userStore.setPermissions(data.permissions)
      loggedIn.value = true
    } catch (err) {
      // token invalide ou expiré !
      userStore.clearUser()
      delete axios.defaults.headers.common.Authorization
      loggedIn.value = false
    }
  }
})


const logout = () => {
  // vider Pinia
  userStore.clearUser()
  // supprimer l'enteete d'authent
  delete axios.defaults.headers.common.Authorization
  // mettre loggedIn à false
  loggedIn.value = false
}

const togglePassword = () => {
  showPassword.value = !showPassword.value
}

const login = async () => {
  try {
    const response = await axios.post('http://localhost:3000/admin/login', {
      email: email.value,
      password: password.value
    })
    // stocke dans Pinia
    userStore.setUser(response.data);
    userStore.setPermissions(response.data.permissions);
    // ajoute l’entête
    axios.defaults.headers.common.Authorization = `Bearer ${response.data.token}`

    toast.init({ message: 'Connexion réussie !', color: 'success', position: 'top-center' })
    goNext()
  } catch (err) {
    const msg = err.response?.data?.message || 'Erreur de connexion'
    toast.init({ message: msg, color: 'danger', position: 'top-center' })
  }
}

const goNext = () => {
  const route = userStore.isAdmin ? '/home-admin' : '/home-club'
  router.push(route)
}
</script>


<style scoped>
.login-wrapper {
  display: flex;
  height: 70vh;
  align-items: center;
  justify-content: center;
  background: url('@/assets/img/background.svg') no-repeat center center;
  background-size: cover;
  padding: 10px;
}

.already-logged {
  text-align: center;
}

.login-card {
  width: 100%;
  max-width: 400px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.logo {
  width: 150px;
  height: 150px;
  margin-bottom: 10px;
}

.title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 20px;
  color: var(--primary-blue);
}

.username-input,
.password-input {
  width: 100%;
  text-align: left;
}

\ n.eye-button {
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;
}
</style>
