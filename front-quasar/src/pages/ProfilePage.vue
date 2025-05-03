<template>
  <q-page class="q-pa-lg">
    <!-- Header -->
    <div class="row justify-center q-mb-xl">
      <div class="column items-center">
        <q-avatar size="150px" class="shadow-5">
          <q-img :src="avatarUrl" />
        </q-avatar>
        <h1 class="q-mt-md text-weight-bold">{{ fullName }}</h1>
        <q-btn
          to="/profile/edit"
          color="primary"
          label="Modifier mon profil"
          class="q-mt-sm"
          icon="edit"
        />
      </div>
    </div>

    <!-- Infos perso -->
    <div class="row q-col-gutter-lg">
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
            </q-list>
          </q-card-section>
        </q-card>
      </div>

      <!-- Stats -->
      <div class="col-12 col-md-8">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-h6">Statistiques</div>
            <div class="row q-col-gutter-md q-mt-sm">
              <div
                v-for="key in statKeys"
                :key="key"
                class="col-6 col-sm-4"
              >
                <q-card flat :class="statClasses[key] + ' text-white'">
                  <q-card-section class="text-center">
                    <div class="text-h4">{{ stats[key] }}</div>
                    <div class="text-caption">{{ statLabels[key] }}</div>
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
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useUserStore } from '../stores/user'

const store = useUserStore()

// Charge user+stats
onMounted(() => {
  store.fetchSession()
})

// Perso
const fullName  = computed(() => store.fullName)
const email     = computed(() => store.user?.email     ?? '—')
const phone     = computed(() => store.user?.phone     ?? '—')
const birthDate = computed(() =>
  store.user?.birth_date
    ? new Date(store.user.birth_date).toLocaleDateString('fr-FR')
    : '—'
)
// Utilisation des champs grade_name et club_name exposés par l'API
const grade     = computed(() => store.user?.grade_name  ?? '—')
const club      = computed(() => store.user?.club_name   ?? '—')

// Stats fallback
type StatKey = 'totalTournaments' | 'victories' | 'defeats' | 'ippon' | 'keiKoku' | 'totalTime'
const statKeys = ['totalTournaments','victories','defeats','ippon','keiKoku'] as const
const stats = computed<Record<StatKey, number>>(() => {
  const s = store.stats ?? {
    totalTournaments: 0,
    victories:       0,
    defeats:         0,
    ippon:           0,
    keiKoku:         0,
    totalTime:       0
  }
  return s as Record<StatKey, number>
})

// Labels & classes
const statLabels: Record<StatKey, string> = {
  totalTournaments: 'Tournois participés',
  victories:        'Victoires',
  defeats:          'Défaites',
  ippon:            'IPPON marqués',
  keiKoku:          'KEI-KOKU reçus',
  totalTime:        ''
}
const statClasses: Record<StatKey, string> = {
  totalTournaments: 'bg-primary',
  victories:        'bg-positive',
  defeats:          'bg-negative',
  ippon:            'bg-deep-purple',
  keiKoku:          'bg-orange',
  totalTime:        ''
}

// Formatage temps
const formatTime = (s: number) => `${(s/3600).toFixed(1).replace('.',',')}h`

// Avatar
const avatarUrl = computed(() =>
  `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${store.user?.first_name||'User'}`
)
</script>
