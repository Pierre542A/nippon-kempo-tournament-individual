<template>
  <q-page padding>
    <!-- Carte des filtres -->
    <q-card style="border:1px solid #800020">
      <q-card-section>
        <div class="row q-col-gutter-md">
          <!-- Recherche globale -->
          <div class="col-12">
            <q-input v-model="searchQuery" label="Rechercher un tournoi" outlined />
          </div>

          <!-- Filtres date -->
          <div class="col-12 col-sm-4">
            <div class="row q-col-gutter-sm">
              <div class="col">
                <q-input v-model="startDate" label="Date de début" type="date" outlined />
              </div>
              <div class="col">
                <q-input v-model="endDate" label="Date de fin" type="date" outlined />
              </div>
            </div>
          </div>

          <!-- Filtre clubs -->
          <div class="col-12 col-sm-4">
            <div class="club-filter">
              <q-input v-model="clubSearch" label="Rechercher par club" outlined>
                <template #append>
                  <q-icon name="list" class="cursor-pointer" @click="showAllClubsDialog = true">
                    <q-tooltip>Voir tous les clubs</q-tooltip>
                  </q-icon>
                </template>
              </q-input>

              <q-menu
                fit anchor="bottom left" self="top left" no-focus
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

          <!-- Filtre catégories -->
          <div class="col-12 col-sm-4">
            <div class="category-filter">
              <q-input v-model="categorySearch" label="Rechercher par catégorie (❌ HS)" outlined>
                <template #append>
                  <q-icon name="list" class="cursor-pointer" @click="showAllCategoriesDialog = true">
                    <q-tooltip>Voir toutes les catégories</q-tooltip>
                  </q-icon>
                </template>
              </q-input>

              <q-menu
                fit anchor="bottom left" self="top left" no-focus
                v-show="showCategorySuggestions && filteredCategoriesPaginated.length"
              >
                <q-list>
                  <q-item
                    v-for="cat in filteredCategoriesPaginated"
                    :key="cat"
                    clickable
                    @click="onSelectCategory(cat)"
                  >
                    <q-item-section>{{ cat }}</q-item-section>
                  </q-item>

                  <q-item>
                    <q-item-section class="row justify-center">
                      <q-pagination
                        v-model="categoryPage"
                        :max="Math.ceil(filteredCategories.length / categoriesPerPage)"
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
                v-for="cat in selectedCategories"
                :key="cat"
                removable
                @remove="removeCategory(cat)"
                class="q-ma-xs"
              >
                {{ cat }}
              </q-chip>
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- En-tête -->
    <div class="row items-center justify-between q-my-md q-px-md">
      <h1>Liste des tournois</h1>
    </div>

    <!-- Avertissement inscription en attente -->
    <div
      v-if="userStore.user?.id_tournament_waiting !== undefined && userStore.user?.id_tournament_waiting !== null"
      class="q-mb-md"
    >
      <q-banner class="bg-orange-1 text-dark" rounded>
        <template #avatar><q-icon name="info" color="warning" /></template>
        Vous avez déjà une inscription en attente pour un tournoi.
        Pour vous inscrire à un autre tournoi, veuillez d'abord annuler votre inscription actuelle
        depuis votre <router-link to="/profile" class="text-primary">page de profil</router-link>.
      </q-banner>
    </div>

    <!-- Tableau des tournois -->
    <q-table
      :rows="paginatedTournaments"
      :columns="columns"
      row-key="id"
      separator="horizontal"
      v-model:pagination="pagination"
      :rows-per-page-options="[10,20,50]"
      class="tournaments-table"
      no-data-label="Aucun tournoi disponible"
      v-model:expanded="expanded"
      :loading="loading"
    >
      <template #body="props">
        <q-tr :props="props" @click="toggleRow(props.row)" class="cursor-pointer hover-row">
          <q-td key="name">{{ props.row.name }}</q-td>
          <q-td key="start_date">{{ formatDate(props.row.start_date) }}</q-td>
          <q-td key="end_date">{{ formatDate(props.row.end_date) }}</q-td>
          <q-td key="club">{{ props.row.club }}</q-td>
          <q-td key="status">
            <q-badge :color="props.row.status === 'open' ? 'positive' : 'negative'">
              {{ props.row.status === 'open' ? 'Ouvert' : 'Fermé' }}
            </q-badge>
          </q-td>
        </q-tr>

        <!-- Ligne détaillée -->
        <q-tr v-show="isExpanded(props.row)" :props="props">
          <q-td colspan="100%">
            <div class="text-left q-pa-md bg-grey-2">
              <q-slide-transition>
                <div v-show="isExpanded(props.row)">
                  <div class="row items-center justify-between">
                    <!-- Infos -->
                    <div class="column">
                      <div class="text-h6 q-mb-md">Détails du tournoi</div>
                      <div class="q-gutter-y-sm">
                        <p><span class="text-grey-8">Nom :</span> {{ props.row.name }}</p>
                        <p><span class="text-grey-8">Date de début :</span> {{ formatDateTime(props.row.start_date) }}</p>
                        <p><span class="text-grey-8">Date de fin :</span> {{ formatDateTime(props.row.end_date) }}</p>
                        <p><span class="text-grey-8">Club :</span> {{ props.row.club }}</p>
                        <p><span class="text-grey-8">Lieu :</span> {{ props.row.address }}</p>

                        <div class="q-mt-md">
                          <p class="text-grey-8">Catégories :</p>
                          <div v-if="props.row.categories?.length">
                            <q-list bordered separator>
                              <q-item v-for="c in props.row.categories" :key="c.id">
                                <q-item-section>
                                  <q-item-label>{{ c.name }}</q-item-label>
                                  <q-item-label caption>
                                    Grade min: {{ c.grade_min }} |
                                    Grade max: {{ c.grade_max }} |
                                    Type: {{ c.category_type }}
                                  </q-item-label>
                                </q-item-section>
                              </q-item>
                            </q-list>
                          </div>
                          <div v-else><em>Aucune catégorie enregistrée</em></div>
                        </div>
                      </div>
                    </div>

                    <!-- Bouton inscription -->
                    <div>
                      <q-btn
                        color="primary"
                        icon="how_to_reg"
                        label="S'inscrire"
                        class="q-px-md"
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

    <!-- Dialog Clubs -->
    <q-dialog v-model="showAllClubsDialog">
      <q-card style="min-width:350px">
        <q-card-section class="row items-center">
          <div class="text-h6">Liste des clubs</div>
          <q-space /><q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <q-list>
            <q-item v-for="club in dialogClubsPaginated" :key="club">
              <q-item-section>{{ club }}</q-item-section>
              <q-item-section side>
                <q-btn
                  flat round
                  :icon="selectedClubs.includes(club) ? 'remove' : 'add'"
                  :color="selectedClubs.includes(club) ? 'negative' : 'positive'"
                  @click="selectedClubs.includes(club) ? removeClub(club) : onSelectClub(club)"
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

    <!-- Dialog Catégories -->
    <q-dialog v-model="showAllCategoriesDialog">
      <q-card style="min-width:350px">
        <q-card-section class="row items-center">
          <div class="text-h6">Liste des catégories</div>
          <q-space /><q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <q-list>
            <q-item v-for="cat in dialogCategoriesPaginated" :key="cat">
              <q-item-section>{{ cat }}</q-item-section>
              <q-item-section side>
                <q-btn
                  flat round
                  :icon="selectedCategories.includes(cat) ? 'remove' : 'add'"
                  :color="selectedCategories.includes(cat) ? 'negative' : 'positive'"
                  @click="selectedCategories.includes(cat) ? removeCategory(cat) : onSelectCategory(cat)"
                />
              </q-item-section>
            </q-item>
          </q-list>
          <div class="row justify-center q-mt-md">
            <q-pagination
              v-model="dialogCategoryPage"
              :max="Math.ceil(availableCategories.length / categoriesPerPage)"
              :max-pages="5"
              boundary-numbers
              direction-links
            />
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Dialog confirmation -->
    <q-dialog v-model="confirmDialogVisible" persistent>
      <q-card style="min-width:350px">
        <q-card-section class="bg-primary text-white">
          <div class="text-h6"><q-icon name="how_to_reg" class="q-mr-sm" />Confirmer l'inscription</div>
        </q-card-section>

        <q-card-section class="q-pt-md">
          <p>
            Êtes-vous sûr de vouloir vous inscrire au tournoi
            <strong>{{ selectedTournament?.name }}</strong> ?
          </p>
          <p class="text-grey-8">Date : {{ selectedTournament ? formatDate(selectedTournament.start_date) : '' }}</p>
          <p class="text-grey-8">Lieu : {{ selectedTournament?.address }}</p>
        </q-card-section>

        <q-card-actions align="right" class="q-pb-md q-pr-md">
          <q-btn flat label="Annuler" color="primary" v-close-popup />
          <q-btn unelevated label="Confirmer" color="primary" :loading="registering" @click="registerForTournament" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import axios from 'axios'
