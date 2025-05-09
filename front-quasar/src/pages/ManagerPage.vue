<template>
  <q-page class="q-pa-lg">
    <div class="text-h4 q-mb-lg">Espace Manager</div>
    
    <div v-if="isLoadingUser">
      <q-spinner size="50px" color="primary" />
      <span class="q-ml-md">Chargement des données...</span>
    </div>
    
    <div v-else-if="!userStore.user || userStore.user.id_role !== 2">
      <q-banner class="bg-negative text-white">
        <template v-slot:avatar>
          <q-icon name="error" />
        </template>
        Accès restreint aux managers de club
      </q-banner>
      <p class="q-mt-md">Vous serez redirigé vers la page d'accueil dans quelques instants.</p>
    </div>
    
    <div v-else>
      <!-- Contenu réel de la page pour les managers -->
      <q-tabs
        v-model="activeTab"
        dense
        class="text-primary q-mb-md"
        active-color="primary"
        indicator-color="primary"
        align="justify"
      >
        <q-tab name="members" label="Membres du club" icon="people" />
        <q-tab name="club-info" label="Informations du club" icon="business" />
        <q-tab name="import" label="Importation de données" icon="upload_file" />
      </q-tabs>

      <q-separator />
      
      <!-- Message d'erreur global -->
      <q-banner v-if="errorMessage" class="bg-negative text-white q-my-md">
        <template v-slot:avatar>
          <q-icon name="error" />
        </template>
        {{ errorMessage }}
      </q-banner>

      <!-- Contenu des onglets -->
      <q-tab-panels v-model="activeTab" animated>
        <!-- Onglet des membres du club -->
        <q-tab-panel name="members">
          <template v-if="isLoading">
            <div class="text-center q-pa-md">
              <q-spinner size="50px" color="primary" class="q-mb-md" />
              <p>Chargement des membres...</p>
            </div>
          </template>
          <template v-else-if="!userClub">
            <div class="text-center q-pa-xl">
              <q-icon name="error_outline" size="50px" color="negative" class="q-mb-md" />
              <p class="text-h6">Vous n'êtes pas associé à un club</p>
              <p>Contactez un administrateur pour vous assigner à un club.</p>
            </div>
          </template>
          <template v-else>
            <div class="row items-center q-mb-md">
              <h2 class="text-h5 q-my-none">Membres de {{ userClub.name }}</h2>
              <q-space />
              <q-chip color="primary" text-color="white" class="q-ml-sm">
                Total : {{ filteredMembers.length }}
              </q-chip>
              <q-chip color="purple" text-color="white">
                Admins : {{ adminCount }}
              </q-chip>
              <q-chip color="blue" text-color="white">
                Managers : {{ managerCount }}
              </q-chip>
              <q-chip color="green" text-color="white">
                Joueurs : {{ playerCount }}
              </q-chip>
            </div>

            <!-- Recherche et filtres -->
            <div class="row q-col-gutter-md q-mb-md">
              <div class="col-12 col-md-6">
                <q-input v-model="searchText" outlined dense label="Rechercher par nom" clearable>
                  <template v-slot:append>
                    <q-icon name="search" />
                  </template>
                </q-input>
              </div>
              <div class="col-12 col-md-2">
                <q-select v-model="memberRoleFilter" :options="roleOptions" outlined dense label="Rôle" emit-value 
                  map-options clearable />
              </div>
              <div class="col-12 col-md-2">
                <q-select v-model="memberStatusFilter" :options="statusOptions" outlined dense label="Statut" emit-value 
                  map-options clearable />
              </div>
              <div class="col-12 col-md-2">
                <q-select v-model="memberGradeFilter" :options="gradeOptions" outlined dense label="Grade" emit-value 
                  map-options clearable />
              </div>
            </div>

            <!-- Tableau des membres -->
            <q-table
              :rows="filteredMembers"
              :columns="memberColumns"
              row-key="id"
              :loading="isLoading"
              bordered
              flat
              :pagination-label="paginationLabel"
              :rows-per-page-options="[10, 15, 20, 0]"
            >
              <template v-slot:body="props">
                <q-tr :props="props" :class="!props.row.is_active ? 'bg-grey-2' : ''">
                  <q-td key="id" :props="props">{{ props.row.id }}</q-td>
                  <q-td key="name" :props="props">
                    <div class="row items-center">
                      <q-avatar size="28px" class="q-mr-sm">
                        <q-img v-if="props.row.avatar_seed" :src="getAvatarUrl(props.row.avatar_seed)" />
                        <q-icon v-else name="person" size="28px" color="grey-7" />
                      </q-avatar>
                      {{ props.row.first_name }} {{ props.row.last_name }}
                    </div>
                  </q-td>
                  <q-td key="email" :props="props">{{ props.row.email }}</q-td>
                  <q-td key="info" :props="props">
                    <div class="row items-center q-gutter-x-sm">
                      <q-chip dense outline size="sm" icon="event">
                        {{ formatDate(props.row.birth_date) }}
                      </q-chip>
                      <q-chip v-if="props.row.weight" dense outline size="sm" icon="fitness_center">
                        {{ props.row.weight }} kg
                      </q-chip>
                      <q-chip dense size="sm" icon="flag">
                        {{ props.row.nationality }}
                      </q-chip>
                    </div>
                  </q-td>
                  <q-td key="role" :props="props">
                    <q-badge :color="getRoleColor(props.row.id_role)">
                      {{ getRoleName(props.row.id_role) }}
                    </q-badge>
                  </q-td>
                  <q-td key="grade" :props="props">
                    <q-badge color="orange">
                      {{ props.row.grade_name || getGradeName(props.row.id_grade) || '—' }}
                    </q-badge>
                  </q-td>
                  <q-td key="status" :props="props">
                    <q-badge :color="props.row.is_active ? 'positive' : 'negative'">
                      {{ props.row.is_active ? 'Actif' : 'Inactif' }}
                    </q-badge>
                  </q-td>
                  <q-td key="actions" :props="props" class="q-gutter-sm">
                    <div class="row q-gutter-xs justify-center">
                      <q-btn flat dense round icon="visibility" color="primary" @click="viewMemberDetails(props.row)">
                        <q-tooltip>Voir détails</q-tooltip>
                      </q-btn>
                      <q-btn flat dense round icon="edit" color="info" @click="openMemberEditDialog(props.row)">
                        <q-tooltip>Modifier</q-tooltip>
                      </q-btn>
                    </div>
                  </q-td>
                </q-tr>
              </template>

              <template v-slot:no-data>
                <div class="full-width row flex-center text-grey q-gutter-sm q-pa-lg">
                  <q-icon size="2em" name="sentiment_dissatisfied" />
                  <span>Aucun membre trouvé</span>
                </div>
              </template>
            </q-table>
          </template>
        </q-tab-panel>

        <!-- Onglet des informations du club -->
        <q-tab-panel name="club-info">
          <template v-if="isLoading">
            <div class="text-center q-pa-md">
              <q-spinner size="50px" color="primary" class="q-mb-md" />
              <p>Chargement des informations du club...</p>
            </div>
          </template>
          <template v-else-if="!userClub">
            <div class="text-center q-pa-xl">
              <q-icon name="error_outline" size="50px" color="negative" class="q-mb-md" />
              <p class="text-h6">Vous n'êtes pas associé à un club</p>
              <p>Contactez un administrateur pour vous assigner à un club.</p>
            </div>
          </template>
          <template v-else>
            <h2 class="text-h5">Informations du club</h2>
            <div class="q-pa-md">
              <club-info-editor :club="userClub" @club-updated="loadUserClub" />
            </div>
          </template>
        </q-tab-panel>

        <!-- Onglet d'importation -->
        <q-tab-panel name="import">
          <h2 class="text-h5">Importation de données</h2>
          <div class="q-pa-md">
            <json-importer :club-id="userClub?.id ?? null" />
          </div>
        </q-tab-panel>
      </q-tab-panels>
    </div>
    
    <!-- Dialogue de détails du membre -->
    <q-dialog v-model="showMemberDetailsDialog">
      <q-card style="min-width: 350px; max-width: 80vw;">
        <q-card-section class="bg-primary text-white">
          <div class="text-h6">Détails du membre</div>
          <q-btn icon="close" flat round dense v-close-popup class="absolute-right" />
        </q-card-section>

        <q-card-section v-if="selectedMember">
          <div class="row justify-center q-mb-md">
            <q-avatar size="80px">
              <q-img :src="getAvatarUrl(selectedMember.avatar_seed || 'default')" />
            </q-avatar>
          </div>

          <q-list bordered separator>
            <q-item>
              <q-item-section>
                <q-item-label caption>ID</q-item-label>
                <q-item-label>{{ selectedMember.id }}</q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section>
                <q-item-label caption>Nom complet</q-item-label>
                <q-item-label>{{ selectedMember.first_name }} {{ selectedMember.last_name }}</q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section>
                <q-item-label caption>Email</q-item-label>
                <q-item-label>{{ selectedMember.email }}</q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section>
                <q-item-label caption>Téléphone</q-item-label>
                <q-item-label>{{ selectedMember.phone || '—' }}</q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section>
                <q-item-label caption>Date de naissance</q-item-label>
                <q-item-label>{{ formatDate(selectedMember.birth_date) }}</q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section>
                <q-item-label caption>Genre</q-item-label>
                <q-item-label>
                  {{genderOptions.find(g => g.value === selectedMember?.id_gender)?.label || '—'}}
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section>
                <q-item-label caption>Poids</q-item-label>
                <q-item-label>{{ selectedMember.weight ? selectedMember.weight + " kg" : '—' }}</q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section>
                <q-item-label caption>Nationalité</q-item-label>
                <q-item-label>{{ selectedMember.nationality || '—' }}</q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section>
                <q-item-label caption>Rôle</q-item-label>
                <q-item-label>
                  <q-badge :color="getRoleColor(selectedMember.id_role)">
                    {{ getRoleName(selectedMember.id_role) }}
                  </q-badge>
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section>
                <q-item-label caption>Club</q-item-label>
                <q-item-label>{{ selectedMember.club_name || '—' }}</q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section>
                <q-item-label caption>Grade</q-item-label>
                <q-item-label>{{ selectedMember.grade_name || getGradeName(selectedMember.id_grade) || '—' }}</q-item-label>
              </q-item-section>
            </q-item>

            <q-item v-if="selectedMember.tournament_name">
              <q-item-section>
                <q-item-label caption>Tournoi en attente</q-item-label>
                <q-item-label>{{ selectedMember.tournament_name }}</q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section>
                <q-item-label caption>Statut</q-item-label>
                <q-item-label>
                  <q-badge :color="selectedMember.is_active ? 'positive' : 'negative'">
                    {{ selectedMember.is_active ? 'Actif' : 'Inactif' }}
                  </q-badge>
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section>
                <q-item-label caption>Date de création</q-item-label>
                <q-item-label>{{ formatCreatedDate(selectedMember.created_at) }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Fermer" color="primary" v-close-popup />
          <q-btn flat label="Modifier" color="secondary"
            @click="selectedMember && openMemberEditDialog(selectedMember); showMemberDetailsDialog = false" />
        </q-card-actions>
      </q-card>
    </q-dialog>
    
    <!-- Dialogue d'édition de membre -->
    <q-dialog v-model="showMemberEditDialog">
      <q-card style="width: 700px; max-width: 90vw;">
        <q-card-section class="bg-primary text-white">
          <div class="text-h6">Modifier les informations du membre</div>
          <q-btn icon="close" flat round dense v-close-popup class="absolute-right" />
        </q-card-section>

        <q-card-section class="q-pa-md">
          <q-form @submit.prevent="saveMember" class="q-gutter-md">
            <!-- Informations personnelles -->
            <div class="q-mb-md">
              <div class="text-subtitle1 q-mb-sm">Informations personnelles</div>
              <div class="row q-col-gutter-md">
                <div class="col-12 col-md-6">
                  <q-input v-model="editingMember.first_name" label="Prénom *" outlined dense
                    :rules="[val => !!val || 'Le prénom est requis']" />
                </div>
                <div class="col-12 col-md-6">
                  <q-input v-model="editingMember.last_name" label="Nom *" outlined dense
                    :rules="[val => !!val || 'Le nom est requis']" />
                </div>
              </div>

              <div class="row q-col-gutter-md q-mt-sm">
                <div class="col-12 col-md-6">
                  <q-input v-model="editingMember.email" label="Email *" type="email" outlined dense :rules="[
                    val => !!val || 'L\'email est requis',
                    val => /^[^@]+@[^@]+\.[^@]+$/.test(val) || 'Format d\'email invalide'
                  ]" />
                </div>
                <div class="col-12 col-md-6">
                  <q-input v-model="editingMember.phone" label="Téléphone" outlined dense />
                </div>
              </div>

              <div class="row q-col-gutter-md q-mt-sm">
                <div class="col-12 col-md-6">
                  <q-input v-model="editingMember.birth_date" label="Date de naissance" type="date" outlined dense />
                </div>
                <div class="col-12 col-md-6">
                  <q-select v-model="editingMember.id_gender" :options="genderOptions" label="Genre *" outlined dense
                    emit-value map-options menu-self="top middle" menu-anchor="bottom middle">
                    <template v-slot:no-option>
                      <q-item>
                        <q-item-section class="text-grey">
                          Aucun genre disponible
                        </q-item-section>
                      </q-item>
                    </template>
                  </q-select>
                </div>
              </div>
            </div>

            <q-separator spaced />

            <!-- Informations sportives -->
            <div class="q-mb-md">
              <div class="text-subtitle1 q-mb-sm">Informations sportives</div>
              <div class="row q-col-gutter-md">
                <div class="col-12 col-md-6">
                  <q-input v-model.number="editingMember.weight" label="Poids (kg)" type="number" outlined dense min="30"
                    max="200" />
                </div>
                <div class="col-12 col-md-6">
                  <q-input v-model="editingMember.nationality" label="Nationalité" outlined dense />
                </div>
              </div>

              <div class="row q-col-gutter-md q-mt-sm">
                <div class="col-12 col-md-6">
                  <q-select v-model="editingMember.id_grade" :options="gradeOptions" label="Grade" outlined dense emit-value
                    map-options clearable menu-self="top middle" menu-anchor="bottom middle">
                    <template v-slot:no-option>
                      <q-item>
                        <q-item-section class="text-grey">
                          Aucun grade disponible
                        </q-item-section>
                      </q-item>
                    </template>
                  </q-select>
                </div>
                <div class="col-12 col-md-6">
                  <q-select v-model="editingMember.id_role" :options="roleOptions" label="Rôle" outlined dense emit-value
                    map-options menu-self="top middle" menu-anchor="bottom middle">
                    <template v-slot:selected-item="{ opt }">
                      <q-badge :color="getRoleColor(opt.value)">
                        {{ opt.label }}
                      </q-badge>
                    </template>
                  </q-select>
                </div>
              </div>
            </div>

            <div class="row justify-end q-mt-lg">
              <q-btn flat label="Annuler" color="grey-7" v-close-popup class="q-mr-sm" />
              <q-btn unelevated type="submit" label="Enregistrer" color="primary" :loading="isSaving" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/user';
