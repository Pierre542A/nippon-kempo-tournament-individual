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
    >
      <template v-slot:body="props">
        <q-tr :props="props" @click="toggleRow(props.row)" class="cursor-pointer hover-row">
          <q-td key="name" :props="props">
            {{ props.row.name }}
          </q-td>
          <q-td key="date" :props="props">
            {{ formatDate(props.row.date) }}
          </q-td>
          <q-td key="club" :props="props">
            {{ props.row.club }}
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
                          <span class="text-grey-8">Date:</span> {{ formatDate(props.row.date) }}
                        </p>
                        <p class="text-weight-medium">
                          <span class="text-grey-8">Club organisateur:</span> {{ props.row.club }}
                        </p>
                      </div>
                    </div>
                    <div>
                      <q-btn
                        color="primary"
                        label="S'inscrire"
                        class="q-px-md"
                        icon="how_to_reg"
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
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Tournament {
  id: number
  name: string
  date: string
  club: string
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
    name: 'date',
    required: true,
    label: 'Date',
    align: 'left' as const,
    field: 'date',
    sortable: true
  },
  {
    name: 'club',
    required: true,
    label: 'Club organisateur',
    align: 'left' as const,
    field: 'club',
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

const tournaments: Tournament[] = [
  { id: 1,  name: 'Tournoi Régional',       date: '2025-03-10', club: 'Sho Bu Kai' },
  { id: 2,  name: 'Championnat National',   date: '2025-04-15', club: 'Kempo Lyon' },
  { id: 3,  name: 'Open Paris',             date: '2025-05-20', club: 'Nippon Kempo Paris' },
  { id: 4,  name: 'Coupe de France',        date: '2025-06-05', club: 'Club Tokyo' },
  { id: 5,  name: 'Challenge Inter-Clubs',  date: '2025-07-12', club: 'Dojo Osaka' },
  { id: 6,  name: 'Tournoi International',  date: '2025-08-25', club: 'Club Kyoto' },
  { id: 7,  name: 'Open du Sud',            date: '2025-09-30', club: 'Nippon Kempo Nice' },
  { id: 8,  name: 'Challenge d\'Automne',   date: '2025-10-15', club: 'Club Bordeaux' },
  { id: 9,  name: 'Championnat National',   date: '2025-04-15', club: 'Kempo Lyon' },
  { id: 10, name: 'Open Paris',             date: '2025-05-20', club: 'Nippon Kempo Paris' },
  { id: 11, name: 'Coupe de France',        date: '2025-06-05', club: 'Club Tokyo' },
  { id: 12, name: 'Challenge Inter-Clubs',  date: '2025-07-12', club: 'Dojo Osaka' },
  { id: 13, name: 'Tournoi International',  date: '2025-08-25', club: 'Club Kyoto' },
  { id: 14, name: 'Open du Sud',            date: '2025-09-30', club: 'Nippon Kempo Nice' },
  { id: 15, name: 'Challenge d\'Automne',   date: '2025-10-15', club: 'Club Bordeaux' },
  { id: 16, name: 'Tournoi de Printemps',   date: '2025-03-20', club: 'Sho Bu Kai' },
  { id: 17, name: 'Coupe d\'Été',           date: '2025-07-01', club: 'Kempo Lyon' },
  { id: 18, name: 'Open d\'Hiver',          date: '2025-12-10', club: 'Nippon Kempo Paris' },
  { id: 19, name: 'Tournoi des Champions',  date: '2025-11-05', club: 'Club Tokyo' },
  { id: 20, name: 'Challenge des Étoiles',  date: '2025-08-01', club: 'Dojo Osaka' }
]

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
  const filtered = tournaments.filter(tournament => {
    const matchQuery = !searchQuery.value ||
      tournament.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    const tournamentDate = new Date(tournament.date)
    const matchStartDate = !startDate.value ||
      tournamentDate >= new Date(startDate.value)
    const matchEndDate = !endDate.value ||
      tournamentDate <= new Date(endDate.value)
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

function toggleRow(row: Tournament) {
  if (isExpanded(row)) {
    expanded.value = expanded.value.filter(r => r.id !== row.id)
  } else {
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
</script>