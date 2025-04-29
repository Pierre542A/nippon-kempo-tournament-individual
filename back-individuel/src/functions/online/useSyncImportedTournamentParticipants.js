import { ref } from 'vue'
import axios from 'axios'
import { useToast } from 'vuestic-ui'

// hook principal pour gerer l import et la sync des participants d un tournoi
export function useSyncImportedTournamentParticipants(clubId) {
  const toast = useToast() // init des toasts pour les notifications
  const fileInput = ref(null) // reference sur l input file
  const loading = ref(false) // etat de chargement
  const progress = ref('') // message de progression affiche a l utilisateur
  const keyToIdMap = ref({}) // map pour retrouver l id d un participant existant
  const createdParticipantIds = ref([]) // liste des participants crees a rollback en cas d erreur

  // fonction pour normaliser une chaine (enlever accents et passer en minuscules)
  const normalize = s =>
    String(s || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()

  // fonction pour recuperer tous les participants existants
  async function fetchAllParticipants() {
    progress.value = 'Chargement des participants existants…'
    const res = await axios.get('http://localhost:3000/participants')
    const list = Array.isArray(res.data.participants)
      ? res.data.participants
      : []
    // pour chaque participant existant, on cree des cles normalisees pour le retrouver facilement
    list.forEach(p => {
      const date = p.birth_date.split('T')[0]
      const fn = normalize(p.first_name)
      const ln = normalize(p.last_name)
      keyToIdMap.value[`${fn}|${ln}|${date}`] = String(p.id)
      keyToIdMap.value[`${ln}|${fn}|${date}`] = String(p.id)
    })
  }

  // fonction pour rollback tous les participants crees si erreur
  async function rollbackParticipants() {
    for (const id of createdParticipantIds.value) {
      try {
        await axios.delete(`http://localhost:3000/participants/${id}`)
      } catch (err) {
        console.error(`Echec supp participant ${id}:`, err)
      }
    }
    createdParticipantIds.value = []
  }

  // fonction pour s assurer que chaque participant du fichier a bien un id existant
  async function ensureIds(participants) {
    const mapIds = {}
    for (let i = 0; i < participants.length; i++) {
      const p = participants[i]
      const date = p.birthDate
      const fn = normalize(p.firstName)
      const ln = normalize(p.lastName)
      const key = `${fn}|${ln}|${date}`

      progress.value = `Participant ${i + 1}/${participants.length} : ${p.firstName} ${p.lastName}`

      let remoteId = keyToIdMap.value[key]
      // si aucun id existant alors creer le participant
      if (!remoteId) {
        const payload = {
          first_name: p.firstName,
          last_name: p.lastName,
          birth_date: `${date}T00:00:00`,
          club: p.clubName,
          weight: p.weight,
          id_nationality: p.nationalityId,
          id_gender: p.genderId,
          id_grade: p.gradeId,
          email: p.email?.trim() || `${fn}.${ln}.${Date.now()}@import.local`
        }
        try {
          progress.value = `Creation de ${p.firstName} ${p.lastName}…`
          const { data } = await axios.post('http://localhost:3000/participants', payload)
          remoteId = String(data.id)
          createdParticipantIds.value.push(remoteId)
        } catch (err) {
          console.log(err)
          // rollback si erreur de creation et remonter erreur
          await rollbackParticipants()
          throw err
        }
        // stocker l id dans la map
        keyToIdMap.value[key] = remoteId
      }
      // associer l id interne du fichier a l id distant
      mapIds[p.id] = remoteId
    }
    return mapIds
  }

  // fonction recursive pour remplacer les ids dans tout l objet
  function deepReplaceIds(obj, mapIds) {
    if (Array.isArray(obj)) {
      return obj.map(v => deepReplaceIds(v, mapIds))
    } else if (obj && typeof obj === 'object') {
      return Object.fromEntries(
        Object.entries(obj).map(([k, v]) => [
          k,
          k.toLowerCase().includes('id') && mapIds[v]
            ? mapIds[v]
            : deepReplaceIds(v, mapIds)
        ])
      )
    }
    return obj
  }

  // fonction principale qui gere l upload du fichier
  async function handleFileUpload(event) {
    const file = event.target.files?.[0]
    if (!file) return

    loading.value = true
    progress.value = 'Lecture du fichier…'

    try {
      // etape 1 : lecture et parsing du fichier
      const text = await file.text()
      const data = JSON.parse(text)

      // etape 2 : sync des participants avec creation si besoin
      if (!Object.keys(keyToIdMap.value).length) {
        await fetchAllParticipants()
      }
      const mapIds = await ensureIds(data.participants)

      // etape 3 : remplacer tous les ids dans les donnees
      progress.value = 'Remplacement des IDs dans tout le tournoi…'
      const synced = deepReplaceIds(data, mapIds)

      // etape 4 : preparation du payload a envoyer
      const payload = {
        tournaments: synced.tournaments,
        categories: synced.categories,
        participants: synced.participants,
        poolManagers: synced.poolManagers,
        poules: synced.poules,
        brackets: synced.brackets,
        rounds: synced.rounds,
        matches: synced.matches,
        idClub: clubId
      }

      // etape 5 : appel API pour crea du tournoi
      progress.value = 'Creation du tournoi…'
      const res = await axios.post('http://localhost:3000/sync-tournament', payload)

      // affichage du message de succes
      const { message, tournamentId } = res.data
      progress.value = 'Termine !'
      toast.init({
        message: `${message}`,
        color: 'success',
        duration: 5000
      })

    } catch (err) {
      // rollback participants en cas d erreur
      await rollbackParticipants()
      const errorMessage = err.response?.data?.error || err.message
      toast.init({ message: errorMessage, color: 'danger', duration: 5000 })
      progress.value = `Erreur : ${errorMessage}`

    } finally {
      loading.value = false
    }
  }

  // fonction pour ouvrir le selecteur de fichier
  function openFileDialog() {
    fileInput.value?.click()
  }

  return {
    fileInput,
    loading,
    progress,
    openFileDialog,
    handleFileUpload
  }
}