import ClubInfoEditor from '../components/ClubInfoEditor.vue';
import JsonImporter from '../components/JsonImporter.vue';

// Types
interface RawUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  birth_date?: string;
  id_role?: number;
  id_gender?: number;
  weight?: number | null;
  nationality?: string;
  id_club?: number | null;
  id_tournament_waiting?: number | null;
  is_active: boolean | number | string;
  avatar_seed?: string | null;
  created_at?: string;
  id_grade?: number | null;
  grade_name?: string;
  club_name?: string;
}

interface RawGrade {
  id: number;
  name: string;
}

// Interfaces
interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  birth_date: string;
  id_role: number;
  id_gender: number;
  weight: number | null;
  nationality: string;
  id_club: number | null;
  club_name?: string | null;
  id_grade: number | null;
  grade_name?: string | null;
  id_tournament_waiting: number | null;
  tournament_name?: string | null;
  is_active: boolean;
  avatar_seed: string | null;
  created_at: string;
}

interface Club {
  id: number;
  name: string;
  street: string;
  city: string;
  postal_code: string;
  phone: string;
  email: string;
  website?: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

interface EditMemberForm {
  id: number | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  birth_date: string;
  id_gender: number;
  weight: number | null;
  nationality: string;
  id_grade: number | null;
  id_role: number;
  is_active: boolean;
}

// Composables
const $q = useQuasar();
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const router = useRouter();
const userStore = useUserStore();

// État
const isLoadingUser = ref(true);
const clubMembers = ref<User[]>([]);
const userClub = ref<Club | null>(null);
const activeTab = ref('members');
const isLoading = ref(false);
const isSaving = ref(false);
const errorMessage = ref('');
const searchText = ref('');
const memberStatusFilter = ref<boolean | null>(null);
const memberGradeFilter = ref<number | null>(null);
const memberRoleFilter = ref<number | null>(null);
const showMemberDetailsDialog = ref(false);
const showMemberEditDialog = ref(false);
const selectedMember = ref<User | null>(null);

// Options pour les filtres et les formulaires
const genderOptions = [
  { label: 'Homme', value: 1 },
  { label: 'Femme', value: 2 }
];

const statusOptions = [
  { label: 'Actif', value: true },
  { label: 'Inactif', value: false }
];

const roleOptions = computed(() =>
  roles.value.map(r => ({ label: r.name, value: r.id }))
);

// État pour les grades
const grades = ref<{id: number, name: string}[]>([]);

// Fonction pour récupérer le nom du grade à partir de l'ID
const getGradeName = computed(() => {
  return (gradeId: number | null): string => {
    if (!gradeId) return '—';
    const grade = grades.value.find(g => g.id === gradeId);
    return grade ? grade.name : '—';
  };
});

// Options de grade (extraites dynamiquement)
const gradeOptions = computed(() =>
  grades.value.map(g => ({ label: g.name, value: g.id }))
);

// Compteurs pour les membres par rôle
const adminCount = computed(() => 
  clubMembers.value.filter(member => member.id_role === 1).length
);

const managerCount = computed(() => 
  clubMembers.value.filter(member => member.id_role === 2).length
);

const playerCount = computed(() => 
  clubMembers.value.filter(member => member.id_role === 3).length
);

// Utilisateur à éditer
const editingMember = reactive<EditMemberForm>({
  id: null,
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  birth_date: '',
  id_gender: 1,
  weight: null,
  nationality: 'Française',
  id_grade: null,
  id_role: 3,
  is_active: true
});

// Fonction pour récupérer le nom du rôle à partir de l'ID
const getRoleName = computed(() => {
  return (roleId: number): string => {
    if (!roleId) return '—';
    const role = roles.value.find(r => r.id === roleId);
    return role ? role.name : `Rôle #${roleId}`;
  };
});

// Fonction pour obtenir la couleur du rôle
function getRoleColor(roleId: number): string {
  const colors: Record<number, string> = { 
    1: 'purple', 
    2: 'blue', 
    3: 'green' 
  };
  return colors[roleId] || 'grey';
}

const roles = ref<{id: number, name: string}[]>([
  { id: 1, name: 'Admin' },
  { id: 2, name: 'Manager' },
  { id: 3, name: 'Joueur' }
]);

// Colonnes du tableau des membres
const memberColumns = [
  { name: 'id', label: 'ID', field: 'id', sortable: true, align: 'left' as const },
  { name: 'name', label: 'Nom', field: (row: User) => `${row.first_name} ${row.last_name}`, sortable: true, align: 'left' as const },
  { name: 'email', label: 'Email', field: 'email', sortable: true, align: 'left' as const },
  { name: 'info', label: 'Informations', field: 'info', sortable: false, align: 'left' as const },
  { name: 'role', label: 'Rôle', field: 'id_role', sortable: true, align: 'center' as const },
  { name: 'grade', label: 'Grade', field: 'id_grade', sortable: true, align: 'center' as const },
  { name: 'status', label: 'Statut', field: 'is_active', sortable: true, align: 'center' as const },
  { name: 'actions', label: 'Actions', field: 'actions', sortable: false, align: 'center' as const }
];

// Filtres calculés pour les membres
const filteredMembers = computed(() => {
  return clubMembers.value.filter(member => {
    // Filtre par texte (nom, email)
    const textMatch = !searchText.value ||
      member.first_name.toLowerCase().includes(searchText.value.toLowerCase()) ||
      member.last_name.toLowerCase().includes(searchText.value.toLowerCase()) ||
      member.email.toLowerCase().includes(searchText.value.toLowerCase());

    // Filtre par statut
    const statusMatch = memberStatusFilter.value === null || Boolean(member.is_active) === Boolean(memberStatusFilter.value);

    // Filtre par grade
    const gradeMatch = memberGradeFilter.value === null || member.id_grade === memberGradeFilter.value;
    
    // Filtre par rôle
    const roleMatch = memberRoleFilter.value === null || member.id_role === memberRoleFilter.value;

    return textMatch && statusMatch && gradeMatch && roleMatch;
  });
});

// --- Helpers ---
const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR');
};

