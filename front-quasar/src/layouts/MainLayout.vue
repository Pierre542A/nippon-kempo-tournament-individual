<template>
  <q-layout view="lHh Lpr lFf">
    <!-- Header -->
    <q-header elevated>
      <q-toolbar>
        <q-btn flat dense round icon="menu" @click="toggleLeftDrawer" />
        <q-toolbar-title>{{ currentTitle }}</q-toolbar-title>
        <div>CDA Cube #3-2.1</div>
      </q-toolbar>
    </q-header>

    <!-- Drawer -->
    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-list>
        <router-link to="/">
          <q-img src="/assets/logo.png" alt="Logo" loading="eager" style="cursor:pointer;" />
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

          <!-- No - connected -->
          <div v-else style="display:flex;flex-direction:column;align-items:center;">
            <q-btn color="primary" class="text-white q-mb-sm" label="Se connecter" @click="showLoginDialog = true" />
            <q-btn color="secondary" class="text-white" label="S'inscrire" @click="showSignupDialog = true" />
          </div>

          <!-- Signup dialog optimisée -->
          <q-dialog v-model="showSignupDialog" transition-show="fade" transition-hide="fade" maximized>
            <q-card class="signup-modal" style="max-width: 800px; width: 100%; margin: auto;">
              <q-card-section class="bg-primary text-white">
                <div class="text-h6">Inscription</div>
                <q-btn icon="close" flat round dense v-close-popup class="absolute-right" color="white" />
              </q-card-section>

              <q-form @submit.prevent="handleSignup" class="q-pa-md">
                <!-- Informations personnelles -->
                <div class="text-subtitle1 q-mb-sm text-primary">Informations personnelles</div>
                
                <!-- Ligne 1: Prénom et Nom -->
                <div class="row q-col-gutter-md">
                  <div class="col-12 col-md-6">
                    <q-input 
                      v-model="signupForm.first_name" 
                      label="Prénom *" 
                      outlined 
                      :rules="[val => !!val || 'Le prénom est requis']"
                    >
                      <template v-slot:prepend>
                        <q-icon name="person" color="primary" />
                      </template>
                    </q-input>
                  </div>
                  <div class="col-12 col-md-6">
                    <q-input 
                      v-model="signupForm.last_name" 
                      label="Nom *" 
                      outlined 
                      :rules="[val => !!val || 'Le nom est requis']"
                    >
                      <template v-slot:prepend>
                        <q-icon name="badge" color="primary" />
                      </template>
                    </q-input>
                  </div>
                </div>
                
                <!-- Ligne 2: Email -->
                <q-input 
                  v-model="signupForm.email" 
                  label="Email *" 
                  type="email" 
                  outlined 
                  class="q-my-sm"
                  :rules="[
                    val => !!val || 'L\'email est requis',
                    val => /^[^@]+@[^@]+\.[^@]+$/.test(val) || 'Format d\'email invalide'
                  ]"
                >
                  <template v-slot:prepend>
                    <q-icon name="email" color="primary" />
                  </template>
                </q-input>
                
                <!-- Ligne 3: Mot de passe et confirmation -->
                <div class="row q-col-gutter-md">
                  <div class="col-12 col-md-6">
                    <q-input 
                      v-model="signupForm.password" 
                      label="Mot de passe *" 
                      :type="showPassword ? 'text' : 'password'" 
                      outlined 
                      :rules="[val => !!val || 'Le mot de passe est requis']"
                    >
                      <template v-slot:prepend>
                        <q-icon name="lock" color="primary" />
                      </template>
                      <template v-slot:append>
                        <q-icon
                          :name="showPassword ? 'visibility_off' : 'visibility'"
                          class="cursor-pointer"
                          @click="showPassword = !showPassword"
                        />
                      </template>
                    </q-input>
                  </div>
                  <div class="col-12 col-md-6">
                    <q-input 
                      v-model="signupForm.confirm_password" 
                      label="Confirmer mot de passe *" 
                      :type="showPassword ? 'text' : 'password'" 
                      outlined 
                      :rules="[
                        val => !!val || 'La confirmation est requise',
                        val => val === signupForm.password || 'Les mots de passe ne correspondent pas'
                      ]"
                    >
                      <template v-slot:prepend>
                        <q-icon name="lock" color="primary" />
                      </template>
                    </q-input>
                  </div>
                </div>
                
                <!-- Séparateur -->
                <div class="text-subtitle1 q-my-sm text-primary">Informations sportives</div>
                
                <!-- Ligne 4: Date de naissance et Genre -->
                <div class="row q-col-gutter-md">
                  <div class="col-12 col-md-6">
                    <q-input 
                      v-model="signupForm.birth_date" 
                      label="Date de naissance *" 
                      type="date" 
                      outlined 
                      :rules="[val => !!val || 'La date de naissance est requise']"
                    >
                      <template v-slot:prepend>
                        <q-icon name="event" color="primary" />
                      </template>
                    </q-input>
                  </div>
                  <div class="col-12 col-md-6">
                    <q-field 
                      label="Genre *" 
                      stack-label 
                      outlined
                    >
                      <template v-slot:control>
                        <div class="q-py-sm full-width">
                          <q-radio v-model.number="signupForm.id_gender" :val="1" label="Homme" class="q-mr-md" />
                          <q-radio v-model.number="signupForm.id_gender" :val="2" label="Femme" />
                        </div>
                      </template>
                      <template v-slot:prepend>
                        <q-icon name="people" color="primary" />
                      </template>
                    </q-field>
                  </div>
                </div>
                
                <!-- Ligne 5: Poids et Téléphone -->
                <div class="row q-col-gutter-md q-mt-sm">
                  <div class="col-12 col-md-6">
                    <q-input 
                      v-model.number="signupForm.weight" 
                      label="Poids (kg) *" 
                      type="number" 
                      min="1" 
                      outlined 
                      :rules="[val => !!val || 'Le poids est requis']"
                    >
                      <template v-slot:prepend>
                        <q-icon name="fitness_center" color="primary" />
                      </template>
                    </q-input>
                  </div>
                  <div class="col-12 col-md-6">
                    <q-input 
                      v-model="signupForm.phone" 
                      label="Téléphone *" 
                      outlined 
                      :rules="[val => !!val || 'Le téléphone est requis']"
                    >
                      <template v-slot:prepend>
                        <q-icon name="phone" color="primary" />
                      </template>
                    </q-input>
                  </div>
                </div>
                
                <!-- Ligne 6: Nationalité, Club et Grade -->
                <div class="row q-col-gutter-md q-mt-sm">
                  <div class="col-12 col-md-4">
                    <q-select 
                      v-model="signupForm.nationality" 
                      label="Nationalité *" 
                      outlined 
                      :options="['Française', 'Autre']" 
                      emit-value
                      popup-content-class="z-top"
                    >
                      <template v-slot:prepend>
                        <q-icon name="flag" color="primary" />
                      </template>
                    </q-select>
                  </div>
                  <div class="col-12 col-md-4">
                    <q-select 
                      v-model="signupForm.id_club" 
                      label="Club *" 
                      outlined
                      :options="clubOptions"
                      option-value="id"
                      option-label="name"
                      emit-value
                      map-options
                      menu-self="top middle"
                      transition-show="jump-down"
                      transition-hide="jump-up"
                      popup-content-class="z-top"
                    >
                      <template v-slot:prepend>
                        <q-icon name="business" color="primary" />
                      </template>
                    </q-select>
                  </div>
                  <div class="col-12 col-md-4">
                    <q-select 
                      v-model="signupForm.id_grade" 
                      label="Grade *" 
                      outlined
                      :options="gradeOptions"
                      option-value="id"
                      option-label="name"
                      emit-value
                      map-options
                      menu-self="top middle"
                      transition-show="jump-down"
                      transition-hide="jump-up"
                      popup-content-class="z-top"
                    >
                      <template v-slot:prepend>
                        <q-icon name="military_tech" color="primary" />
                      </template>
                    </q-select>
                  </div>
                </div>

                <q-card-actions align="right" class="q-mt-md">
                  <q-btn flat label="Annuler" color="negative" v-close-popup />
                  <q-btn label="S'inscrire" color="primary" type="submit" :loading="store.loading" />
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
                  <q-btn label="Envoyer le lien de récupération" color="primary" type="submit" :loading="forgotPasswordLoading">
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

        <!-- Nouveau : Section pour les gestionnaires -->
        <template v-if="isConnected && isManager">
          <q-separator />
          <q-item-label header>Gestionnaire</q-item-label>
          <q-item to="/manager" clickable v-ripple>
            <q-item-section avatar><q-icon name="business" /></q-item-section>
            <q-item-section>
              <q-item-label>Espace Gestionnaire</q-item-label>
              <q-item-label caption>Gérez votre club, ses tournois et ses membres</q-item-label>
            </q-item-section>
          </q-item>
        </template>

        <template v-if="isConnected && isAdmin">
          <q-separator />
          <q-item-label header>Espace administrateur</q-item-label>
          <q-item to="/admin" clickable v-ripple>
            <q-item-section avatar><q-icon name="admin_panel_settings" /></q-item-section>
            <q-item-section>
              <q-item-label>Gérer les utilisateurs</q-item-label>
              <q-item-label caption>Modifiez leurs informations ou désactivez‑les.</q-item-label>
            </q-item-section>
          </q-item>
          <!-- Ajout du lien pour la création de club -->
            <q-item to="/admin/create-club" clickable v-ripple>
              <q-item-section avatar><q-icon name="add_business" /></q-item-section>
              <q-item-section>
                <q-item-label>Gérez les clubs</q-item-label>
                <q-item-label caption>Modifier ou ajouter un nouveau club.</q-item-label>
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
const showPassword            = ref(false)
const forgotPasswordLoading   = ref(false)

