<template>
  <div class="q-pa-md">
    <div class="text-subtitle1 q-mb-md">
      Importation de données JSON pour votre club
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
          Ce module vous permet d'importer des données au format JSON pour votre club. 
          Les données importées seront automatiquement converties et insérées dans la base de données.
        </p>
        <p class="text-weight-bold">
          Formats de données supportés :
        </p>
        <ul>
          <li>
            <span class="text-weight-bold">Tournois</span> - Historique des tournois, participants, résultats
          </li>
          <li>
            <span class="text-weight-bold">Membres</span> - Ajout en masse de nouveaux membres
          </li>
          <li>
            <span class="text-weight-bold">Matchs</span> - Historique des matchs et résultats
          </li>
        </ul>
        <p class="text-weight-bold">
          Structure JSON requise :
        </p>
        <pre class="bg-grey-2 q-pa-sm">{{ exampleJson }}</pre>
      </q-card-section>
    </q-card>

    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-md-4">
        <q-select
          v-model="importType"
          :options="importTypeOptions"
          label="Type de données à importer *"
          outlined
          dense
          emit-value
          map-options
        />
      </div>
      <div class="col-12 col-md-8">
        <q-file
          v-model="selectedFile"
          label="Sélectionner un fichier JSON *"
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
          <div v-if="importType === 'tournaments'">
            <div class="text-h6">Tournoi : {{ getTournamentData().name }}</div>
            <div>Date : {{ formatDate(getTournamentData().date) }}</div>
            <div>Nombre de participants : {{ getTournamentData().participants?.length || 0 }}</div>
            <div>Nombre de matchs : {{ getTournamentData().matches?.length || 0 }}</div>
          </div>
          <div v-else-if="importType === 'members'">
            <div class="text-h6">Importation de membres</div>
            <div>Nombre de membres à importer : {{ getMembersData().members?.length || 0 }}</div>
          </div>
          <div v-else-if="importType === 'matches'">
            <div class="text-h6">Historique des matchs</div>
            <div>Nombre de matchs à importer : {{ getMatchesData().matches?.length || 0 }}</div>
          </div>
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
          <p>Les données ont été importées avec succès.</p>
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
import { ref, computed } from 'vue';
import { useQuasar } from 'quasar';

// Types
interface ImportSummary {
  [key: string]: number;
}

// Définir les types spécifiques pour chaque format d'importation
interface TournamentData {
  name: string;
  date: string;
  location?: string;
  participants?: Array<{id: number, category: string}>;
  matches?: Array<{id_users_white: number, id_users_red: number, id_winner?: number}>;
}

interface MembersData {
  members: Array<{
    first_name: string;
    last_name: string;
    email: string;
    birth_date: string;
    id_gender: number;
    weight?: number;
    id_grade?: number;
  }>;
}

interface MatchesData {
  matches: Array<{
    date: string;
    id_users_white: number;
    id_users_red: number;
    id_winner?: number;
    id_tournament: number;
    ippon_white?: number;
    ippon_red?: number;
  }>;
}

// Type union pour les données d'importation
type ImportData = TournamentData | MembersData | MatchesData;

// Props
const props = defineProps<{
  clubId?: number | null;
}>();

// Composables
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const $q = useQuasar();

// État
const importType = ref<string>('tournaments');
const selectedFile = ref<File | null>(null);
const parsedData = ref<ImportData | null>(null);
const isImporting = ref(false);
const errorMessage = ref('');
const showSuccessDialog = ref(false);
const importSummary = ref<ImportSummary>({});

// Options pour le type d'importation
const importTypeOptions = [
  { label: 'Tournois', value: 'tournaments' },
  { label: 'Membres', value: 'members' },
  { label: 'Matchs', value: 'matches' }
];

// Helper functions pour l'accès typé aux données
function getTournamentData(): TournamentData {
  return parsedData.value as TournamentData;
}

function getMembersData(): MembersData {
  return parsedData.value as MembersData;
}

function getMatchesData(): MatchesData {
  return parsedData.value as MatchesData;
}

