<template>
  <q-page class="q-pa-lg">
    <div class="row justify-center">
      <div class="col-12 col-md-8">
        <q-card flat bordered class="profile-edit-card">
          <!-- En-tête avec bouton Retour -->
          <q-card-section class="row items-center bg-primary text-white">
            <div class="text-h6">Modifier mon profil</div>
            <q-space />
            <q-btn flat icon="arrow_back" label="Retour" to="/profile" color="white" class="hover-btn" />
          </q-card-section>

          <q-separator />

          <q-card-section>
            <q-form @submit.prevent="onSubmit" class="q-gutter-md">
              <!-- Section Avatar avec prévisualisation -->
              <div class="row justify-center q-mb-xl">
                <div class="column items-center">
                  <q-avatar size="150px" class="shadow-2 cursor-pointer avatar-hover" @click="showAvatarDialog = true">
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

              <!-- Champs du formulaire -->
              <div class="row q-col-gutter-md">
                <div class="col-12 col-sm-6">
                  <q-input v-model="form.firstName" label="Prénom" filled :rules="[val => !!val || 'Le prénom est requis']" />
                </div>
                <div class="col-12 col-sm-6">
                  <q-input v-model="form.lastName" label="Nom" filled :rules="[val => !!val || 'Le nom est requis']" />
                </div>
                <div class="col-12">
                  <q-input
                    v-model="form.email"
                    label="Email"
                    type="email"
                    filled
                    :rules="[val => !!val || 'L\'email est requis', val => validateEmail(val) || 'Email invalide']"
                  />
                </div>
                <div class="col-12 col-sm-6">
                  <q-input
                    v-model="form.birthDate"
                    label="Date de naissance"
                    type="date"
                    filled
                    :rules="[val => !!val || 'La date de naissance est requise']"
                  />
                </div>
                <div class="col-12 col-sm-6">
                  <q-select
                    v-model="form.grade"
                    :options="gradeOptions"
                    label="Grade"
                    filled
                    :rules="[val => !!val || 'Le grade est requis']"
                  />
                </div>
                <div class="col-12">
                  <q-select
                    v-model="form.club"
                    :options="clubOptions"
                    label="Club"
                    filled
                    :rules="[val => !!val || 'Le club est requis']"
                  />
                </div>

                <!-- Option de changement de mot de passe -->
                <div class="col-12">
                  <q-expansion-item icon="lock" label="Changer le mot de passe" caption="Optionnel" header-class="text-primary">
                    <q-card>
                      <q-card-section>
                        <div class="row q-col-gutter-md">
                          <div class="col-12">
                            <q-input v-model="form.currentPassword" label="Mot de passe actuel" type="password" filled />
                          </div>
                          <div class="col-12 col-sm-6">
                            <q-input v-model="form.newPassword" label="Nouveau mot de passe" type="password" filled />
                          </div>
                          <div class="col-12 col-sm-6">
                            <q-input v-model="form.confirmPassword" label="Confirmer le mot de passe" type="password" filled />
                          </div>
                        </div>
                      </q-card-section>
                    </q-card>
                  </q-expansion-item>
                </div>
              </div>

              <q-separator class="q-my-lg" />

              <!-- Boutons Annuler / Sauvegarder -->
              <div class="row q-col-gutter-md">
                <div class="col">
                  <q-btn label="Annuler" type="reset" flat class="full-width" color="negative" to="/profile" />
                </div>
                <div class="col">
                  <q-btn label="Sauvegarder" type="submit" color="primary" class="full-width" />
                </div>
              </div>
            </q-form>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Dialog pour la sélection d'avatar -->
    <q-dialog v-model="showAvatarDialog" transition-show="slide-up" transition-hide="slide-down">
      <q-card class="avatar-dialog" style="min-width: 350px; max-width: 600px;">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Choisir votre avatar</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>
        <q-card-section class="q-pt-md">
          <!-- Affichage de la catégorie unique "Avatars" -->
          <div v-for="category in avatarCategories" :key="category.name" class="q-mb-lg">
            <div class="text-subtitle1 q-mb-sm">{{ category.name }}</div>
            <div class="row q-col-gutter-md justify-center">
              <div v-for="img in category.images" :key="img" class="custom-avatar-cell">
                <q-card class="cursor-pointer avatar-card" :class="{ 'avatar-selected': img === currentSeed }" @click="selectAvatar(img)">
                  <q-img :src="img" />
                </q-card>
              </div>
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="center" class="q-mt-md">
          <q-btn color="primary" label="Rafraîchir les avatars" @click="fetchAvatarCategoriesFake" class="q-mb-md" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'