const getAvatarUrl = (seed: string): string => {
  return `https://api.dicebear.com/6.x/avataaars/svg?seed=${seed}&size=64`;
};

const paginationLabel = (firstRowIndex: number, endRowIndex: number, totalRowsNumber: number) => {
  return `${firstRowIndex} à ${endRowIndex} sur ${totalRowsNumber}`;
};

const formatCreatedDate = (dateStr?: string): string => {
  if (!dateStr) return '—';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return '—'; // Retourne un tiret si la date est invalide
    }
    return date.toLocaleString('fr-FR');
  } catch (error) {
    console.error('Erreur lors du formatage de la date de création:', error);
    return '—';
  }
};

// --- Fonctions principales ---

// Charge les informations de l'utilisateur et vérifie son club
async function checkUserClub (): Promise<void> {
  isLoadingUser.value = true;
  try {
    /* DEBUG : vérifie l'utilisateur et son id_club */
    console.log('[checkUserClub] user =', userStore.user);

    if (!userStore.user || userStore.user.id_role !== 2) return;
    if (!userStore.user.id_club)                        return;

    await loadUserClub();
  } catch (error) {
    console.error('[checkUserClub] catch →', error);    // DEBUG
    errorMessage.value = 'Erreur lors du chargement…';
  } finally {
    isLoadingUser.value = false;
  }
}

