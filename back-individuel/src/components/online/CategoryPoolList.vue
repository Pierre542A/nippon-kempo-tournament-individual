<template>
    <div class="category-pool-list">

        <!-- Corps scrollable -->
        <div class="category-body">
            <!-- Poules initiales -->
            <section v-if="initialPools.length" class="pool-section initial">
                <h3>Poules Initiales</h3>
                <div class="pools-list">
                    <CategoryPool v-for="pool in initialPools" :key="pool.id" :pool="pool"
                        :participants="category.participants" class="pool-item" />
                </div>
            </section>

            <!-- Poule finale -->
            <section v-if="finalPool" class="pool-section final">
                <h3>🏆 Poule Finale</h3>
                <CategoryPool :pool="finalPool" :participants="category.participants" class="pool-item" />
            </section>

            <!-- Aucun pool -->
            <p v-if="!category.pools || category.pools.length === 0" class="no-pools">
                Aucune poule disponible pour cette catégorie.
            </p>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import CategoryPool from './CategoryPool.vue'

const props = defineProps({
    category: { type: Object, required: true }
})

// Séparation poules initiales / finale
const initialPools = computed(() =>
    props.category.pools.filter(p => p.name !== 'Poule Finale')
)

const finalPool = computed(() => {
    const finale = props.category.pools.find(p => p.name === 'Poule Finale')
    if (!finale && props.category.pools.length === 1) {
        return props.category.pools[0]
    }
    return finale || null
})
</script>

<style scoped>
.category-pool-list {
    height: 70vh;
    display: flex;
    flex-direction: column;
    border: 1px solid #ececec;
    border-radius: 8px;
    background: #fff;
    overflow: hidden;
}

.category-body {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
}

/* Poules empilées verticalement */
.pools-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

/* Chaque poule occupe toute la largeur */
.pool-item {
    width: 100%;
}

/* Sections */
.pool-section {
    margin-bottom: 1.5rem;
}

.pool-section h3 {
    margin: 0 0 0.75rem;
    font-size: 1.25rem;
    color: #34495e;
}

.pool-section.initial h3::before {
    content: '🌟 ';
}

.pool-section.final h3 {
    color: #b8860b;
}

/* Message “aucun pool” */
.no-pools {
    text-align: center;
    color: #777;
    font-style: italic;
    margin-top: 2rem;
}

/* Scrollbar discrète */
.category-body::-webkit-scrollbar {
    width: 8px;
}

.category-body::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 4px;
}

/* Responsive */
@media (max-width: 600px) {
    .category-body {
        padding: 0.5rem;
    }
}
</style>