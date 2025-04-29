<template>
    <div class="pool-container">
        <!-- EN-TÊTE FIXE -->
        <header class="pool-header">
            <h2>{{ pool.name }}</h2>
            <span class="badge">{{ pool.ranking.length }} participants</span>
        </header>

        <!-- CORPS AVEC DEUX COLONNES -->
        <div class="pool-body">
            <!-- Classement à gauche -->
            <section v-if="pool.ranking.length" class="standings">
                <h3>Classement</h3>
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Participant</th>
                            <th>MJ</th>
                            <th>MG</th>
                            <th>MN</th>
                            <th>MP</th>
                            <th>IP</th>
                            <th>IC</th>
                            <th>KP</th>
                            <th>KC</th>
                            <th>Pts</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="r in sortedRanking" :key="r.participant_id" :class="{ winnerRow: r.position === 1 }">
                            <td>{{ r.position }}</td>
                            <td class="participant-cell">
                                <span v-if="r.position === 1" class="material-icons trophy" title="Vainqueur">
                                    emoji_events
                                </span>
                                {{ nameOf(r.participant_id) }}
                            </td>
                            <td>{{ r.matches_played }}</td>
                            <td>{{ r.matches_won }}</td>
                            <td>{{ r.matches_drawn }}</td>
                            <td>{{ r.matches_lost }}</td>
                            <td>{{ r.ippons_scored }}</td>
                            <td>{{ r.ippons_conceded }}</td>
                            <td>{{ r.keikokus_scored }}</td>
                            <td>{{ r.keikokus_conceded }}</td>
                            <td>{{ r.total_points }}</td>
                        </tr>
                    </tbody>
                </table>
            </section>
            <p v-else class="empty-state">Aucun classement disponible</p>

            <!-- Matchs à droite -->
            <section class="matches">
                <h3>Matchs</h3>
                <div v-if="sortedMatches.length" class="matches-grid">
                    <article v-for="m in sortedMatches" :key="m.id"
                        :class="['match-card', { additional: m.additional_match }]">
                        <!-- Ligne des noms -->
                        <div class="names-line">
                            <div class="player name1" :class="{ winner: m.id_winner === m.id_participant1 }">
                                {{ nameOf(m.id_participant1) }}
                            </div>
                            <div class="vs">VS</div>
                            <div class="player name2" :class="{ winner: m.id_winner === m.id_participant2 }">
                                {{ nameOf(m.id_participant2) }}
                            </div>
                        </div>

                        <!-- Ippons -->
                        <div class="stats-row">
                            <div class="stat name1">{{ m.ippons_participant1 }}</div>
                            <div class="label">Ippons</div>
                            <div class="stat name2">{{ m.ippons_participant2 }}</div>
                        </div>

                        <!-- Keikokus -->
                        <div class="stats-row">
                            <div class="stat name1">{{ m.keikokus_participant1 }}</div>
                            <div class="label">Keikokus</div>
                            <div class="stat name2">{{ m.keikokus_participant2 }}</div>
                        </div>

                        <!-- Statut -->
                        <div class="match-status" :class="m.id_winner ? 'finished' : 'pending'">
                            {{ m.id_winner ? 'Terminé' : 'En attente' }}
                        </div>
                    </article>
                </div>
                <p v-else class="empty-state">Aucun match programmé</p>
            </section>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'

// Props
const props = defineProps({
    pool: { type: Object, required: true },
    participants: { type: Array, required: true }
})

// Mapping id → Nom Prénom
const nameMap = computed(() =>
    Object.fromEntries(
        props.participants.map(p => [p.id, `${p.last_name} ${p.first_name}`])
    )
)

// Classement trié
const sortedRanking = computed(() =>
    props.pool.ranking.slice().sort((a, b) => a.position - b.position)
)

// Matchs : normaux puis additionnels
const sortedMatches = computed(() => {
    const normal = props.pool.matches.filter(m => !m.additional_match)
    const additional = props.pool.matches.filter(m => m.additional_match)
    return [...normal, ...additional]
})

