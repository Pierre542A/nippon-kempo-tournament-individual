<template>
  <div class="q-pa-md">
    <div class="text-subtitle1 q-mb-md">
      Importation de données de tournoi JSON
    </div>

    <q-banner v-if="errorMessage" class="bg-negative text-white q-mb-md">
      <template v-slot:avatar>
        <q-icon name="error" />
      </template>
      {{ errorMessage }}
    </q-banner>

    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <div class="text-h6">Instructions</div>
        <p>
          Ce module vous permet d'importer des données de tournoi exportées depuis l'application back-office.
          L'importation inclut:
        </p>
        <ul>
          <li>
            <span class="text-weight-bold">Tournoi</span> - Configuration, date et adresse
          </li>
          <li>
            <span class="text-weight-bold">Participants</span> - Participants avec leurs informations (comparaison avec les utilisateurs existants)
          </li>
          <li>
            <span class="text-weight-bold">Catégories</span> - Catégories du tournoi
          </li>
          <li>
            <span class="text-weight-bold">Matchs</span> - Matchs du tournoi avec les résultats
          </li>
        </ul>
      </q-card-section>
    </q-card>

    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12">
        <q-file
          v-model="selectedFile"
          label="Sélectionner un fichier JSON de tournoi *"
          outlined
          dense
          accept=".json"
          @update:model-value="onFileSelected"
        >
          <template v-slot:prepend>
            <q-icon name="attach_file" />
          </template>
        </q-file>
      </div>
    </div>

    <div v-if="parsedData" class="q-mb-md">
      <div class="text-subtitle1 q-mb-sm">Aperçu des données</div>
      <q-card flat bordered>
        <q-card-section>
          <div class="text-h6">Tournoi : {{ parsedData.tournaments?.[0]?.name || 'Sans nom' }}</div>
          <div>Date : {{ formatDate(parsedData.tournaments?.[0]?.startDate) }}</div>
          <div>Adresse : {{ parsedData.tournaments?.[0]?.address || 'Non spécifiée' }}</div>
          <div>Statut du tournoi : {{ parsedData.tournaments?.[0]?.started ? 'Démarré' : 'Pas encore démarré' }}</div>
          <div>Type : {{ parsedData.tournaments?.[0]?.started ? 'Résultats (tournoi terminé)' : 'Inscriptions (tournoi à venir)' }}</div>
          <div>Catégories : {{ parsedData.categories?.length || 0 }}</div>
          <div>Participants : {{ parsedData.participants?.length || 0 }}</div>
          <div>Matchs : {{ parsedData.matches?.length || 0 }}</div>
          
          <!-- Détails des catégories -->
          <q-expansion-item
            label="Détails des catégories"
            caption="Cliquez pour voir les catégories"
            icon="category"
            class="q-mt-md"
          >
            <q-card>
              <q-card-section>
                <div class="row q-col-gutter-md">
                  <div v-for="(category, index) in parsedData.categories" :key="index" class="col-12 col-md-6">
                    <q-card flat bordered>
                      <q-card-section>
                        <div class="text-h6">{{ category.name }}</div>
                        <div>Genre: {{ getGenderName(category.genderId) }}</div>
                        <div>Type: {{ getTypeName(category.typeId) }}</div>
                        <div>Grades: {{ getGradeRange(category.minGradeId, category.maxGradeId) }}</div>
                      </q-card-section>
                    </q-card>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </q-expansion-item>
          
          <!-- Détails des participants -->
          <q-expansion-item
            label="Détails des participants"
            caption="Cliquez pour voir les participants"
            icon="people"
            class="q-mt-md"
          >
            <q-card>
              <q-card-section>
                <q-table
                  title="Participants"
                  :rows="parsedData.participants"
                  :columns="participantColumns"
                  row-key="id"
                  :pagination="{ rowsPerPage: 10 }"
                  dense
                />
              </q-card-section>
            </q-card>
          </q-expansion-item>
          
          <!-- Détails des matchs -->
          <q-expansion-item
            label="Détails des matchs"
            caption="Cliquez pour voir les matchs"
            icon="sports_kabaddi"
            class="q-mt-md"
          >
            <q-card>
              <q-card-section>
                <q-table
                  title="Matchs"
                  :rows="parsedData.matches || []"
                  :columns="matchColumns"
                  row-key="idMatch"
                  :pagination="{ rowsPerPage: 10 }"
                  dense
                />
              </q-card-section>
            </q-card>
          </q-expansion-item>
        </q-card-section>
      </q-card>
    </div>

    <div class="row justify-end">
      <q-btn
        unelevated
        label="Importer"
        color="primary"
        :loading="isImporting"
        :disable="!parsedData || isImporting"
        @click="importData"
      />
    </div>

    <!-- Dialog de confirmation d'importation réussie -->
    <q-dialog v-model="showSuccessDialog">
      <q-card>
        <q-card-section class="bg-positive text-white">
          <div class="text-h6">Importation réussie</div>
        </q-card-section>

        <q-card-section>
          <p>Les données du tournoi ont été importées avec succès.</p>
          <div v-if="importSummary">
            <div class="text-weight-bold">Résumé :</div>
            <ul>
              <li v-for="(value, key) in importSummary" :key="key">
                {{ key }} : {{ value }}
              </li>
            </ul>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Fermer" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
