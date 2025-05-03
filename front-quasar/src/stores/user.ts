/* src/stores/user.ts ---------------------------------------------------- */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

/* ---------------------------------------------------------------- types */
export interface User {
    id: number;
    first_name: string;
    last_name: string;
    birth_date: string;
    email: string;
    phone: string | null;
    weight: number;
    nationality: string;
    id_gender: number;
    id_grade: number | null;
    grade_name: string;
    id_club: number | null;
    club_name: string;
    id_role: number;
    is_active: boolean;
    created_at: string;
    id_tournament_waiting: number | null;
}

/* stats que tu renverras via  GET /users/:id/stats  --------------------- */
export interface Stats {
    totalTournaments: number
    victories: number
    defeats: number
    ippon: number
    keiKoku: number
    totalTime: number     // secondes
}

/* ---------------------------------------------------------------------- */
axios.defaults.withCredentials = true   // cookies cross-origin

export const useUserStore = defineStore('user', () => {
    /* ------------------------------ state -------------------------------- */
    const user = ref<User | null>(null)
    const stats = ref<Stats | null>(null)
    const loading = ref(false)

    /* ------------------------------ getters ------------------------------ */
    const connected = computed(() => user.value !== null)
    const fullName = computed(() =>
        user.value ? `${user.value.last_name} ${user.value.first_name}` : ''
    )

    const isAdmin = computed(() => user.value?.id_role === 1)
    const isManager = computed(() => user.value?.id_role === 2)

    /* labels : tu peux remplacer par des appels API si tu préfères -------- */
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

    /* ------------------------------ actions ------------------------------ */

    /** Vérifie s’il existe un cookie auth et récupère /me */
    async function fetchSession() {
        loading.value = true
        try {
            // on indique au TS ce qu’on attend dans la réponse
            const { data } = await axios.get<{ user: User; stats: Stats }>(
                `${import.meta.env.VITE_API_URL}/me`
            )

            user.value = data.user
            stats.value = data.stats
        }
        catch {
            user.value = null
            stats.value = null
        }
        finally {
            loading.value = false
        }
    }

    /** POST /login  — retourne true/false */
    async function login(email: string, password: string) {
        loading.value = true
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/login`, { email, password })
            await fetchSession()
            return true
        } catch {
            return false
        } finally {
            loading.value = false
        }
    }

    /** POST /signup  — payload minimal pour l’exemple */
    async function signup(payload: {
        first_name: string; last_name: string; email: string; password: string;
        birth_date: string; weight: number; nationality: string; id_gender: number; phone?: string
    }) {
        loading.value = true
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/signup`, payload)
            await fetchSession()
            return true
        } catch {
            return false
        } finally {
            loading.value = false
        }
    }

    /** Déconnexion totale */
    async function logout() {
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/logout`)
        } finally {
            user.value = null
            stats.value = null
        }
    }

    /* ------------------------------ expose ------------------------------- */
    return {
    /* state */   user, stats, loading,
    /* getters */ connected, fullName, gradeLabel, clubLabel, isAdmin, isManager,
    /* actions */ fetchSession, login, signup, logout
    }
})
