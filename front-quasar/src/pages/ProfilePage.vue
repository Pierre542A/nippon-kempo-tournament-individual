<template>
  <q-page class="q-pa-lg">
    <!-- Header avec photo de profil -->
    <div class="row justify-center q-mb-xl">
      <div class="column items-center">
        <q-avatar size="150px" class="shadow-5">
          <q-img src="https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=Oliver" />
        </q-avatar>
        <h1 class="q-mt-md text-weight-bold text-decoration-none">{{ fullName }}</h1>
        <q-btn
          to="/profile/edit"
          color="primary"
          label="Modifier mon profil"
          class="q-mt-sm"
          icon="edit"
        />
      </div>
    </div>

    <!-- Informations principales -->
    <div class="row q-col-gutter-lg">
      <!-- Carte informations personnelles -->
      <div class="col-12 col-md-4">
        <q-card flat bordered>
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
            </q-list>
          </q-card-section>
        </q-card>
      </div>

      <!-- Statistiques globales -->
      <div class="col-12 col-md-8">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-h6">Statistiques</div>
            <div class="row q-col-gutter-md q-mt-sm">
              <div class="col-6 col-sm-4">
                <q-card flat class="bg-primary text-white">
                  <q-card-section class="text-center">
                    <div class="text-h4">{{ stats.totalTournaments }}</div>
                    <div class="text-caption">Tournois participés</div>
                  </q-card-section>
                </q-card>
              </div>

              <div class="col-6 col-sm-4">
                <q-card flat class="bg-positive text-white">
                  <q-card-section class="text-center">
                    <div class="text-h4">{{ stats.victories }}</div>
                    <div class="text-caption">Victoires</div>
                  </q-card-section>
                </q-card>
              </div>

              <div class="col-6 col-sm-4">
                <q-card flat class="bg-negative text-white">
                  <q-card-section class="text-center">
                    <div class="text-h4">{{ stats.defeats }}</div>
                    <div class="text-caption">Défaites</div>
                  </q-card-section>
                </q-card>
              </div>

              <div class="col-6 col-sm-4">
                <q-card flat class="bg-deep-purple text-white">
                  <q-card-section class="text-center">
                    <div class="text-h4">{{ stats.ippon }}</div>
                    <div class="text-caption">IPPON marqués</div>
                  </q-card-section>
                </q-card>
              </div>

              <div class="col-6 col-sm-4">
                <q-card flat class="bg-orange text-white">
                  <q-card-section class="text-center">
                    <div class="text-h4">{{ stats.keiKoku }}</div>
                    <div class="text-caption">KEI-KOKU reçus</div>
                  </q-card-section>
                </q-card>
              </div>

              <div class="col-6 col-sm-4">
                <q-card flat class="bg-teal text-white">
                  <q-card-section class="text-center">
                    <div class="text-h4">{{ formatTime(stats.totalTime) }}</div>
                    <div class="text-caption">Temps en tournoi</div>
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Tournoi à venir -->
    <div class="q-mt-lg" v-if="nextTournament">
      <q-card flat bordered>
        <q-card-section>
          <div class="text-h6">Prochain tournoi</div>
          <div class="row items-center q-mt-md">
            <div class="col">
              <div class="text-subtitle1">{{ nextTournament.name }}</div>
              <div class="text-caption">{{ nextTournament.date }}</div>
              <div class="text-caption">{{ nextTournament.location }}</div>
            </div>
            <div class="col-auto">
              <q-btn 
                color="negative" 
                label="Se désinscrire" 
                flat 
                @click="confirmUnsubscribe"
              />
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Historique des tournois -->
    <div class="q-mt-lg">
      <q-card flat bordered>
        <q-card-section>
          <div class="text-h6">Historique des tournois</div>
          <q-table
            :rows="tournamentHistory"
            :columns="columns"
            row-key="id"
            flat
            bordered
            :pagination="{ rowsPerPage: 5 }"
          >
            <template v-slot:body-cell-result="props">
              <q-td :props="props">
                <q-chip
                  :color="getResultColor(props.row.result)"
                  text-color="white"
                  size="sm"
                >
                  {{ props.row.result }}
                </q-chip>
              </q-td>
            </template>
          </q-table>
        </q-card-section>
      </q-card>
    </div>

    <!-- Dialog de confirmation de désinscription -->
    <q-dialog v-model="confirmDialog">
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="warning" text-color="white" />
          <span class="q-ml-sm">Êtes-vous sûr de vouloir vous désinscrire de ce tournoi ?</span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Annuler" color="primary" v-close-popup />
          <q-btn flat label="Confirmer" color="negative" @click="unsubscribe" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()

