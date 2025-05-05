<template>
  <q-page padding>
    <!-- Carte des filtres avec bordure bordeaux -->
    <q-card style="border-width: 1px; border-style: solid; border-color: #800020;">
      <q-card-section>
        <div class="row q-col-gutter-md">
          <!-- Recherche globale -->
          <div class="col-12">
            <q-input
              v-model="searchQuery"
              label="Rechercher un tournoi"
              outlined
            />
          </div>

          <!-- Filtres date -->
          <div class="col-12 col-sm-6">
            <div class="row q-col-gutter-sm">
              <div class="col">
                <q-input
                  v-model="startDate"
                  label="Date de début"
                  type="date"
                  outlined
                />
              </div>
              <div class="col">
                <q-input
                  v-model="endDate"
                  label="Date de fin"
                  type="date"
                  outlined
                />
              </div>
            </div>
          </div>

          <!-- Filtre clubs -->
          <div class="col-12 col-sm-6">
            <div class="club-filter">
              <q-input
                v-model="clubSearch"
                label="Rechercher par club"
                outlined
              >
                <template #append>
                  <q-icon
                    name="list"
                    class="cursor-pointer"
                    @click="showAllClubsDialog = true"
                  >
                    <q-tooltip>Voir tous les clubs</q-tooltip>
                  </q-icon>
                </template>
              </q-input>

              <q-menu
                fit
                anchor="bottom left"
                self="top left"
                no-focus
                v-show="showClubSuggestions && filteredClubsPaginated.length"
              >
                <q-list>
                  <q-item
                    v-for="club in filteredClubsPaginated"
                    :key="club"
                    clickable
                    @click="onSelectClub(club)"
                  >
                    <q-item-section>{{ club }}</q-item-section>
                  </q-item>

                  <q-item>
                    <q-item-section class="row justify-center">
                      <q-pagination
                        v-model="clubPage"
                        :max="Math.ceil(filteredClubs.length / clubsPerPage)"
                        :max-pages="5"
                        boundary-numbers
                        direction-links
                        dense
                      />
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </div>

            <div class="q-mt-sm">
              <q-chip
                v-for="club in selectedClubs"
                :key="club"
                removable
                @remove="removeClub(club)"
                class="q-ma-xs"
              >
                {{ club }}
              </q-chip>
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- En-tête avec titre -->
    <div class="row items-center justify-between q-my-md q-px-md">
      <h1>Liste des tournois</h1>
    </div>

    <!-- Bannière de notification si l'utilisateur a déjà une inscription en attente -->
    <div v-if="userStore.user?.id_tournament_waiting !== undefined && userStore.user?.id_tournament_waiting !== null" class="q-mb-md">
      <q-banner class="bg-orange-1 text-dark" rounded>
        <template v-slot:avatar>
          <q-icon name="info" color="warning" />
        </template>
        Vous avez déjà une inscription en attente pour un tournoi. 
        Pour vous inscrire à un autre tournoi, veuillez d'abord annuler votre inscription actuelle 
        depuis votre <router-link to="/profile" class="text-primary">page de profil</router-link>.
      </q-banner>
    </div>

    <!-- Table des tournois avec lignes extensibles -->
    <q-table
      :rows="paginatedTournaments"
      :columns="columns"
      row-key="id"
      separator="horizontal"
      v-model:pagination="pagination"
      :rows-per-page-options="[10, 20, 50]"
      class="tournaments-table"
      no-data-label="Aucun tournoi disponible"
      v-model:expanded="expanded"
      :loading="loading"
    >
      <template v-slot:body="props">
        <q-tr :props="props" @click="toggleRow(props.row)" class="cursor-pointer hover-row">
          <q-td key="name" :props="props">
            {{ props.row.name }}
          </q-td>
          <q-td key="start_date" :props="props">
            {{ formatDate(props.row.start_date) }}
          </q-td>
          <q-td key="end_date" :props="props">
            {{ formatDate(props.row.end_date) }}
          </q-td>
          <q-td key="club" :props="props">
            {{ props.row.club }}
          </q-td>
          <q-td key="status" :props="props">
            <q-badge :color="props.row.status === 'open' ? 'positive' : 'negative'">
              {{ props.row.status === 'open' ? 'Ouvert' : 'Fermé' }}
            </q-badge>
          </q-td>
        </q-tr>

        <q-tr v-show="isExpanded(props.row)" :props="props">
          <q-td colspan="100%">
            <div class="text-left q-pa-md bg-grey-2">
              <q-slide-transition>
                <div v-show="isExpanded(props.row)">
                  <div class="row items-center justify-between">
                    <div class="column">
                      <div class="text-h6 q-mb-md">Détails du tournoi</div>
                      <div class="q-gutter-y-sm">
                        <p class="text-weight-medium">
                          <span class="text-grey-8">Nom:</span> {{ props.row.name }}
                        </p>
                        <p class="text-weight-medium">
                          <span class="text-grey-8">Date de début:</span> {{ formatDateTime(props.row.start_date) }}
                        </p>
                        <p class="text-weight-medium">
                          <span class="text-grey-8">Date de fin:</span> {{ formatDateTime(props.row.end_date) }}
                        </p>
                        <p class="text-weight-medium">
                          <span class="text-grey-8">Club organisateur:</span> {{ props.row.club }}
                        </p>
                        <p class="text-weight-medium">
                          <span class="text-grey-8">Lieu:</span> {{ props.row.address }}
                        </p>
                        <div class="text-weight-medium q-mt-md">
                          <p class="text-grey-8">Catégories:</p>
                          <div v-if="props.row.categories && props.row.categories.length">
                            <q-list bordered separator>
                              <q-item v-for="category in props.row.categories" :key="category.id">
                                <q-item-section>
                                  <q-item-label>{{ category.name }}</q-item-label>
                                  <q-item-label caption>
                                    Grade min: {{ category.grade_min }} | Grade max: {{ category.grade_max }} | 
                                    Type: {{ category.category_type }}
                                  </q-item-label>
                                </q-item-section>
                              </q-item>
                            </q-list>
                          </div>
                          <div v-else>
                            <p class="text-italic">Aucune catégorie d'enregistrer</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <q-btn
                        color="primary"
                        label="S'inscrire"
                        class="q-px-md"
                        icon="how_to_reg"
                        :disable="props.row.status === 'closed' || Boolean(userStore.user?.id_tournament_waiting)"
                        @click="openConfirmDialog(props.row.id)"
                      />
                    </div>
                  </div>
                </div>
              </q-slide-transition>
            </div>
          </q-td>
        </q-tr>
      </template>
    </q-table>

    <!-- Dialog liste des clubs -->
    <q-dialog v-model="showAllClubsDialog">
      <q-card style="min-width: 350px">
        <q-card-section class="row items-center">
          <div class="text-h6">Liste des clubs</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <q-list>
            <q-item v-for="club in dialogClubsPaginated" :key="club">
              <q-item-section>{{ club }}</q-item-section>
              <q-item-section side>
                <q-btn
                  flat
                  round
                  :icon="selectedClubs.includes(club) ? 'remove' : 'add'"
                  @click="selectedClubs.includes(club) ? removeClub(club) : onSelectClub(club)"
                  :color="selectedClubs.includes(club) ? 'negative' : 'positive'"
                />
              </q-item-section>
            </q-item>
          </q-list>
          <div class="row justify-center q-mt-md">
            <q-pagination
              v-model="dialogClubPage"
              :max="Math.ceil(availableClubs.length / clubsPerPage)"
              :max-pages="5"
              boundary-numbers
              direction-links
            />
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Dialog de confirmation d'inscription -->
    <q-dialog v-model="confirmDialogVisible" persistent>
      <q-card style="min-width: 350px">
        <q-card-section class="bg-primary text-white">
          <div class="text-h6">
            <q-icon name="how_to_reg" class="q-mr-sm" />
            Confirmer l'inscription
          </div>
        </q-card-section>

        <q-card-section class="q-pt-md">
          <p>Êtes-vous sûr de vouloir vous inscrire au tournoi <strong>{{ selectedTournament?.name }}</strong> ?</p>
          <p class="text-grey-8">
            Date: {{ selectedTournament ? formatDate(selectedTournament.start_date) : '' }}
          </p>
          <p class="text-grey-8">
            Lieu: {{ selectedTournament?.address }}
          </p>
        </q-card-section>

        <q-card-actions align="right" class="q-pb-md q-pr-md">
          <q-btn flat label="Annuler" color="primary" v-close-popup />
          <q-btn unelevated label="Confirmer" color="primary" @click="registerForTournament" 
                 :loading="registering" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import axios from 'axios'
