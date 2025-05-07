<template>
  <q-page class="q-pa-lg">
    <!-- Header -->
    <div class="row justify-center q-mb-xl">
      <div class="column items-center">
        <q-avatar size="150px" class="shadow-5">
          <q-img :src="avatarUrl" :key="avatarKey" />
        </q-avatar>
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
              <q-item><q-item-section><q-item-label caption>Email</q-item-label><q-item-label>{{ email }}</q-item-label></q-item-section></q-item>
              <q-item><q-item-section><q-item-label caption>Téléphone</q-item-label><q-item-label>{{ phone }}</q-item-label></q-item-section></q-item>
              <q-item><q-item-section><q-item-label caption>Date de naissance</q-item-label><q-item-label>{{ birthDate }}</q-item-label></q-item-section></q-item>
              <q-item><q-item-section><q-item-label caption>Grade</q-item-label><q-item-label>{{ grade }}</q-item-label></q-item-section></q-item>
              <q-item><q-item-section><q-item-label caption>Club</q-item-label><q-item-label>{{ club }}</q-item-label></q-item-section></q-item>
              <q-item v-if="debug"><q-item-section><q-item-label caption>Avatar Seed</q-item-label><q-item-label>{{ store.user?.avatar_seed || 'default' }}</q-item-label></q-item-section></q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </div>

      <!-- Stats -->
      <div class="col-12 col-md-8">
        <q-card flat bordered class="full-height">
          <q-card-section>
            <div class="text-h6">Statistiques</div>
            <!-- Première ligne -->
            <div class="row q-col-gutter-md q-mt-sm">
              <div v-for="key in firstStatKeys" :key="key" class="col-6 col-sm-4">
                <q-card flat :class="statClasses[key] + ' text-white stat-card'">
                  <q-card-section class="text-center">
                    <div class="text-h4">{{ stats[key] }}</div>
                    <div class="stat-label"><span v-html="formatLabel(key)"></span></div>
                  </q-card-section>
                </q-card>
              </div>
            </div>
            <!-- Seconde ligne -->
            <div class="row q-col-gutter-md q-mt-sm">
              <div v-for="key in secondStatKeys" :key="key" class="col-6 col-sm-4">
                <q-card flat :class="statClasses[key] + ' text-white stat-card'">
                  <q-card-section class="text-center">
                    <div class="text-h4">{{ stats[key] }}</div>
                    <div class="stat-label"><span v-html="formatLabel(key)"></span></div>
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
              <q-btn color="negative" label="Se désinscrire" icon="cancel" unelevated @click="confirmCancelRegistration" :loading="cancelingRegistration" />
            </div>
            <q-separator class="q-my-md" />
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <q-list dense>
                  <q-item><q-item-section><q-item-label caption>Nom du tournoi</q-item-label><q-item-label class="text-bold">{{ waitingTournament?.name || 'Chargement...' }}</q-item-label></q-item-section></q-item>
                  <q-item><q-item-section><q-item-label caption>Date de début</q-item-label><q-item-label>{{ formatTournamentDate(waitingTournament?.start_date) }}</q-item-label></q-item-section></q-item>
                  <q-item><q-item-section><q-item-label caption>Date de fin</q-item-label><q-item-label>{{ formatTournamentDate(waitingTournament?.end_date) }}</q-item-label></q-item-section></q-item>
                </q-list>
              </div>
              <div class="col-12 col-md-6">
                <q-list dense>
                  <q-item><q-item-section><q-item-label caption>Lieu</q-item-label><q-item-label>{{ waitingTournament?.address || '—' }}</q-item-label></q-item-section></q-item>
                  <q-item><q-item-section><q-item-label caption>Statut</q-item-label><q-item-label><q-badge :color="waitingTournament?.status === 'open' ? 'positive' : 'negative'">{{ waitingTournament?.status === 'open' ? 'Ouvert aux inscriptions' : 'Inscriptions fermées' }}</q-badge></q-item-label></q-item-section></q-item>
                </q-list>
              </div>
            </div>
            <div class="row q-mt-md"><div class="col-12 text-center"><q-badge color="orange" class="q-pa-sm">Votre inscription est en attente de validation</q-badge></div></div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Historique des tournois -->
    <div class="row q-mt-xl">
      <div class="col-12">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-h6">Historique des matches</div>
            <q-separator class="q-my-md" />
            <q-table :rows="userMatches" :columns="matchColumns" row-key="id" :loading="loadingMatches" :pagination="matchPagination" flat bordered :rows-per-page-options="[5,10,15]">
              <template v-slot:body="props">
                <q-tr :props="props">
                  <q-td key="tournament" :props="props">{{ props.row.tournament_name }}</q-td>
                  <q-td key="start_date" :props="props">{{ formatTournamentDate(props.row.start_date) }}</q-td>
                  <q-td key="end_date" :props="props">{{ formatTournamentDate(props.row.end_date) }}</q-td>
                  <q-td key="placement" :props="props">{{ props.row.placement ?? 'N/A' }}</q-td>
                  <q-td key="participants" :props="props">{{ props.row.participants }}</q-td>
                  <q-td key="ippon" :props="props">{{ props.row.ippon }}</q-td>
                  <q-td key="keikoku" :props="props">{{ props.row.keikoku }}</q-td>
                </q-tr>
              </template>
              <template v-slot:no-data>
                <div class="full-width row flex-center q-py-md"><q-icon name="emoji_events_off" size="2em" color="grey-7" class="q-mr-sm" /><span class="text-grey-7">Aucun match trouvé</span></div>
              </template>
            </q-table>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Dialog de confirmation de désinscription -->
    <q-dialog v-model="confirmDialogVisible" persistent>
      <q-card style="min-width:300px"><q-card-section class="bg-negative text-white"><div class="text-h6"><q-icon name="warning" class="q-mr-sm" />Confirmation de désinscription</div></q-card-section><q-card-section class="q-pt-md">Êtes-vous sûr de vouloir vous désinscrire du tournoi "{{ waitingTournament?.name || 'en attente' }}" ?<p class="text-negative q-mt-sm">Cette action est irréversible.</p></q-card-section><q-card-actions align="right" class="q-pb-md q-pr-md"><q-btn flat label="Annuler" color="primary" v-close-popup /><q-btn unelevated label="Confirmer" color="negative" @click="cancelRegistration" :loading="cancelingRegistration" v-close-popup /></q-card-actions></q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, nextTick, watch } from 'vue'
