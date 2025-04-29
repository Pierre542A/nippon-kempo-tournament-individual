<template>
    <div class="tournament-card" @click="select" :title="`Voir détails de ${tournament.name}`">
        <div class="card-content">
            <!-- En-tête avec nom et date -->
            <div class="card-header">
                <h3 class="tournament-name">{{ tournament.name }}</h3>
                <span class="tournament-date">{{ formattedDate }}</span>
            </div>

            <!-- Informations du tournoi -->
            <div class="tournament-info">
                <div class="info-item">
                    <span class="material-icons icon">place</span>
                    <span>{{ tournament.address }}</span>
                </div>

                <div class="info-item">
                    <span class="material-icons icon">label</span>
                    <span>{{ tournament.status.name }}</span>
                </div>

                <div class="info-item">
                    <span class="material-icons icon">folder</span>
                    <span>
                        {{ categoriesCount }} catégorie<span v-if="categoriesCount > 1">s</span>
                    </span>
                </div>
            </div>
        </div>

        <!-- Indicateur visuel pour le clic -->
        <div class="card-action">
            <span class="material-icons icon arrow">chevron_right</span>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
    tournament: { type: Object, required: true },
    categories: { type: Array, default: () => [] }
})
const emit = defineEmits(['select'])

const formattedDate = computed(() =>
    new Date(props.tournament.start_date).toLocaleDateString('fr-FR', {
        year: 'numeric', month: 'long', day: 'numeric'
    })
)

const categoriesCount = computed(() => props.categories.length)

function select() {
    emit('select', props.tournament.id)
}
</script>

<style scoped>
.tournament-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 3px 12px rgba(0, 0, 0, 0.06);
    overflow: hidden;
    transition: transform 0.2s, box-shadow 0.2s;
    cursor: pointer;
    display: flex;
    position: relative;
}

.tournament-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
}

.tournament-card:hover::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 3px;
    background: linear-gradient(to bottom, #3498db, #9b59b6);
}

.card-content {
    flex: 1;
    padding: 1rem 1.25rem;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 1rem;
}

.tournament-name {
    font-size: 1.2rem;
    font-weight: 600;
    color: #2c3e50;
    margin: 0;
}

.tournament-date {
    font-size: 0.85rem;
    color: #7f8c8d;
    font-weight: 500;
}

.tournament-info {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.info-item {
    display: flex;
    align-items: center;
    font-size: 0.9rem;
    color: #546e7a;
}

.card-action {
    display: flex;
    align-items: center;
    padding: 0 1rem;
    border-left: 1px solid #f1f2f6;
}

/* Material Icons */
.material-icons.icon {
    font-size: 18px;
    margin-right: 0.75rem;
    opacity: 0.7;
}

.icon.arrow {
    transition: transform 0.2s, color 0.2s;
    color: #bbbbbb;
}

.tournament-card:hover .icon.arrow {
    transform: translateX(3px);
    color: #3498db;
}

/* État du tournoi */
.info-item:nth-child(2) span:last-child {
    padding: 0.15rem 0.5rem;
    border-radius: 12px;
    background-color: #f1f2f6;
    color: #2c3e50;
    font-size: 0.85rem;
    font-weight: 500;
}

@media (max-width: 600px) {
    .card-header {
        flex-direction: column;
        gap: 0.25rem;
    }

    .tournament-date {
        font-size: 0.8rem;
    }

    .card-action {
        padding: 0 0.75rem;
    }
}
</style>