// Suppression de l'import 'computed' qui n'est pas utilisé
type ImportType = 'results' | 'registration';
const importType = ref<ImportType>('registration');

// Types
interface ImportSummary {
  [key: string]: number | string;
}

// Types pour éviter les erreurs implicites
interface MatchRow {
  idMatch: string;
  idPlayer1: string;
  idPlayer2: string;
  idWinner: string | number;
  ipponsPlayer1: number;
  ipponsPlayer2: number;
  keikokusPlayer1: number;
  keikokusPlayer2: number;
}

// Type pour les objets dans les tableaux
interface Match {
  idMatch: string;
  idMatchType: number;
  idRound: string | null;
  idPool: string | null;
  idPlayer1: string;
  idPlayer2: string;
  idPreviousMatch1: string | null;
  idPreviousMatch2: string | null;
  ipponsPlayer1: number;
  ipponsPlayer2: number;
  keikokusPlayer1: number;
  keikokusPlayer2: number;
  idWinner: string;
  timer: {
    isRunning: boolean;
    currentTime: number;
    additionalTime: number;
  };
  createdAt: string;
}

interface Bracket {
  tournamentId: string;
  id: string;
  categoryId: string;
}

interface PoolManager {
  tournamentId: string;
  id: string;
  categoryId: string;
}

interface Poule {
  tournamentId: string;
  id: string;
  poolManagerId: string;
  label: string;
  qualifyingPositions: number[];
  isComplete: boolean;
  participants: unknown[];
  ranking?: unknown[];
}

interface Round {
  tournamentId: string;
  id: string;
  idBracket: string;
  label: string;
  order: number;
  matches: unknown[];
}

// Type pour les données de tournoi
interface TournamentBackOfficeData {
  metadata: {
    exportedAt: string;
    tournamentId: string;
    status?: string;
  };
  tournaments: Array<{
    id: string;
    name: string;
    address: string;
    startDate: string;
    started?: boolean;
  }>;
  categories: Array<{
    id: string;
    tournamentId: string;
    name: string;
    genderId: number;
    typeId: number;
    ageCategoryIds: number[];
    minGradeId: number;
    maxGradeId: number;
    weightRange?: number[];
    idWinner?: string;
  }>;
  participants: Array<{
    id: string;
    tournamentId: string;
    firstName: string;
    lastName: string;
    birthDate: string;
    clubName: string;
    weight: number;
    nationalityId: number;
    genderId: number;
    gradeId: number;
    email: string;
    categoryId: string;
    isEliminated?: boolean;
  }>;
  matches?: Array<Match>;
  brackets?: Array<Bracket>;
  poolManagers?: Array<PoolManager>;
  poules?: Array<Poule>;
  rounds?: Array<Round>;
}

// Props
const props = defineProps<{
  clubId?: number | null;
}>();

// État
const selectedFile = ref<File | null>(null);
const parsedData = ref<TournamentBackOfficeData | null>(null);
const isImporting = ref(false);
const errorMessage = ref('');
const showSuccessDialog = ref(false);
const importSummary = ref<ImportSummary>({});

// Configuration de la table des participants
const participantColumns = [
  { name: 'firstName', label: 'Prénom', field: 'firstName', sortable: true },
  { name: 'lastName', label: 'Nom', field: 'lastName', sortable: true },
  { name: 'birthDate', label: 'Date de naissance', field: 'birthDate', sortable: true,
    format: (val: string) => formatDate(val) },
  { name: 'clubName', label: 'Club', field: 'clubName', sortable: true },
  { name: 'weight', label: 'Poids', field: 'weight', sortable: true },
  { name: 'email', label: 'Email', field: 'email', sortable: true }
];

