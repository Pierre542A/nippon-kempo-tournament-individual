<template>
  <q-page padding>
    <div class="q-pa-md">
      <h1 class="text-h4 q-mb-md">Gestion des utilisateurs</h1>

      <!-- Bouton de rechargement et compteur -->
      <div class="row items-center q-mb-md">
        <div class="row q-gutter-sm">
          <q-chip v-if="users.length" color="primary" text-color="white">
            Total : {{ users.length }}
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
      </div>

      <!-- Message d'erreur -->
      <q-banner v-if="errorMessage" class="bg-negative text-white q-mb-md">
        <template v-slot:avatar>
          <q-icon name="error" />
        </template>
        {{ errorMessage }}
      </q-banner>

      <!-- Recherche et filtres -->
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-12 col-md-3">
          <q-input v-model="searchText" outlined dense label="Rechercher par nom" clearable>
            <template v-slot:append>
              <q-icon name="search" />
            </template>
          </q-input>
        </div>
        <div class="col-12 col-md-3">
          <q-select v-model="clubFilter" :options="clubOptions" label="Filtrer par club" outlined dense emit-value
            map-options clearable />
        </div>
        <div class="col-12 col-md-3">
          <q-select v-model="roleFilter" :options="roleOptions" outlined dense label="Filtrer par rôle" emit-value
            map-options clearable>
            <template v-slot:selected-item="{ opt }">
              <q-badge :color="getRoleColor(opt.value)">
                {{ opt.label }}
              </q-badge>
            </template>
          </q-select>
        </div>
        <div class="col-12 col-md-3">
          <q-select v-model="statusFilter" :options="statusOptions" outlined dense label="Statut" emit-value map-options
            clearable />
        </div>
      </div>

      <!-- Tableau -->
      <q-table v-if="!isLoading" :rows="filteredUsers" :columns="columns" row-key="id" :loading="isLoading" bordered
        flat :pagination-label="paginationLabel" :rows-per-page-options="[10, 15, 20, 0]">
        <template v-slot:header="props">
          <q-tr :props="props">
            <q-th v-for="col in props.cols" :key="col.name" :props="props">
              {{ col.label }}
            </q-th>
          </q-tr>
        </template>

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
            <q-td key="role" :props="props">
              <q-badge :color="getRoleColor(props.row.id_role)">
                {{ roleLabel(props.row.id_role) }}
              </q-badge>
            </q-td>
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
            <q-td key="status" :props="props">
              <q-badge :color="props.row.is_active ? 'positive' : 'negative'">
                {{ props.row.is_active ? 'Actif' : 'Inactif' }}
              </q-badge>
            </q-td>
            <q-td key="actions" :props="props" class="q-gutter-sm">
              <div class="row q-gutter-xs justify-center">
                <q-btn flat dense round icon="visibility" color="primary" @click="viewDetails(props.row)">
                  <q-tooltip>Voir détails</q-tooltip>
                </q-btn>
                <q-btn flat dense round icon="edit" color="info" @click="openEdit(props.row)">
                  <q-tooltip>Modifier</q-tooltip>
                </q-btn>
                <q-btn flat dense round :icon="props.row.is_active ? 'block' : 'restore'"
                  :color="props.row.is_active ? 'negative' : 'positive'" @click="toggleStatus(props.row)">
                  <q-tooltip>{{ props.row.is_active ? 'Désactiver' : 'Activer' }}</q-tooltip>
                </q-btn>
              </div>
            </q-td>
          </q-tr>
        </template>

        <template v-slot:no-data>
          <div class="full-width row flex-center text-grey q-gutter-sm q-pa-lg">
            <q-icon size="2em" name="sentiment_dissatisfied" />
            <span>
              Aucun utilisateur trouvé
            </span>
          </div>
        </template>
      </q-table>
    </div>

    <!-- Dialogue de détails -->
    <q-dialog v-model="showDetailsDialog">
      <q-card style="min-width: 350px; max-width: 80vw;">
        <q-card-section class="bg-primary text-white">
          <div class="text-h6">Détails de l'utilisateur</div>
          <q-btn icon="close" flat round dense v-close-popup class="absolute-right" />
        </q-card-section>

        <q-card-section v-if="selectedUser">
          <div class="row justify-center q-mb-md">
            <q-avatar size="80px">
              <q-img :src="getAvatarUrl(selectedUser.avatar_seed || 'default')" />
            </q-avatar>
          </div>

          <q-list bordered separator>
            <q-item>
              <q-item-section>
                <q-item-label caption>ID</q-item-label>
                <q-item-label>{{ selectedUser.id }}</q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section>
                <q-item-label caption>Nom complet</q-item-label>
                <q-item-label>{{ selectedUser.first_name }} {{ selectedUser.last_name }}</q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section>
                <q-item-label caption>Email</q-item-label>
                <q-item-label>{{ selectedUser.email }}</q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section>
                <q-item-label caption>Téléphone</q-item-label>
                <q-item-label>{{ selectedUser.phone || '—' }}</q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section>
                <q-item-label caption>Date de naissance</q-item-label>
                <q-item-label>{{ formatDate(selectedUser.birth_date) }}</q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section>
                <q-item-label caption>Rôle</q-item-label>
                <q-item-label>
                  <q-badge :color="getRoleColor(selectedUser.id_role)">
                    {{ roleLabel(selectedUser.id_role) }}
                  </q-badge>
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-item v-if="selectedUser">
              <q-item-section>
                <q-item-label caption>Genre</q-item-label>
                <q-item-label>
                  {{genderOptions.find(g => g.value === selectedUser?.id_gender)?.label || '—'}}
                </q-item-label>
              </q-item-section>
            </q-item>

            <!-- Ajout du poids de manière conditionnelle -->
            <q-item>
              <q-item-section>
                <q-item-label caption>Poids</q-item-label>
                <q-item-label>{{ selectedUser.weight ? selectedUser.weight + " kg" : '—' }}</q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section>
                <q-item-label caption>Nationalité</q-item-label>
                <q-item-label>{{ selectedUser.nationality || '—' }}</q-item-label>
              </q-item-section>
            </q-item>

            <!-- Affichage du club de manière plus robuste -->
            <q-item>
              <q-item-section>
                <q-item-label caption>Club</q-item-label>
                <q-item-label>{{ selectedUser.club_name || '—' }}</q-item-label>
              </q-item-section>
            </q-item>

            <!-- Affichage du grade de manière plus robuste -->
            <q-item>
              <q-item-section>
                <q-item-label caption>Grade</q-item-label>
                <q-item-label>{{ selectedUser.grade_name || getGradeName(selectedUser.id_grade) || '—' }}</q-item-label>
              </q-item-section>
            </q-item>

            <q-item v-if="selectedUser.tournament_name">
              <q-item-section>
                <q-item-label caption>Tournoi en attente</q-item-label>
                <q-item-label>{{ selectedUser.tournament_name }}</q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section>
                <q-item-label caption>Statut</q-item-label>
                <q-item-label>
                  <q-badge :color="selectedUser.is_active ? 'positive' : 'negative'">
                    {{ selectedUser.is_active ? 'Actif' : 'Inactif' }}
                  </q-badge>
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section>
                <q-item-label caption>Date de création</q-item-label>
                <q-item-label>{{ formatCreatedDate(selectedUser.created_at) }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Fermer" color="primary" v-close-popup />
          <q-btn flat label="Modifier" color="secondary"
            @click="selectedUser && openEdit(selectedUser); showDetailsDialog = false" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialogue d'édition -->
    <q-dialog v-model="showEditDialog">
      <q-card style="width: 700px; max-width: 90vw;">
        <q-card-section class="bg-primary text-white">
          <div class="text-h6">{{ editUser.id ? 'Modifier' : 'Ajouter' }} un utilisateur</div>
          <q-btn icon="close" flat round dense v-close-popup class="absolute-right" />
        </q-card-section>

        <q-card-section class="q-pa-md">
          <q-form @submit.prevent="saveUser" class="q-gutter-md">
            <!-- Informations personnelles -->
            <div class="q-mb-md">
              <div class="text-subtitle1 q-mb-sm">Informations personnelles</div>
              <div class="row q-col-gutter-md">
                <div class="col-12 col-md-6">
                  <q-input v-model="editUser.first_name" label="Prénom *" outlined dense
                    :rules="[val => !!val || 'Le prénom est requis']" />
                </div>
                <div class="col-12 col-md-6">
                  <q-input v-model="editUser.last_name" label="Nom *" outlined dense
                    :rules="[val => !!val || 'Le nom est requis']" />
                </div>
              </div>

              <div class="row q-col-gutter-md q-mt-sm">
                <div class="col-12 col-md-6">
                  <q-input v-model="editUser.email" label="Email *" type="email" outlined dense :rules="[
                    val => !!val || 'L\'email est requis',
                    val => /^[^@]+@[^@]+\.[^@]+$/.test(val) || 'Format d\'email invalide'
                  ]" />
                </div>
                <div class="col-12 col-md-6">
                  <q-input v-model="editUser.phone" label="Téléphone" outlined dense />
                </div>
              </div>

              <div class="row q-col-gutter-md q-mt-sm">
                <div class="col-12 col-md-6">
                  <q-input v-model="editUser.birth_date" label="Date de naissance" type="date" outlined dense />
                </div>
                <div class="col-12 col-md-6">
                  <q-select v-model="editUser.id_gender" :options="genderOptions" label="Genre *" outlined dense
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
                  <q-input v-model.number="editUser.weight" label="Poids (kg)" type="number" outlined dense min="30"
                    max="200" />
                </div>
                <div class="col-12 col-md-6">
                  <q-input v-model="editUser.nationality" label="Nationalité" outlined dense />
                </div>
              </div>

              <div class="row q-col-gutter-md q-mt-sm">
                <div class="col-12 col-md-4">
                  <q-select v-model="editUser.id_role" :options="roleOptions" label="Rôle *" outlined dense emit-value
                    map-options menu-self="top middle" menu-anchor="bottom middle">
                    <template v-slot:selected-item="{ opt }">
                      <q-badge :color="getRoleColor(opt.value)">
                        {{ opt.label }}
                      </q-badge>
                    </template>
                    <template v-slot:no-option>
                      <q-item>
                        <q-item-section class="text-grey">
                          Aucun rôle disponible
                        </q-item-section>
                      </q-item>
                    </template>
                  </q-select>
                </div>
                <div class="col-12 col-md-4">
                  <q-select v-model="editUser.id_club" :options="clubOptions" label="Club" outlined dense emit-value
                    map-options clearable menu-self="top middle" menu-anchor="bottom middle">
                    <template v-slot:no-option>
                      <q-item>
                        <q-item-section class="text-grey">
                          Aucun club disponible
                        </q-item-section>
                      </q-item>
                    </template>
                  </q-select>
                </div>
                <div class="col-12 col-md-4">
                  <q-select v-model="editUser.id_grade" :options="gradeOptions" label="Grade" outlined dense emit-value
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
              </div>
            </div>

            <q-separator spaced />

            <!-- Informations de compte -->
            <div class="q-mb-md">
              <div class="text-subtitle1 q-mb-sm">Informations de compte</div>
              <div class="row q-col-gutter-md">
                <div class="col-12 col-md-6">
                  <q-input v-model="editUser.avatar_seed" label="Avatar Seed" outlined dense 
                    hint="Laissez vide pour l'avatar par défaut" />
                </div>
                <div class="col-12 col-md-6 flex items-center">
                  <q-toggle v-model="editUser.is_active" label="Compte actif" color="positive" />
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

    <!-- Dialogue de confirmation de changement de statut -->
    <q-dialog v-model="showStatusDialog">
      <q-card>
        <q-card-section :class="userToUpdate?.is_active ? 'bg-negative' : 'bg-positive'" class="text-white">
          <div class="text-h6">{{ userToUpdate?.is_active ? 'Désactiver' : 'Activer' }} le compte</div>
        </q-card-section>

        <q-card-section class="q-pt-md">
          <p v-if="userToUpdate">
            Êtes-vous sûr de vouloir {{ userToUpdate.is_active ? 'désactiver' : 'activer' }} le compte de
            <strong>{{ userToUpdate.first_name }} {{ userToUpdate.last_name }}</strong> ?
          </p>
          <p v-if="userToUpdate?.is_active" class="text-caption text-grey-8">
            Un compte désactivé ne peut plus se connecter à l'application.
          </p>
        </q-card-section>

        <q-card-actions align="right" class="bg-white">
          <q-btn flat label="Annuler" color="primary" v-close-popup />
          <q-btn flat :label="userToUpdate?.is_active ? 'Désactiver' : 'Activer'"
            :color="userToUpdate?.is_active ? 'negative' : 'positive'" @click="updateUserStatus()"
            :loading="isStatusUpdating" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

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
  id_club: number | null
  club_name?: string | null
  id_grade: number | null
  grade_name?: string | null
  id_tournament_waiting: number | null
  tournament_name?: string | null
  is_active: boolean;
  avatar_seed: string | null;
  created_at: string;
}