interface Tournament {
  id: number;
  name: string;
  date: string;
  location: string;
}

interface TournamentHistoryItem {
  id: number;
  date: string;
  tournament: string;
  category: string;
  result: string;
}

interface Column {
  name: string;
  label: string;
  field: string;
  align: 'left' | 'right' | 'center';
}

interface Stats {
  totalTournaments: number;
  victories: number;
  defeats: number;
  ippon: number;
  keiKoku: number;
  totalTime: number;
}

// Données utilisateur
const fullName = ref('Pierre Durand')
const email = ref('pierre.durand@example.com')
const birthDate = ref('15/03/1990')
const grade = ref('Ceinture noire 2ème dan')
const club = ref('Nippon Kempo Paris')

// Statistiques
const stats = ref<Stats>({
  totalTournaments: 15,
  victories: 10,
  defeats: 5,
  ippon: 25,
  keiKoku: 8,
  totalTime: 2350 // en secondes
})

// Colonnes pour le tableau d'historique
const columns: Column[] = [
  { name: 'date', label: 'Date', field: 'date', align: 'left' },
  { name: 'tournament', label: 'Tournoi', field: 'tournament', align: 'left' },
  { name: 'category', label: 'Catégorie', field: 'category', align: 'left' },
  { name: 'result', label: 'Résultat', field: 'result', align: 'center' }
]

// Historique des tournois
const tournamentHistory = ref<TournamentHistoryItem[]>([
  { id: 1, date: '10/01/2025', tournament: 'Championnat Régional', category: '-75kg', result: 'Victoire' },
  { id: 2, date: '15/12/2024', tournament: 'Open de Paris', category: '-75kg', result: 'Défaite' },
  { id: 3, date: '20/11/2024', tournament: 'Coupe de France', category: '-75kg', result: 'Victoire' }
])

// Prochain tournoi
const nextTournament = ref<Tournament | undefined>({
  id: 1,
  name: 'Championnat National',
  date: '15/03/2025',
  location: 'Paris'
})

// Dialog de confirmation
const confirmDialog = ref(false)

// Formater le temps total (convertir les secondes en format lisible)
const formatTime = (seconds: number): string => {
  const hours = seconds / 3600
  const minutes = Math.floor(seconds / 60)
  return `${hours.toFixed(1).replace('.', ',')}h (${minutes}min)`
}

// Obtenir la couleur pour le résultat
const getResultColor = (result: string): string => {
  switch (result) {
    case 'Victoire':
      return 'positive'
    case 'Défaite':
      return 'negative'
    default:
      return 'grey'
  }
}

// Gérer la désinscription
const confirmUnsubscribe = () => {
  confirmDialog.value = true
}

const unsubscribe = async () => {
  try {
    // Simuler une requête API
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    $q.notify({
      color: 'positive',
      message: 'Désinscription effectuée avec succès',
      icon: 'check'
    })
    
    nextTournament.value = undefined
  } catch (err: unknown) {
    console.error(err)
    $q.notify({
      color: 'negative',
      message: 'Erreur lors de la désinscription',
      icon: 'error'
    })
  }
}
</script>