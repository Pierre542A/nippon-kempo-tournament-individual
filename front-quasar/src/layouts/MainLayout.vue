<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat dense round icon="menu" @click="toggleLeftDrawer" />
        <q-toolbar-title>{{ currentTitle }}</q-toolbar-title>
        <div>CDA Cube #2</div>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-list>
        <router-link to="/">
          <q-img src="/src/assets/logo.png" alt="Logo" loading="eager" style="cursor: pointer;" />
        </router-link>

        <div class="q-pa-md" style="width: 100%; border-top: 1px solid lightgrey; border-bottom: 1px solid lightgrey;">
          <div v-if="isConnected" style="position: relative; width: 100%;">
            <q-btn
              flat
              color="negative"
              icon="logout"
              @click="logout"
              style="position: absolute; top: 0; left: 0;"
            >
              <q-tooltip>Se déconnecter</q-tooltip>
            </q-btn>

            <div style="display: flex; flex-direction: column; align-items: center;">
              <span style="font-size: 20px; font-weight: bold;">{{ lastName }} {{ firstName }}</span>
              <span style="font-size: 12px; color: grey;">
                <router-link to="/profile/edit" style="font-size: 12px; color: grey; text-decoration: none;" class="hover-underline">
                  modifier mon profil
                </router-link>
              </span>
            </div>
          </div>

          <div v-else style="display: flex; flex-direction: column; align-items: center;">
            <q-btn color="primary" class="text-white q-mb-sm" label="Se connecter" @click="showLoginDialog = true" />
            <q-btn color="secondary" class="text-white" label="S'inscrire" @click="showSignupDialog = true" />
          </div>

          <!-- Popup inscription -->
          <q-dialog v-model="showSignupDialog" transition-show="scale" transition-hide="scale">
            <q-card style="min-width: 300px; max-width: 400px;">
              <q-card-section class="row items-center">
                <div class="text-h6">Inscription</div>
                <q-space />
                <q-btn icon="close" flat round dense v-close-popup />
              </q-card-section>

              <q-form @submit.prevent="handleSignup">
                <q-card-section>
                  <q-input v-model="signupForm.first_name" label="Prénom" filled class="q-mb-sm" required />
                  <q-input v-model="signupForm.last_name" label="Nom" filled class="q-mb-sm" required />
                  <q-input v-model="signupForm.email" label="Email" type="email" filled class="q-mb-sm" required />

                  <q-input v-model="signupForm.password" label="Mot de passe" type="password" filled class="q-mb-sm" required />
                  <q-input v-model="signupForm.confirm_password" label="Confirmer le mot de passe" type="password" filled class="q-mb-sm" required />

                  <q-input v-model="signupForm.birth_date" label="Date de naissance" type="date" filled class="q-mb-sm" required />

                  <q-input v-model.number="signupForm.weight" label="Poids (kg)" type="number" min="1" filled class="q-mb-sm" />

                  <q-input v-model="signupForm.phone" label="Téléphone" filled class="q-mb-sm" />

                  <q-select
                    v-model="signupForm.nationality"
                    label="Nationalité"
                    filled
                    :options="['Française', 'Autre']"
                    class="q-mb-sm"
                  />

                  <div class="q-gutter-sm q-my-md">
                    <span>Genre :</span>
                    <q-radio v-model="signupForm.id_gender" val="1" label="Homme" />
                    <q-radio v-model="signupForm.id_gender" val="2" label="Femme" />
                    <q-radio v-model="signupForm.id_gender" val="3" label="Autre" />
                  </div>
                </q-card-section>

                <q-card-actions align="right">
                  <q-btn flat label="Annuler" color="primary" v-close-popup />
                  <q-btn label="Valider" color="primary" type="submit" :loading="loadingSignup">
                    <template v-slot:loading>
                      <q-spinner-facebook />
                    </template>
                  </q-btn>
                </q-card-actions>
              </q-form>
            </q-card>
          </q-dialog>

          <!-- Popup connexion -->
          <q-dialog v-model="showLoginDialog" transition-show="scale" transition-hide="scale">
            <q-card style="min-width: 300px; max-width: 400px; width: 100%">
              <q-card-section class="row items-center q-pb-none">
                <div class="text-h6">Connexion</div>
                <q-space />
                <q-btn icon="close" flat round dense v-close-popup :disable="loading" />
              </q-card-section>

              <q-form @submit.prevent="handleLogin">
                <q-card-section class="q-pt-md">
                  <q-input v-model="loginForm.email" label="Email" type="email" filled class="q-mb-md" lazy-rules :disable="loading">
                    <template v-slot:prepend><q-icon name="email" /></template>
                  </q-input>

                  <q-input v-model="loginForm.password" label="Mot de passe" :type="isPwd ? 'password' : 'text'" filled lazy-rules :disable="loading">
                    <template v-slot:prepend><q-icon name="lock" /></template>
                    <template v-slot:append>
                      <q-icon :name="isPwd ? 'visibility_off' : 'visibility'" class="cursor-pointer" @click="isPwd = !isPwd" />
                    </template>
                  </q-input>
                </q-card-section>

                <q-card-actions align="right" class="text-primary">
                  <q-btn label="Annuler" flat color="primary" v-close-popup :disable="loading" />
                  <q-btn label="Se connecter" color="primary" type="submit" :loading="loading">
                    <template v-slot:loading><q-spinner-facebook /></template>
                  </q-btn>
                </q-card-actions>
              </q-form>
            </q-card>
          </q-dialog>
        </div>

        <q-item-label header />

        <q-item to="/profile" clickable v-ripple>
          <q-item-section avatar><q-icon name="account_circle" /></q-item-section>
          <q-item-section>
            <q-item-label>Mon Profil</q-item-label>
            <q-item-label caption>Consultez vos informations personnelles, vos statistiques...</q-item-label>
          </q-item-section>
        </q-item>

        <q-item to="/tournaments" clickable v-ripple>
          <q-item-section avatar><q-icon name="view_list" /></q-item-section>
          <q-item-section>
            <q-item-label>Tournois</q-item-label>
            <q-item-label caption>Liste des prochains tournois</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import axios from 'axios'

