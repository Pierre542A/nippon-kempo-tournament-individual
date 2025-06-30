<template>
  <q-page padding>
    <div class="row justify-center">
      <div class="col-12 col-md-8 col-lg-6" v-if="!successMessage">
        <div class="text-h4 q-mb-lg text-center">Créer un nouveau club</div>
        
        <!-- Formulaire de création de club -->
        <q-card class="club-form-card q-pa-md">
          <q-form ref="clubForm" @submit.prevent="createClub" class="q-gutter-md">
            <!-- Informations de base -->
            <div class="text-subtitle1 q-mb-sm">Informations générales</div>
            
            <q-input 
              v-model="form.name" 
              label="Nom du club *" 
              outlined 
              :rules="[(val) => !!val || 'Le nom est requis']"
              :disable="loading"
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
              :disable="loading"
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
              :disable="loading"
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
              :disable="loading"
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
            :disable="loading"
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
                  :disable="loading"
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
                  :disable="loading"
                  lazy-rules
                >
                  <template v-slot:prepend>
                    <q-icon name="markunread_mailbox" color="primary" />
                  </template>
                </q-input>
              </div>
            </div>
            
            <!-- Boutons d'action -->
            <div class="row justify-end q-mt-lg">
              <q-btn 
                flat 
                label="Annuler" 
                color="grey-7" 
                to="/admin" 
                :disable="loading" 
                class="q-mr-sm" 
              />
              <q-btn 
                unelevated 
                type="submit" 
                label="Créer le club" 
                color="primary" 
                :loading="loading" 
                icon="add_business"
              />
            </div>
          </q-form>
        </q-card>
      </div>
      
      <!-- Message de confirmation -->
      <div v-if="successMessage" class="col-12 col-md-8 col-lg-6 text-center">
        <q-banner class="bg-positive text-white q-mb-lg">
          <template v-slot:avatar>
            <q-icon name="check_circle" />
          </template>
          {{ successMessage }}
        </q-banner>
        
        <div class="q-mb-lg">
          <q-btn 
            color="primary" 
            label="Retour à l'administration" 
            to="/admin" 
            icon="arrow_back"
            class="q-mr-sm"
          />
          <q-btn 
            color="secondary" 
            label="Créer un autre club" 
            @click="resetForm" 
            icon="refresh"
          />
        </div>
      </div>
      
      <!-- Liste des clubs -->
      <div class="col-12 q-mt-xl">
        <h4 class="text-center">Liste des clubs</h4>
        
        <div class="row q-mb-md">
          <div class="col-12 col-md-6">
            <q-input v-model="search" placeholder="Rechercher un club..." dense outlined>
              <template v-slot:append>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>
          <div class="col-12 col-md-6 q-pt-sm-xs q-pt-md-none text-center text-md-right">
            <q-option-group
              v-model="statusFilter"
              :options="[
                { label: 'Tous', value: 'all' },
                { label: 'Actifs', value: 'active' },
                { label: 'Inactifs', value: 'inactive' }
              ]"
              inline
              dense
              color="primary"
            />
          </div>
        </div>
        
        <q-table
          :rows="filteredClubs"
          :loading="loadingClubs"
          :columns="columns"
          row-key="id"
          :pagination="{ rowsPerPage: 10 }"
          separator="cell"
          class="q-mt-md club-table"
        >
          <!-- Statut personnalisé -->
          <template v-slot:body-cell-status="props">
            <q-td :props="props">
              <q-badge :color="props.row.is_active ? 'positive' : 'negative'">
                {{ props.row.is_active ? 'Actif' : 'Inactif' }}
              </q-badge>
            </q-td>
          </template>
          
          <!-- Actions -->
          <template v-slot:body-cell-actions="props">
            <q-td :props="props" class="q-gutter-sm">
              <q-btn
                flat
                round
                size="sm"
                :color="props.row.is_active ? 'negative' : 'positive'"
                :icon="props.row.is_active ? 'block' : 'check_circle'"
                @click="toggleClubStatus(props.row)"
                :disable="toggleLoading === props.row.id"
                :loading="toggleLoading === props.row.id"
              >
                <q-tooltip>
                  {{ props.row.is_active ? 'Désactiver' : 'Activer' }}
                </q-tooltip>
              </q-btn>
              
              <q-btn
                flat
                round
                size="sm"
                color="primary"
                icon="edit"
                @click="editClub(props.row)"
              >
                <q-tooltip>Modifier</q-tooltip>
              </q-btn>
              
            </q-td>
          </template>
          
          <!-- État vide -->
          <template v-slot:no-data>
            <div class="full-width row flex-center q-gutter-sm q-pa-lg">
              <q-icon name="business" size="2em" color="grey-7" />
              <span class="text-grey-7">
                Aucun club trouvé
              </span>
            </div>
          </template>
        </q-table>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useQuasar, QForm } from 'quasar';
import { useRouter } from 'vue-router';
import { useUserStore } from 'src/stores/user';

// Types
interface Club {
  id: number;
  name: string;
  email: string;
  phone: string;
  website?: string;
  street: string;
  postal_code: string;
  city: string;
  is_active: boolean;
}

// Composables
const $q = useQuasar();
const router = useRouter();
const userStore = useUserStore();

interface QFormRef {
  resetValidation: () => void;
}

// Référence au formulaire pour réinitialiser la validation
const clubForm = ref<QFormRef | null>(null);

// Vérifier que l'utilisateur est connecté et est administrateur
if (!userStore.connected || !userStore.isAdmin) {
  router.push('/');
  $q.notify({
    color: 'negative',
    message: 'Accès non autorisé',
    position: 'top'
  });
}