import { useQuasar } from 'quasar'
import type { QTableColumn } from 'quasar'
import { useUserStore } from '../stores/user'
import { useRouter } from 'vue-router'

const $q = useQuasar()
const userStore = useUserStore()
const router = useRouter()

/* -------------------------------------------------------------------------- */
/* Typages                                                                     */
/* -------------------------------------------------------------------------- */

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

interface Club {
  id: number
  name: string
  is_active: number
  email?: string
  phone?: string
  address?: string
}

/* -------------------------------------------------------------------------- */
/* Etat & constantes                                                          */
/* -------------------------------------------------------------------------- */

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '' })

const searchQuery = ref('')
const startDate = ref('')
const endDate = ref('')

const selectedClubs = ref<string[]>([])
const clubSearch = ref('')
const showAllClubsDialog = ref(false)
const clubPage = ref(1)
const dialogClubPage = ref(1)

const selectedCategories = ref<string[]>([])
const categorySearch = ref('')
const showAllCategoriesDialog = ref(false)
const categoryPage = ref(1)
const dialogCategoryPage = ref(1)

const clubsPerPage = 5
const categoriesPerPage = 5
const tournamentsPerPage = 10

const expanded = ref<Tournament[]>([])
const loading = ref(false)
const tournaments = ref<Tournament[]>([])

