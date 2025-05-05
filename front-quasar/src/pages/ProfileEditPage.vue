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
                    Cliquez pour personnaliser votre avatar
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
                           filled :rules="[v => !!v || 'Le poids est requis']" />
                </div>
                <div class="col-12 col-sm-6">
                  <q-select v-model="form.grade" :options="gradeOptions"
                            option-value="id" option-label="name"
                            label="Grade" filled emit-value map-options
                            :rules="[v => !!v || 'Le grade est requis']" />
                </div>
                <div class="col-12 col-sm-6">
                  <q-select v-model="form.nationality" :options="['Française', 'Autre']"
                            label="Nationalité" filled
                            :rules="[v => !!v || 'La nationalité est requise']" />
                </div>
                <div class="col-12">
                  <q-select v-model="form.club" :options="clubOptions"
                            option-value="id" option-label="name"
                            label="Club" filled emit-value map-options
                            :rules="[v => !!v || 'Le club est requis']" />
                </div>
                <div class="col-12">
                  <q-input v-model="form.phone" label="Téléphone" filled />
                </div>
                <div class="col-12">
                  <q-select v-model="form.gender" :options="genderOptions"
                            option-value="id" option-label="name"
                            label="Genre" filled emit-value map-options
                            :rules="[v => !!v || 'Le genre est requis']" />
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
                                     :rules="[
                                       v => !form.newPassword || v === form.newPassword || 'Les mots de passe ne correspondent pas'
                                     ]" />
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
                         color="primary" class="full-width" />
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
          <q-btn flat label="Supprimer" color="negative" @click="deleteAccount" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { useUserStore } from '../stores/user'

const $q      = useQuasar()
const router  = useRouter()
const store   = useUserStore()

/* -------------------- constantes DiceBear --------------------------- */
const STYLE = 'avataaars'
const SIZE  = 150

/* -------------------- helpers -------------------------------------- */
const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const validateEmail = (e: string) => emailRx.test(e)

const getAvatarUrl = (seed: string) =>
  `https://api.dicebear.com/9.x/${STYLE}/svg?seed=${seed}&size=${SIZE}`

const randSeed = () => Math.random().toString(36).slice(2, 10)

/* -------------------- formulaire ----------------------------------- */
interface FormData {
  firstName: string; lastName: string; email: string; birthDate: string
  grade: number; club: number; currentPassword: string; gender: number
  newPassword: string; confirmPassword: string; avatarSeed: string
  weight: number; phone: string; nationality: string
}

// Options pour les champs select avec id et nom 
const gradeOptions = [
  { id: 1, name: 'Ceinture blanche' }, 
  { id: 2, name: 'Ceinture jaune' },  
  { id: 3, name: 'Ceinture orange' },
  { id: 4, name: 'Ceinture verte' },   
  { id: 5, name: 'Ceinture bleue' },  
  { id: 6, name: 'Ceinture marron' },
  { id: 7, name: 'Ceinture noire 1er dan' }, 
  { id: 8, name: 'Ceinture noire 2ème dan' }, 
  { id: 9, name: 'Ceinture noire 3ème dan' }
]

const clubOptions = [
  { id: 1, name: 'Nippon Kempo Paris' }, 
  { id: 2, name: 'Nippon Kempo Lyon' },
  { id: 3, name: 'Nippon Kempo Marseille' }, 
  { id: 4, name: 'Nippon Kempo Bordeaux' }
]

const genderOptions = [
  { id: 1, name: 'Homme' },
  { id: 2, name: 'Femme' }
]

const form = ref<FormData>({
  firstName: '', lastName: '', email: '', birthDate: '',
  grade: 1, club: 1, currentPassword: '', gender: 1,
  newPassword: '', confirmPassword: '', avatarSeed: '',
  weight: 0, phone: '', nationality: 'Française'
})

/* -------------------- dialogs ------------------------------------- */
const showAvatarDialog = ref(false)
const showDeleteDialog = ref(false)

/* -------------------- avatar actuel -------------------------------- */
const currentSeed = ref(store.user?.avatar_seed ?? 'default')
const currentAvatarUrl = computed(() => getAvatarUrl(currentSeed.value))

/* 20 seeds pour la modale */
const avatarSeeds = ref<Array<string>>([])
const refreshSeeds = () => {
  avatarSeeds.value = Array.from({ length: 20 }, randSeed)
}
const selectAvatar = (seed: string) => {
  currentSeed.value       = seed
  form.value.avatarSeed   = seed
  $q.notify({ color: 'positive', message: 'Avatar sélectionné' })
  showAvatarDialog.value = false
}

/* -------------------- init ----------------------------------------- */
onMounted(() => {
  const u = store.user!
  form.value = {
    firstName: u.first_name,
    lastName : u.last_name,
    email    : u.email,
    birthDate: u.birth_date.split(' ')[0], // Récupérer juste la date sans l'heure
    grade    : u.id_grade,
    club     : u.id_club,
    gender   : u.id_gender,
    weight   : u.weight,
    phone    : u.phone || '',
    nationality: u.nationality,
    currentPassword: '',
    newPassword    : '',
    confirmPassword: '',
    avatarSeed     : u.avatar_seed || 'default'
  }
  
  currentSeed.value = u.avatar_seed || 'default'
  refreshSeeds()
})

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
  
  try {
    // Préparer les données à envoyer au serveur
    const payload = {
      first_name: form.value.firstName,
      last_name: form.value.lastName,
      email: form.value.email,
      birth_date: `${form.value.birthDate} 00:00:00`, // Ajouter l'heure pour DATETIME
      weight: form.value.weight,
      phone: form.value.phone,
      nationality: form.value.nationality,
      id_gender: form.value.gender,
      id_grade: form.value.grade,
      id_club: form.value.club
    }
    
    // Si changement de mot de passe, ajouter les champs correspondants
    if (form.value.newPassword) {
      Object.assign(payload, {
        password: form.value.newPassword,
        current_password: form.value.currentPassword
      })
    }
    
    // Mettre à jour le profil
    await axios.put(`/users/${store.user!.id}`, payload)
    
    // Mettre à jour l'avatar si modifié
    if (form.value.avatarSeed !== store.user!.avatar_seed) {
      await axios.put(`/users/${store.user!.id}`, { avatar_seed: form.value.avatarSeed })
    }
    
    // Mettre à jour les données utilisateur dans le store
    await store.fetchSession()
    
    $q.notify({ color: 'positive', message: 'Profil mis à jour avec succès' })
    router.push('/profile')
  } catch (error) {
    console.error('Erreur mise à jour profil:', error)
    $q.notify({
      color: 'negative',
      message: error?.response?.data?.error || 'Erreur lors de la mise à jour du profil'
    })
  }
}

/* -------------------- delete account ------------------------------- */
const deleteAccount = async () => {
  try {
    // Appel API pour désactiver le compte (is_active = 0)
    await axios.put(`/users/${store.user!.id}`, { is_active: false })
    
    // Déconnexion
    await store.logout()
    
    // Notification et redirection
    $q.notify({ 
      color: 'info', 
      message: 'Votre compte a été supprimé. Vous avez été déconnecté.' 
    })
    
    router.push('/')
  } catch (error) {
    console.error('Erreur suppression compte:', error)
    $q.notify({
      color: 'negative',
      message: error?.response?.data?.error || 'Erreur lors de la suppression du compte'
    })
    showDeleteDialog.value = false
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