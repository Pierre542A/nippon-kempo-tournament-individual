<template>
  <div class="tournament-layout">
    <!-- eEADER -->
    <header class="header">
      <!-- bouton Accueil (icône seule) -->
      <VaButton @click="goToHomePage" class="home-button" color="primary" icon="home" />

      <!-- checkbbox pour afficher/cacher la sidebar -->
      <VaCheckbox v-model="showSidebar" class="toggle-sidebar" label="Afficher les catégories" />

      <!-- nom du tournoi, bien centré -->
      <h1 class="page-title">
        <VaIcon name="trophy" class="title-icon" />
        Gestion du tournoi: {{ tournament ? tournament.name : "Chargement..." }}
      </h1>

      <VaButton @click="handleGetAllData" class="export-button" color="primary" icon="call_made"
        :disabled="!allCategoriesFinished" :title="!allCategoriesFinished
          ? 'Le bouton sera activé lorsque toutes les catégories du tournoi seront terminées'
          : ''">
        Exporter le tournoi en JSON
      </VaButton>

    </header>

    <!-- contenu principal -->
    <main class="content">
      <!-- sidebar des catégories -->
      <aside v-if="showSidebar" class="category-sidebar">
        <h2 class="sidebar-title">
          <VaIcon name="category" />
          Catégories
        </h2>

        <div class="category-list">
          <!-- liste des catégories -->
          <div v-for="category in formattedCategories" :key="category.id" class="category-item"
            :class="{ active: category.id === activeCategory?.id }" @click="activeCategory = category">
            <!-- nom de la catégorie + nombre de participants -->
            <h3 class="category-name">
              {{ category.name }}
            </h3>

            <span class="participant-count">{{ category.participantCount }} participants</span>

            <!-- genre + Type de tournoi -->
            <div class="category-meta">
              <span class="category-gender">
                <VaIcon name="person" /> {{ category.genre }}
              </span>
              <VaChip class="category-type" color="primary" size="small">
                <VaIcon name="sports" />
                {{ category.type }}
              </VaChip>
            </div>

            <!-- grade -->
            <p class="category-grade">
              <VaIcon name="school" />
              {{ category.gradeRange }}
            </p>

            <!-- tranche d'âge -->
            <p class="category-age">
              <VaIcon name="calendar_today" />
              {{ category.ageCategories }}
            </p>

            <!-- statut de la catégorie -->
            <span class="category-status" :class="category.status === 'Terminé' ? 'finished' : 'ongoing'">
              {{ category.status }}
            </span>

            <!--  gagnant si la catégorie est terminée -->
            <p v-if="category.status === 'Terminé' && category.winnerName" class="category-winner">
              <VaIcon name="emoji_events" class="winner-icon" />
              {{ category.winnerName }}
            </p>

          </div>

        </div>
      </aside>

      <!-- affichage de CategoryManage quand une catégorie est sélectionnée -->
      <section class="category-manage-container" v-if="activeCategory?.id">
        <CategoryManage :category="activeCategory" :tournament="tournament" />
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getCategoriesByTournament } from "@/replicache/stores/categoryStore";
import { getParticipantsByCategory } from "@/replicache/stores/participantStore";
import CategoryManage from "@/components/offline/CategoryManage.vue";
import { categoriesAge, grades, genders, categoriesTypes } from "@/replicache/models/constants";
import { replicacheInstance as rep } from "@/replicache/replicache";
import { determinePoolRanking } from '@/functions/determinePoolRanking';
import { useToast } from "vuestic-ui";

// recup de l'ID du tournoi via la route
const route = useRoute();
const router = useRouter();
const tournamentId = computed(() => route.params.id);

const toast = useToast();

// etats
const tournament = ref(null);
const categories = ref([]);
const activeCategory = ref(null);
const showSidebar = ref(true);


