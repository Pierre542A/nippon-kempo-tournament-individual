<template>
  <q-page class="q-pa-lg">
    <div class="row justify-center">
      <div class="col-12 col-md-8">
        <q-card flat bordered class="profile-edit-card">

          <!-- En-tête -->
          <q-card-section class="row items-center bg-primary text-white">
            <div class="text-h6">Modifier mon profil</div>
            <q-space />
            <q-btn flat icon="arrow_back" label="Retour"
                   to="/profile" color="white" />
          </q-card-section>

          <q-separator />

          <q-card-section>
            <q-form @submit.prevent="onSubmit" class="q-gutter-md">

              <!-- Avatar -->
              <div class="row justify-center q-mb-xl">
                <div class="column items-center">
                  <q-avatar size="150px" class="shadow-2 cursor-pointer"
                            @click="showAvatarDialog = true">
                    <q-img :src="currentAvatarUrl" />
                    <div class="avatar-overlay">
                      <q-icon name="edit" size="24px" color="white" />
                    </div>
                  </q-avatar>
                  <div class="text-caption q-mt-sm text-grey-7">
                    Cliquez pour personnaliser votre avatar (Seed actuelle: {{ currentSeed }})
                  </div>
                </div>
              </div>

              <!-- Champs -->
              <div class="row q-col-gutter-md">
                <div class="col-12 col-sm-6">
                  <q-input v-model="form.firstName" label="Prénom" filled
                           :rules="[v => !!v || 'Le prénom est requis']" />
                </div>
                <div class="col-12 col-sm-6">
                  <q-input v-model="form.lastName" label="Nom" filled
                           :rules="[v => !!v || 'Le nom est requis']" />
                </div>
                <div class="col-12">
                  <q-input v-model="form.email" type="email" label="Email" filled
                           :rules="[
                             v => !!v || 'L\'email est requis',
                             v => validateEmail(v) || 'Email invalide'
                           ]" />
                </div>
                <div class="col-12 col-sm-6">
                  <q-input v-model="form.birthDate" type="date" label="Date de naissance"
                           filled :rules="[v => !!v || 'La date de naissance est requise']" />
                </div>
                <div class="col-12 col-sm-6">
                  <q-input v-model.number="form.weight" type="number" label="Poids (kg)"
                           filled />
                </div>
                <div class="col-12 col-sm-6">
                  <q-select v-model="form.grade" :options="gradeOptions"
                            option-value="id" option-label="name"
                            label="Grade" filled emit-value map-options
                            :loading="loading.grades" />
                </div>
                <div class="col-12 col-sm-6">
                  <q-select v-model="form.nationality" :options="['Française', 'Autre']"
                            label="Nationalité" filled />
                </div>
                <div class="col-12">
                  <q-select v-model="form.club" :options="clubOptions"
                            option-value="id" option-label="name"
                            label="Club" filled emit-value map-options
                            :loading="loading.clubs" />
                </div>
                <div class="col-12">
                  <q-input v-model="form.phone" label="Téléphone" filled 
                          :rules="[
                            v => !v || validatePhone(v) || 'Format de téléphone invalide'
                          ]" />
                </div>
                <div class="col-12">
                  <q-select v-model="form.gender" :options="genderOptions"
                          option-value="id" option-label="name"
                          label="Genre" filled emit-value map-options />
                </div>

                <!-- Changer de mot de passe -->
                <div class="col-12">
                  <q-expansion-item
                    icon="lock" label="Changer le mot de passe" caption="Optionnel"
                    header-class="text-primary">
                    <q-card>
                      <q-card-section>
                        <div class="row q-col-gutter-md">
                          <div class="col-12">
                            <q-input v-model="form.currentPassword"
                                     label="Mot de passe actuel" type="password" filled />
                          </div>
                          <div class="col-12 col-sm-6">
                            <q-input v-model="form.newPassword"
                                     label="Nouveau mot de passe" type="password" filled 
                                     :rules="[
                                       v => !v || v.length >= 8 || 'Le mot de passe doit contenir au moins 8 caractères'
                                     ]" />
                          </div>
                          <div class="col-12 col-sm-6">
                            <q-input v-model="form.confirmPassword"
                                     label="Confirmer" type="password" filled 
                                     :rules="[validatePasswordMatch]" />
                          </div>
                        </div>
                      </q-card-section>
                    </q-card>
                  </q-expansion-item>
                </div>
              </div>

              <q-separator class="q-my-lg" />

              <!-- Boutons -->
              <div class="row q-col-gutter-md">
                <div class="col">
                  <q-btn label="Annuler" type="reset" flat
                         class="full-width" color="negative"
                         to="/profile" />
                </div>
                <div class="col">
                  <q-btn label="Sauvegarder" type="submit"
                         color="primary" class="full-width" 
                         :loading="loading.submit" />
                </div>
              </div>
              
              <!-- Supprimer le compte -->
              <div class="row justify-center q-mt-xl">
                <q-btn label="Supprimer mon compte" color="negative" flat
                       @click="showDeleteDialog = true" />
              </div>
            </q-form>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Dialog avatars -->
    <q-dialog v-model="showAvatarDialog">
      <q-card style="min-width:350px;max-width:600px;">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Choisir votre avatar</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <div class="text-subtitle1 q-mb-sm">Avatars</div>
          <div class="row q-col-gutter-md justify-center">
            <div v-for="seed in avatarSeeds" :key="seed" class="custom-avatar-cell">
              <q-card class="cursor-pointer avatar-card"
                      :class="{ 'avatar-selected': seed === currentSeed }"
                      @click="selectAvatar(seed)">
                <q-img :src="getAvatarUrl(seed)" />
              </q-card>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="center">
          <q-btn color="primary" label="Rafraîchir"
                 @click="refreshSeeds" />
        </q-card-actions>
      </q-card>
    </q-dialog>
    
    <!-- Dialog confirmation suppression -->
    <q-dialog v-model="showDeleteDialog">
      <q-card style="min-width:300px;">
        <q-card-section class="row items-center bg-negative text-white">
          <div class="text-h6">Confirmation</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <p class="text-body1">Êtes-vous sûr de vouloir supprimer votre compte ?</p>
          <p class="text-body2">Cette action est irréversible.</p>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Annuler" color="primary" v-close-popup />
          <q-btn flat label="Supprimer" color="negative" @click="deleteAccount" :loading="loading.delete" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { useUserStore } from '../stores/user'