import { useQuasar } from 'quasar'
import { useUserStore } from '../stores/user'
import { useRouter } from 'vue-router'

const $q = useQuasar()
const userStore = useUserStore()
const router = useRouter()

// Création d'une instance API
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || ''
})

interface Category {
  id: number
  name: string
  grade_min: string
  grade_max: string
  category_type: string
}

interface Tournament {
  id: number
  name: string
  start_date: string
  end_date: string
  club: string
  club_id: number
  address: string
  status: 'open' | 'closed'
  categories?: Category[]
}

interface ApiTournament {
  id: number
  name: string
  start_date: string
  end_date: string
  club_name: string
  id_club: number
  address: string
  status: 'open' | 'closed'
}

interface ApiCategory {
  id: number
  name: string
  grade_min_name: string
  grade_max_name: string
  category_type_name: string
}

interface ApiResponse<T> {
  message?: string
  data?: T
  success?: boolean
}

// Définition des colonnes du tableau
const columns = [
  {
    name: 'name',
    required: true,
    label: 'Nom du tournoi',
    align: 'left' as const,
    field: 'name',
    sortable: true
  },
  {
    name: 'start_date',
    required: true,
    label: 'Date de début',
    align: 'left' as const,
    field: 'start_date',
    sortable: true
  },
  {
    name: 'end_date',
    required: true,
    label: 'Date de fin',
    align: 'left' as const,
    field: 'end_date',
    sortable: true
  },
  {
    name: 'club',
    required: true,
    label: 'Club organisateur',
    align: 'left' as const,
    field: 'club',
    sortable: true
  },
  {
    name: 'status',
    required: true,
    label: 'Statut',
    align: 'left' as const,
    field: 'status',
    sortable: true
  }
]