// Ce type décrit exactement ce que renvoie votre API, avant nettoyage
interface RawUser {
  id: number
  first_name: string
  last_name: string
  email: string
  phone: string
  birth_date: string
  id_role: number
  id_gender: number
  weight: number | null
  nationality: string
  id_club: number | null
  id_tournament_waiting: number | null
  // peut venir en booléen, en 0/1 ou en "true"/"false"
  is_active: boolean | 0 | 1 | 'true' | 'false'
  avatar_seed: string | null
  created_at: string,
  id_grade?: number | null // Ajoutez cette ligne avec "?" pour indiquer que c'est optionnel
}

interface RawClub {
  id: number
  name: string
}

interface RawGrade {
  id: number
  name: string
}

interface EditUserForm {
  id: number | null;
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
  id_tournament_waiting: number | null;
  is_active: boolean;
  avatar_seed: string | null;
  id_grade: number | null;
}

// Composables
const $q = useQuasar()
const router = useRouter()
const userStore = useUserStore()

// État
const users = ref<User[]>([])
const isLoading = ref(false)
const isSaving = ref(false)
const isStatusUpdating = ref(false)
const errorMessage = ref('')
const searchText = ref('')
const roleFilter = ref<number | null>(null)
const statusFilter = ref<boolean | null>(null)
const showEditDialog = ref(false)
const showDetailsDialog = ref(false)
const showStatusDialog = ref(false)
const selectedUser = ref<User | null>(null)
const userToUpdate = ref<User | null>(null)

