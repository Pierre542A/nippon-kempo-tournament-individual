<template>
    <div class="tournois-club-page">
        <!-- 1) Liste des tournois -->
        <template v-if="!selectedTournament">
            <div class="actions-bar">
                <VaButton color="primary" @click="openFileDialog">
                    Importer un tournoi (JSON)
                </VaButton>
                <VaButton color="success" @click="onCreateTournament">
                    + Créer un tournoi
                </VaButton>
                <!-- on remplace handleFileUpload par onFileChange -->
                <input type="file" ref="fileInput" accept="application/json" @change="onFileChange" hidden />
            </div>

            <div v-if="loadingTournaments" class="loading-state">
                <VaLoading size="48" />
                <p>Chargement des tournois…</p>
            </div>

            <template v-else>
                <div class="filter-bar">
                    <VaInput v-model="filters.q" placeholder="Recherche…" clearable icon="search" />
                    <VaSelect v-model="filters.status" :options="statusOptions" placeholder="Statut" clearable
                        track-by="value" value-by="value" />
                </div>

                <div class="tournaments-list">
                    <TournamentCard v-for="t in filteredTournaments" :key="t.tournament.id" :tournament="t.tournament"
                        :categories="t.categories" @select="onSelectTournament" />
                </div>
            </template>
        </template>

        <!-- liste des catégories d’un tournoi -->
        <template v-else-if="!selectedCategory">
            <div class="back-toolbar">
                <VaButton color="secondary" @click="selectedTournament = null">
                    ← Revenir à la liste des tournois
                </VaButton>
                <span class="current-tournament-name">
                    {{ selectedTournament.tournament.name }}
                </span>
            </div>

            <TournamentCategoryList :categories="selectedTournament.categories" @select="onSelectCategory" />
        </template>

        <!-- affichage des poules d’une catégorie -->
        <template v-else>
            <div class="back-toolbar">
                <VaButton color="secondary" @click="selectedCategory = null">
                    ← Revenir aux catégories
                </VaButton>
                <span class="current-tournament-name">
                    {{ selectedTournament.tournament.name }} - {{ selectedCategory.name }}
                </span>
            </div>

            <CategoryPoolList :category="selectedCategory" />
        </template>

        <!-- modal import -->
        <VaModal v-model="loadingImport" title="Import en cours" hide-default-actions no-outside-dismiss no-esc-dismiss>
            <div class="progress-text">{{ progressImport }}</div>
        </VaModal>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import TournamentCard from '@/components/online/TournamentCard.vue'
import TournamentCategoryList from '@/components/online/TournamentCategoryList.vue'
import CategoryPoolList from '@/components/online/CategoryPoolList.vue'
import {
    useSyncImportedTournamentParticipants
} from '@/functions/online/useSyncImportedTournamentParticipants'

// Props
const props = defineProps({ club: Object })

// Import JSON hook
const {
    fileInput,
    loading: loadingImport,
    progress: progressImport,
    openFileDialog,
    handleFileUpload
} = useSyncImportedTournamentParticipants(props.club.id)

// États principaux
const tournaments = ref([])
const selectedTournament = ref(null)
const selectedCategory = ref(null)
const loadingTournaments = ref(true)

// Filtres
const filters = ref({ q: '', status: null })

// Options de statut dynamiques
const statusOptions = computed(() =>
    Array.from(new Set(tournaments.value.map(t => t.tournament.status.name)))
        .map(s => ({ text: s, value: s }))
)

// Chargement initial des tournois
async function fetchTournaments() {
    loadingTournaments.value = true
    try {
        const { data } = await axios.get(
            `http://localhost:3000/tournament/club/${props.club.id}`
        )
        tournaments.value = data
    } finally {
        loadingTournaments.value = false
    }
}
onMounted(fetchTournaments)

// Nouveau wrapper : après l’upload, on relance fetchTournaments()
async function onFileChange(event) {
    await handleFileUpload(event)
    await fetchTournaments()
}

// Liste filtrée
const filteredTournaments = computed(() =>
    tournaments.value.filter(t => {
        const tour = t.tournament
        const hay = [tour.name, tour.address, tour.status.name]
            .join(' ')
            .toLowerCase()
        if (filters.value.q && !hay.includes(filters.value.q.toLowerCase()))
            return false
        if (filters.value.status && tour.status.name !== filters.value.status)
            return false
        return true
    })
)

// Navigation
function onSelectTournament(id) {
    selectedTournament.value = tournaments.value.find(
        t => t.tournament.id === id
    )
}
function onSelectCategory(catId) {
    selectedCategory.value = selectedTournament.value.categories.find(
        c => c.id === catId
    )
}
function onCreateTournament() {
    console.log('Créer un tournoi…')
}
</script>

<style scoped>
.tournois-club-page {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 1.5rem;
}

.actions-bar {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
}

.filter-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    align-items: center;
}

.tournaments-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1rem;
}

.loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 2rem;
}

.back-toolbar {
    position: relative;
    display: flex;
    align-items: center;
    gap: 1rem;
}

.current-tournament-name {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    font-size: 1.25rem;
    font-weight: 600;
    color: #2c3e50;
}

.progress-text {
    font-size: 1rem;
    color: #333;
}

@media (max-width: 600px) {
    .back-toolbar {
        flex-direction: column;
    }

    .current-tournament-name {
        position: static;
        transform: none;
        text-align: center;
    }
}
</style>