const searchQuery = ref('')
const startDate = ref('')
const endDate = ref('')
const selectedClubs = ref<string[]>([])
const clubSearch = ref('')
const showAllClubsDialog = ref(false)
const clubPage = ref(1)
const dialogClubPage = ref(1)
const tournamentPage = ref(1)
const clubsPerPage = 5
const tournamentsPerPage = 10
const expanded = ref<Tournament[]>([])
const loading = ref(false)
const tournaments = ref<Tournament[]>([])

// États pour l'inscription
const confirmDialogVisible = ref(false)
const selectedTournamentId = ref<number | null>(null)
const selectedTournament = ref<Tournament | null>(null)
const registering = ref(false)

const pagination = ref({
  rowsPerPage: tournamentsPerPage,
  page: tournamentPage
})

const availableClubs = [
  'Sho Bu Kai',
  'Kempo Lyon',
  'Nippon Kempo Paris',
  'Club Tokyo',
  'Dojo Osaka',
  'Club Kyoto',
  'Dojo Kobe',
  'Club Sapporo',
  'Nippon Kempo Nice',
  'Club Bordeaux'
].sort()

// Définir un mapping sûr pour les clubs
const clubsMap: Record<number, string> = {
  1: 'Sho Bu Kai',
  2: 'Kempo Lyon',
  3: 'Nippon Kempo Paris',
  4: 'Club Tokyo', 
  5: 'Dojo Osaka',
  6: 'Club Kyoto',
  7: 'Dojo Kobe',
  8: 'Club Sapporo',
  9: 'Nippon Kempo Nice',
  10: 'Club Bordeaux'
}