interface Grade {
  id: number;
  name: string;
}

interface Club {
  id: number;
  name: string;
}

interface ApiGradesResponse {
  success: boolean;
  grades: Grade[];
}

interface ApiClubsResponse {
  success: boolean;
  clubs: Club[];
}

// Interface pour typer les erreurs
interface ApiError {
  response?: {
    status?: number
    data?: {
      error?: string;
      message?: string;
    };
  };
  message?: string;
}

const $q      = useQuasar()
const router  = useRouter()
const store   = useUserStore()

// État de chargement pour les différentes opérations
const loading = ref({
  grades: false,
  clubs: false,
  submit: false,
  delete: false
})

/* -------------------- constantes DiceBear --------------------------- */
const STYLE = 'avataaars'
const SIZE  = 150

/* -------------------- helpers -------------------------------------- */
const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const validateEmail = (e: string) => emailRx.test(e)

// Regex pour validation de numéro de téléphone (format international)
const phoneRx = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/
const validatePhone = (p: string) => phoneRx.test(p)

const getAvatarUrl = (seed: string) =>
  `https://api.dicebear.com/9.x/${STYLE}/svg?seed=${seed}&size=${SIZE}`

const randSeed = () => Math.random().toString(36).slice(2, 10)

/* -------------------- formulaire ----------------------------------- */
interface FormData {
  firstName: string; lastName: string; email: string; birthDate: string
  grade: number | null; club: number | null; currentPassword: string; gender: number | null;
  newPassword: string; confirmPassword: string; avatarSeed: string
  weight: number | null; phone: string; nationality: string | null
}

interface Option {
  id: number;
  name: string;
}

const clubOptions = ref<Option[]>([])
const gradeOptions = ref<Option[]>([])

const genderOptions = [
  { id: 1, name: 'Homme' },
  { id: 2, name: 'Femme' }
]

const form = ref<FormData>({
  firstName: '', lastName: '', email: '', birthDate: '',
  grade: null, club: null, currentPassword: '', gender: null,
  newPassword: '', confirmPassword: '', avatarSeed: '',
  weight: null, phone: '', nationality: ''
})

const validatePasswordMatch = () => {
  return !form.value.newPassword || 
         form.value.newPassword === form.value.confirmPassword || 
         'Les mots de passe ne correspondent pas';
}

/* -------------------- dialogs ------------------------------------- */
const showAvatarDialog = ref(false)
const showDeleteDialog = ref(false)