const handleGetAllData = async () => {

  try {
    // 1) on lit tout le store des données stockkees dans replicache
    const scanResults = await rep.query(async tx => {
      const entries = [];
      for await (const [key, value] of tx.scan().entries()) {
        entries.push({ key, value });
      }
      return entries;
    });

    // 2) on prépare l'objet d'export sa structure

    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const formattedDate =
      `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ` +
      `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    const exportData = {
      metadata: {
        exportedAt: `${formattedDate}`,
        tournamentId: tournamentId.value,
      },
      tournaments: [],
      categories: [],
      participants: [],
      matches: [],
      brackets: [],
      poolManagers: [],
      poules: [],
      rounds: [],
    };

    // 3) on dispatch dans exportData selon le préfixe clé de replicache
    scanResults.forEach(({ key, value }) => {
      const [kind, tid, id] = key.split("/");
      if (!kind) return;
      const base = { tournamentId: tid, id, ...value };
      switch (kind) {
        case "tournament": exportData.tournaments.push({ id: tid, ...value }); break;
        case "category": exportData.categories.push(base); break;
        case "participant": exportData.participants.push(base); break;
        case "match":
          const match = { ...value };
          delete match.tournamentId;
          exportData.matches.push(match);
          break;
        case "bracket": exportData.brackets.push(base); break;
        case "poolManager": exportData.poolManagers.push(base); break;
        case "poule": exportData.poules.push(base); break;
        case "round": exportData.rounds.push(base); break;
      }
    });

    // 4) on filtre les participants vraiment inscrits
    exportData.participants = exportData.participants
      .filter(p => p.categoryId && p.categoryId !== -1);

    // 5) pour chaque poule, on calcule ranking si c'est bien une poule
    exportData.poules.forEach(poule => {
      // on retrouve la catégorie via le poolManager
      const pm = exportData.poolManagers.find(pm => pm.id === poule.poolManagerId);
      const cat = exportData.categories.find(c => c.id === pm?.categoryId);

      if (cat?.typeId === 1) {  // 1 = le type poule uniquement
        // on laisse poule.participants tel quel
        const participantsInPool = poule.participants || [];

        // on cherche tous les matchs de cette poule
        const matchesInPool = exportData.matches.filter(m => m.idPool === poule.id);

        // on calcule le classement
        poule.ranking = determinePoolRanking(participantsInPool, matchesInPool)
          .map(s => ({
            position: s.rank,
            participant_id: s.participant.id,
            ippons_scored: s.ip,
            ippons_conceded: s.ic,
            keikokus_scored: s.kp,
            keikokus_conceded: s.kc,
            matches_played: s.mj,
            matches_won: s.mg,
            matches_drawn: s.mn,
            matches_lost: s.mp,
            total_points: s.points,
          }));
      } else { // pour le type tableau
        // ni participants, ni ranking si pas une poule
        poule.participants = [];
        poule.ranking = [];
      }
    });


    // 6) on déclenche le teleechargement JSON
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${tournament.value.name} - ${formattedDate}.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);

    toast.init({ message: "Export réalisé avec succés.", color: "success", position: 'top-center' });

  } catch (err) {
    console.error("Échec de l'export :", err);
    toast.init({ message: `Erreur lors de l'export : ${err.message}`, color: "error", position: 'top-center' });
  }
};

// recup du tournoi via Replicache
const fetchTournament = async () => {
  if (!tournamentId.value) return;
  try {
    tournament.value = await rep.query(async (tx) => {
      return await tx.get(`tournament/${tournamentId.value}`);
    });
  } catch (error) {
    console.error("Erreur lors du chargement du tournoi :", error);
  }
};

// recup des catégories avec les participants
const unsubscribeFunctions = []; // Stocke les abonnements pour les désactiver plus tard

const refreshCategories = async () => {
  if (!tournamentId.value) return;
  try {
    const fetchedCategories = await getCategoriesByTournament(tournamentId.value);

    // desabonner les anciennes écoutes pour éviter des abos multiples
    unsubscribeFunctions.forEach(unsub => unsub());
    unsubscribeFunctions.length = 0;

    // pour chaque catégorie, récupérer ses participants et l ajouter a l'état
    const categoriesWithParticipants = await Promise.all(
      fetchedCategories.map(async (category) => {
        const participants = await getParticipantsByCategory(tournamentId.value, category.id);
        const fullCategory = { ...category, participants };

        // souscrire aux changements de cette caté
        const unsubscribe = rep.subscribe(
          async (tx) => await tx.get(`category/${category.id}`),
          async (updatedCategory) => {
            if (updatedCategory) {
              // maj uniquement la catégorie modif
              categories.value = categories.value.map(cat =>
                cat.id === updatedCategory.id
                  ? { ...updatedCategory, participants }
                  : cat
              );
            }
          }
        );
        unsubscribeFunctions.push(unsubscribe);

        return fullCategory;
      })
    );

    categories.value = categoriesWithParticipants;
  } catch (error) {
    console.error("Erreur lors de la récupération des catégories et des participants :", error);
  }
};