// Options pour les filtres et les formulaires
const roleOptions = [
  { label: 'Administrateur', value: 1 },
  { label: 'Manager', value: 2 },
  { label: 'Joueur', value: 3 }
]

const genderOptions = [
  { label: 'Homme', value: 1 },
  { label: 'Femme', value: 2 }
]

const statusOptions = [
  { label: 'Actif', value: true },
  { label: 'Inactif', value: false }
]

// Ajoutez après `statusFilter` :
interface Club { id: number; name: string }
const clubs = ref<Club[]>([])
const clubFilter = ref<number | null>(null)

// État pour les grades
const grades = ref<{id: number, name: string}[]>([])

const getGradeName = computed(() => {
  return (gradeId: number | null): string => {
    if (!gradeId) return '—';
    const grade = grades.value.find(g => g.id === gradeId);
    return grade ? grade.name : '—';
  };
});

// Récupère la liste des clubs actifs
async function fetchClubs(): Promise<void> {
  try {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    const res = await fetch(`${API_URL}/clubs`, { credentials: 'include' })
    
    if (!res.ok) throw new Error(`Erreur HTTP clubs: ${res.status}`)
    
    const body = await res.json() as { clubs: RawClub[] }  // Utilisez le type ici
    
    if (!Array.isArray(body.clubs)) {
      return
    }

    // On efface d'abord tout vieux contenu
    clubs.value = []
    // Puis on remplit avec les vraies données
    clubs.value = body.clubs.map((c: RawClub) => ({  // Ajoutez le type ici aussi
      id: c.id,
      name: c.name
    }))
  }
  catch (err) {
    console.error('Erreur fetchClubs:', err)
  }
}