import { useUserStore } from '../stores/user'
import { useQuasar } from 'quasar'
import axios from 'axios'
import { useRoute } from 'vue-router'
import type { QTableProps } from 'quasar'

const store = useUserStore()
const $q = useQuasar()
const route = useRoute()

const debug = ref(false)

// Avatar reload key
const avatarKey = ref(0)

// -- Personal info
const fullName = computed(() => store.fullName)
const email = computed(() => store.user?.email ?? '—')
const phone = computed(() => store.user?.phone ?? '—')
const birthDate = computed(() => store.user?.birth_date ? new Date(store.user.birth_date).toLocaleDateString('fr-FR') : '—')
const grade = computed(() => store.user?.grade_name ?? '—')
const club = computed(() => store.user?.club_name ?? '—')

// -- Stats
const stats = computed(() => store.stats ?? { totalTournaments:0,victories:0,defeats:0,matches:0,ippon:0,keiKoku:0 })
const firstStatKeys = ['totalTournaments','victories','defeats'] as const
const secondStatKeys = ['matches','ippon','keiKoku'] as const

type StatKey = typeof firstStatKeys[number] | typeof secondStatKeys[number]
const statLabels: Record<StatKey,string> = {
  totalTournaments:'Tournois participés',
  victories:'Victoires (tous matchs cumulés)',
  defeats:'Défaites (tous matchs cumulés)',
  matches:'Matchs participés',
  ippon:'IPPON marqués (tous matchs cumulés)',
  keiKoku:'KEI-KOKU reçus (tous matchs cumulés)'
}
const statClasses: Record<StatKey,string> = {
  totalTournaments:'bg-primary',
  victories:'bg-positive',
  defeats:'bg-negative',
  matches:'bg-secondary',
  ippon:'bg-deep-purple',
  keiKoku:'bg-orange'
}
function formatLabel(key:StatKey){
  return statLabels[key].includes('(tous')
    ? statLabels[key].replace(' (tous matchs cumulés)','<br>(tous matchs cumulés)')
    : statLabels[key]
}

// -- Avatar
const avatarUrl = computed(() => store.avatarUrl)

// -- Waiting tournament
interface Tournament { id:number; name:string; start_date:string; end_date:string; address:string; status:string }
const waitingTournament = ref<Tournament|null>(null)

