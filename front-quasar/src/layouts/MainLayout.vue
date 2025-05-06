<template>
  <q-layout view="lHh Lpr lFf">
    <!-- Header -->
    <q-header elevated>
      <q-toolbar>
        <q-btn flat dense round icon="menu" @click="toggleLeftDrawer" />
        <q-toolbar-title>{{ currentTitle }}</q-toolbar-title>
        <div>CDA Cube #2</div>
      </q-toolbar>
    </q-header>

    <!-- Drawer -->
    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-list>
        <router-link to="/">
          <q-img src="/src/assets/logo.png" alt="Logo" loading="eager" style="cursor:pointer;" />
        </router-link>

        <!-- User section -->
        <div class="q-pa-md" style="width:100%;border-top:1px solid lightgrey;border-bottom:1px solid lightgrey;">
          <!-- Connected -->
          <div v-if="isConnected" style="position:relative;width:100%;">
            <q-btn flat color="negative" icon="logout" @click="logout" style="position:absolute;top:0;left:0;">
              <q-tooltip>Se déconnecter</q-tooltip>
            </q-btn>

            <div style="display:flex;flex-direction:column;align-items:center;">
              <span style="font-size:20px;font-weight:bold;">{{ store.user?.last_name }} {{ store.user?.first_name }}</span>
              <span style="font-size:12px;color:grey;">
                <router-link to="/profile/edit" class="hover-underline" style="font-size:12px;color:grey;text-decoration:none;">modifier mon profil</router-link>
              </span>
            </div>
          </div>

          <!-- Not connected -->
          <div v-else style="display:flex;flex-direction:column;align-items:center;">
            <q-btn color="primary" class="text-white q-mb-sm" label="Se connecter" @click="showLoginDialog = true" />
            <q-btn color="secondary" class="text-white" label="S'inscrire" @click="showSignupDialog = true" />
          </div>

          <!-- Signup dialog -->
          <q-dialog v-model="showSignupDialog" transition-show="scale" transition-hide="scale">
            <q-card style="min-width:300px;max-width:400px;">
              <q-card-section class="row items-center">
                <div class="text-h6">Inscription</div>
                <q-space />
                <q-btn icon="close" flat round dense v-close-popup />
              </q-card-section>

              <q-form @submit.prevent="handleSignup">
                <q-card-section>
                  <q-input v-model="signupForm.first_name" label="Prénom" filled class="q-mb-sm" required />
                  <q-input v-model="signupForm.last_name"  label="Nom"    filled class="q-mb-sm" required />
                  <q-input v-model="signupForm.email"      label="Email"  type="email" filled class="q-mb-sm" required />

                  <q-input v-model="signupForm.password"         label="Mot de passe" type="password" filled class="q-mb-sm" required />
                  <q-input v-model="signupForm.confirm_password" label="Confirmer le mot de passe" type="password" filled class="q-mb-sm" required />

                  <q-input v-model="signupForm.birth_date" label="Date de naissance" type="date" filled class="q-mb-sm" required />

                  <q-input v-model.number="signupForm.weight" label="Poids (kg)" type="number" min="1" filled class="q-mb-sm" required />

                  <q-input v-model="signupForm.phone" label="Téléphone" filled class="q-mb-sm" />

                  <q-select v-model="signupForm.nationality" label="Nationalité" filled :options="['Française','Autre']" class="q-mb-sm" required />

                  <div class="q-gutter-sm q-my-md">
                    <span>Genre :</span>
                    <q-radio v-model.number="signupForm.id_gender" :val="1" label="Homme" />
                    <q-radio v-model.number="signupForm.id_gender" :val="2" label="Femme" />
                  </div>
                </q-card-section>

                <q-card-actions align="right">
                  <q-btn flat label="Annuler" color="primary" v-close-popup />
                  <q-btn label="Valider" color="primary" type="submit" :loading="store.loading">
                    <template #loading><q-spinner-facebook /></template>
                  </q-btn>
                </q-card-actions>
              </q-form>
            </q-card>
          </q-dialog>

          <!-- Login dialog -->
          <q-dialog v-model="showLoginDialog" transition-show="scale" transition-hide="scale">
            <q-card style="min-width:300px;max-width:400px;width:100%">
              <q-card-section class="row items-center q-pb-none">
                <div class="text-h6">Connexion</div>
                <q-space />
                <q-btn icon="close" flat round dense v-close-popup :disable="store.loading" />
              </q-card-section>

              <q-form @submit.prevent="handleLogin">
                <q-card-section class="q-pt-md">
                  <q-input v-model="loginForm.email" label="Email" type="email" filled class="q-mb-md" lazy-rules :disable="store.loading">
                    <template #prepend><q-icon name="email" /></template>
                  </q-input>

                  <q-input v-model="loginForm.password" label="Mot de passe" :type="isPwd ? 'password' : 'text'" filled lazy-rules :disable="store.loading">
                    <template #prepend><q-icon name="lock" /></template>
                    <template #append>
                      <q-icon :name="isPwd ? 'visibility_off' : 'visibility'" class="cursor-pointer" @click="isPwd = !isPwd" />
                    </template>
                  </q-input>
                  
                  <!-- Ajout du lien "Mot de passe oublié" -->
                  <div class="text-right q-mt-sm">
                    <q-btn flat dense size="sm" label="Mot de passe oublié ?" class="text-primary" @click="showForgotPasswordDialog = true; showLoginDialog = false" />
                  </div>
                </q-card-section>

                <q-card-actions align="right" class="text-primary">
                  <q-btn label="Annuler" flat color="primary" v-close-popup :disable="store.loading" />
                  <q-btn label="Se connecter" color="primary" type="submit" :loading="store.loading">
                    <template #loading><q-spinner-facebook /></template>
                  </q-btn>
                </q-card-actions>
              </q-form>
            </q-card>
          </q-dialog>
          
          <!-- Forgot Password Dialog -->
          <q-dialog v-model="showForgotPasswordDialog" transition-show="scale" transition-hide="scale">
            <q-card style="min-width:300px;max-width:400px;width:100%">
              <q-card-section class="row items-center q-pb-none">
                <div class="text-h6">Réinitialisation du mot de passe</div>
                <q-space />
                <q-btn icon="close" flat round dense v-close-popup :disable="forgotPasswordLoading" />
              </q-card-section>

              <q-form @submit.prevent="handleForgotPassword">
                <q-card-section class="q-pt-md">
                  <p class="text-body2">Entrez votre adresse email pour recevoir un lien de réinitialisation de mot de passe.</p>
                  <q-input 
                    v-model="forgotPasswordForm.email" 
                    label="Email" 
                    type="email" 
                    filled 
                    class="q-mb-md" 
                    lazy-rules 
                    :disable="forgotPasswordLoading"
                    :rules="[
                      val => !!val || 'L\'adresse email est requise',
                      val => validateEmail(val) || 'Format d\'email invalide'
                    ]">
                    <template #prepend><q-icon name="email" /></template>
                  </q-input>
                </q-card-section>

                <q-card-actions align="right" class="text-primary">
                  <q-btn flat label="Retour" color="primary" @click="showLoginDialog = true; showForgotPasswordDialog = false" :disable="forgotPasswordLoading" />
                  <q-btn label="Envoyer le lien" color="primary" type="submit" :loading="forgotPasswordLoading">
                    <template #loading><q-spinner-facebook /></template>
                  </q-btn>
                </q-card-actions>
              </q-form>
            </q-card>
          </q-dialog>
        </div>

        <q-item-label header />

        <!-- Menu items -->
        <q-item v-if="isConnected" to="/profile" clickable v-ripple>
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

        <template v-if="isConnected && isAdmin">
          <q-separator />
          <q-item-label header>Administration</q-item-label>
          <q-item to="/admin" clickable v-ripple>
            <q-item-section avatar><q-icon name="admin_panel_settings" /></q-item-section>
            <q-item-section>
              <q-item-label>Espace administrateur</q-item-label>
              <q-item-label caption>Gérez les utilisateurs, modifiez leurs informations ou désactivez‑les.</q-item-label>
            </q-item-section>
          </q-item>
        </template>
      </q-list>
    </q-drawer>

    <!-- Page container -->
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useUserStore } from '../stores/user'
import axios from 'axios'

