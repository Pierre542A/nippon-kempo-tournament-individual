/* -------------------------------------------------------------------- */
/* src/stores/user.ts                                                   */
/* -------------------------------------------------------------------- */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

/* --------------------------- types utilisateur ----------------------- */
export interface User {
    id: number
    avatar_seed: string          // ← toujours NON NULL en BDD
    first_name: string
    last_name: string
    birth_date: string           // Date uniquement (sans heure)
    email: string
    phone: string | null
    weight: number
    nationality: string
    id_gender: number
    id_grade: number | null
    grade_name: string
    id_club: number | null
    club_name: string
    id_role: number
    is_active: boolean
    created_at: string
    id_tournament_waiting: number | null
}

/* stats renvoyées par GET /users/:id/stats --------------------------- */
export interface Stats {
    totalTournaments: number
    matches: number
    victories: number
    defeats: number
    ippon: number
    keiKoku: number
}

/* -------------------------------------------------------------------- */
axios.defaults.withCredentials = true   // cookies cross-origin

// Fonction pour formater les dates (ne garder que la partie date)
function formatDateOnly(dateString: string | null | undefined): string | null {
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

export const useUserStore = defineStore('user', () => {
    /* ------------------------------ state ------------------------------ */
    const user = ref<User | null>(null)
    const stats = ref<Stats | null>(null)
    const loading = ref(false)

    /* ---------------------- constantes avatar DiceBear ----------------- */
    const DEFAULT_SEED = 'default'
    const AVATAR_STYLE = 'avataaars'     // change ici si tu préfères un autre style
    const AVATAR_SIZE = 150             // px (pour le <q-avatar size="150px">)

    /* ------------------------------ getters ---------------------------- */
    const avatarUrl = computed(() => {
        const seed = user.value?.avatar_seed ?? DEFAULT_SEED
        return `https://api.dicebear.com/9.x/${AVATAR_STYLE}/svg` +
            `?seed=${encodeURIComponent(seed)}&size=${AVATAR_SIZE}`
    })

    const connected = computed(() => user.value !== null)
    const fullName = computed(() =>
        user.value ? `${user.value.last_name} ${user.value.first_name}` : ''
    )
    const isAdmin = computed(() => user.value?.id_role === 1)
    const isManager = computed(() => user.value?.id_role === 2)

    const gradeLabel = computed(() => {
        const map: Record<number, string> = {
            1: '6ᵉ kyu', 2: '5ᵉ kyu', 3: '4ᵉ kyu', 4: 'ceinture marron',
            5: 'ceinture noire 1ᵉʳ dan', 6: '2ᵉ dan'
        }
        return user.value?.id_grade ? map[user.value.id_grade] ?? '—' : '—'
    })

    const clubLabel = computed(() => {
        const map: Record<number, string> = {
            1: 'Nippon Kempo Paris',
            2: 'Toulouse Shinobi KC',
            3: 'Marseille Kenpo'
        }
        return user.value?.id_club ? map[user.value.id_club] ?? '—' : '—'
    })

    /* ------------------------------ actions ---------------------------- */
    /** Vérifie s'il existe un cookie auth et récupère /me */
    async function fetchSession() {
        loading.value = true
        try {
            // Utilisez une option pour éviter le cache du navigateur
            const { data } = await axios.get<{ user: User; stats: Stats }>(
                `${import.meta.env.VITE_API_URL}/me`,
                {
                    // Ajout d'un paramètre aléatoire pour éviter la mise en cache
                    params: { _t: new Date().getTime() }
                }
            )
            console.log("Données reçues de /me:", data)

            // S'assurer que l'objet User reçu contient bien la propriété avatar_seed
            if (data.user && !data.user.avatar_seed) {
                console.warn("L'objet User reçu du backend ne contient pas de avatar_seed, utilisation de la valeur par défaut");
                data.user.avatar_seed = 'default';
            } else {
                console.log("Avatar seed reçu du backend:", data.user.avatar_seed);
            }

            // Assurer que la date de naissance est au format correct (juste la date sans heure)
            if (data.user && data.user.birth_date) {
                data.user.birth_date = formatDateOnly(data.user.birth_date) || data.user.birth_date;
            }

            // Mise à jour des données du store
            user.value = data.user
            stats.value = data.stats
        } catch (error) {
            console.error("Erreur lors de la récupération des données de session:", error);
            user.value = null
            stats.value = null
        } finally {
            loading.value = false
        }
    }

    /** POST /login — retourne true/false */
    async function login(email: string, password: string) {
        loading.value = true
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/login`, { email, password })
            await fetchSession()
            return true
        } catch (error) {
            // Propager l'erreur au lieu de simplement retourner false
            loading.value = false
            throw error
        }
    }

    /** POST /signup — payload minimal */
    async function signup(payload: {
        first_name: string; last_name: string; email: string; password: string
        birth_date: string; weight: number; nationality: string; id_gender: number; phone?: string
    }) {
        loading.value = true
        try {
            // S'assurer que la date de naissance est au format correct avant l'envoi
            if (payload.birth_date) {
                payload.birth_date = formatDateOnly(payload.birth_date) || payload.birth_date;
            }
            
            await axios.post(`${import.meta.env.VITE_API_URL}/signup`, payload)
            await fetchSession()
            return true
        } catch (error) {
            // Propager l'erreur au lieu de simplement retourner false
            loading.value = false
            throw error
        }
    }

    /** Déconnexion */
    async function logout() {
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/logout`)
        } finally {
            user.value = null
            stats.value = null
        }
    }

    /* ------------------------------ expose ----------------------------- */
    return {
    /* state */   user, stats, loading,
    /* getters */ connected, fullName, gradeLabel, clubLabel,
        isAdmin, isManager, avatarUrl,
    /* actions */ fetchSession, login, signup, logout
    }
})