// Configuration de la table des matchs
const matchColumns = [
  { name: 'idMatch', label: 'ID Match', field: 'idMatch', sortable: true },
  { 
    name: 'players', 
    label: 'Combattants', 
    field: (row: MatchRow) => row,
    format: (row: MatchRow) => {
      const player1 = parsedData.value?.participants?.find(p => p.id === row.idPlayer1)?.lastName || row.idPlayer1;
      const player2 = parsedData.value?.participants?.find(p => p.id === row.idPlayer2)?.lastName || row.idPlayer2;
      return `${player1} vs ${player2}`;
    },
    sortable: false 
  },
  { 
    name: 'winner', 
    label: 'Vainqueur', 
    field: 'idWinner',
    format: (winner: string | number) => {
      if (winner === -1) return 'Match nul';
      return parsedData.value?.participants?.find(p => p.id === winner)?.lastName || winner || '—';
    },
    sortable: true 
  },
  { 
    name: 'score', 
    label: 'Score (Ippon)', 
    field: (row: MatchRow) => row,
    format: (row: MatchRow) => `${row.ipponsPlayer1} - ${row.ipponsPlayer2}`,
    sortable: false 
  },
  { 
    name: 'penalties', 
    label: 'Pénalités (Keikoku)', 
    field: (row: MatchRow) => row,
    format: (row: MatchRow) => `${row.keikokusPlayer1} - ${row.keikokusPlayer2}`,
    sortable: false 
  }
];

// Fonctions d'utilitaires
function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR');
}

// Fonctions pour obtenir les noms des enums
function getGenderName(genderId: number): string {
  const genders: Record<number, string> = {
    1: 'Masculin',
    2: 'Féminin',
    3: 'Non précisé'
  };
  return genders[genderId] || 'Inconnu';
}

function getTypeName(typeId: number): string {
  const types: Record<number, string> = {
    1: 'Poule',
    2: 'Tableau'
  };
  return types[typeId] || 'Inconnu';
}

function getGradeRange(minGradeId: number, maxGradeId: number): string {
  const grades: Record<number, string> = {
    1: 'Blanche',
    2: 'Blanche-Jaune',
    3: 'Jaune',
    4: 'Jaune-Orange',
    5: 'Orange',
    6: 'Orange-Verte',
    7: 'Verte',
    8: 'Verte-Bleue',
    9: 'Bleue',
    10: 'Bleue-Marron',
    11: 'Marron',
    12: '1ère Dan',
    13: '2ème Dan',
    14: '3ème Dan',
    15: '4ème Dan',
    16: '5ème Dan',
    17: '6ème Dan'
  };
  
  const minGrade = grades[minGradeId] || 'Inconnue';
  const maxGrade = grades[maxGradeId] || 'Inconnue';
  
  return `${minGrade} à ${maxGrade}`;
}

// Méthodes
async function onFileSelected(): Promise<void> {
  if (!selectedFile.value) {
    parsedData.value = null;
    return;
  }

  try {
    // Lire le contenu du fichier
    const fileContent = await readFile(selectedFile.value);
    
    // Parser le JSON
    const data = JSON.parse(fileContent);
    
    // Valider les données selon le format attendu
    if (!validateData(data)) {
      selectedFile.value = null;
      return;
    }
    
    parsedData.value = data;
    
    // Suggérer automatiquement le type d'importation en fonction du contenu
    if (data.tournaments && data.tournaments[0] && data.tournaments[0].started) {
      importType.value = 'results';
    } else {
      importType.value = 'registration';
    }
    
    errorMessage.value = '';
  } catch (err) {
    console.error('Erreur lors de la lecture du fichier:', err);
    errorMessage.value = 'Erreur lors de la lecture du fichier. Vérifiez que le format est JSON valide.';
    parsedData.value = null;
    selectedFile.value = null;
  }
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Erreur de lecture du fichier'));
      }
    };
    reader.onerror = () => {
      reject(reader.error);
    };
    reader.readAsText(file);
  });
}

