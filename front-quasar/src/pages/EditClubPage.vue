<template>
  <q-page padding>
    <div class="row justify-center">
      <div class="col-12 col-md-8 col-lg-6">
        <div class="text-h4 q-mb-lg text-center">Modifier un club</div>
        
        <q-card v-if="loading" class="club-form-card q-pa-md text-center">
          <q-spinner color="primary" size="3em" />
          <div class="q-mt-md">Chargement des données du club...</div>
        </q-card>
        
        <!-- Formulaire d'édition de club -->
        <q-card v-else-if="!errorMessage" class="club-form-card q-pa-md">
          <q-form ref="clubForm" @submit.prevent="updateClub" class="q-gutter-md">
            <!-- Informations de base -->
            <div class="text-subtitle1 q-mb-sm">Informations générales</div>
            
            <q-input 
              v-model="form.name" 
              label="Nom du club *" 
              outlined 
              :rules="[(val) => !!val || 'Le nom est requis']"
              :disable="submitLoading"
              lazy-rules
            >
              <template v-slot:prepend>
                <q-icon name="badge" color="primary" />
              </template>
            </q-input>
            
            <q-input 
              v-model="form.email" 
              label="Email *" 
              type="email" 
              outlined 
              :rules="[
                (val) => !!val || 'L\'email est requis',
                (val) => /^[^@]+@[^@]+\.[^@]+$/.test(val) || 'Format d\'email invalide'
              ]"
              :disable="submitLoading"
              lazy-rules
            >
              <template v-slot:prepend>
                <q-icon name="email" color="primary" />
              </template>
            </q-input>
            
            <q-input 
              v-model="form.phone" 
              label="Téléphone *" 
              outlined 
              :rules="[(val) => !!val || 'Le téléphone est requis']"
              :disable="submitLoading"
              lazy-rules
            >
              <template v-slot:prepend>
                <q-icon name="phone" color="primary" />
              </template>
            </q-input>
            
            <q-input 
              v-model="form.website" 
              label="Site Web" 
              outlined 
              :rules="[
                (val) => !val || /^https?:\/\/.+/.test(val) || 'URL invalide'
              ]"
              :disable="submitLoading"
              lazy-rules
            >
              <template v-slot:prepend>
                <q-icon name="language" color="primary" />
              </template>
            </q-input>
            
            <q-separator />
            
            <!-- Adresse -->
            <div class="text-subtitle1 q-mb-sm">Adresse</div>
            
            <q-input 
              v-model="form.street" 
              label="Rue *" 
              outlined 
              :rules="[(val) => !!val || 'L\'adresse est requise']"
              :disable="submitLoading"
              class="q-mb-md"
              lazy-rules
            >
              <template v-slot:prepend>
                <q-icon name="home" color="primary" />
              </template>
            </q-input>
            
            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-7">
                <q-input 
                  v-model="form.city" 
                  label="Ville *" 
                  outlined 
                  :rules="[(val) => !!val || 'La ville est requise']"
                  :disable="submitLoading"
                  lazy-rules
                >
                  <template v-slot:prepend>
                    <q-icon name="location_city" color="primary" />
                  </template>
                </q-input>
              </div>
              <div class="col-12 col-sm-5">
                <q-input 
                  v-model="form.postal_code" 
                  label="Code postal *" 
                  outlined 
                  :rules="[(val) => !!val || 'Le code postal est requis']"
                  :disable="submitLoading"
                  lazy-rules
                >
                  <template v-slot:prepend>
                    <q-icon name="markunread_mailbox" color="primary" />
                  </template>
                </q-input>
              </div>
            </div>
            
            <!-- Statut -->
            <div class="text-subtitle1 q-mb-sm">Statut</div>
            <q-toggle
              v-model="form.is_active"
              label="Club actif"
              color="positive"
              :disable="submitLoading"
            />
            
            <div class="text-caption q-ml-md" v-if="!form.is_active">
              <q-icon name="info" color="warning" size="xs" class="q-mr-xs" />
              Désactiver un club le rendra invisible dans les listes publiques.
            </div>
            
            <!-- Boutons d'action -->
            <div class="row justify-end q-mt-lg">
              <q-btn 
                flat 
                label="Annuler" 
                color="grey-7" 
                to="/admin/create-club" 
                :disable="submitLoading" 
                class="q-mr-sm" 
              />
              <q-btn 
                unelevated 
                type="submit" 
                label="Enregistrer les modifications" 
                color="primary" 
                :loading="submitLoading" 
                icon="save"
              />
            </div>
          </q-form>
        </q-card>
        
        <!-- Message d'erreur -->
        <div v-else-if="errorMessage" class="text-center">
          <q-banner class="bg-negative text-white">
            <template v-slot:avatar>
              <q-icon name="error" />
            </template>
            {{ errorMessage }}
          </q-banner>
          
          <q-btn 
            color="primary" 
            label="Retour à la liste des clubs" 
            to="/admin/create-club" 
            icon="arrow_back"
            class="q-mt-md"
          />
        </div>
        
        <!-- Message de confirmation -->
        <div v-if="successMessage" class="text-center q-mt-lg">
          <q-banner class="bg-positive text-white">
            <template v-slot:avatar>
              <q-icon name="check_circle" />
            </template>
            {{ successMessage }}
          </q-banner>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from 'src/stores/user';

