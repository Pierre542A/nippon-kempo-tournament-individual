<template>
    <div class="categories">
        <h2>Catégories</h2>

        <!-- 🌟 FILTRES 🌟 -->
        <div class="filters">
            <VaInput v-model="filters.q" placeholder="Recherche par nom…" clearable icon="search" />

            <VaSelect v-model="filters.gender" :options="genreOptions" placeholder="Genre" clearable track-by="value"
                value-by="value" />

            <VaSelect v-model="filters.type" :options="typeOptions" placeholder="Type" clearable track-by="value"
                value-by="value" />
        </div>

        <!-- 🌟 LISTE FILTRÉE 🌟 -->
        <div class="card-container">
            <div v-for="cat in filteredCategories" :key="cat.id" class="cat-card" @click="$emit('select', cat.id)"
                :title="`Voir détails de ${cat.name}`">
                <!-- entête de la carte -->
                <div class="card-header">
                    <span class="cat-name">{{ cat.name }}</span>
                    <span class="cat-badge" :class="cat.type.toLowerCase()">
                        {{ cat.type }}
                    </span>
                </div>

                <!-- corps de la carte avec les détails -->
                <div class="card-body">
                    <div class="info-row">
                        <span class="info-item">
                            <span class="material-icons icon">wc</span>{{ cat.gender.name }}
                        </span>
                        <span class="info-item">
                            <span class="material-icons icon">school</span>
                            <span v-if="cat.gradeMin === cat.gradeMax">
                                {{ cat.gradeMin }}
                            </span>
                            <span v-else>
                                {{ cat.gradeMin }} à {{ cat.gradeMax }}
                            </span>
                        </span>
                    </div>

                    <div class="info-row">
                        <span class="info-item">
                            <span class="material-icons icon">fitness_center</span>
                            {{ cat.weightRange[0] }}-{{ cat.weightRange[1] }} kg
                        </span>
                        <span class="info-item" v-if="winnerName(cat) !== '–'">
                            <span class="material-icons icon" style="color: gold;">
                                emoji_events
                            </span>
                            {{ winnerName(cat) }}
                        </span>
                    </div>
                </div>

                <!-- pied de la carte -->
                <div class="card-footer">
                    <span class="participants">
                        <span class="material-icons icon">group</span>
                        <strong>{{ cat.participants.length }}</strong> participants
                    </span>
                    <span class="material-icons icon arrow">chevron_right</span>
                </div>
            </div>
        </div>

        <!-- message si aucune catégorie ne correspond -->
        <p v-if="filteredCategories.length === 0" class="no-results">
            Aucune catégorie trouvée…
        </p>
    </div>
</template>

<script setup>
import { reactive, computed } from 'vue'
import { VaInput, VaSelect } from 'vuestic-ui'

const props = defineProps({
    categories: { type: Array, required: true }
})
const emit = defineEmits(['select'])

// 🔍 Filters state
const filters = reactive({
    q: '',
    gender: null,
    type: null
})

// 🎨 Options pour les selects
const genreOptions = computed(() => {
    const genres = new Set(props.categories.map(c => c.gender.name))
    return Array.from(genres).map(g => ({ text: g, value: g }))
})

const typeOptions = [
    { text: 'Poule', value: 'Poule' },
    { text: 'Tableau', value: 'Tableau' }
]

// 📑 Liste filtrée
const filteredCategories = computed(() =>
    props.categories.filter(c => {
        // 1) search by name
        const name = c.name.toLowerCase()
        if (filters.q && !name.includes(filters.q.toLowerCase())) return false

        // 2) filter by gender
        if (filters.gender && c.gender.name !== filters.gender) return false

        // 3) filter by type
        if (filters.type && c.type !== filters.type) return false

        return true
    })
)

// 🙋 Helper pour afficher le nom du vainqueur
function winnerName(cat) {
    const w = cat.participants.find(p => p.id === cat.winnerId)
    return w ? `${w.first_name} ${w.last_name}` : '–'
}
</script>

<style scoped>
.categories {
    font-family: system-ui, -apple-system, sans-serif;
    max-width: 90%;
}

h2 {
    font-size: 1.75rem;
    font-weight: 600;
    margin-bottom: 1rem;
    color: #2c3e50;
}

/* — FILTRES — */
.filters {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 1.5rem;
}

/* — CARDS — */
.card-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 1.25rem;
}

.cat-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 3px 15px rgba(0, 0, 0, 0.06);
    overflow: hidden;
    transition: transform 0.2s, box-shadow 0.2s;
    cursor: pointer;
    position: relative;
}

.cat-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.cat-card:hover::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #3498db, #9b59b6);
}

.card-header {
    padding: 1rem 1.25rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #f1f2f6;
}

.cat-name {
    font-weight: 600;
    font-size: 1.1rem;
    color: #2c3e50;
}

.cat-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 500;
}

.cat-badge.poule {
    background-color: #e3f2fd;
    color: #1976d2;
}

.cat-badge.tableau {
    background-color: #f3e5f5;
    color: #9c27b0;
}

.card-body {
    padding: 1rem 1.25rem;
}

.info-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.75rem;
}

.info-row:last-child {
    margin-bottom: 0;
}

.info-item {
    display: flex;
    align-items: center;
    font-size: 0.9rem;
    color: #546e7a;
}

.card-footer {
    padding: 0.875rem 1.25rem;
    background-color: #f9fafc;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid #f1f2f6;
}

.participants {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    color: #546e7a;
}

.participants strong {
    color: #2c3e50;
}

.material-icons.icon {
    font-size: 18px;
    margin-right: 4px;
    opacity: 0.7;
}

.icon.arrow {
    transition: transform 0.2s, color 0.2s;
    color: #bbbbbb;
}

.cat-card:hover .icon.arrow {
    transform: translateX(4px);
    color: #3498db;
}

/* message "aucun résultat" */
.no-results {
    margin-top: 2rem;
    text-align: center;
    color: #777;
    font-style: italic;
}

/* Responsive */
@media (max-width: 600px) {
    .card-container {
        grid-template-columns: 1fr;
    }

    .info-row {
        flex-direction: column;
        gap: 0.5rem;
    }
}
</style>