const availableClubs = ref<string[]>([])
const availableCategories = ref<string[]>([])

const confirmDialogVisible = ref(false)
const selectedTournamentId = ref<number | null>(null)
const selectedTournament = ref<Tournament | null>(null)
const registering = ref(false)

const pagination = ref({ page: 1, rowsPerPage: tournamentsPerPage })

/* -------------------------------------------------------------------------- */
/* Colonnes                                                                   */
/* -------------------------------------------------------------------------- */

const columns: QTableColumn[] = [
  { name: 'name', label: 'Nom du tournoi', field: 'name', sortable: true, align: 'left' as const },
  { name: 'start_date', label: 'Date de début', field: 'start_date', sortable: true, align: 'left' as const },
  { name: 'end_date', label: 'Date de fin', field: 'end_date', sortable: true, align: 'left' as const },
  { name: 'club', label: 'Club organisateur', field: 'club', sortable: true, align: 'left' as const },
  { name: 'status', label: 'Statut', field: 'status', sortable: true, align: 'left' as const }
]

/* -------------------------------------------------------------------------- */
/* Fetch & helpers                                                            */
/* -------------------------------------------------------------------------- */

async function fetchTournaments () {
  loading.value = true
  try {
    const { data } = await api.get<ApiTournament[]>('/tournaments')
    tournaments.value = data.map(t => ({
      id: t.id,
      name: t.name,
      start_date: t.start_date,
      end_date: t.end_date,
      club: t.club_name,
      club_id: t.id_club,
      address: t.address,
      status: t.status
    }))

    await Promise.all(
      tournaments.value.map(async t => {
        t.categories = await fetchTournamentCategories(t.id)
      })
    )

    buildFilters()
  } catch {
    $q.notify({ color: 'negative', message: 'Erreur lors du chargement des tournois', icon: 'error' })
    tournaments.value = []
  } finally {
    loading.value = false
  }
}