// Charge les informations du club de l'utilisateur
async function loadUserClub (): Promise<void> {
  if (!userStore.user || !userStore.user.id_club) return;

  isLoading.value = true;
  errorMessage.value = '';

  /* DEBUG : construire et afficher l'URL */
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const url     = `${API_URL}/clubs/${userStore.user.id_club}`;
  console.log('[loadUserClub] fetch →', url);

  try {
    const response = await fetch(url, { credentials: 'include' });
    console.log('[loadUserClub] status →', response.status);               // DEBUG

    const rawBody = await response.clone().text();                         // DEBUG
    console.log('[loadUserClub] raw body →', rawBody);                     // DEBUG

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = JSON.parse(rawBody);
    console.log('[loadUserClub] data →', data);                            // DEBUG

    if (!data.club) throw new Error('Format de réponse incorrect');
    userClub.value = data.club;

    await Promise.all([loadClubMembers(), loadGrades()]);
  } catch (err) {
    console.error('[loadUserClub] catch →', err);                          // DEBUG
    errorMessage.value = err instanceof Error ? err.message : String(err);
    userClub.value = null;
  } finally {
    isLoading.value = false;
  }
}

// Charge la liste des membres du club
async function loadClubMembers (): Promise<void> {
  if (!userClub.value) return;

  isLoading.value = true;
  errorMessage.value = '';

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const url     = `${API_URL}/clubs/${userClub.value.id}/members`;
  console.log('[loadClubMembers] fetch →', url);                           // DEBUG

  try {
    const res  = await fetch(url, { credentials: 'include' });
    console.log('[loadClubMembers] status →', res.status);                 // DEBUG

    const raw  = await res.clone().text();                                 // DEBUG
    console.log('[loadClubMembers] raw body →', raw);                      // DEBUG

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const body = JSON.parse(raw);
    clubMembers.value = (body.users ?? []).map((u: RawUser) => ({
      ...u,
      id_grade: u.id_grade || null,
      is_active:
        typeof u.is_active === 'boolean'
          ? u.is_active
          : u.is_active === 1 || u.is_active === 'true'
    })) as User[];
  } catch (err) {
    console.error('[loadClubMembers] catch →', err);                       // DEBUG
    errorMessage.value = err instanceof Error ? err.message : String(err);
  } finally {
    isLoading.value = false;
  }
}