// Helper pour nom
function nameOf(id) {
    return nameMap.value[id] || '–'
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/icon?family=Material+Icons');

.pool-container {
    display: flex;
    flex-direction: column;
    width: 100%;
}

.pool-header {
    padding: 0.75rem;
    background: #fafafa;
    border-bottom: 1px solid #ececec;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.pool-header h2 {
    margin: 0;
    font-size: 1.5rem;
    color: #2c3e50;
}

.badge {
    background: #e3f2fd;
    color: #1976d2;
    padding: 0.25rem 0.5rem;
    border-radius: 1rem;
    font-weight: 600;
    font-size: 0.85rem;
}

.pool-body {
    display: flex;
    flex-wrap: wrap;
    padding: 0.75rem;
}

.standings {
    flex: 1 1 50%;
    max-width: 50%;
    padding-right: 0.75rem;
}

.matches {
    flex: 1 1 50%;
    max-width: 50%;
    padding-left: 0.75rem;
}

h3 {
    margin-bottom: 0.5rem;
    color: #34495e;
    font-size: 1.2rem;
}

.standings table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0 4px;
    font-size: 0.85rem;
}

.standings th {
    background: #fafafa;
    color: #7f8c8d;
    font-weight: 600;
    padding: 0.4rem;
    text-align: center;
    font-size: 0.8rem;
}

.standings td {
    background: #fff;
    padding: 0.5rem 0.3rem;
    text-align: center;
    color: #2c3e50;
}

.winnerRow td {
    background: #fef9e7;
}

.participant-cell {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.3rem;
}

.material-icons.trophy {
    color: gold;
    font-size: 1rem;
}

.matches-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
}

.match-card {
    background: #fff;
    border-radius: 6px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
    display: grid;
    grid-auto-rows: auto;
    row-gap: 0.3rem;
    padding: 0.75rem;
    border: 1px solid transparent;
    font-size: 0.9rem;
}

.match-card.additional {
    border: 1px dashed #1976d2;
}

.names-line {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
}

.player {
    font-size: 0.9rem;
}

.name1 {
    text-align: right;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding-right: 6px;
}

.name2 {
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding-left: 6px;
}

.vs {
    text-align: center;
    font-weight: bold;
    color: #7f8c8d;
    font-size: 0.8rem;
}

.names-line .winner {
    color: #00796b;
    font-weight: 600;
}

.stats-row {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
}

.stats-row .label {
    text-align: center;
    color: #7f8c8d;
    font-weight: 600;
    font-size: 0.8rem;
}

.stats-row .stat {
    font-size: 0.85rem;
    color: #2c3e50;
}

.stats-row .name1 {
    text-align: right;
}

.stats-row .name2 {
    text-align: left;
}

.match-status {
    text-align: center;
    padding-top: 0.4rem;
    margin-top: 0.3rem;
    border-top: 1px solid #ececec;
    font-size: 0.8rem;
    font-weight: 600;
}

.match-status.finished {
    color: #00796b;
}

.match-status.pending {
    color: #d32f2f;
}

.empty-state {
    text-align: center;
    color: #888;
    font-style: italic;
    margin: 1rem 0;
    font-size: 0.9rem;
}

/* Responsive: revenir au layout vertical quand l'écran est petit */
@media (max-width: 768px) {
    .pool-body {
        flex-direction: column;
    }

    .standings,
    .matches {
        flex: 1 1 100%;
        max-width: 100%;
        padding: 0;
        margin-bottom: 1.5rem;
    }

    .standings table {
        font-size: 0.75rem;
    }

    /* Simplification de l'affichage pour les petits écrans */
    .standings th:nth-child(5),
    .standings th:nth-child(6),
    .standings th:nth-child(7),
    .standings th:nth-child(8),
    .standings th:nth-child(9),
    .standings th:nth-child(10),
    .standings td:nth-child(5),
    .standings td:nth-child(6),
    .standings td:nth-child(7),
    .standings td:nth-child(8),
    .standings td:nth-child(9),
    .standings td:nth-child(10) {
        display: none;
    }
}

@media (max-width: 500px) {

    .names-line,
    .stats-row {
        grid-template-columns: 1fr auto 1fr;
    }

    .pool-header h2 {
        font-size: 1.2rem;
    }

    .badge {
        font-size: 0.7rem;
        padding: 0.2rem 0.4rem;
    }
}
</style>