// Composables
const $q = useQuasar();
const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

// Référence au formulaire pour réinitialiser la validation
const clubForm = ref(null);

// Vérifier que l'utilisateur est connecté et est administrateur
if (!userStore.connected || !userStore.isAdmin) {
  router.push('/');
  $q.notify({
    color: 'negative',
    message: 'Accès non autorisé',
    position: 'top'
  });
}

// ID du club à éditer
const clubId = ref(route.params.id);

// État
const loading = ref(true);
const submitLoading = ref(false);
const successMessage = ref('');
const errorMessage = ref('');

// Formulaire
const form = ref({
  name: '',
  email: '',
  phone: '',
  website: '',
  street: '',
  city: '',
  postal_code: '',
  is_active: true
});

// Fonction pour récupérer les données du club
async function fetchClubData() {
  loading.value = true;
  errorMessage.value = '';
  
  try {
    const API_URL = import.meta.env.VITE_API_URL;
    const response = await fetch(`${API_URL}/clubs/${clubId.value}`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération des données du club (${response.status})`);
    }
    
    const data = await response.json();
    
    if (!data.club) {
      throw new Error('Club non trouvé');
    }
    
    // Remplir le formulaire avec les données du club
    form.value = {
      name: data.club.name || '',
      email: data.club.email || '',
      phone: data.club.phone || '',
      website: data.club.website || '',
      street: data.club.street || '',
      city: data.club.city || '',
      postal_code: data.club.postal_code || '',
      is_active: data.club.is_active === 1 || data.club.is_active === true
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des données du club:', error);
    
    let message = 'Erreur lors du chargement des données du club';
    
    if (error instanceof Error) {
      message = error.message;
    }
    
    errorMessage.value = message;
  } finally {
    loading.value = false;
  }
}

// Fonction pour mettre à jour le club
async function updateClub() {
  submitLoading.value = true;
  successMessage.value = '';
  errorMessage.value = '';
  
  try {
    const API_URL = import.meta.env.VITE_API_URL;
    const response = await fetch(`${API_URL}/clubs/${clubId.value}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors de la mise à jour du club');
    }
    
    successMessage.value = `Le club "${form.value.name}" a été mis à jour avec succès !`;
    
    $q.notify({
      color: 'positive',
      message: 'Club mis à jour avec succès',
      icon: 'check_circle',
      position: 'top',
      timeout: 2000
    });
    
    // Rediriger vers la liste des clubs après un court délai
    setTimeout(() => {
      router.push('/admin/create-club');
    }, 2000);
  } catch (error) {
    let message = 'Erreur lors de la mise à jour du club';
    
    if (error instanceof Error) {
      message = error.message;
    }
    
    errorMessage.value = message;
    
    $q.notify({
      color: 'negative',
      message: message,
      icon: 'error',
      position: 'top',
      timeout: 4000
    });
    
    console.error('Erreur lors de la mise à jour du club:', error);
  } finally {
    submitLoading.value = false;
  }
}

// Charger les données du club au montage du composant
onMounted(() => {
  fetchClubData();
});
</script>