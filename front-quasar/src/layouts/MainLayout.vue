<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />
        <q-toolbar-title>
          {{ currentTitle }}
        </q-toolbar-title>
        <div>CDA Cube #2</div>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-list>
        <router-link to="/">
          <q-img
            src="/src/assets/logo.png"
            alt="Logo"
            loading="eager"
            style="cursor: pointer;"
          />
        </router-link>

        <div
          class="q-pa-md"
          style="width: 100%; border-top: 1px solid lightgrey; border-bottom: 1px solid lightgrey; position: relative;"
        >
          <div v-if="isConnected" style="position: relative; width: 100%;">
            <q-btn
              flat
              color="negative"
              icon="logout"
              @click="logout"
              style="position: absolute; top: 0; left: 0; margin: 0; padding: 0;"
            >
              <q-tooltip>Se déconnecter</q-tooltip>
            </q-btn>

            <div style="display: flex; flex-direction: column; align-items: center;">
              <span style="font-size: 20px; font-weight: bold;">
                {{ username }}
              </span>
              <span style="font-size: 12px; color: grey;">
                <router-link
                  to="/profile/edit"
                  style="font-size: 12px; color: grey; text-decoration: none;"
                  class="hover-underline"
                >
                  modifier mon profil
                </router-link>
              </span>
            </div>
          </div>

          <div
            v-else
            style="display: flex; flex-direction: column; align-items: center;"
          >
            <q-btn
              color="primary"
              class="text-white"
              label="Se connecter"
              @click="goLogin"
            />
          </div>

          <q-dialog 
            v-model="showLoginDialog"
            transition-show="scale"
            transition-hide="scale"
          >
            <q-card style="min-width: 300px; max-width: 400px; width: 100%">
              <q-card-section class="row items-center q-pb-none">
                <div class="text-h6">Connexion</div>
                <q-space />
                <q-btn icon="close" flat round dense v-close-popup />
              </q-card-section>

              <q-form @submit.prevent="handleLogin">
                <q-card-section class="q-pt-md">
                  <q-input
                    v-model="loginForm.email"
                    label="Email"
                    type="email"
                    filled
                    class="q-mb-md"
                    lazy-rules
                  >
                    <template v-slot:prepend>
                      <q-icon name="email" />
                    </template>
                  </q-input>

                  <q-input
                    v-model="loginForm.password"
                    label="Mot de passe"
                    :type="isPwd ? 'password' : 'text'"
                    filled
                    lazy-rules
                  >
                    <template v-slot:prepend>
                      <q-icon name="lock" />
                    </template>
                    <template v-slot:append>
                      <q-icon
                        :name="isPwd ? 'visibility_off' : 'visibility'"
                        class="cursor-pointer"
                        @click="isPwd = !isPwd"
                      />
                    </template>
                  </q-input>
                </q-card-section>

                <q-card-actions align="right" class="text-primary">
                  <q-btn
                    label="Annuler"
                    flat
                    color="primary"
                    v-close-popup
                  />
                  <q-btn
                    label="Se connecter"
                    color="primary"
                    type="submit"
                  />
                </q-card-actions>
              </q-form>
            </q-card>
          </q-dialog>
        </div>

        <q-item-label header />

        <q-item to="/profile" clickable v-ripple>
          <q-item-section avatar>
            <q-icon name="account_circle" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Mon Profil</q-item-label>
            <q-item-label caption>Consultez vos informations personnelles</q-item-label>
          </q-item-section>
        </q-item>

        <q-item to="/tournaments" clickable v-ripple>
          <q-item-section avatar>
            <q-icon name="view_list" />
          </q-item-section>
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
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import axios from 'axios'

interface LoginResponse {
  username?: string
  token?: string
}

interface MyAxiosError extends Error {
  isAxiosError: boolean
  response?: {
    status?: number
    data?: unknown
  }
}

function isAxiosError(error: unknown): error is MyAxiosError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'isAxiosError' in error &&
    (error as MyAxiosError).isAxiosError === true
  )
}

const route = useRoute()
const currentTitle = computed(() => route.meta.title as string || 'Nippon Kempo Tournament')
const $q = useQuasar()
const leftDrawerOpen = ref(false)
const isConnected = ref(false)
const username = ref('')
const showLoginDialog = ref(false)
const isPwd = ref(true)
const loginForm = ref({
  email: '',
  password: ''
})

function toggleLeftDrawer () {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

function goLogin () {
  showLoginDialog.value = true
}

async function handleLogin () {
  if (!loginForm.value.email || !loginForm.value.password) {
    $q.notify({
      message: 'Veuillez remplir tous les champs pour vous connecter.',
      color: 'negative',
      position: 'bottom',
      timeout: 3000,
      icon: 'warning'
    })
    return
  }

  const { email, password } = loginForm.value
  console.log('[Login] Tentative de connexion avec :', { email, password })

  try {
    const response = await axios.post<LoginResponse>(
      `${import.meta.env.VITE_API_URL}/auth/login`,
      { email, password }
    )
    
    username.value = response.data.username ?? 'Inconnu'
    isConnected.value = true
    showLoginDialog.value = false

    $q.notify({
      message: 'Connexion réussie ! Bienvenue sur Nippon Kempo Tournament.',
      color: 'positive',
      position: 'bottom',
      timeout: 3000,
      icon: 'check_circle'
    })
  } catch (err: unknown) {
    if (isAxiosError(err)) {
      if (err.response?.status === 401) {
        $q.notify({
          message: 'Email ou mot de passe incorrect. Veuillez réessayer.',
          color: 'negative',
          position: 'bottom',
          timeout: 4000,
          icon: 'error'
        })
      } else if (err.response?.status === 429) {
        $q.notify({
          message: 'Trop de tentatives de connexion. Veuillez patienter quelques minutes.',
          color: 'warning',
          position: 'bottom',
          timeout: 5000,
          icon: 'timer'
        })
      } else if (!err.response) {
        $q.notify({
          message: 'Impossible de joindre le serveur. Vérifiez votre connexion internet.',
          color: 'negative',
          position: 'bottom',
          timeout: 4000,
          icon: 'wifi_off'
        })
      } else {
        $q.notify({
          message: 'Une erreur est survenue lors de la connexion. Veuillez réessayer.',
          color: 'negative',
          position: 'bottom',
          timeout: 4000,
          icon: 'error'
        })
      }
    } else {
      $q.notify({
        message: 'Une erreur inattendue est survenue. Veuillez réessayer ultérieurement.',
        color: 'negative',
        position: 'bottom',
        timeout: 4000,
        icon: 'error'
      })
    }
  }
}

function logout () {
  isConnected.value = false
  username.value = ''
  $q.notify({
    message: 'Déconnexion réussie',
    color: 'info',
    position: 'bottom'
  })
}
</script>