// Fonction pour récupérer les tournois depuis l'API
async function fetchTournaments() {
  loading.value = true
  try {
    const { data } = await api.get<ApiTournament[]>('/tournaments')
    tournaments.value = data.map((tournament: ApiTournament) => ({
      id: tournament.id,
      name: tournament.name,
      start_date: tournament.start_date,
      end_date: tournament.end_date,
      club: tournament.club_name,
      club_id: tournament.id_club,
      address: tournament.address,
      status: tournament.status
    }))
  } catch {
    console.error('Erreur lors du chargement des tournois')
    $q.notify({
      color: 'negative',
      message: 'Erreur lors du chargement des tournois',
      icon: 'error'
    })
    
    // Fallback avec des données fictives en cas d'erreur
    tournaments.value = [
      { 
        id: 1, 
        name: 'Tournoi National', 
        start_date: '2025-06-10 09:00:00', 
        end_date: '2025-06-11 18:00:00', 
        club: clubsMap[1] || 'Club inconnu', // Sécuriser en cas d'undefined
        club_id: 1,
        address: 'Stade Paris', 
        status: 'open'
      },
      { 
        id: 2, 
        name: 'Tournoi Régional', 
        start_date: '2025-07-15 10:00:00', 
        end_date: '2025-07-16 19:00:00', 
        club: clubsMap[2] || 'Club inconnu', // Sécuriser en cas d'undefined
        club_id: 2,
        address: 'Gymnase Lyon', 
        status: 'closed'
      }
    ]
  } finally {
    loading.value = false
  }
}

// Fonction pour récupérer les catégories d'un tournoi
async function fetchTournamentCategories(tournamentId: number): Promise<Category[]> {
  try {
    const { data } = await api.get<ApiCategory[]>(`/tournaments/${tournamentId}/categories`)
    return data.map((category: ApiCategory) => ({
      id: category.id,
      name: category.name,
      grade_min: category.grade_min_name,
      grade_max: category.grade_max_name,
      category_type: category.category_type_name
    }))
  } catch {
    console.error(`Erreur lors du chargement des catégories pour le tournoi ${tournamentId}`)
    
    // Fallback avec des données fictives en cas d'erreur
    const categoriesMap: Record<number, Category[]> = {
      1: [{ id: 1, name: 'Ceinture Blanche - Junior', grade_min: 'Débutant', grade_max: 'Ceinture Orange', category_type: 'Junior' }],
      2: [{ id: 2, name: 'Ceinture Noire - Senior', grade_min: 'Ceinture Marron', grade_max: 'Ceinture Noire 3ème Dan', category_type: 'Senior' }]
    }
    
    // Récupération sécurisée des catégories
    const categories = categoriesMap[tournamentId];
    // Retourner un tableau vide si aucune catégorie n'est trouvée
    return categories ? [...categories] : [];
  }
}

// Fonction pour enrichir un tournoi avec ses catégories
async function loadTournamentCategories(tournament: Tournament) {
  // Vérifier si les catégories sont déjà chargées
  if (!tournament.categories) {
    const categories = await fetchTournamentCategories(tournament.id)
    // Assigner les catégories au tournament
    tournament.categories = categories
  }
}

const showClubSuggestions = computed(() => clubSearch.value.length > 0)

const filteredClubs = computed(() => {
  if (clubSearch.value.length < 1) return []
  return availableClubs.filter(club =>
    club.toLowerCase().includes(clubSearch.value.toLowerCase()) &&
    !selectedClubs.value.includes(club)
  )
})

const filteredClubsPaginated = computed(() => {
  const start = (clubPage.value - 1) * clubsPerPage
  return filteredClubs.value.slice(start, start + clubsPerPage)
})

const dialogClubsPaginated = computed(() => {
  const start = (dialogClubPage.value - 1) * clubsPerPage
  return availableClubs.slice(start, start + clubsPerPage)
})

const filteredTournamentsSorted = computed(() => {
  const filtered = tournaments.value.filter(tournament => {
    const matchQuery = !searchQuery.value ||
      tournament.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    
    const tournamentStartDate = new Date(tournament.start_date)
    const matchStartDate = !startDate.value ||
      tournamentStartDate >= new Date(startDate.value)
    
    const tournamentEndDate = new Date(tournament.end_date)
    const matchEndDate = !endDate.value ||
      tournamentEndDate <= new Date(endDate.value)
    
    const matchClub = selectedClubs.value.length === 0 ||
      selectedClubs.value.includes(tournament.club)
    
    return matchQuery && matchStartDate && matchEndDate && matchClub
  })

  return filtered
})

const paginatedTournaments = computed(() => {
  const start = (pagination.value.page - 1) * pagination.value.rowsPerPage
  return filteredTournamentsSorted.value.slice(start, start + pagination.value.rowsPerPage)
})