// Charge la liste des grades disponibles
async function loadGrades(): Promise<void> {
  try {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const res = await fetch(`${API_URL}/grades`, { credentials: 'include' });
    
    if (!res.ok) throw new Error(`Erreur HTTP grades: ${res.status}`);
    
    const body = await res.json();
    
    if (!Array.isArray(body.grades)) {
      console.error('Réponse grades inattendue:', body);
      return;
    }

    grades.value = body.grades.map((g: RawGrade) => ({
        id: g.id,
        name: g.name
    }));
  } catch (err) {
    console.error('Erreur lors du chargement des grades:', err);
  }
}

// Fonctions pour gérer les détails d'un membre
function viewMemberDetails(member: User): void {
  selectedMember.value = { ...member };
  showMemberDetailsDialog.value = true;
}

// Fonction pour ouvrir le dialogue d'édition d'un membre
function openMemberEditDialog(member: User): void {
  console.log("Membre à modifier:", JSON.stringify(member, null, 2));
  
  // Réinitialiser le formulaire
  Object.assign(editingMember, {
    id: null,
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    birth_date: '',
    id_gender: 1,
    weight: null,
    nationality: 'Française',
    id_grade: null,
    id_role: 3,
    is_active: true
  });
  
  // Remplir avec les données du membre
  Object.assign(editingMember, {
    id: member.id,
    first_name: member.first_name || '',
    last_name: member.last_name || '',
    email: member.email || '',
    phone: member.phone || '',
    birth_date: member.birth_date ? member.birth_date.split('T')[0] : '',
    id_gender: member.id_gender !== undefined ? Number(member.id_gender) : 1,
    weight: member.weight !== undefined && member.weight !== null ? Number(member.weight) : null,
    nationality: member.nationality || 'Française',
    id_grade: member.id_grade !== undefined && member.id_grade !== null ? Number(member.id_grade) : null,
    id_role: member.id_role !== undefined ? Number(member.id_role) : 3,
    is_active: typeof member.is_active === 'boolean' ? member.is_active : true
  });

  console.log("Formulaire d'édition initialisé:", JSON.stringify(editingMember, null, 2));
  
  showMemberEditDialog.value = true;
}