// État
const loading = ref(false);
const loadingClubs = ref(false);
const successMessage = ref('');
const clubs = ref<Club[]>([]);
const search = ref('');
const statusFilter = ref('all'); // 'all', 'active', 'inactive'
const toggleLoading = ref<number | null>(null);

// Définition des colonnes
const columns = [
  {
    name: 'id',
    required: true,
    label: 'ID',
    align: 'left' as const, // "as const" pour fixer le type littéral
    field: 'id',
    sortable: true,
    style: 'width: 50px'
  },
  {
    name: 'name',
    required: true,
    label: 'Nom',
    align: 'left' as const,
    field: 'name',
    sortable: true
  },
  {
    name: 'email',
    required: true,
    label: 'Email',
    align: 'left' as const,
    field: 'email',
    sortable: true
  },
  {
    name: 'phone',
    required: true,
    label: 'Téléphone',
    align: 'left' as const,
    field: 'phone'
  },
  {
    name: 'city',
    required: true,
    label: 'Ville',
    align: 'left' as const,
    field: 'city',
    sortable: true
  },
  {
    name: 'status',
    required: true,
    label: 'Statut',
    align: 'center' as const,
    field: 'is_active',
    sortable: true
  },
  {
    name: 'actions',
    required: true,
    label: 'Actions',
    align: 'center' as const,
    field: 'actions'
  }
];

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

// Filtrer les clubs en fonction de la recherche et du statut
const filteredClubs = computed(() => {
  let result = clubs.value;
  
  // Filtrer par statut
  if (statusFilter.value === 'active') {
    result = result.filter(club => club.is_active);
  } else if (statusFilter.value === 'inactive') {
    result = result.filter(club => !club.is_active);
  }
  
  // Filtrer par recherche
  if (search.value) {
    const searchLower = search.value.toLowerCase();
    result = result.filter(club => 
      club.name.toLowerCase().includes(searchLower) ||
      club.email.toLowerCase().includes(searchLower) ||
      club.city.toLowerCase().includes(searchLower)
    );
  }
  
  return result;
});

// Créer un club
async function createClub() {
  loading.value = true;
  
  try {
    const API_URL = import.meta.env.VITE_API_URL;
    const response = await fetch(`${API_URL}/clubs`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors de la création du club');
    }
    
    const clubId = data.club_id || '';
    
    successMessage.value = `Le club "${form.value.name}" a été créé avec succès ! ${clubId ? `(ID: ${clubId})` : ''}`;
    
    $q.notify({
      color: 'positive',
      message: 'Club créé avec succès',
      icon: 'check_circle',
      position: 'top',
      timeout: 2000
    });
    
    // Réinitialiser le formulaire après la création réussie
    resetForm();
    
    // Recharger la liste des clubs
    fetchClubs();
  } catch (error) {
    let errorMessage = 'Erreur lors de la création du club';
    
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    $q.notify({
      color: 'negative',
      message: errorMessage,
      icon: 'error',
      position: 'top',
      timeout: 4000
    });
    
    console.error('Erreur lors de la création du club:', error);
  } finally {
    loading.value = false;
  }
}

// Réinitialiser le formulaire
function resetForm() {
  // Réinitialiser les valeurs du formulaire
  form.value = {
    name: '',
    email: '',
    phone: '',
    website: '',
    street: '',
    city: '',
    postal_code: '',
    is_active: true
  };
  
  // Réinitialiser le message de succès
  successMessage.value = '';
  
  // Réinitialiser la validation (si la référence au formulaire est disponible)
  if (clubForm.value) {
    clubForm.value.resetValidation();
  }
}

// Récupérer la liste des clubs
async function fetchClubs() {
  loadingClubs.value = true;
  
  try {
    const API_URL = import.meta.env.VITE_API_URL;
    const response = await fetch(`${API_URL}/clubs?show_all=true`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des clubs');
    }
    
    const data = await response.json();
    clubs.value = data.clubs || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des clubs:', error);
    $q.notify({
      color: 'negative',
      message: 'Erreur lors du chargement des clubs',
      icon: 'error',
      position: 'top'
    });
  } finally {
    loadingClubs.value = false;
  }
}

// Modifier l'état actif/inactif d'un club
async function toggleClubStatus(club: Club) {
  toggleLoading.value = club.id;
  
  try {
    const API_URL = import.meta.env.VITE_API_URL;
    const response = await fetch(`${API_URL}/clubs/${club.id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        is_active: !club.is_active
      })
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || `Erreur lors de la ${club.is_active ? 'désactivation' : 'activation'} du club`);
    }
    
    // Mettre à jour l'état du club localement
    club.is_active = !club.is_active;
    
    $q.notify({
      color: 'positive',
      message: `Club ${club.is_active ? 'activé' : 'désactivé'} avec succès`,
      icon: 'check_circle',
      position: 'top',
      timeout: 2000
    });
  } catch (error) {
    let errorMessage = `Erreur lors de la ${club.is_active ? 'désactivation' : 'activation'} du club`;
    
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    $q.notify({
      color: 'negative',
      message: errorMessage,
      icon: 'error',
      position: 'top',
      timeout: 4000
    });
    
    console.error(`Erreur lors de la modification du statut du club:`, error);
    
    // Recharger les clubs pour revenir à l'état précédent
    await fetchClubs();
  } finally {
    toggleLoading.value = null;
  }
}

// Rediriger vers la page d'édition du club
function editClub(club: Club) {
  router.push(`/admin/edit-club/${club.id}`);
}

// Charger les clubs au montage du composant
onMounted(() => {
  fetchClubs();
});
</script>

<style scoped>
.club-form-card {
  border-radius: 8px;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.2);
}

.club-table {
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

@media (max-width: 599px) {
  .q-table th, .q-table td {
    padding: 8px 4px;
  }
  
  .q-pt-sm-xs {
    padding-top: 12px;
  }
}
</style>