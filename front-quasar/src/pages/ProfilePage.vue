<template>
  <q-page class="q-pa-lg">
    <!-- Header -->
    <div class="row justify-center q-mb-xl">
      <div class="column items-center">
        <div class="row items-center">
          <q-avatar size="150px" class="shadow-5">
            <q-img :src="avatarUrl" :key="avatarKey" />
          </q-avatar>
          <!-- Bouton de rafraîchissement des données -->
          <q-btn 
            flat round color="grey-7" icon="refresh" 
            class="q-ml-sm" size="sm"
            @click="refreshUserData" 
            :loading="refreshingData"
            tooltip="Rafraîchir les données">
          </q-btn>
        </div>
        <h1 class="q-mt-md text-weight-bold">{{ fullName }}</h1>
        <q-btn to="/profile/edit" color="primary" label="Modifier mon profil" class="q-mt-sm" icon="edit" />
      </div>
    </div>

    <!-- Infos perso & Stats - même hauteur -->
    <div class="row q-col-gutter-lg">
      <div class="col-12 col-md-4">
        <q-card flat bordered class="full-height">
          <q-card-section>
            <div class="text-h6">Informations personnelles</div>
            <q-list>
              <q-item>
                <q-item-section>
                  <q-item-label caption>Email</q-item-label>
                  <q-item-label>{{ email }}</q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label caption>Téléphone</q-item-label>
                  <q-item-label>{{ phone }}</q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label caption>Date de naissance</q-item-label>
                  <q-item-label>{{ birthDate }}</q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label caption>Grade</q-item-label>
                  <q-item-label>{{ grade }}</q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label caption>Club</q-item-label>
                  <q-item-label>{{ club }}</q-item-label>
                </q-item-section>
              </q-item>
              
              <!-- Ajout d'une ligne pour afficher la seed actuelle (utile pour débogage) -->
              <q-item v-if="debug">
                <q-item-section>
                  <q-item-label caption>Avatar Seed</q-item-label>
                  <q-item-label>{{ store.user?.avatar_seed || 'default' }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </div>

      <!-- Stats -->
      <div class="col-12 col-md-8">
        <q-card flat bordered class="full-height">
          <q-card-section>
            <div class="text-h6">Statistiques</div>

            <!-- Première ligne - même hauteur -->
            <div class="row q-col-gutter-md q-mt-sm">
              <div v-for="key in firstStatKeys" :key="key" class="col-6 col-sm-4">
                <q-card flat :class="statClasses[key] + ' text-white stat-card'">
                  <q-card-section class="text-center">
                    <div class="text-h4">{{ stats[key] }}</div>
                    <div class="stat-label">
                      <template v-if="needsTwoLines(key)">
                        {{ statLabels[key].split('(')[0] }}<br>(tous matchs cumulés)
                      </template>
                      <template v-else>
                        {{ statLabels[key] }}
                      </template>
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </div>

            <!-- Seconde ligne - même hauteur -->
            <div class="row q-col-gutter-md q-mt-sm">
              <div v-for="key in secondStatKeys" :key="key" class="col-6 col-sm-4">
                <q-card flat :class="statClasses[key] + ' text-white stat-card'">
                  <q-card-section class="text-center">
                    <div class="text-h4">{{ stats[key] }}</div>
                    <div class="stat-label">
                      <template v-if="needsTwoLines(key)">
                        {{ statLabels[key].split('(')[0] }}<br>(tous matchs cumulés)
                      </template>
                      <template v-else>
                        {{ statLabels[key] }}
                      </template>
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Tournoi en attente -->
    <div class="row q-mt-xl" v-if="store.user?.id_tournament_waiting">
      <div class="col-12">
        <q-card flat bordered>
          <q-card-section>
            <div class="row justify-between items-center">
              <div class="text-h6">Tournoi en attente d'inscription</div>
              <q-btn color="negative" label="Se désinscrire" icon="cancel" unelevated @click="confirmCancelRegistration"
                :loading="cancelingRegistration" />
            </div>
            <q-separator class="q-my-md" />

            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <q-list dense>
                  <q-item>
                    <q-item-section>
                      <q-item-label caption>Nom du tournoi</q-item-label>
                      <q-item-label class="text-bold">{{ waitingTournament?.name || 'Chargement...' }}</q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item>
                    <q-item-section>
                      <q-item-label caption>Date de début</q-item-label>
                      <q-item-label>{{ formatTournamentDate(waitingTournament?.start_date) }}</q-item-label>
                    </q-item-section>
                  </q-item>
                  
                  <q-item>
                    <q-item-section>
                      <q-item-label caption>Date de fin</q-item-label>
                      <q-item-label>{{ formatTournamentDate(waitingTournament?.end_date) }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </div>

              <div class="col-12 col-md-6">
                <q-list dense>
                  <q-item>
                    <q-item-section>
                      <q-item-label caption>Lieu</q-item-label>
                      <q-item-label>{{ waitingTournament?.address || '—' }}</q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item>
                    <q-item-section>
                      <q-item-label caption>Statut</q-item-label>
                      <q-item-label>
                        <q-badge :color="waitingTournament?.status === 'open' ? 'positive' : 'negative'">
                          {{ waitingTournament?.status === 'open' ? 'Ouvert aux inscriptions' : 'Inscriptions fermées'
                          }}
                        </q-badge>
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </div>
            </div>

            <div class="row q-mt-md">
              <div class="col-12 text-center">
                <q-badge color="orange" class="q-pa-sm">
                  Votre inscription est en attente de validation
                </q-badge>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Historique des tournois -->
    <div class="row q-mt-xl">
      <div class="col-12">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-h6">Historique des tournois</div>
            <q-separator class="q-my-md" />

            <q-table :rows="userTournaments" :columns="tournamentColumns" row-key="id" :loading="loading"
              :pagination="pagination" flat bordered :rows-per-page-options="[5, 10, 15]">
              <!-- En-tête personnalisé pour le statut -->
              <template v-slot:header="props">
                <q-tr :props="props">
                  <q-th v-for="col in props.cols" :key="col.name" :props="props">
                    {{ col.label }}
                  </q-th>
                </q-tr>
              </template>

              <!-- Corps du tableau -->
              <template v-slot:body="props">
                <q-tr :props="props">
                  <q-td key="name" :props="props">{{ props.row.name }}</q-td>
                  <q-td key="date" :props="props">{{ formatTournamentDate(props.row.start_date) }}</q-td>
                  <q-td key="placement" :props="props">
                    <q-badge :color="getPlacementColor(props.row.placement)">
                      {{ getPlacementLabel(props.row.placement) }}
                    </q-badge>
                  </q-td>
                  <q-td key="ippon" :props="props">{{ props.row.ippon }}</q-td>
                  <q-td key="keikoku" :props="props">{{ props.row.keikoku }}</q-td>
                  <q-td key="actions" :props="props">
                    <q-btn flat round color="primary" icon="visibility" size="sm">
                      <q-tooltip>Voir les détails</q-tooltip>
                    </q-btn>
                  </q-td>
                </q-tr>
              </template>

              <!-- Message si aucune donnée -->
              <template v-slot:no-data>
                <div class="full-width row flex-center q-py-md">
                  <q-icon name="event_busy" size="2em" color="grey-7" class="q-mr-sm" />
                  <span class="text-grey-7">Vous n'avez pas encore participé à des tournois</span>
                </div>
              </template>
            </q-table>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Dialog de confirmation de désinscription -->
    <q-dialog v-model="confirmDialogVisible" persistent>
      <q-card style="min-width: 300px">
        <q-card-section class="bg-negative text-white">
          <div class="text-h6">
            <q-icon name="warning" class="q-mr-sm" />
            Confirmation de désinscription
          </div>
        </q-card-section>

        <q-card-section class="q-pt-md">
          Êtes-vous sûr de vouloir vous désinscrire du tournoi "{{ waitingTournament?.name || 'en attente' }}" ?
          <p class="text-negative q-mt-sm">Cette action est irréversible.</p>
        </q-card-section>

        <q-card-actions align="right" class="q-pb-md q-pr-md">
          <q-btn flat label="Annuler" color="primary" v-close-popup />
          <q-btn unelevated label="Confirmer" color="negative" @click="cancelRegistration"
            :loading="cancelingRegistration" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, nextTick, watch } from 'vue'
import { useUserStore } from '../stores/user'
import type { QTableProps } from 'quasar'
import { useQuasar } from 'quasar'
import axios from 'axios'
import { useRoute } from 'vue-router'

const store = useUserStore()
const $q = useQuasar()
const route = useRoute()

// État de chargement
const loading = ref(false)
const refreshingData = ref(false)
const debug = ref(false) // Mettre à true pour afficher la seed d'avatar actuelle

// Avatar key pour forcer le rechargement de l'image
const avatarKey = ref(0)

// État pour la désinscription
const confirmDialogVisible = ref(false)
const cancelingRegistration = ref(false)

// Fonction pour rafraîchir les données utilisateur
async function refreshUserData() {
  refreshingData.value = true
  try {
    // Forcer un rechargement complet des données
    await store.fetchSession()
    console.log("Avatar seed actualisé:", store.user?.avatar_seed)
    console.log("URL d'avatar actualisée:", store.avatarUrl)
    
    // Incrémenter la clé pour forcer le rechargement de l'image
    avatarKey.value++
    
    // Attendre le prochain cycle de rendu
    await nextTick()
  } catch (error) {
    console.error("Erreur lors du rafraîchissement des données:", error)
    $q.notify({
      color: 'negative',
      message: 'Erreur lors du rafraîchissement des données',
      icon: 'error'
    })
  } finally {
    refreshingData.value = false
  }
}

// Surveiller les changements de route pour rafraîchir les données
watch(() => route.fullPath, async (newPath, oldPath) => {
  if (newPath.includes('/profile') && oldPath?.includes('/profile/edit')) {
    console.log('Retour depuis l\'écran d\'édition, rafraîchissement des données...')
    await refreshUserData()
  }
})

// Charge user+stats
onMounted(async () => {
  console.log('ProfilePage - onMounted')
  // Rafraîchir explicitement les données utilisateur
  await refreshUserData()

  // Léger délai avant de charger les infos du tournoi
  setTimeout(() => {
    fetchTournamentData()
  }, 500)
})

// Perso
const fullName = computed(() => store.fullName)
const email = computed(() => store.user?.email ?? '—')
const phone = computed(() => store.user?.phone ?? '—')
const birthDate = computed(() =>
  store.user?.birth_date
    ? new Date(store.user.birth_date).toLocaleDateString('fr-FR')
    : '—'
)
// Utilisation des champs grade_name et club_name exposés par l'API
const grade = computed(() => store.user?.grade_name ?? '—')
const club = computed(() => store.user?.club_name ?? '—')

// Stats
// Types de clés
type StatKey = 'totalTournaments' | 'victories' | 'defeats' | 'matches' | 'ippon' | 'keiKoku'

// Clés pour chaque ligne
const firstStatKeys = ['totalTournaments', 'victories', 'defeats'] as const
const secondStatKeys = ['matches', 'ippon', 'keiKoku'] as const

// Stats fallback
const stats = computed<Record<StatKey, number>>(() => {
  const s = store.stats ?? {
    totalTournaments: 0,
    victories: 0,
    defeats: 0,
    matches: 0,
    ippon: 0,
    keiKoku: 0,
  }
  return s as Record<StatKey, number>
})

// Labels & classes
const statLabels: Record<StatKey, string> = {
  totalTournaments: 'Tournois participés',
  victories: 'Victoires (tous matchs cumulés)',
  defeats: 'Défaites (tous matchs cumulés)',
  matches: 'Matchs participés',
  ippon: 'IPPON marqués (tous matchs cumulés)',
  keiKoku: 'KEI-KOKU reçus (tous matchs cumulés)'
}
const statClasses: Record<StatKey, string> = {
  totalTournaments: 'bg-primary',
  victories: 'bg-positive',
  defeats: 'bg-negative',
  matches: 'bg-secondary',
  ippon: 'bg-deep-purple',
  keiKoku: 'bg-orange'
}

// Fonction pour déterminer quelles statistiques doivent être affichées sur deux lignes
function needsTwoLines(key: StatKey): boolean {
  return key === 'victories' || key === 'defeats' || key === 'ippon' || key === 'keiKoku'
}

// Avatar
const avatarUrl = computed(() => store.avatarUrl)

// Types pour les tournois
interface Tournament {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  address: string;
  status: string;
}

interface UserTournament {
  id: number;
  name: string;
  start_date: string;
  placement: number;
  ippon: number;
  keikoku: number;
}

// Pour les tournois
// Tournoi en attente
const waitingTournament = ref<Tournament | null>(null)

// Liste des tournois de l'utilisateur (données factices pour le moment)
const userTournaments = ref<UserTournament[]>([])

// Configuration du tableau - typage strict pour QTable
const tournamentColumns: QTableProps['columns'] = [
  { name: 'name', required: true, label: 'Nom du tournoi', align: 'left', field: 'name', sortable: true },
  { name: 'date', required: true, label: 'Date de début', align: 'left', field: 'start_date', sortable: true },
  { name: 'placement', required: true, label: 'Classement', align: 'center', field: 'placement', sortable: true },
  { name: 'ippon', required: true, label: 'IPPON marqués', align: 'center', field: 'ippon', sortable: true },
  { name: 'keikoku', required: true, label: 'KEI-KOKU reçus', align: 'center', field: 'keikoku', sortable: true },
  { name: 'actions', required: true, label: 'Actions', align: 'center', field: 'actions', sortable: false }
]

// Configuration de la pagination
const pagination = ref({
  rowsPerPage: 5,
  sortBy: 'date',
  descending: true
})

// Formatage de la date du tournoi
function formatTournamentDate(dateStr: string | undefined): string {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Obtenir la couleur du badge en fonction du classement
function getPlacementColor(placement: number): string {
  if (placement === 1) return 'amber-8'    // Or
  if (placement === 2) return 'grey-6'     // Argent
  if (placement === 3) return 'orange-8'   // Bronze
  if (placement > 3) return 'blue-5'       // Autre classement
  return 'red'                             // Non classé/éliminé
}

// Obtenir le libellé du classement
function getPlacementLabel(placement: number): string {
  if (placement === 1) return '1er - Or'
  if (placement === 2) return '2ème - Argent'
  if (placement === 3) return '3ème - Bronze'
  if (placement > 3) return `${placement}ème place`
  return 'Non classé'
}

// Fonction à appeler pour récupérer les données des tournois
async function fetchTournamentData(): Promise<void> {
  loading.value = true;

  try {
    // Si l'utilisateur a un tournoi en attente, on récupère ses informations
    if (store.user?.id_tournament_waiting) {
      const apiUrl = `${import.meta.env.VITE_API_URL}/tournaments/${store.user.id_tournament_waiting}`;

      // Solution de contournement - Appel direct avec fetch
      const response = await fetch(apiUrl);
      if (response.ok) {
        const data = await response.json();
        waitingTournament.value = data as Tournament;
      }
    }
  } catch {
    $q.notify({
      color: 'negative',
      message: `Erreur lors de la récupération des données du tournoi`,
      icon: 'error'
    });
  } finally {
    loading.value = false;
  }
}

// Confirmation avant désinscription
function confirmCancelRegistration(): void {
  confirmDialogVisible.value = true
}

// Désinscription du tournoi
async function cancelRegistration(): Promise<void> {
  if (!store.user?.id) return

  cancelingRegistration.value = true

  try {
    // Appel à l'API pour annuler l'inscription
    await axios.delete(`${import.meta.env.VITE_API_URL}/users/${store.user.id}/tournament-registration`)

    // Mise à jour des données locales
    store.user.id_tournament_waiting = null
    waitingTournament.value = null

    // Notification de succès
    $q.notify({
      color: 'positive',
      message: 'Désinscription effectuée avec succès',
      icon: 'check_circle'
    })

  } catch {
    $q.notify({
      color: 'negative',
      message: 'Erreur lors de la désinscription',
      icon: 'error'
    })
  } finally {
    cancelingRegistration.value = false
    confirmDialogVisible.value = false
  }
}
</script>

<style scoped>
/* Hauteur fixe pour les cartes de statistiques */
.stat-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.stat-label {
  min-height: 3em;
  /* Hauteur minimale pour accommoder 2 lignes */
  display: flex;
  flex-direction: column;
  justify-content: center;
}

/* Assurer que les cartes s'étendent sur toute la hauteur disponible */
.full-height {
  height: 100%;
}
</style>