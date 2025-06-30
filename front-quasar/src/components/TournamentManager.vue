<template>
  <div>
    <div class="row q-mb-md q-col-gutter-md">
      <div class="col-12 col-md-6">
        <q-input v-model="searchText" outlined dense placeholder="Rechercher par nom ou adresse..." clearable>
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>
      <div class="col-12 col-md-3">
        <q-select v-model="statusFilter" :options="statusOptions" outlined dense placeholder="Statut (tous)" emit-value map-options clearable />
      </div>
      <div class="col-12 col-md-3">
        <q-select v-model="activeFilter" :options="activeOptions" outlined dense placeholder="Visibilité (tous)" emit-value map-options clearable />
      </div>
    </div>

    <q-table
      :rows="filteredTournaments"
      :columns="columns"
      row-key="id"
      :loading="loading"
      :pagination="{ rowsPerPage: 10 }"
      class="q-mb-md"
    >
      <template v-slot:loading>
        <q-inner-loading showing>
          <q-spinner size="50px" color="primary" />
        </q-inner-loading>
      </template>

      <template v-slot:body-cell-status="props">
        <q-td :props="props">
          <q-badge :color="getStatusColor(props.row.status)">
            {{ formatStatus(props.row.status) }}
          </q-badge>
        </q-td>
      </template>

      <template v-slot:body-cell-is_active="props">
        <q-td :props="props">
          <q-badge :color="props.row.is_active ? 'positive' : 'negative'">
            {{ props.row.is_active ? 'Actif' : 'Inactif' }}
          </q-badge>
        </q-td>
      </template>

      <template v-slot:body-cell-dates="props">
        <q-td :props="props">
          {{ formatDate(props.row.start_date) }} - {{ formatDate(props.row.end_date) }}
        </q-td>
      </template>

      <template v-slot:body-cell-actions="props">
        <q-td :props="props" class="q-gutter-xs">
          <q-btn
            dense
            round
            flat
            :color="props.row.is_active ? 'negative' : 'positive'"
            :icon="props.row.is_active ? 'delete' : 'restore'"
            @click="toggleActive(props.row)"
          >
            <q-tooltip>{{ props.row.is_active ? 'Supprimer' : 'Restaurer' }}</q-tooltip>
          </q-btn>
          
          <q-btn
            v-if="props.row.status === 'open'"
            dense
            round
            flat
            color="orange"
            icon="lock"
            @click="closeTournament(props.row)"
          >
            <q-tooltip>Clôturer le tournoi</q-tooltip>
          </q-btn>
        </q-td>
      </template>

      <template v-slot:no-data>
        <div class="full-width row flex-center q-gutter-sm text-grey q-pa-lg">
          <q-icon size="2em" name="event_busy" />
          <span>Aucun tournoi trouvé</span>
        </div>
      </template>
    </q-table>

    <!-- Dialogue de confirmation -->
    <q-dialog v-model="confirmDialog" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar :icon="confirmIcon" :color="confirmColor" text-color="white" />
          <span class="q-ml-sm">{{ confirmMessage }}</span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Annuler" color="primary" v-close-popup />
          <q-btn flat :label="confirmButtonLabel" :color="confirmColor" @click="confirmAction" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useQuasar } from 'quasar';

// Définition des interfaces
interface Tournament {
  id: number;
  name: string;
  address?: string;
  start_date: string;
  end_date: string;
  status: 'open' | 'closed';
  is_active: boolean;
  club_name?: string;
  id_club?: number;
}

interface Props {
  clubId: number | null;
}

const props = defineProps<Props>();

const $q = useQuasar();
const tournaments = ref<Tournament[]>([]);
const loading = ref(false);
const searchText = ref('');
const statusFilter = ref<'open' | 'closed' | null>(null);
const activeFilter = ref<boolean | null>(null);
const confirmDialog = ref(false);
const confirmMessage = ref('');
const pendingAction = ref<'toggleActive' | 'closeTournament' | null>(null);
const pendingRow = ref<Tournament | null>(null);

const statusOptions = [
  { label: 'Ouvert', value: 'open' },
  { label: 'Fermé', value: 'closed' }
];

const activeOptions = [
  { label: 'Actif', value: true },
  { label: 'Inactif', value: false }
];

const columns = [
  { name: 'id', label: 'ID', field: 'id', sortable: true, align: 'left' as const },
  { name: 'name', label: 'Nom', field: 'name', sortable: true, align: 'left' as const },
  { name: 'address', label: 'Adresse', field: 'address', sortable: true, align: 'left' as const },
  { name: 'dates', label: 'Dates', field: (row: Tournament) => `${row.start_date} - ${row.end_date}`, sortable: true, align: 'left' as const },
  { name: 'status', label: 'Statut', field: 'status', sortable: true, align: 'center' as const },
  { name: 'is_active', label: 'Visibilité', field: 'is_active', sortable: true, align: 'center' as const },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'center' as const }
];

// Propriétés calculées pour la boîte de dialogue de confirmation
const confirmColor = computed(() => {
  if (pendingAction.value === 'toggleActive') {
    return pendingRow.value?.is_active ? 'negative' : 'positive';
  }
  if (pendingAction.value === 'closeTournament') return 'orange';
  return 'primary';
});

