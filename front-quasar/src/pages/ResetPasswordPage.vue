<template>
    <q-page class="flex flex-center">
      <div class="row justify-center items-start q-pa-md">
        <div class="col-12 col-sm-8 col-md-6 col-lg-4">
          <!-- Card principale -->
          <q-card class="shadow-3 rounded-borders">
            <q-card-section class="bg-primary text-white">
              <div class="text-h5">Réinitialisation de mot de passe</div>
            </q-card-section>
  
            <!-- Message d'erreur dans une bannière élégante -->
            <div v-if="tokenError">
              <q-card-section class="bg-negative text-white q-pb-md">
                <div class="text-subtitle1 q-mb-sm">
                  <q-icon name="error" size="sm" class="q-mr-xs" />
                  Une erreur est survenue
                </div>
                <p class="q-mb-md">{{ tokenError }}</p>
                <q-btn color="white" text-color="negative" label="Demander un nouveau lien" 
                      @click="requestNewLink" flat class="q-mr-sm" />
                <q-btn color="white" text-color="negative" label="Retour à l'accueil" 
                      to="/" flat />
              </q-card-section>
            </div>
  
            <!-- Formulaire de réinitialisation -->
            <div v-else>
              <q-card-section v-if="!success">
                <p class="text-body1 q-mb-lg text-grey-8">
                  Veuillez définir un nouveau mot de passe sécurisé pour votre compte.
                </p>
  
                <q-form @submit.prevent="resetPassword" class="q-gutter-md">
                  <q-input 
                    v-model="newPassword" 
                    type="password" 
                    label="Nouveau mot de passe" 
                    :rules="[
                      val => !!val || 'Le mot de passe est requis',
                      val => val.length >= 8 || 'Le mot de passe doit contenir au moins 8 caractères'
                    ]"
                    class="q-mb-md"
                    outlined
                    square
                  >
                    <template v-slot:prepend>
                      <q-icon name="lock" />
                    </template>
                  </q-input>
  
                  <q-input 
                    v-model="confirmPassword" 
                    type="password" 
                    label="Confirmer le mot de passe" 
                    :rules="[
                      val => !!val || 'La confirmation est requise',
                      val => val === newPassword || 'Les mots de passe ne correspondent pas'
                    ]"
                    class="q-mb-lg"
                    outlined
                    square
                  >
                    <template v-slot:prepend>
                      <q-icon name="lock_outline" />
                    </template>
                  </q-input>
  
                  <div>
                    <q-btn 
                      label="Réinitialiser mon mot de passe" 
                      type="submit" 
                      color="primary" 
                      class="full-width" 
                      :loading="loading"
                    />
                  </div>
                </q-form>
              </q-card-section>
  
              <!-- Message de succès -->
              <q-card-section v-else class="bg-positive text-white">
                <div class="row items-center q-mb-md">
                  <q-icon name="check_circle" size="md" class="q-mr-md" />
                  <div class="text-h6">Mot de passe modifié avec succès!</div>
                </div>
                <p class="q-mb-md">Votre mot de passe a bien été réinitialisé. Vous pouvez maintenant vous connecter avec vos nouveaux identifiants.</p>
                <q-btn color="white" text-color="positive" label="Se connecter" @click="redirectToLogin" flat />
              </q-card-section>
            </div>
  
            <!-- Pied de carte avec information -->
            <q-card-section v-if="!success && !tokenError" class="bg-grey-2 text-grey-8">
              <div class="text-caption">
                <q-icon name="info" size="xs" class="q-mr-xs" />
                Pour votre sécurité, choisissez un mot de passe fort contenant au moins 8 caractères, incluant des lettres majuscules, minuscules, des chiffres et des caractères spéciaux.
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
  
      <!-- Dialog pour demander un nouveau lien si besoin -->
      <q-dialog v-model="showRequestDialog">
        <q-card style="min-width: 350px">
          <q-card-section class="bg-primary text-white">
            <div class="text-h6">Demander un nouveau lien</div>
          </q-card-section>
  
          <q-card-section class="q-pt-lg">
            <p class="q-mb-md">Veuillez entrer votre adresse email pour recevoir un nouveau lien de réinitialisation.</p>
            <q-input 
              v-model="requestEmail" 
              label="Email" 
              outlined 
              square
              type="email"
            >
              <template v-slot:prepend>
                <q-icon name="email" />
              </template>
            </q-input>
          </q-card-section>
  
          <q-card-actions align="right" class="bg-white">
            <q-btn flat label="Annuler" color="negative" v-close-popup />
            <q-btn flat label="Envoyer" color="primary" @click="sendNewLink" :loading="requestLoading" />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </q-page>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useQuasar } from 'quasar'
  import axios from 'axios'
  
  // Initialiser les variables manquantes
  const $q = useQuasar()
  const route = useRoute()
  const router = useRouter()
  
  // Interface pour le typage des réponses API
  interface PasswordResetResponse {
    success: boolean;
    message?: string;
    error?: string;
  }
  
  // État
  const token = ref('')
  const newPassword = ref('')
  const confirmPassword = ref('')
  const loading = ref(false)
  const tokenError = ref('')
  const success = ref(false)
  const showRequestDialog = ref(false)
  const requestEmail = ref('')
  const requestLoading = ref(false)
  
  // Fonction pour demander un nouveau lien
  function requestNewLink() {
    showRequestDialog.value = true
  }
  
  // Fonction pour envoyer un nouveau lien
  async function sendNewLink() {
    if (!requestEmail.value) {
      $q.notify({
        color: 'negative',
        message: 'Veuillez entrer votre adresse email'
      })
      return
    }
    
    requestLoading.value = true
    try {
      await axios.post<PasswordResetResponse>(
        `${import.meta.env.VITE_API_URL}/request-password-reset`,
        { email: requestEmail.value }
      )
      
      $q.notify({
        color: 'positive',
        message: 'Un email de réinitialisation a été envoyé à votre adresse si celle-ci est associée à un compte'
      })
      showRequestDialog.value = false
    } catch (error) {
      console.error('Erreur demande de réinitialisation:', error)
      $q.notify({
        color: 'positive',
        message: 'Un email de réinitialisation a été envoyé à votre adresse si celle-ci est associée à un compte'
      })
    } finally {
      requestLoading.value = false
      showRequestDialog.value = false
    }
  }
  
  // Fonction pour réinitialiser le mot de passe
  async function resetPassword() {
    if (newPassword.value !== confirmPassword.value) {
      $q.notify({
        color: 'negative',
        message: 'Les mots de passe ne correspondent pas'
      })
      return
    }
    
    if (newPassword.value.length < 8) {
      $q.notify({
        color: 'negative',
        message: 'Le mot de passe doit contenir au moins 8 caractères'
      })
      return
    }
    
    loading.value = true
    
    try {
      const response = await axios.post<PasswordResetResponse>(
        `${import.meta.env.VITE_API_URL}/reset-password`,
        {
          token: token.value,
          password: newPassword.value
        }
      )
      
      if (response.data.success) {
        success.value = true
        $q.notify({
          color: 'positive',
          message: 'Votre mot de passe a été réinitialisé avec succès'
        })
      } else {
        $q.notify({
          color: 'negative',
          message: response.data.error || 'Une erreur est survenue'
        })
      }
    } catch (error) {
      console.error('Erreur réinitialisation:', error)
      $q.notify({
        color: 'negative',
        message: 'Une erreur est survenue lors de la réinitialisation du mot de passe'
      })
    } finally {
      loading.value = false
    }
  }
  
  // Fonction pour rediriger vers la page d'accueil après réinitialisation
  function redirectToLogin() {
    router.push('/')
    setTimeout(() => {
      // Ouvrir automatiquement la popup de connexion
      window.dispatchEvent(new CustomEvent('open-login-dialog'))
    }, 100)
  }
  
  // Lors du chargement de la page, vérifier le token
  onMounted(async () => {
    // Récupérer le token depuis l'URL
    token.value = route.query.token as string || ''
    
    if (!token.value) {
      tokenError.value = 'Lien de réinitialisation invalide. Veuillez demander un nouveau lien.'
      return
    }
    
    // Vérifier la validité du token
    try {
      loading.value = true
      const response = await axios.post<PasswordResetResponse>(
        `${import.meta.env.VITE_API_URL}/verify-reset-token`,
        { token: token.value }
      )
      
      if (!response.data.success) {
        tokenError.value = 'Ce lien de réinitialisation a expiré ou est invalide. Veuillez demander un nouveau lien.'
      }
    } catch (error) {
      console.error('Erreur vérification token:', error)
      tokenError.value = 'Ce lien de réinitialisation a expiré ou est invalide. Veuillez demander un nouveau lien.'
    } finally {
      loading.value = false
    }
  })
  </script>