// formattage des catégories
const formattedCategories = computed(() =>
  categories.value.map((category) => {
    // trouve le gagnant s'il y en a un
    const winner = category.participants?.find(p => p.id === category.idWinner);

    return {
      ...category,
      name: category.name,
      icon: category.typeId === 1 ? "grid_view" : "bar_chart",
      genre: getGenderLabel(category.genderId),
      type: getTypeLabel(category.typeId),
      ageCategories: getAgeCategories(category.ageCategoryIds),
      gradeRange: getGradeRange(category.minGradeId, category.maxGradeId),
      participantCount: category.participants ? category.participants.length : 0,
      status: category.idWinner ? "Terminé" : "En cours",
      winnerName: winner ? winner?.firstName + ' ' + winner?.lastName : null // nom du gagnant
    };
  })
);

// indique si TOUTES les catégories sont terminées
const allCategoriesFinished = computed(() =>
  formattedCategories.value.every(cat => cat.status === 'Terminé')
);

// libellé du genre
const getGenderLabel = (genreId) => {
  const gender = genders.find((g) => g.id === String(genreId));
  return gender ? gender.nom : "Inconnu";
};

// liibellé du type de tournoi
const getTypeLabel = (typeId) => {
  const type = categoriesTypes.find((t) => t.id === String(typeId));
  return type ? type.nom : "Inconnu";
};

// tranche d'âge
const getAgeCategories = (ageCategoryIds) => {
  if (!ageCategoryIds || ageCategoryIds.length === 0) return "Non défini";
  return ageCategoryIds.map((id) => {
    const ageCat = categoriesAge.find((a) => a.id === String(id));
    return ageCat ? `${ageCat.nom} (${ageCat.ageMin}-${ageCat.ageMax} ans)` : "Inconnu";
  }).join(", ");
};

// grades min et max
const getGradeRange = (minGradeId, maxGradeId) => {
  const minGrade = grades.find((g) => g.id === String(minGradeId));
  const maxGrade = grades.find((g) => g.id === String(maxGradeId));
  return minGrade && maxGrade ? `${minGrade.nom} → ${maxGrade.nom}` : "Non défini";
};

// retour à l'accueil
const goToHomePage = () => {
  router.push("/home-page");
};

// chargement des données au montage
onMounted(async () => {
  await fetchTournament();
  await refreshCategories();
});
</script>

<style scoped>
.tournament-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #f9f9f9;
}

/* hEADER */
.header {
  display: flex;
  align-items: center;
  padding: 16px 24px;
  background: #ffffff;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.category-name {
  font-size: 20px;
}

.home-button {
  margin-right: 30px;
}

.page-title {
  font-size: 1.8rem;
  font-weight: bold;
  color: #0c2432;
  flex: 1;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toggle-sidebar {
  margin-left: auto;
}

.content {
  display: flex;
  flex: 1;
}

/* sidebar */
.category-sidebar {
  width: 280px;
  min-width: 280px;
  background: #ffffff;
  border-right: 1px solid #e0e0e0;
  padding: 16px;
  height: 90vh;
  overflow: auto;
}

.sidebar-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.2rem;
  font-weight: bold;
  color: #0c2432;
  margin-bottom: 16px;
}

/* liste des catégories */
.category-item {
  background: #ffffff;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 12px;
}

.category-meta {
  display: flex;
  justify-content: space-between;
  margin: 8px 0;
}

.category-winner {
  font-size: 1rem;
  font-weight: bold;
  color: #0c2432;
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 5px;
}

.winner-icon {
  color: gold;
  font-size: 1.2rem;
}

.category-type {
  font-size: 0.85rem;
}

.category-grade {
  padding-bottom: 10px;
}

/* style du nombre de participants */
.participant-count {
  font-size: 0.9rem;
  font-weight: normal;
  text-align: right;
  color: #a0a0a0;
}

/* Style du statut */
.category-status {
  display: inline-block;
  font-size: 1rem;
  font-weight: bold;
  padding: 4px 8px;
  border-radius: 8px;
  text-align: center;
  margin: 2px;
  width: 100%;
}

.ongoing {
  background-color: #ffcc00;
  color: #000;
}

.finished {
  background-color: #28a745;
  color: white;
}

/* section principale */
.category-manage-container {
  flex-grow: 1;
  min-width: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.category-item {
  background: #ffffff;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 12px;
  cursor: pointer;
  transition: background 0.3s ease-in-out;
}

.category-item:hover {
  background: #f0f0f0;
}

.category-item.active {
  background: #0c2432;
  color: white;
  font-weight: bold;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
}

.category-item.active .category-name,
.category-item.active .category-meta,
.category-item.active .category-grade,
.category-item.active .category-age .category-item.active .participant-count,
.category-item.active .category-winner {
  color: white !important;
}

.category-age {
  margin-bottom: 10px;
}

.category-item.active .category-type {
  background: white;
  color: #0c2432;
}
</style>