const confirmIcon = computed(() => {
  if (pendingAction.value === 'toggleActive') {
    return pendingRow.value?.is_active ? 'delete' : 'restore';
  }
  if (pendingAction.value === 'closeTournament') return 'lock';
  return 'help';
});

const confirmButtonLabel = computed(() => {
  if (pendingAction.value === 'toggleActive') {
    return pendingRow.value?.is_active ? 'Supprimer' : 'Restaurer';
  }
  if (pendingAction.value === 'closeTournament') return 'Clôturer';
  return 'Confirmer';
});

const filteredTournaments = computed(() => {
  return tournaments.value.filter(t => {
    // Recherche par nom ou adresse (insensible à la casse)
    const searchTextLower = searchText.value.toLowerCase();
    const textMatch = !searchText.value || 
                      t.name.toLowerCase().includes(searchTextLower) || 
                      (t.address && t.address.toLowerCase().includes(searchTextLower));
    
    // Filtre par statut
    const statusMatch = statusFilter.value === null || t.status === statusFilter.value;
    
    // Filtre par état actif/inactif
    const activeMatch = activeFilter.value === null || t.is_active === activeFilter.value;
    
    return textMatch && statusMatch && activeMatch;
  });
});

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '—';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('fr-FR');
  } catch (e) {
    console.error('Erreur de formatage de date:', e);
    return '—';
  }
};

const formatStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'open': 'Ouvert',
    'closed': 'Fermé'
  };
  return statusMap[status] || status;
};

const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    'open': 'green',
    'closed': 'blue'
  };
  return colorMap[status] || 'grey';
};

const loadTournaments = async (): Promise<void> => {
  if (!props.clubId) return;
  
  loading.value = true;
  
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/clubs/${props.clubId}/tournaments`, {
      credentials: 'include'
    });
        
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    
    tournaments.value = Array.isArray(data.tournaments) ? data.tournaments : [];
  } catch (error) {
    console.error('Erreur lors du chargement des tournois:', error);
    $q.notify({
      color: 'negative',
      message: `Erreur: ${error instanceof Error ? error.message : 'Inconnue'}`,
      icon: 'error'
    });
    tournaments.value = [];
  } finally {
    loading.value = false;
  }
};

const toggleActive = (row: Tournament): void => {
  confirmMessage.value = row.is_active 
    ? `Êtes-vous sûr de vouloir supprimer le tournoi "${row.name}" ?` 
    : `Êtes-vous sûr de vouloir restaurer le tournoi "${row.name}" ?`;
  
  pendingAction.value = 'toggleActive';
  pendingRow.value = row;
  confirmDialog.value = true;
};

const closeTournament = (row: Tournament): void => {
  confirmMessage.value = `Êtes-vous sûr de vouloir clôturer le tournoi "${row.name}" ? 
  
ATTENTION: Cette action supprimera toutes les inscriptions en attente pour ce tournoi. Assurez-vous d'avoir accepté tous les participants que vous souhaitiez intégrer avant de clôturer.

Cette action est irréversible.`;
  pendingAction.value = 'closeTournament';
  pendingRow.value = row;
  confirmDialog.value = true;
};

const confirmAction = async (): Promise<void> => {
  if (!pendingRow.value) return;
  
  try {
    if (pendingAction.value === 'toggleActive') {
      await toggleTournamentActive(pendingRow.value);
    } else if (pendingAction.value === 'closeTournament') {
      await submitCloseTournament(pendingRow.value);
    }
  } catch (error) {
    console.error('Erreur lors de l\'action:', error);
  } finally {
    pendingAction.value = null;
    pendingRow.value = null;
  }
};

const toggleTournamentActive = async (row: Tournament): Promise<void> => {
  try {
    const newStatus = !row.is_active;
    const response = await fetch(`${import.meta.env.VITE_API_URL}/tournaments/${row.id}/toggle-active`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        is_active: newStatus
      })
    });
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      // Mettre à jour localement
      row.is_active = newStatus;
      
      $q.notify({
        color: 'positive',
        message: newStatus ? 'Tournoi restauré avec succès' : 'Tournoi supprimé avec succès',
        icon: 'check_circle'
      });
    } else {
      throw new Error(data.error || 'Une erreur est survenue');
    }
  } catch (error) {
    console.error(`Erreur lors de l'action:`, error);
    $q.notify({
      color: 'negative',
      message: `Erreur: ${error instanceof Error ? error.message : 'Inconnue'}`,
      icon: 'error'
    });
  }
};

const submitCloseTournament = async (row: Tournament): Promise<void> => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/tournaments/${row.id}/close`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({}) // Ajouté un corps de requête vide pour éviter les erreurs 400
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Réponse d\'erreur du serveur:', errorText);
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      // Mettre à jour localement
      row.status = 'closed';
      
      $q.notify({
        color: 'positive',
        message: data.message || 'Tournoi clôturé avec succès',
        icon: 'check_circle'
      });
    } else {
      throw new Error(data.error || 'Une erreur est survenue');
    }
  } catch (error) {
    console.error('Erreur lors de la clôture du tournoi:', error);
    $q.notify({
      color: 'negative',
      message: `Erreur: ${error instanceof Error ? error.message : 'Inconnue'}`,
      icon: 'error'
    });
  }
};

watch(() => props.clubId, (newVal) => {
  if (newVal) {
    loadTournaments();
  }
});

onMounted(() => {
  if (props.clubId) {
    loadTournaments();
  }
});
</script>