watch(() => clubSearch.value, (val) => {
  if (val.length < 1) clubPage.value = 1
})

watch(() => userStore.user?.id_tournament_waiting, () => {
  // Force la mise à jour de l'interface lorsque le statut d'inscription change
  // Cela permettra aux boutons d'inscription de se réactiver
  
  if (!loading.value) {
    // Forcer un rafraîchissement de la liste des tournois
    const currentTournaments = [...tournaments.value]
    tournaments.value = []
    setTimeout(() => {
      tournaments.value = currentTournaments
    }, 10)
  }
})

async function toggleRow(row: Tournament) {
  if (isExpanded(row)) {
    expanded.value = expanded.value.filter(r => r.id !== row.id)
  } else {
    // Charger les catégories avant d'expandre la ligne
    await loadTournamentCategories(row)
    expanded.value = [row]
  }
}

function isExpanded(row: Tournament) {
  return expanded.value.some(r => r.id === row.id)
}

function onSelectClub(club: string) {
  addClub(club)
  clubPage.value = 1
  clubSearch.value = ''
}

function addClub(club: string) {
  if (!selectedClubs.value.includes(club)) {
    selectedClubs.value.push(club)
  }
}

function removeClub(club: string) {
  selectedClubs.value = selectedClubs.value.filter(c => c !== club)
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR')
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('fr-FR')
}

// Ouvrir la boîte de dialogue de confirmation d'inscription
function openConfirmDialog(tournamentId: number) {
  // Empêcher la propagation de l'événement au parent (qui fermerait l'expansion)
  event?.stopPropagation()
  
  // Vérifier si l'utilisateur est connecté
  if (!userStore.user) {
    $q.notify({
      color: 'negative',
      message: 'Vous devez être connecté pour vous inscrire à un tournoi',
      icon: 'error'
    })
    return
  }
  
  // Vérifier si l'utilisateur a déjà une inscription en attente
  if (userStore.user.id_tournament_waiting) {
    $q.notify({
      color: 'warning',
      message: 'Vous avez déjà une inscription en attente. Veuillez annuler celle-ci avant de vous inscrire à un nouveau tournoi.',
      icon: 'warning',
      timeout: 5000
    })
    return
  }
  
  selectedTournamentId.value = tournamentId
  selectedTournament.value = tournaments.value.find(t => t.id === tournamentId) || null
  confirmDialogVisible.value = true
}

// S'inscrire au tournoi
async function registerForTournament() {
  if (!selectedTournamentId.value) return
  
  registering.value = true
  
  try {
    // Appel API pour s'inscrire au tournoi
    const response = await api.post<ApiResponse<unknown>>(`/tournaments/${selectedTournamentId.value}/register`)
    const responseData = response.data
    
    // Mettre à jour l'utilisateur dans le store
    if (userStore.user) {
      userStore.user.id_tournament_waiting = selectedTournamentId.value
    }
    
    // Fermer la boîte de dialogue
    confirmDialogVisible.value = false
    
    // Notification de succès
    $q.notify({
      color: 'positive',
      message: typeof responseData === 'object' && responseData && 'message' in responseData 
        ? responseData.message as string
        : 'Inscription au tournoi enregistrée avec succès',
      icon: 'check_circle',
      timeout: 3000
    })
    
    // Rediriger vers la page de profil pour voir le tournoi en attente
    setTimeout(() => {
      router.push('/profile')
    }, 1000)
    
  } catch {
    console.error('Erreur lors de l\'inscription au tournoi')
    
    // Message par défaut en cas d'erreur
    const errorMessage = 'Erreur lors de l\'inscription au tournoi. Veuillez réessayer.'
    
    $q.notify({
      color: 'negative',
      message: errorMessage,
      icon: 'error',
      timeout: 5000
    })
  } finally {
    registering.value = false
  }
}

// Précharger les données utilisateur si nécessaire
onMounted(async () => {
  if (!userStore.user) {
    await userStore.fetchSession()
  }
  
  // Charger les tournois
  await fetchTournaments()
})
</script>

<style scoped>
.hover-row:hover {
  background-color: rgba(0, 0, 0, 0.03);
}
</style>