/* -------------------- avatar actuel -------------------------------- */
const currentSeed = ref('default')
const currentAvatarUrl = computed(() => getAvatarUrl(currentSeed.value))

/* 20 seeds pour la modale */
const avatarSeeds = ref<Array<string>>([])
const refreshSeeds = () => {
  avatarSeeds.value = Array.from({ length: 20 }, randSeed)
}
const selectAvatar = (seed: string) => {
  currentSeed.value = seed
  form.value.avatarSeed = seed
  $q.notify({ color: 'positive', message: 'Avatar sélectionné' })
  showAvatarDialog.value = false
}

/* -------------------- Chargement des données ---------------------- */
const fetchGrades = async () => {
  loading.value.grades = true
  try {
    const gradesResponse = await axios.get<ApiGradesResponse>(`${import.meta.env.VITE_API_URL}/grades`)
    if (gradesResponse.data?.success && Array.isArray(gradesResponse.data.grades)) {
      gradeOptions.value = gradesResponse.data.grades
    }
  } catch (error) {
    const err = error as ApiError
    $q.notify({
      color: 'negative',
      message: err.response?.data?.error || err.response?.data?.message || 'Erreur lors du chargement des grades'
    })
  } finally {
    loading.value.grades = false
  }
}

const fetchClubs = async () => {
  loading.value.clubs = true
  try {
    const clubsResponse = await axios.get<ApiClubsResponse>(`${import.meta.env.VITE_API_URL}/clubs`)
    if (clubsResponse.data?.success && Array.isArray(clubsResponse.data.clubs)) {
      clubOptions.value = clubsResponse.data.clubs
    }
  } catch (error) {
    const err = error as ApiError
    $q.notify({
      color: 'negative',
      message: err.response?.data?.error || err.response?.data?.message || 'Erreur lors du chargement des clubs'
    })
  } finally {
    loading.value.clubs = false
  }
}

/* -------------------- Remplir le formulaire avec les données utilisateur -------------------- */
const fillFormWithUserData = () => {
  if (!store.user) {
    return false
  }
  
  const u = store.user
  
  // Définir une valeur par défaut pour birthDate pour éviter le undefined
  let birthDateStr = ''
  if (u.birth_date) {
    // Convertir le format ISO en YYYY-MM-DD
    try {
      // Gérer soit un format ISO complet, soit juste la partie date
      const birthDate = new Date(u.birth_date)
      if (!isNaN(birthDate.getTime())) {
        // Formater en YYYY-MM-DD
        const year = birthDate.getFullYear()
        const month = String(birthDate.getMonth() + 1).padStart(2, '0')
        const day = String(birthDate.getDate()).padStart(2, '0')
        birthDateStr = `${year}-${month}-${day}`
      }
    } catch {
      // En cas d'erreur, on essaie d'extraire juste la partie date
      if (typeof u.birth_date === 'string') {
        const parts = u.birth_date.split('T')
        if (parts.length > 0 && parts[0]) {
          birthDateStr = parts[0]
        }
      }
    }
  }

  form.value = {
    firstName: u.first_name,
    lastName : u.last_name,
    email    : u.email,
    birthDate: birthDateStr, // Date sans l'heure, avec valeur par défaut
    grade    : u.id_grade, // Conserver la valeur null si elle est absente
    club     : u.id_club,  // Conserver la valeur null si elle est absente
    gender   : u.id_gender,
    weight   : u.weight || null, // Poids peut être null
    phone    : u.phone || '',
    nationality: u.nationality,
    currentPassword: '',
    newPassword    : '',
    confirmPassword: '',
    avatarSeed     : u.avatar_seed || 'default'
  }
  
  // Mise à jour de currentSeed avec la valeur de l'avatar de l'utilisateur
  currentSeed.value = u.avatar_seed || 'default'
  
  return true
}

/* -------------------- init ----------------------------------------- */
onMounted(async () => {  
  // Charger les listes de grades et clubs depuis l'API
  await Promise.all([fetchGrades(), fetchClubs()])
  
  // Remplir le formulaire si l'utilisateur est déjà chargé
  if (store.user) {
    fillFormWithUserData()
  } else {
    try {
      await store.fetchSession()
      fillFormWithUserData()
    } catch {
      $q.notify({
        color: 'negative',
        message: 'Erreur lors du chargement de votre profil, veuillez vous reconnecter'
      })
      router.push('/login')
    }
  }
  
  refreshSeeds()
})

// Surveiller les changements dans le store.user pour mettre à jour le formulaire
watch(() => store.user, (newUser) => {
  if (newUser) {
    fillFormWithUserData()
  }
}, { deep: true })