// Puis modifiez fetchGrades
async function fetchGrades(): Promise<void> {
  try {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    const res = await fetch(`${API_URL}/grades`, { credentials: 'include' })
    
    if (!res.ok) throw new Error(`Erreur HTTP grades: ${res.status}`)
    
    const body = await res.json() as { grades: RawGrade[] }  // Utilisez le type ici
    
    if (!Array.isArray(body.grades)) {
      console.error('Réponse grades inattendue:', body)
      return
    }

    // On efface d'abord tout vieux contenu
    grades.value = []
    // Puis on remplit avec les vraies données
    grades.value = body.grades.map((g: RawGrade) => ({  // Ajoutez le type ici aussi
      id: g.id,
      name: g.name
    }))
  }
  catch (err) {
    console.error('Erreur fetchGrades:', err)
  }
}

// Options de club (extraites dynamiquement)
const clubOptions = computed(() =>
  clubs.value.map(c => ({ label: c.name, value: c.id }))
)

// Options de grade (extraites dynamiquement)
const gradeOptions = computed(() =>
  grades.value.map(g => ({ label: g.name, value: g.id }))
)

// Computed pour les totaux par rôle
const adminCount = computed(() => users.value.filter(u => u.id_role === 1).length)
const managerCount = computed(() => users.value.filter(u => u.id_role === 2).length)
const playerCount = computed(() => users.value.filter(u => u.id_role === 3).length)

