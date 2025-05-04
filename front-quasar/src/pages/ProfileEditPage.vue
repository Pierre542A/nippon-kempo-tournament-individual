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
                  <q-select v-model="form.grade" :options="gradeOptions"
                            label="Grade" filled
                            :rules="[v => !!v || 'Le grade est requis']" />
                </div>
                <div class="col-12">
                  <q-select v-model="form.club" :options="clubOptions"
                            label="Club" filled
                            :rules="[v => !!v || 'Le club est requis']" />
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
                                     label="Nouveau mot de passe" type="password" filled />
                          </div>
                          <div class="col-12 col-sm-6">
                            <q-input v-model="form.confirmPassword"
                                     label="Confirmer" type="password" filled />
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
  grade: string;    club: string;     currentPassword: string
  newPassword: string; confirmPassword: string; avatarSeed: string
}

const gradeOptions = [
  'Ceinture blanche', 'Ceinture jaune',  'Ceinture orange',
  'Ceinture verte',   'Ceinture bleue',  'Ceinture marron',
  'Ceinture noire 1er dan', 'Ceinture noire 2ème dan', 'Ceinture noire 3ème dan'
]
const clubOptions  = [
  'Nippon Kempo Paris', 'Nippon Kempo Lyon',
  'Nippon Kempo Marseille', 'Nippon Kempo Bordeaux'
]

const form = ref<FormData>({
  firstName: '', lastName: '', email: '', birthDate: '',
  grade: '', club: '', currentPassword: '',
  newPassword: '', confirmPassword: '', avatarSeed: ''
})

/* -------------------- avatar actuel -------------------------------- */
const showAvatarDialog = ref(false)
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
    birthDate: u.birth_date,
    grade    : u.grade_name,
    club     : u.club_name,
    currentPassword: '',
    newPassword    : '',
    confirmPassword: '',
    avatarSeed     : currentSeed.value
  }
  refreshSeeds()
})

/* -------------------- submit --------------------------------------- */
const onSubmit = async () => {
  if (form.value.newPassword && form.value.newPassword !== form.value.confirmPassword) {
    $q.notify({ color: 'negative', message: 'Les mots de passe ne correspondent pas' })
    return
  }

  /* --- simulation --- remplace par tes appels réels ---------------- */
  await new Promise(r => setTimeout(r, 800))

  /* avatar modifié ? */
  if (form.value.avatarSeed !== store.user!.avatar_seed) {
    await axios.put('/me/avatar', { seed: form.value.avatarSeed })
    store.user!.avatar_seed = form.value.avatarSeed
  }

  $q.notify({ color: 'positive', message: 'Profil mis à jour' })
  router.push('/profile')
}
</script>

<style scoped>
.avatar-card { transition: transform .2s }
.avatar-card:hover { transform: scale(1.05) }
.avatar-selected { border: 2px solid var(--q-primary); }
</style>