/* -------------------- submit --------------------------------------- */
const onSubmit = async () => {
  // Vérification pour le changement de mot de passe
  if (form.value.newPassword) {
    if (!form.value.currentPassword) {
      $q.notify({ color: 'negative', message: 'Le mot de passe actuel est requis pour changer le mot de passe' })
      return
    }
    
    if (form.value.newPassword.length < 8) {
      $q.notify({ color: 'negative', message: 'Le nouveau mot de passe doit contenir au moins 8 caractères' })
      return
    }
    
    if (form.value.newPassword !== form.value.confirmPassword) {
      $q.notify({ color: 'negative', message: 'Les mots de passe ne correspondent pas' })
      return
    }
  }
  
  loading.value.submit = true
  try {    
    // Préparer les données à envoyer au serveur
    const payload: Record<string, string | number | boolean | null> = {
      first_name: form.value.firstName,
      last_name: form.value.lastName,
      email: form.value.email,
      birth_date: form.value.birthDate, // Juste la date sans l'heure
      avatar_seed: form.value.avatarSeed // Inclure la seed de l'avatar dans la même requête
    }
    
    // Ajouter les champs optionnels seulement s'ils ont une valeur
    if (form.value.nationality) {
      payload.nationality = form.value.nationality;
    }

    if (form.value.gender !== null) {
      payload.id_gender = form.value.gender;
    }

    if (form.value.phone) {
      payload.phone = form.value.phone;
    }
    
    if (form.value.weight !== null) {
      payload.weight = form.value.weight;
    }
    
    if (form.value.grade !== null) {
      payload.id_grade = form.value.grade;
    }
    
    if (form.value.club !== null) {
      payload.id_club = form.value.club;
    }
    
    // Si changement de mot de passe, ajouter les champs correspondants
    if (form.value.newPassword && form.value.currentPassword) {
      Object.assign(payload, {
        password: form.value.newPassword,
        current_password: form.value.currentPassword
      })
    }
    
    // Mettre à jour le profil (une seule requête pour tout, y compris l'avatar)
    await axios.put(`${import.meta.env.VITE_API_URL}/users/${store.user!.id}`, payload);
        
    // Force un rechargement complet des données de session pour actualiser le store Pinia
    await store.fetchSession();
        
    // Afficher la notification de succès
    $q.notify({ color: 'positive', message: 'Profil mis à jour avec succès' })
    
    // Redirection vers la page de profil
    router.push('/profile')
  } catch (error) {
    // Gestion spécifique des erreurs d'email déjà utilisé
    const err = error as ApiError
        
    if (err.response?.status === 409 || 
        (err.response?.data?.error && err.response.data.error.includes('email')) || 
        (err.response?.data?.message && err.response.data.message.includes('email'))) {
      $q.notify({
        color: 'negative',
        message: 'Cet email est déjà utilisé par un autre compte'
      })
    } else {
      $q.notify({
        color: 'negative',
        message: err.response?.data?.error || err.response?.data?.message || 'Erreur lors de la mise à jour du profil'
      })
    }
  } finally {
    loading.value.submit = false
  }
}

/* -------------------- delete account ------------------------------- */
const deleteAccount = async () => {
  loading.value.delete = true
  try {
    // Appel API pour désactiver le compte (is_active = 0)
    await axios.put(`${import.meta.env.VITE_API_URL}/users/${store.user!.id}`, { is_active: false })
    
    // Déconnexion
    await store.logout()
    
    // Notification et redirection
    $q.notify({ 
      color: 'info', 
      message: 'Votre compte a été supprimé. Vous avez été déconnecté.' 
    })
    
    router.push('/')
  } catch (error) {
    const err = error as ApiError
    $q.notify({
      color: 'negative',
      message: err.response?.data?.error || err.response?.data?.message || 'Erreur lors de la suppression du compte'
    })
    showDeleteDialog.value = false
  } finally {
    loading.value.delete = false
  }
}
</script>

<style scoped>
.avatar-card { transition: transform .2s; border-radius: 4px; overflow: hidden; }
.avatar-card:hover { transform: scale(1.05) }
.avatar-selected { border: 2px solid var(--q-primary); }
.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0,0,0,0.3);
  opacity: 0;
  transition: opacity 0.2s;
}
.q-avatar:hover .avatar-overlay {
  opacity: 1;
}
.custom-avatar-cell {
  width: 80px;
  margin-bottom: 12px;
}
</style>