// Utilisateur à éditer
const editUser = reactive<EditUserForm>({
  id: null,
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  birth_date: '',
  id_role: 3,
  id_gender: 1,
  weight: null,
  nationality: 'Française',
  id_club: null,
  id_tournament_waiting: null,
  is_active: true,
  avatar_seed: null,
  id_grade: null
})

// Colonnes du tableau
const columns = [
  { name: 'id', label: 'ID', field: 'id', sortable: true, align: 'left' as const },
  { name: 'name', label: 'Nom', field: (row: User) => `${row.first_name} ${row.last_name}`, sortable: true, align: 'left' as const },
  { name: 'email', label: 'Email', field: 'email', sortable: true, align: 'left' as const },
  { name: 'role', label: 'Rôle', field: 'id_role', sortable: true, align: 'center' as const },
  { name: 'info', label: 'Informations', field: 'info', sortable: false, align: 'left' as const },
  { name: 'status', label: 'Statut', field: 'is_active', sortable: true, align: 'center' as const },
  { name: 'actions', label: 'Actions', field: 'actions', sortable: false, align: 'center' as const }
]

// Filtres calculés
const filteredUsers = computed(() => {
  return users.value.filter(user => {
    // Filtre par texte (nom, email)
    const textMatch = !searchText.value ||
      user.first_name.toLowerCase().includes(searchText.value.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchText.value.toLowerCase()) ||
      user.email.toLowerCase().includes(searchText.value.toLowerCase());

    // Filtre par rôle
    const roleMatch = roleFilter.value === null || user.id_role === roleFilter.value;

    // Filtre par statut
    const statusMatch = statusFilter.value === null || Boolean(user.is_active) === Boolean(statusFilter.value)

    // Dans `filteredUsers`
    const clubMatch = clubFilter.value === null || user.id_club === clubFilter.value
    return textMatch && roleMatch && statusMatch && clubMatch
  });
});

// --- Helpers ---
const roleLabel = (roleId: number): string => {
  const roles: Record<number, string> = { 1: 'Admin', 2: 'Manager', 3: 'Joueur' }
  return roles[roleId] || 'Inconnu'
}

const getRoleColor = (roleId: number): string => {
  const colors: Record<number, string> = { 1: 'purple', 2: 'blue', 3: 'green' }
  return colors[roleId] || 'grey'
}

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-FR')
}

const getAvatarUrl = (seed: string): string => {
  return `https://api.dicebear.com/6.x/avataaars/svg?seed=${seed}&size=64`
}

const paginationLabel = (firstRowIndex: number, endRowIndex: number, totalRowsNumber: number) => {
  return `${firstRowIndex} à ${endRowIndex} sur ${totalRowsNumber}`
}

