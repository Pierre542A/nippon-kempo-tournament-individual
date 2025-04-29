<template>
    <div class="home-club-page">
        <!-- en tete avec bouton retour, nom du club et onglets -->
        <header class="header">
            <!-- partie gauche : bouton retour + nom du club -->
            <div class="header-left">
                <VaButton icon @click="goBack" class="btn-back">
                    <VaIcon name="arrow_back" />
                </VaButton>
                <h2 class="club-name">
                    {{ hasClub && club.is_active ? club.name : 'Aucun club' }}
                </h2>
            </div>

            <!-- barre d onglets centrale -->
            <nav v-if="hasClub && club.is_active" class="tabs">
                <VaButton text class="tab" :class="{ active: activeTab === 'info' }" @click="activeTab = 'info'">
                    Informations du club
                </VaButton>
                <VaButton v-if="userStore.canManageTournaments" text class="tab"
                    :class="{ active: activeTab === 'tournaments' }" @click="activeTab = 'tournaments'">
                    Tournois
                </VaButton>
                <VaButton v-if="userStore.canManageClubUsers" text class="tab"
                    :class="{ active: activeTab === 'users' }" @click="activeTab = 'users'">
                    Utilisateurs admins
                </VaButton>
            </nav>

            <!-- menu deroulant compte utilisateur -->
            <va-button-dropdown trigger="click" placement="bottom-end" close-on-content-click class="account-dropdown">
                <!-- label du bouton -->
                <template #label>
                    <va-button text class="account-btn">
                        <va-icon name="person_outline" />
                        <span class="account-text">Mon compte</span>
                    </va-button>
                </template>

                <!-- contenu du menu -->
                <va-button text @click="logout">
                    Se deconnecter
                </va-button>
            </va-button-dropdown>
        </header>

        <!-- contenu principal -->
        <section class="content">
            <div v-if="!hasClub || !club.is_active" class="no-club">
                <p>Ce club n existe pas ou n est plus actif.</p>
            </div>
            <div v-else>
                <InformationsClub v-if="activeTab === 'info'" :club="club" @update="fetchClub()" />
                <TournoisClub v-if="activeTab === 'tournaments' && userStore.canManageTournaments"
                    :tournaments="club.tournament" :club="club" />
                <UtilisateursClub v-if="activeTab === 'users' && userStore.canManageClubUsers"
                    :clubId="userStore.idClub" />
            </div>
        </section>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { useUserStore } from '@/stores/user'
import InformationsClub from './InformationsClub.vue'
import TournoisClub from './TournoisClub.vue'
import UtilisateursClub from './UtilisateursClub.vue'

// initialisation des outils de routage et du store utilisateur
const router = useRouter()
const userStore = useUserStore()

// etats du composant
const activeTab = ref('info')
const club = ref({})
const hasClub = ref(!!userStore.idClub)
const error = ref(null)

// fonction pour retourner en arriere
const goBack = () => router.push('/')

// fonction pour aller sur la page mon compte
const goToAccount = () => router.push('/mon-compte')

// recuperation des infos du club depuis l api
const fetchClub = async () => {
    try {
        const { data } = await axios.get(
            `http://localhost:3000/clubs/${userStore.idClub}`
        )
        club.value = data
    } catch (err) {
        error.value = 'Impossible de charger les informations du club.'
        console.error(err)
    }
}

// fonction de deconnexion
function logout() {
    userStore.clearUser()
    router.push('/')  // redirection vers la page d accueil
}

// au montage du composant, on charge le club si besoin
onMounted(() => {
    if (hasClub.value) fetchClub()
})
</script>

<style scoped>
.header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    padding: 12px 24px;
    background-color: #ffffff;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.header-left {
    display: flex;
    align-items: center;
    flex: 1 1 auto;
    min-width: 0;
}

.btn-back {
    margin-right: 12px;
}

.club-name {
    font-size: 1.25rem;
    font-weight: 600;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
}

.tabs {
    display: flex;
    justify-content: center;
    flex: 2 1 auto;
    gap: 20px;
    overflow-x: auto;
    padding: 8px 0;
}

.account-btn {
    display: flex;
    align-items: center;
}

.account-text {
    margin-left: 6px;
}

.tabs::-webkit-scrollbar {
    height: 4px;
}

.tabs::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 2px;
}

.tab {
    flex-shrink: 0;
    font-size: 1rem;
    font-weight: 500;
    color: #555;
    opacity: 0.7;
    transition: opacity 0.2s, color 0.2s;
}

.tab.active {
    color: var(--va-primary);
    opacity: 1;
    position: relative;
}

.tab.active::after {
    content: '';
    position: absolute;
    bottom: -6px;
    left: 0;
    right: 0;
    height: 3px;
    background-color: var(--va-primary);
    border-radius: 2px;
}

.account-btn {
    display: flex;
    align-items: center;
    justify-content: flex-end;
}

.account-btn .account-text {
    margin-left: 6px;
    font-weight: 500;
    white-space: nowrap;
}

@media (max-width: 600px) {
    .tabs {
        order: 3;
        width: 100%;
        gap: 12px;
    }

    .account-btn {
        order: 2;
        margin-right: 0;
        margin-top: 8px;
    }

    .header-left {
        order: 1;
        margin-bottom: 8px;
    }
}

.content {
    padding: 24px;
}

.no-club {
    text-align: center;
    color: #d9534f;
    font-size: 1rem;
    margin-top: 40px;
}
</style>