const $q = useQuasar()
const router = useRouter()

// Définition du type du formulaire
interface FormData {
  firstName: string
  lastName: string
  email: string
  birthDate: string
  grade: string
  club: string
  currentPassword: string
  newPassword: string
  confirmPassword: string
  avatarSeed: string
}

const form = ref<FormData>({
  firstName: '',
  lastName: '',
  email: '',
  birthDate: '',
  grade: '',
  club: '',
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
  avatarSeed: ''
})

const gradeOptions = [
  'Ceinture blanche',
  'Ceinture jaune',
  'Ceinture orange',
  'Ceinture verte',
  'Ceinture bleue',
  'Ceinture marron',
  'Ceinture noire 1er dan',
  'Ceinture noire 2ème dan',
  'Ceinture noire 3ème dan'
]

const clubOptions = [
  'Nippon Kempo Paris',
  'Nippon Kempo Lyon',
  'Nippon Kempo Marseille',
  'Nippon Kempo Bordeaux'
]

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Gestion de l'avatar
const showAvatarDialog = ref(false)
const currentSeed = ref('')
const currentAvatarUrl = ref('')

// Type pour les catégories d'avatar
interface AvatarCategory {
  name: string
  images: string[]
}
const avatarCategories = ref<AvatarCategory[]>([])

// Fonction pour générer une seed aléatoire (sans préfixe)
const generateRandomSeed = (): string => {
  return Math.random().toString(36).substring(2, 10)
}

// Générer l'URL d'un avatar via DiceBear
const getAvatarUrl = (seed: string): string => {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`
}

// Fonction pour sélectionner un avatar
const selectAvatar = (img: string) => {
  currentSeed.value = img
  currentAvatarUrl.value = img
  form.value.avatarSeed = img
  $q.notify({
    color: 'positive',
    message: 'Avatar sélectionné',
    position: 'bottom'
  })
  showAvatarDialog.value = false
}

// Recharge des fausses catégories d'avatars en fusionnant toutes en une seule catégorie avec 20 images
const fetchAvatarCategoriesFake = () => {
  avatarCategories.value = [
    {
      name: "Avatars",
      images: Array.from({ length: 20 }, () => getAvatarUrl(generateRandomSeed()))
    }
  ]
}

onMounted(() => {
  // Chargement des fausses données utilisateur
  const fakeProfile = {
    firstName: "Pierre",
    lastName: "Durand",
    email: "pierre.durand@example.com",
    birthDate: "1990-03-15",
    grade: "Ceinture noire 2ème dan",
    club: "Nippon Kempo Paris",
    avatarSeed: "Felix"
  }
  form.value = { ...fakeProfile, currentPassword: "", newPassword: "", confirmPassword: "" }
  currentSeed.value = fakeProfile.avatarSeed
  currentAvatarUrl.value = getAvatarUrl(currentSeed.value)

  // Recharge des fausses catégories d'avatars
  fetchAvatarCategoriesFake()
})

const onSubmit = async () => {
  if (form.value.newPassword && form.value.newPassword !== form.value.confirmPassword) {
    $q.notify({
      color: 'negative',
      message: 'Les mots de passe ne correspondent pas',
      icon: 'error'
    })
    return
  }
  // Simulation d'un appel API
  await new Promise(resolve => setTimeout(resolve, 1000))
  $q.notify({
    color: 'positive',
    message: 'Profil mis à jour avec succès',
    icon: 'check'
  })
  router.push('/profile')
}
</script>