// --- CRUD calls ---
async function fetchUsers(): Promise<void> {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    const response = await fetch(`${API_URL}/admin/users`, { credentials: 'include' })
    if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`)

    const data = await response.json() as { users: RawUser[] }
    if (!Array.isArray(data.users)) {
      throw new Error('Format de réponse incorrect')
    }

    // on force is_active en booléen dès la réception
    users.value = data.users.map((u: RawUser) => ({
      ...u,
      id_grade: u.id_grade || null, // Utilisez l'opérateur "||" pour remplacer les valeurs undefined/falsy par null
      is_active:
        typeof u.is_active === 'boolean'
          ? u.is_active
          : u.is_active === 1 || u.is_active === 'true'
    }))
  }
  catch (err) {
    console.error(err)
    errorMessage.value = err instanceof Error ? err.message : String(err)
  }
  finally {
    isLoading.value = false
  }
}

async function viewDetails(user: User): Promise<void> {
  try {
    // 1) on récupère le user "à jour" depuis l'API
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    const res = await fetch(`${API_URL}/users/${user.id}`, { credentials: 'include' })

    if (!res.ok) {
      throw new Error(`Erreur HTTP: ${res.status}`)
    }

    const data = await res.json()

    if (!data.user) {
      throw new Error("Format de réponse incorrect")
    }

    // 2) Formatage des données
    const fresh = data.user

    // Récupérer le nom du grade si l'ID est présent mais que le nom n'est pas fourni
    let gradeName = fresh.grade_name
    if (fresh.id_grade && !fresh.grade_name) {
      const grade = grades.value.find(g => g.id === fresh.id_grade)
      if (grade) {
        gradeName = grade.name
      }
    }

    // S'assurer que toutes les propriétés nécessaires existent
    selectedUser.value = {
      ...fresh,
      id: fresh.id || 0,
      first_name: fresh.first_name || '',
      last_name: fresh.last_name || '',
      email: fresh.email || '',
      phone: fresh.phone || '',
      birth_date: formatDateOnly(fresh.birth_date) || '',
      id_role: fresh.id_role || 0,
      id_gender: fresh.id_gender || 0,
      weight: fresh.weight || null,
      nationality: fresh.nationality || '',
      id_club: fresh.id_club || null,
      club_name: fresh.club_name || null,
      id_grade: fresh.id_grade || null,
      grade_name: gradeName || null,
      id_tournament_waiting: fresh.id_tournament_waiting || null,
      tournament_name: fresh.tournament_name || null,
      is_active: Boolean(fresh.is_active),
      avatar_seed: fresh.avatar_seed || 'default',
      created_at: fresh.created_at || new Date().toISOString()
    }

    showDetailsDialog.value = true
  } catch (err) {
    console.error("Erreur lors de la récupération des détails:", err)
    $q.notify({
      color: 'negative',
      message: err instanceof Error ? err.message : "Erreur lors de la récupération des détails",
      icon: 'error'
    })
  }
}

// Fonction utilitaire pour formater les dates (ne garder que la partie date)
function formatDateOnly(dateString?: string): string | null {
  if (!dateString) return null;

  try {
    // Si la date contient une partie heure, la supprimer
    if (dateString.includes(' ') || dateString.includes('T')) {
      const parts = dateString.split(/[ T]/);
      return parts[0] || null; // Retourne la première partie ou null si vide
    }
    return dateString;
  } catch (error) {
    console.error('Erreur lors du formatage de la date:', error);
    return dateString; // En cas d'erreur, retourner la chaîne originale
  }
}

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
}

function openEdit(user: User): void {
  
  // Réinitialiser le formulaire d'abord pour éviter les valeurs résiduelles
  Object.assign(editUser, {
    id: null,
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    birth_date: '',
    id_role: 3,
    id_gender: 1,
    weight: null,
    nationality: 'Française',
    id_club: null,
    id_tournament_waiting: null,
    is_active: true,
    avatar_seed: null,
    id_grade: null
  });
  
  // Ensuite, remplir avec les données de l'utilisateur
  Object.assign(editUser, {
    id: user.id,
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    email: user.email || '',
    phone: user.phone || '',
    birth_date: user.birth_date ? user.birth_date.split('T')[0] : '',
    id_role: user.id_role !== undefined ? Number(user.id_role) : 3,
    id_gender: user.id_gender !== undefined ? Number(user.id_gender) : 1,
    weight: user.weight !== undefined && user.weight !== null ? Number(user.weight) : null,
    nationality: user.nationality || 'Française',
    id_club: user.id_club !== undefined && user.id_club !== null ? Number(user.id_club) : null,
    id_tournament_waiting: user.id_tournament_waiting,
    is_active: typeof user.is_active === 'boolean' ? user.is_active : true,
    avatar_seed: user.avatar_seed || 'default',
    id_grade: user.id_grade !== undefined && user.id_grade !== null ? Number(user.id_grade) : null
  });
  
  showEditDialog.value = true;
}

function toggleStatus(user: User): void {
  userToUpdate.value = { ...user }
  showStatusDialog.value = true
}

async function updateUserStatus(): Promise<void> {
  if (!userToUpdate.value) return

  isStatusUpdating.value = true
  try {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const response = await fetch(`${API_URL}/users/${userToUpdate.value.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        is_active: !userToUpdate.value.is_active
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `Erreur HTTP: ${response.status}`)
    }

    // Mettre à jour l'utilisateur dans la liste
    const userIndex = users.value.findIndex(u => u.id === userToUpdate.value?.id)
    if (userIndex !== -1 && userToUpdate.value) {
      users.value[userIndex]!.is_active = !userToUpdate.value.is_active
    }

    await fetchUsers()

    $q.notify({
      color: 'positive',
      message: `Utilisateur ${userToUpdate.value.is_active ? 'désactivé' : 'activé'} avec succès`,
      icon: 'check_circle'
    })

    showStatusDialog.value = false
  } catch (err) {
    console.error('Erreur lors de la mise à jour du statut:', err)

    $q.notify({
      color: 'negative',
      message: err instanceof Error ? err.message : 'Erreur lors de la mise à jour du statut',
      icon: 'error'
    })
  } finally {
    isStatusUpdating.value = false
  }
}