const route             = useRoute()
const router            = useRouter()
const $q                = useQuasar()
const store             = useUserStore()

// ---- UI State ----
const leftDrawerOpen          = ref(false)
const showLoginDialog         = ref(false)
const showSignupDialog        = ref(false)
const showForgotPasswordDialog = ref(false)
const isPwd                   = ref(true)
const forgotPasswordLoading   = ref(false)

// ---- Forms ----
const signupForm = ref({
  first_name:        '',
  last_name:         '',
  email:             '',
  password:          '',
  confirm_password:  '',
  birth_date:        '',
  weight:            0,
  phone:             '',
  nationality:       'Française',
  id_gender:         1,
  // Valeurs par défaut pour les champs requis mais non visibles dans le formulaire
  id_grade:          1,    // Grade par défaut (1 = Débutant)
  id_club:           1,    // Club par défaut
  id_role:           3,    // Rôle participant par défaut
  is_active:         true, // Actif par défaut
  avatar_seed:       'default'
})

const loginForm = ref({ email: '', password: '' })
const forgotPasswordForm = ref({ email: '' })

// ---- Computed ----
const currentTitle = computed(() => (route.meta.title as string) || 'Nippon Kempo Tournament')
const isConnected  = computed(() => store.connected)
const isAdmin      = computed(() => store.isAdmin)