axios.defaults.withCredentials = true

interface SignupForm {
  first_name: string
  last_name: string
  email: string
  password: string
  confirm_password: string
  birth_date: string
  weight: number | null
  phone: string
  nationality: string
  id_gender: string
}

interface LoginResponse {
  success: boolean
  user: {
    first_name: string
    last_name: string
  }
}

interface MeResponse {
  user: {
    id: number
    first_name: string
    last_name: string
    birth_date?: string
    weight?: number
    nationality?: string
    email?: string
    phone?: string
    is_active?: number
    id_gender?: number
    id_club?: number
    id_role?: number
    id_grade?: number
    created_at?: string
    id_tournament_waiting?: number | null
  }
}

interface ErrorResponse {
  response?: {
    status?: number
    data?: {
      error?: string
    }
  }
}

const route = useRoute()
const currentTitle = computed(() => route.meta.title as string || 'Nippon Kempo Tournament')
const $q = useQuasar()

const leftDrawerOpen = ref(false)
const isConnected = ref(false)
const firstName = ref('')
const lastName = ref('')
const showLoginDialog = ref(false)
const isPwd = ref(true)
const loading = ref(false)
const showSignupDialog = ref(false)
const loadingSignup = ref(false)

const signupForm = ref<SignupForm>({
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  confirm_password: '',
  birth_date: '',
  weight: null,
  phone: '',
  nationality: 'Française',
  id_gender: '1'
})

const loginForm = ref({
  email: '',
  password: ''
})

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