// -- Matches history
// -- Matches history
interface ApiMatch{ id:number; tournament_name:string; start_date:string; end_date:string; placement:number|null; opponent_name:string; ippon:number; keikoku:number }
interface MatchesResponse{ matches:ApiMatch[] }
interface MatchRow{ id:number; tournament_name:string; start_date:string; end_date:string; placement:number|null; participants:string; ippon:number; keikoku:number }
const userMatches = ref<MatchRow[]>([])
const loadingMatches = ref(false)
const matchPagination = ref({ rowsPerPage:5, sortBy:'start_date', descending:true })
const matchColumns: QTableProps['columns'] = [
  {name:'tournament', label:'Tournoi', field:'tournament_name', align:'left', sortable:true, required:true},
  {name:'start_date', label:'Début', field:'start_date', align:'left', sortable:true, required:true},
  {name:'end_date', label:'Fin', field:'end_date', align:'left', sortable:true, required:true},
  {name:'placement', label:'Classement', field:'placement', align:'center', sortable:true, required:true},
  {name:'participants', label:'Participants', field:'participants', align:'left', sortable:false, required:true},
  {name:'ippon', label:'IPPON', field:'ippon', align:'center', sortable:true, required:true},
  {name:'keikoku', label:'KEI-KOKU', field:'keikoku', align:'center', sortable:true, required:true},
]

// -- State for cancel registration dialog
const confirmDialogVisible = ref(false)
const cancelingRegistration = ref(false)

// Helpers
function formatTournamentDate(dateStr?:string){
  if(!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR',{day:'2-digit',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'})
}

// Fetch matches
async function fetchMatches () {
  if (!store.user?.id) return
  loadingMatches.value = true
  try {
    const { data } = await axios.get<MatchesResponse>(`${import.meta.env.VITE_API_URL}/users/${store.user.id}/matches`)
    userMatches.value = data.matches.map(m => ({
      id: m.id,
      tournament_name: m.tournament_name,
      start_date: m.start_date,
      end_date: m.end_date,
      placement: m.placement ?? null,
      participants: `${store.fullName} vs ${m.opponent_name}`,
      ippon: m.ippon,
      keikoku: m.keikoku
    }))
  } catch {
    console.error('fetchMatches')
    $q.notify({ color: 'negative', message: 'Erreur lors du chargement des matches', icon: 'error' })
  } finally {
    loadingMatches.value = false
  }
}

// Fetch waiting tournament info
async function fetchTournamentData () {
  if (!store.user?.id_tournament_waiting) return
  try {
    const { data } = await axios.get<Tournament>(`${import.meta.env.VITE_API_URL}/tournaments/${store.user.id_tournament_waiting}`)
    waitingTournament.value = data
  } catch {
    $q.notify({ color: 'negative', message: 'Erreur lors de la récupération du tournoi', icon: 'error' })
  }
}

// Cancel registration
function confirmCancelRegistration(){ confirmDialogVisible.value = true }
async function cancelRegistration(){
  if(!store.user?.id) return
  cancelingRegistration.value = true
  try{
    await axios.delete(`${import.meta.env.VITE_API_URL}/users/${store.user.id}/tournament-registration`)
    store.user.id_tournament_waiting = null
    waitingTournament.value = null
    $q.notify({ color:'positive', message:'Désinscription effectuée', icon:'check_circle' })
  }catch{
    $q.notify({ color:'negative', message:'Erreur lors de la désinscription', icon:'error' })
  }finally{
    cancelingRegistration.value = false
    confirmDialogVisible.value = false
  }
}

// Refresh user data helper (called after editing profile)
const refreshingData = ref(false)
async function refreshUserData(){
  refreshingData.value = true
  try{
    await store.fetchSession()
    avatarKey.value++
    await nextTick()
  }finally{ refreshingData.value = false }
}

watch(()=>route.fullPath, async(newPath,oldPath)=>{
  if(newPath.includes('/profile') && oldPath?.includes('/profile/edit')) await refreshUserData()
})

onMounted(async()=>{
  await refreshUserData()
  await fetchMatches()
  await fetchTournamentData()
})
</script>

<style scoped>
.stat-card{height:100%;display:flex;flex-direction:column}
.stat-label{min-height:3em;display:flex;flex-direction:column;justify-content:center}
.full-height{height:100%}
</style>