async function fetchTournamentCategories (id: number): Promise<Category[]> {
  try {
    const { data } = await api.get<ApiCategory[]>(`/tournaments/${id}/categories`)
    return data.map(c => ({
      id: c.id,
      name: c.name,
      grade_min: c.grade_min_name,
      grade_max: c.grade_max_name,
      category_type: c.category_type_name
    }))
  } catch (err) {
    console.error(`Erreur /tournaments/${id}/categories`, err)
    return []
  }
}

async function fetchAllClubs () {
  try {
    const { data } = await api.get<Club[] | { clubs: Club[] }>('/clubs')
    const clubArr: Club[] = Array.isArray(data) ? data : (data as { clubs: Club[] }).clubs
    if (!clubArr) return
    const names = clubArr.map(c => c.name)
    const merged = new Set([...availableClubs.value, ...names])
    availableClubs.value = Array.from(merged).sort()
  } catch (err) {
    console.error('Erreur /clubs', err)
  }
}

function buildFilters () {
  const clubsSet = new Set<string>(availableClubs.value)
  tournaments.value.forEach(t => clubsSet.add(t.club))
  availableClubs.value = Array.from(clubsSet).sort()

  const catSet = new Set<string>()
  tournaments.value.forEach(t => t.categories?.forEach(c => catSet.add(c.name)))
  availableCategories.value = Array.from(catSet).sort()
}

/* -------------------------------------------------------------------------- */
/* Computed & watch                                                           */
/* -------------------------------------------------------------------------- */

const showClubSuggestions = computed(() => clubSearch.value.length > 0)

const filteredClubs = computed(() =>
  clubSearch.value.length < 1
    ? []
    : availableClubs.value.filter(
        c => c.toLowerCase().includes(clubSearch.value.toLowerCase()) &&
             !selectedClubs.value.includes(c)
      )
)

const filteredClubsPaginated = computed(() => {
  const start = (clubPage.value - 1) * clubsPerPage
  return filteredClubs.value.slice(start, start + clubsPerPage)
})

const dialogClubsPaginated = computed(() => {
  const start = (dialogClubPage.value - 1) * clubsPerPage
  return availableClubs.value.slice(start, start + clubsPerPage)
})

watch(clubSearch, v => { if (v.length < 1) clubPage.value = 1 })

/* ------ Catégories ------ */

const showCategorySuggestions = computed(() => categorySearch.value.length > 0)

const filteredCategories = computed(() =>
  categorySearch.value.length < 1
    ? []
    : availableCategories.value.filter(
        c => c.toLowerCase().includes(categorySearch.value.toLowerCase()) &&
             !selectedCategories.value.includes(c)
      )
)

const filteredCategoriesPaginated = computed(() => {
  const start = (categoryPage.value - 1) * categoriesPerPage
  return filteredCategories.value.slice(start, start + categoriesPerPage)
})

const dialogCategoriesPaginated = computed(() => {
  const start = (dialogCategoryPage.value - 1) * categoriesPerPage
  return availableCategories.value.slice(start, start + categoriesPerPage)
})

watch(categorySearch, v => { if (v.length < 1) categoryPage.value = 1 })