// To this:
interface Option {
  id: number;
  name: string;
}

const clubOptions = ref<Option[]>([])
const gradeOptions = ref<Option[]>([])

// Ajoutez ces interfaces
interface ClubResponse {
  id: number;
  name: string;
}

interface GradeResponse {
  id: number;
  name: string;
}

interface ApiResponse<T> {
  success: boolean;
  clubs?: T[];
  grades?: T[];
}

interface SignupFormData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  confirm_password: string;
  birth_date: string;
  weight: number;
  phone: string;
  nationality: string;
  id_gender: number;
  id_grade: number;
  id_club: number;
  id_role: number;
  is_active: boolean;
  avatar_seed: string;
}

// ---- Forms ----
const signupForm = ref<SignupFormData>({
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
const isManager    = computed(() => store.isManager)

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

interface PasswordResetResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// Fonction pour charger les clubs et grades depuis l'API
async function loadFormOptions() {
  try {
    const API_URL = import.meta.env.VITE_API_URL;
    
    // Charger les clubs
    const clubsResponse = await fetch(`${API_URL}/clubs`, {
      credentials: 'include'
    });
    
    if (clubsResponse.ok) {
      const clubsData = await clubsResponse.json() as ApiResponse<ClubResponse>;
      if (clubsData.clubs && Array.isArray(clubsData.clubs)) {
        clubOptions.value = clubsData.clubs.map((club: { id: number; name: string }) => ({
          id: club.id,
          name: club.name
        }));
        
        // Si des clubs sont disponibles, définir le premier comme club par défaut
        if (clubOptions.value.length > 0) {
          signupForm.value.id_club = clubOptions.value[0]!.id;
        }
      }
    }
    
    // Charger les grades
    const gradesResponse = await fetch(`${API_URL}/grades`, {
      credentials: 'include'
    });
    
    if (gradesResponse.ok) {
      const gradesData = await gradesResponse.json() as ApiResponse<GradeResponse>;
      if (gradesData.grades && Array.isArray(gradesData.grades)) {
        gradeOptions.value = gradesData.grades.map((grade: { id: number; name: string }) => ({
          id: grade.id,
          name: grade.name
        }));
        
        // Si des grades sont disponibles, définir le premier comme grade par défaut
        if (gradeOptions.value.length > 0) {
          signupForm.value.id_grade = gradeOptions.value[0]!.id;
        }
      }
    }
  } catch (error) {
    console.error('Erreur lors du chargement des options:', error);
    // En cas d'erreur, utiliser des valeurs par défaut
    if (clubOptions.value.length === 0) {
      clubOptions.value = [
        { id: 1, name: 'Club par défaut' }
      ];
    }
    
    if (gradeOptions.value.length === 0) {
      gradeOptions.value = [
        { id: 1, name: 'Débutant' }
      ];
    }
  }
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
    // Typage de la réponse
    const response = await axios.post<PasswordResetResponse>(
      `${import.meta.env.VITE_API_URL}/request-password-reset`, 
      {
        email: forgotPasswordForm.value.email
      }
    );
    
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
  } catch {
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

async function handleSignup() {
  // Vérification des mots de passe
  if (signupForm.value.password !== signupForm.value.confirm_password) {
    $q.notify({ message: 'Mots de passe non identiques', color: 'negative' })
    return
  }

  // Vérifier que la date de naissance est renseignée
  if (!signupForm.value.birth_date) {
    $q.notify({ message: 'La date de naissance est obligatoire', color: 'negative' })
    return
  }
  
  // Vérification de l'âge
  const birthDate = new Date(signupForm.value.birth_date);
  if (isNaN(birthDate.getTime())) {
    $q.notify({ message: 'Format de date de naissance invalide', color: 'negative' })
    return
  }
  
  // Vérifier que la date n'est pas dans le futur
  if (birthDate > new Date()) {
    $q.notify({ message: 'La date de naissance ne peut pas être dans le futur', color: 'negative' })
    return
  }
  
  // Vérifier l'âge minimum (par exemple 10 ans)
  const minAgeDate = new Date();
  minAgeDate.setFullYear(minAgeDate.getFullYear() - 10);
  if (birthDate > minAgeDate) {
    $q.notify({ message: 'L\'âge minimum est de 10 ans', color: 'negative' })
    return
  }
  
  // Vérifier l'âge maximum (par exemple 120 ans)
  const maxAgeDate = new Date();
  maxAgeDate.setFullYear(maxAgeDate.getFullYear() - 120);
  if (birthDate < maxAgeDate) {
    $q.notify({ message: 'L\'âge maximum est de 120 ans', color: 'negative' })
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

  // Le reste de la fonction reste inchangé
  const formattedDate = signupForm.value.birth_date;

  const payload = {
    first_name:    signupForm.value.first_name.trim(),
    last_name:     signupForm.value.last_name.trim(),
    email:         signupForm.value.email.trim().toLowerCase(),
    password:      signupForm.value.password,
    birth_date:    formattedDate, // Juste la date sans heure
    weight:        Number(signupForm.value.weight),
    phone:         signupForm.value.phone.trim() || '',
    nationality:   signupForm.value.nationality,
    id_gender:     signupForm.value.id_gender,
    // Champs avec valeurs par défaut
    id_grade:      signupForm.value.id_grade,
    id_club:       signupForm.value.id_club,
    id_role:       3,
    is_active:     signupForm.value.is_active,
    avatar_seed:   signupForm.value.avatar_seed
  }

  try {
    const ok = await store.signup(payload)
    if (ok) {
      showSignupDialog.value = false
      resetSignupForm()
      $q.notify({ message: 'Inscription réussie !', color: 'positive' })
      // Redirection vers la page d'accueil après inscription
      router.push('/')
    } else {
      $q.notify({ message: 'Erreur lors de l\'inscription', color: 'negative' })
    }
  } catch (error) {
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
      // Redirection vers la page d'accueil après connexion
      router.push('/')
    } else {
      $q.notify({ message: 'Email ou mot de passe incorrect', color: 'negative' })
    }
  } catch (error) {
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

async function logout() {
  await store.logout()
  if (route.path.startsWith('/profile') || 
      route.path.startsWith('/admin') || 
      route.path.startsWith('/manager')) {
    router.push('/')
  }
  $q.notify({ message: 'Déconnexion réussie', color: 'info' })
}

onMounted(() => {
  store.fetchSession()
  loadFormOptions()
})
</script>

<style>
.hover-underline:hover { text-decoration: underline !important; }

.signup-modal {
  border-radius: 8px;
  max-height: 90vh;
  overflow-y: auto;
}

.q-menu {
  z-index: 10000 !important;
}

.z-top {
  z-index: 10000 !important;
}
</style>