// Exemples de structure JSON pour chaque type d'importation
const exampleJson = computed(() => {
  if (importType.value === 'tournaments') {
    return JSON.stringify({
      name: "Nom du tournoi",
      date: "2023-05-15",
      location: "Paris",
      participants: [
        { id: 123, category: "Senior" }
      ],
      matches: [
        { id_users_white: 123, id_users_red: 456, id_winner: 123 }
      ]
    }, null, 2);
  } else if (importType.value === 'members') {
    return JSON.stringify({
      members: [
        {
          first_name: "Jean",
          last_name: "Dupont",
          email: "jean.dupont@example.com",
          birth_date: "1990-01-15",
          id_gender: 1,
          weight: 75,
          id_grade: 3
        }
      ]
    }, null, 2);
  } else if (importType.value === 'matches') {
    return JSON.stringify({
      matches: [
        {
          date: "2023-05-15",
          id_users_white: 123,
          id_users_red: 456,
          id_winner: 123,
          id_tournament: 789,
          ippon_white: 1,
          ippon_red: 0
        }
      ]
    }, null, 2);
  }
  return '';
});

// Fonctions d'utilitaires
function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR');
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
    
    // Valider les données selon le type d'importation
    if (!validateData(data)) {
      selectedFile.value = null;
      return;
    }
    
    parsedData.value = data;
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
  if (importType.value === 'tournaments') {
    // Type guard pour TournamentData
    const tournamentData = data as TournamentData;
    
    if (!tournamentData.name || !tournamentData.date) {
      errorMessage.value = 'Le fichier JSON doit contenir au moins les champs "name" et "date" pour un tournoi.';
      return false;
    }
    
    if (!Array.isArray(tournamentData.participants) || !Array.isArray(tournamentData.matches)) {
      errorMessage.value = 'Le fichier JSON doit contenir les tableaux "participants" et "matches".';
      return false;
    }
  } 
  else if (importType.value === 'members') {
    // Type guard pour MembersData
    const membersData = data as MembersData;
    
    if (!Array.isArray(membersData.members) || membersData.members.length === 0) {
      errorMessage.value = 'Le fichier JSON doit contenir un tableau "members" non vide.';
      return false;
    }
    
    // Vérifier que chaque membre a les champs requis
    const requiredFields = ['first_name', 'last_name', 'email', 'birth_date'];
    for (const member of membersData.members) {
      for (const field of requiredFields) {
        if (!member[field as keyof typeof member]) {
          errorMessage.value = `Le champ "${field}" est manquant pour au moins un membre.`;
          return false;
        }
      }
    }
  } 
  else if (importType.value === 'matches') {
    // Type guard pour MatchesData
    const matchesData = data as MatchesData;
    
    if (!Array.isArray(matchesData.matches) || matchesData.matches.length === 0) {
      errorMessage.value = 'Le fichier JSON doit contenir un tableau "matches" non vide.';
      return false;
    }
    
    // Vérifier que chaque match a les champs requis
    const requiredFields = ['id_users_white', 'id_users_red', 'date'];
    for (const match of matchesData.matches) {
      for (const field of requiredFields) {
        if (!match[field as keyof typeof match]) {
          errorMessage.value = `Le champ "${field}" est manquant pour au moins un match.`;
          return false;
        }
      }
    }
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
    // Préparer les données avec l'ID du club
    const dataToSend = {
      ...parsedData.value,
      club_id: props.clubId
    };

    // Appel API pour importer les données
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const endpoint = `/imports/${importType.value}`;
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(dataToSend)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
    }

    const result = await response.json();
    console.log('Résultat de l\'importation:', result);

    // Afficher la dialog de succès avec le résumé
    importSummary.value = result.summary || {};
    showSuccessDialog.value = true;

    // Réinitialiser le formulaire
    selectedFile.value = null;
    parsedData.value = null;
  } catch (err) {
    console.error('Erreur lors de l\'importation:', err);
    errorMessage.value = err instanceof Error ? err.message : 'Erreur lors de l\'importation des données.';
  } finally {
    isImporting.value = false;
  }
}
</script>