// ---- Methods ----
function toggleLeftDrawer () {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

interface ApiError {
  response?: {
    data?: {
      error?: string;
    };
  };
  message?: string;
}

// Fonction pour valider le numéro de téléphone (formatage simple)
function validatePhone(phone: string): boolean {
  // Si le champ est vide, on le considère valide (optionnel)
  if (!phone || phone.trim() === '') return true;
  
  // Expression régulière pour valider les numéros français
  // Format: +33612345678 ou 0612345678
  const phoneRegex = /^(\+33|0)[1-9](\d{8})$/;
  
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

// Fonction pour valider l'email
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

interface ApiPasswordResetResponse {
  success: boolean
}

async function handleForgotPassword() {
  if (!forgotPasswordForm.value.email || !validateEmail(forgotPasswordForm.value.email)) {
    $q.notify({ 
      message: 'Veuillez entrer une adresse email valide', 
      color: 'negative' 
    });
    return;
  }
  
  forgotPasswordLoading.value = true;
  
  try {
    // Appel à l'API pour demander une réinitialisation de mot de passe
    const response = await axios.post<ApiPasswordResetResponse>(`${import.meta.env.VITE_API_URL}/request-password-reset`, { email: forgotPasswordForm.value.email })
    
    if (response.data.success) {
      $q.notify({ 
        message: 'Un email de réinitialisation a été envoyé à votre adresse si celle-ci est associée à un compte', 
        color: 'positive',
        timeout: 5000
      });
      showForgotPasswordDialog.value = false;
      resetForgotPasswordForm();
    } else {
      $q.notify({ 
        message: 'Une erreur est survenue. Veuillez réessayer plus tard.', 
        color: 'negative' 
      });
    }
  } catch (error) {
    console.error('Erreur demande de réinitialisation:', error);
    
    // Pour des raisons de sécurité, on ne précise pas si l'email existe ou non
    $q.notify({ 
      message: 'Un email de réinitialisation a été envoyé à votre adresse si celle-ci est associée à un compte',
      color: 'positive',
      timeout: 5000
    });
  } finally {
    forgotPasswordLoading.value = false;
    showForgotPasswordDialog.value = false;
  }
}

async function handleSignup () {
  if (signupForm.value.password !== signupForm.value.confirm_password) {
    $q.notify({ message: 'Mots de passe non identiques', color: 'negative' })
    return
  }

  // Vérifier que la date de naissance est renseignée
  if (!signupForm.value.birth_date) {
    $q.notify({ message: 'La date de naissance est obligatoire', color: 'negative' })
    return
  }

  // Vérifier le format du numéro de téléphone
  if (signupForm.value.phone && !validatePhone(signupForm.value.phone)) {
    $q.notify({ 
      message: 'Format de téléphone invalide. Utilisez le format +33612345678 ou 0612345678', 
      color: 'negative' 
    })
    return
  }

  // Formater la date correctement pour la base de données
  const formattedDate = `${signupForm.value.birth_date} 00:00:00`

  const payload = {
    first_name:    signupForm.value.first_name.trim(),
    last_name:     signupForm.value.last_name.trim(),
    email:         signupForm.value.email.trim().toLowerCase(),
    password:      signupForm.value.password,
    birth_date:    formattedDate, // Date au format DATETIME
    weight:        Number(signupForm.value.weight),
    phone:         signupForm.value.phone.trim() || '',
    nationality:   signupForm.value.nationality,
    id_gender:     signupForm.value.id_gender,
    // Champs avec valeurs par défaut
    id_grade:      signupForm.value.id_grade,
    id_club:       signupForm.value.id_club,
    id_role:       signupForm.value.id_role,
    is_active:     signupForm.value.is_active,
    avatar_seed:   signupForm.value.avatar_seed
  }

  try {
    const ok = await store.signup(payload)
    if (ok) {
      showSignupDialog.value = false
      resetSignupForm()
      $q.notify({ message: 'Inscription réussie !', color: 'positive' })
    } else {
      $q.notify({ message: 'Erreur lors de l\'inscription', color: 'negative' })
    }
  } catch (error) {
    console.error('Erreur inscription:', error)
    // Typage de l'erreur avec l'interface
    const err = error as ApiError
    $q.notify({ 
      message: err?.response?.data?.error || 'Erreur lors de l\'inscription', 
      color: 'negative' 
    })
  }
}

async function handleLogin() {
  if (!loginForm.value.email || !loginForm.value.password) {
    $q.notify({ message: 'Veuillez remplir tous les champs', color: 'negative' })
    return
  }
  
  try {
    const ok = await store.login(loginForm.value.email, loginForm.value.password)
    if (ok) {
      showLoginDialog.value = false
      resetLoginForm()
      $q.notify({ message: 'Connexion réussie !', color: 'positive' })
    } else {
      $q.notify({ message: 'Email ou mot de passe incorrect', color: 'negative' })
    }
  } catch (error) {
    console.error('Erreur connexion:', error)
    // Typage de l'erreur avec l'interface
    const err = error as ApiError
    $q.notify({ 
      message: err?.response?.data?.error || 'Erreur lors de la connexion', 
      color: 'negative' 
    })
  }
}

// Fonctions pour réinitialiser les formulaires
function resetSignupForm() {
  signupForm.value = {
    first_name:        '',
    last_name:         '',
    email:             '',
    password:          '',
    confirm_password:  '',
    birth_date:        '',
    weight:            0,
    phone:             '',
    nationality:       'Française',
    id_gender:         1,
    id_grade:          1,
    id_club:           1,
    id_role:           3,
    is_active:         true,
    avatar_seed:       'default'
  }
}

function resetLoginForm() {
  loginForm.value = { 
    email: '', 
    password: '' 
  }
}

function resetForgotPasswordForm() {
  forgotPasswordForm.value = { 
    email: '' 
  }
}

async function logout () {
  await store.logout()
  if (route.path.startsWith('/profile') || route.path.startsWith('/admin')) router.push('/')
  $q.notify({ message: 'Déconnexion réussie', color: 'positive' })
}

onMounted(() => {
  store.fetchSession()
})
</script>

<style scoped>
.hover-underline:hover { text-decoration: underline !important; }
</style>