async function handleSignup() {
  loadingSignup.value = true
  console.log('Tentative d\'inscription avec les données:', signupForm.value)

  try {
    if (signupForm.value.password !== signupForm.value.confirm_password) {
      throw new Error('Les mots de passe ne correspondent pas')
    }

    const response = await axios.post<LoginResponse>(`${import.meta.env.VITE_API_URL}/signup`, {
      first_name: signupForm.value.first_name,
      last_name: signupForm.value.last_name,
      email: signupForm.value.email,
      password: signupForm.value.password,
      birth_date: signupForm.value.birth_date,
      weight: signupForm.value.weight,
      phone: signupForm.value.phone,
      nationality: signupForm.value.nationality,
      id_gender: signupForm.value.id_gender
    })

    console.log('Réponse du serveur:', response.data)

    if (response.data.success) {
      firstName.value = response.data.user.first_name
      lastName.value = response.data.user.last_name
      isConnected.value = true
      showSignupDialog.value = false

      $q.notify({
        message: 'Inscription réussie !',
        color: 'positive',
        position: 'bottom'
      })

      // Réinitialisation du formulaire
      signupForm.value = {
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        confirm_password: '',
        birth_date: '',
        weight: null,
        phone: '',
        nationality: 'Française',
        id_gender: '1'
      }
    }
  } catch (err: unknown) {
    console.error('Erreur lors de l\'inscription:', err)
    
    let errorMessage = 'Erreur lors de l\'inscription'
    if (typeof err === 'object' && err !== null) {
      const error = err as ErrorResponse
      if (error.response?.data?.error) {
        errorMessage += ': ' + error.response.data.error
      } else if (err instanceof Error) {
        errorMessage += ': ' + err.message
      }
    }

    $q.notify({
      message: errorMessage,
      color: 'negative',
      position: 'bottom'
    })
  } finally {
    loadingSignup.value = false
  }
}

async function handleLogin() {
  if (!loginForm.value.email || !loginForm.value.password) {
    $q.notify({
      message: 'Veuillez remplir tous les champs',
      color: 'negative',
      position: 'bottom'
    })
    return
  }

  loading.value = true
  console.log('Tentative de connexion avec:', loginForm.value.email)

  try {
    const response = await axios.post<LoginResponse>(
      `${import.meta.env.VITE_API_URL}/login`,
      loginForm.value
    )

    console.log('Réponse de connexion:', response.data)

    if (response.data.success) {
      await fetchUserSession()
      showLoginDialog.value = false
      loginForm.value = { email: '', password: '' }

      $q.notify({
        message: 'Connexion réussie !',
        color: 'positive',
        position: 'bottom'
      })
    }
  } catch (err: unknown) {
    console.error('Erreur de connexion:', err)
    
    let errorMessage = 'Erreur de connexion'
    if (typeof err === 'object' && err !== null) {
      const error = err as ErrorResponse
      if (error.response?.status === 401) {
        errorMessage = 'Email ou mot de passe incorrect'
      } else if (error.response?.data?.error) {
        errorMessage += ': ' + error.response.data.error
      }
    }

    $q.notify({
      message: errorMessage,
      color: 'negative',
      position: 'bottom'
    })
  } finally {
    loading.value = false
  }
}

async function fetchUserSession () {
  try {
    const { data } = await axios.get<MeResponse>(`${import.meta.env.VITE_API_URL}/me`);

    isConnected.value = true;
    firstName.value   = data.user.first_name;
    lastName.value    = data.user.last_name;

  } catch {
    isConnected.value = false;
    firstName.value   = '';
    lastName.value    = '';
  }
}

async function logout() {
  try {
    await axios.post(`${import.meta.env.VITE_API_URL}/logout`)
    console.log('Déconnexion réussie')
    isConnected.value = false
    firstName.value = ''
    lastName.value = ''

    $q.notify({
      message: 'Déconnexion réussie',
      color: 'negative',
      position: 'bottom'
    })
  } catch (err) {
    console.error('Erreur de déconnexion:', err)
    $q.notify({
      message: 'Erreur lors de la déconnexion',
      color: 'negative',
      position: 'bottom'
    })
  }
}

onMounted(() => {
  fetchUserSession()
})
</script>

<style scoped>
.hover-underline:hover {
  text-decoration: underline !important;
}
</style>