async function saveUser(): Promise<void> {
  isSaving.value = true
  try {
    // Validation de base
    if (!editUser.first_name || !editUser.last_name || !editUser.email) {
      $q.notify({
        color: 'negative',
        message: 'Veuillez remplir tous les champs obligatoires',
        icon: 'warning'
      })
      isSaving.value = false
      return
    }

    // Validation de l'email
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(editUser.email)) {
      $q.notify({
        color: 'negative',
        message: 'Format d\'email invalide',
        icon: 'warning'
      })
      isSaving.value = false
      return
    }

    // Récupérer l'utilisateur original pour conserver les valeurs inchangées
    const originalUser = users.value.find(u => u.id === editUser.id);

    // Préparer les données pour l'API
    const userData = {
      first_name: editUser.first_name,
      last_name: editUser.last_name,
      email: editUser.email,
      phone: editUser.phone === '' ? null : editUser.phone,
      birth_date: editUser.birth_date || undefined,
      id_role: editUser.id_role,
      id_gender: editUser.id_gender || (originalUser ? originalUser.id_gender : 1),
      weight: editUser.weight === null || editUser.weight === undefined ? 
              (originalUser ? originalUser.weight : null) : editUser.weight,
      nationality: editUser.nationality || '',
      id_club: editUser.id_club,
      is_active: editUser.is_active,
      avatar_seed: editUser.avatar_seed || 'default',
      id_grade: editUser.id_grade
    }

    // Appel API pour mettre à jour l'utilisateur
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    const response = await fetch(`${API_URL}/users/${editUser.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(userData)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `Erreur HTTP: ${response.status}`)
    }

    // Rafraîchir la liste des utilisateurs
    await fetchUsers()

    // Notification et fermeture de la modal
    $q.notify({
      color: 'positive',
      message: 'Utilisateur mis à jour avec succès',
      icon: 'check_circle'
    })

    showEditDialog.value = false
  } catch (err) {
    console.error('Erreur lors de la sauvegarde:', err)

    // Gestion des erreurs
    let errorMsg = 'Erreur lors de la sauvegarde'

    if (err instanceof Error) {
      // Gestion des erreurs spécifiques
      if (err.message.includes('email')) {
        errorMsg = 'Cet email est déjà utilisé par un autre compte'
      } else {
        errorMsg = err.message
      }
    }

    $q.notify({
      color: 'negative',
      message: errorMsg,
      icon: 'error'
    })
  } finally {
    isSaving.value = false
  }
}

// --- Lifecycle ---
onMounted(async () => {
  // Vérifier si l'utilisateur est un administrateur
  if (!userStore.user || userStore.user.id_role !== 1) {
    $q.notify({
      color: 'negative',
      message: 'Accès restreint aux administrateurs',
      timeout: 5000
    })
    router.push('/')
    return
  }

  isLoading.value = true;

  try {
    // Chargement séquentiel pour assurer que tout est bien chargé
    await fetchClubs();
    
    await fetchGrades();
    
    await fetchUsers();
  } catch (error) {
    console.error("Erreur lors du chargement des données:", error);
    errorMessage.value = "Erreur lors du chargement des données";
  } finally {
    isLoading.value = false;
  }
})
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