function validateData(data: unknown): boolean {
  const tournamentData = data as TournamentBackOfficeData;
  
  if (!tournamentData.metadata || !tournamentData.tournaments || !Array.isArray(tournamentData.tournaments)) {
    errorMessage.value = 'Le fichier JSON doit contenir les sections "metadata" et "tournaments".';
    return false;
  }
  
  if (tournamentData.tournaments.length === 0) {
    errorMessage.value = 'Aucun tournoi trouvé dans le fichier.';
    return false;
  }
  
  if (!Array.isArray(tournamentData.participants)) {
    errorMessage.value = 'Le fichier doit contenir une section "participants".';
    return false;
  }
  
  return true;
}

async function importData(): Promise<void> {
  if (!parsedData.value || !props.clubId) {
    errorMessage.value = 'Données invalides ou club non spécifié.';
    return;
  }

  isImporting.value = true;
  errorMessage.value = '';

  try {
    // Préparation des données à envoyer
    const tournament = parsedData.value.tournaments[0];
    
    // Vérifier que le tournoi existe
    if (!tournament) {
      throw new Error("Aucun tournoi trouvé dans les données");
    }
    
    // Préparation des données de tournoi
    const tournamentData = {
      name: tournament.name,
      address: tournament.address || null,
      start_date: new Date(tournament.startDate).toISOString().split('T')[0],
      end_date: new Date(tournament.startDate).toISOString().split('T')[0], 
      status: parsedData.value?.tournaments?.[0]?.started ? 'closed' : 'open', // Statut basé sur les données du JSON
      id_club: props.clubId // Utiliser l'ID du club sélectionné
    };
        
    // Préparation des données de participants
    const participants = parsedData.value.participants.map(p => ({
      first_name: p.firstName,
      last_name: p.lastName,
      birth_date: p.birthDate,
      email: p.email,
      weight: p.weight,
      genderId: p.genderId,
      gradeId: p.gradeId,
      externalId: p.id // C'est l'ID externe qui sera utilisé pour le mappage
    }));
        
    // Préparation des données de catégories
    const categories = parsedData.value.categories.map(c => ({
      name: c.name, 
      minGradeId: c.minGradeId,
      maxGradeId: c.maxGradeId,
      typeId: c.typeId,
      externalId: c.id // Garder l'ID externe pour faire le mapping dans le contrôleur
    }));
    
    // Préparation des données de matchs
    const matches = parsedData.value.matches || [];
    
    // Données à envoyer à l'API
    const dataToSend = {
      tournament: tournamentData,
      participants: participants,
      categories: categories,
      matches: matches,
      importType: parsedData.value?.tournaments?.[0]?.started ? 'results' : 'registration'
    };

    // Appel API pour importer les données
    const API_URL = import.meta.env.VITE_API_URL;
    const completeUrl = `${API_URL}/imports/tournament`;
    
    try {
      const response = await fetch(completeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(dataToSend)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Réponse d\'erreur du serveur:', errorText);
        
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
        } catch {
          throw new Error(`Erreur HTTP ${response.status}: ${errorText || 'Réponse vide'}`);
        }
      }

      const result = await response.json();

      // Afficher la dialog de succès avec le résumé
      importSummary.value = {
        'Tournoi créé': result.tournamentCreated || 0,
        'Tournoi mis à jour': result.tournamentUpdated || 0,
        'Type d\'importation': parsedData.value?.tournaments?.[0]?.started ? 'Résultats' : 'Inscriptions',
        'Statut du tournoi': result.tournamentStatus || (importType.value === 'registration' ? 'Ouvert' : 'Fermé'),
        'Participants traités': participants.length,
        'Participants ajoutés': result.newParticipants || 0,
        'Participants mis à jour': result.updatedParticipants || 0,
        'Catégories créées': result.newCategories || 0,
        'Catégories mises à jour': result.updatedCategories || 0,
        'Matchs importés': result.newMatches || 0
      };
      
      showSuccessDialog.value = true;

      // Réinitialiser le formulaire
      selectedFile.value = null;
      parsedData.value = null;
    } catch (fetchError) {
      console.error('Erreur fetch détaillée:', fetchError);
      throw fetchError;
    }
  } catch (err) {
    console.error('Erreur lors de l\'importation:', err);
    errorMessage.value = err instanceof Error ? err.message : 'Erreur lors de l\'importation des données.';
  } finally {
    isImporting.value = false;
  }
}
</script>