// Fonction pour sauvegarder les modifications d'un membre
async function saveMember(): Promise<void> {
  isSaving.value = true;
  try {
    // Validation de base
    if (!editingMember.first_name || !editingMember.last_name || !editingMember.email) {
      $q.notify({
        color: 'negative',
        message: 'Veuillez remplir tous les champs obligatoires',
        icon: 'warning'
      });
      isSaving.value = false;
      return;
    }

    // Validation de l'email
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(editingMember.email)) {
      $q.notify({
        color: 'negative',
        message: 'Format d\'email invalide',
        icon: 'warning'
      });
      isSaving.value = false;
      return;
    }

    // Préparer les données pour l'API
    const userData = {
      first_name: editingMember.first_name,
      last_name: editingMember.last_name,
      email: editingMember.email,
      phone: editingMember.phone === '' ? null : editingMember.phone,
      birth_date: editingMember.birth_date || undefined,
      id_gender: editingMember.id_gender,
      weight: editingMember.weight,
      nationality: editingMember.nationality || '',
      id_grade: editingMember.id_grade,
      id_role: editingMember.id_role,
      is_active: editingMember.is_active
    };

    console.log("Données à envoyer à l'API:", userData);

    // Appel API pour mettre à jour l'utilisateur
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const response = await fetch(`${API_URL}/users/${editingMember.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
    }

    // Rafraîchir la liste des membres
    await loadClubMembers();

    // Notification et fermeture de la modale
    $q.notify({
      color: 'positive',
      message: 'Membre mis à jour avec succès',
      icon: 'check_circle'
    });

    showMemberEditDialog.value = false;
  } catch (err) {
    console.error('Erreur lors de la sauvegarde:', err);

    // Gestion des erreurs
    let errorMsg = 'Erreur lors de la sauvegarde';

    if (err instanceof Error) {
      // Gestion des erreurs spécifiques
      if (err.message.includes('email')) {
        errorMsg = 'Cet email est déjà utilisé par un autre compte';
      } else {
        errorMsg = err.message;
      }
    }

    $q.notify({
      color: 'negative',
      message: errorMsg,
      icon: 'error'
    });
  } finally {
    isSaving.value = false;
  }
}

// Fonction principale d'initialisation
async function initialize(): Promise<void> {
  await checkUserClub();
  await loadGrades(); // Si ce n'est pas déjà appelé
}

// --- Lifecycle ---
onMounted(() => {
  initialize();
});
</script>

<style>
/* Augmenter le z-index pour les dialogues/modales */
.q-dialog {
  z-index: 6000 !important;
}

/* Augmenter encore plus le z-index pour les menus */
.q-menu {
  z-index: 7000 !important;
}

/* Pour éviter les problèmes de superposition d'autres éléments */
.q-select__dropdown-icon {
  z-index: 1 !important;
}
</style>