/* ------ Tournois filtrés ------ */

const filteredTournamentsSorted = computed(() =>
  tournaments.value.filter(t => {
    const matchQuery =
      !searchQuery.value || t.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchStartDate = !startDate.value || new Date(t.start_date) >= new Date(startDate.value)
    const matchEndDate = !endDate.value || new Date(t.end_date) <= new Date(endDate.value)
    const matchClub = selectedClubs.value.length === 0 || selectedClubs.value.includes(t.club)
    const matchCategory =
      selectedCategories.value.length === 0 ||
      t.categories?.some(c => selectedCategories.value.includes(c.name))

    return matchQuery && matchStartDate && matchEndDate && matchClub && matchCategory
  })
)

const paginatedTournaments = computed(() => {
  const start = (pagination.value.page - 1) * pagination.value.rowsPerPage
  return filteredTournamentsSorted.value.slice(start, start + pagination.value.rowsPerPage)
})

/* -------------------------------------------------------------------------- */
/* UI handlers                                                                 */
/* -------------------------------------------------------------------------- */

function onSelectClub (club: string) {
  addClub(club); clubPage.value = 1; clubSearch.value = ''
}
function addClub (club: string) {
  if (!selectedClubs.value.includes(club)) selectedClubs.value.push(club)
}
function removeClub (club: string) {
  selectedClubs.value = selectedClubs.value.filter(c => c !== club)
}

function onSelectCategory (cat: string) {
  addCategory(cat); categoryPage.value = 1; categorySearch.value = ''
}
function addCategory (cat: string) {
  if (!selectedCategories.value.includes(cat)) selectedCategories.value.push(cat)
}
function removeCategory (cat: string) {
  selectedCategories.value = selectedCategories.value.filter(c => c !== cat)
}

function toggleRow (row: Tournament) {
  expanded.value = isExpanded(row) ? expanded.value.filter(r => r.id !== row.id) : [row]
}
function isExpanded (row: Tournament) {
  return expanded.value.some(r => r.id === row.id)
}

/* -------------------------------------------------------------------------- */
/* Format & inscription                                                       */
/* -------------------------------------------------------------------------- */

const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR')
const formatDateTime = (d: string) => new Date(d).toLocaleString('fr-FR')

function openConfirmDialog (id: number) {
  event?.stopPropagation()
  if (!userStore.user) {
    $q.notify({ color: 'negative', message: 'Connectez-vous pour vous inscrire', icon: 'error' })
    return
  }
  if (userStore.user.id_tournament_waiting) {
    $q.notify({ color: 'warning', message: 'Annulez d’abord votre inscription en attente.', icon: 'warning' })
    return
  }
  selectedTournamentId.value = id
  selectedTournament.value = tournaments.value.find(t => t.id === id) || null
  confirmDialogVisible.value = true
}

async function registerForTournament () {
  if (!selectedTournamentId.value) return
  registering.value = true
  try {
    const { data } = await api.post<{ message?: string }>(`/tournaments/${selectedTournamentId.value}/register`)
    if (userStore.user) userStore.user.id_tournament_waiting = selectedTournamentId.value
    confirmDialogVisible.value = false
    $q.notify({ color: 'positive', icon: 'check_circle', message: data.message ?? 'Inscription enregistrée' })
    setTimeout(() => router.push('/profile'), 1000)
  } catch (err) {
    console.error(err)
    $q.notify({ color: 'negative', message: 'Erreur lors de l’inscription', icon: 'error' })
  } finally {
    registering.value = false
  }
}

/* -------------------------------------------------------------------------- */
/* Mounting                                                                   */
/* -------------------------------------------------------------------------- */

onMounted(async () => {
  if (!userStore.user) await userStore.fetchSession()
  await fetchTournaments()
  await fetchAllClubs()
})
</script>

<style scoped>
.hover-row:hover { background-color: rgba(0,0,0,0.03); }
</style>
