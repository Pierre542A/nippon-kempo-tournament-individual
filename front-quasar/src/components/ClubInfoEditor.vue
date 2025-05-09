<template>
  <div class="club-info-container" :class="{ 'disabled-club': !props.club.is_active }">
    <!-- Indicateur de club désactivé -->
    <div v-if="!props.club.is_active" class="club-disabled-indicator">
      <q-badge color="negative" class="disabled-badge">
        <q-icon name="warning" />
        CLUB DÉSACTIVÉ
      </q-badge>
    </div>
    
    <!-- En-tête avec titre et compteurs -->
    <div class="club-header">
      <div class="club-title">
        <q-icon name="business" color="primary" size="28px" class="q-mr-sm" />
        <h2 class="text-h5 q-my-none text-primary">
          {{ props.club.name }}
          <q-tooltip v-if="!props.club.is_active">
            Ce club est désactivé et n'est plus visible pour les utilisateurs
          </q-tooltip>
        </h2>
        <q-badge 
          v-if="!props.club.is_active" 
          color="negative" 
          class="q-ml-sm"
          outline
        >
          Désactivé
        </q-badge>
      </div>
      
      <div class="buttons-container">
        <!-- Bouton de suppression -->
        <q-btn
          flat
          round
          color="negative"
          icon="delete"
          @click="confirmDelete"
          :disable="!props.club.is_active"
        >
          <q-tooltip v-if="!props.club.is_active">
            Ce club est déjà désactivé
          </q-tooltip>
        </q-btn>
      </div>
    </div>
    
    <!-- Formulaire de saisie -->
    <q-form @submit.prevent="save" class="club-form">
      <!-- Champ Nom -->
      <div class="form-field">
        <div class="field-label">
          <q-icon name="badge" color="primary" />
          <span>Nom *</span>
        </div>
        <q-input 
          v-model="form.name"
          outlined
          dense
          class="full-width"
          :rules="[r.required]"
          :readonly="saving || !props.club.is_active"
        />
      </div>
      
      <!-- Champ Email -->
      <div class="form-field">
        <div class="field-label">
          <q-icon name="email" color="primary" />
          <span>Email *</span>
        </div>
        <q-input 
          v-model="form.email"
          outlined
          dense
          type="email"
          class="full-width"
          :rules="[r.required, r.email]"
          :readonly="saving || !props.club.is_active"
        />
      </div>
      
      <!-- Champ Téléphone -->
      <div class="form-field">
        <div class="field-label">
          <q-icon name="phone" color="primary" />
          <span>Téléphone</span>
        </div>
        <q-input 
          v-model="form.phone"
          outlined
          dense
          class="full-width"
          :readonly="saving || !props.club.is_active"
        />
      </div>
      
      <!-- Champ Site Web -->
      <div class="form-field">
        <div class="field-label">
          <q-icon name="language" color="primary" />
          <span>Site Web</span>
        </div>
        <q-input 
          v-model="form.website"
          outlined
          dense
          class="full-width"
          :rules="[r.url]"
          :readonly="saving || !props.club.is_active"
        >
          <template v-slot:append>
            <q-btn
              v-if="form.website"
              flat
              round
              dense
              icon="open_in_new"
              type="a"
              :href="form.website"
              target="_blank"
            />
          </template>
        </q-input>
      </div>
      
      <!-- Champ Adresse -->
      <div class="form-field">
        <div class="field-label">
          <q-icon name="home" color="primary" />
          <span>Adresse *</span>
        </div>
        <q-input 
          v-model="form.street"
          outlined
          dense
          class="full-width"
          :rules="[r.required]"
          :readonly="saving || !props.club.is_active"
        />
      </div>
      
      <!-- Champs Ville et Code postal sur la même ligne -->
      <div class="form-row">
        <div class="form-field city-field">
          <div class="field-label">
            <q-icon name="location_city" color="primary" />
            <span>Ville *</span>
          </div>
          <q-input 
            v-model="form.city"
            outlined
            dense
            class="full-width"
            :rules="[r.required]"
            :readonly="saving || !props.club.is_active"
          />
        </div>
        
        <div class="form-field postal-field">
          <div class="field-label">
            <q-icon name="markunread_mailbox" color="primary" />
            <span>Code postal *</span>
          </div>
          <q-input 
            v-model="form.postal_code"
            outlined
            dense
            class="full-width"
            :rules="[r.required]"
            :readonly="saving || !props.club.is_active"
          />
        </div>
      </div>
      
      <!-- Message d'information si club désactivé -->
      <div v-if="!props.club.is_active" class="disabled-info q-my-md">
        <q-icon name="info" color="blue" size="20px" class="q-mr-sm" />
        Ce club est actuellement désactivé. Cliquez sur le bouton "Réactiver" pour le remettre en service.
      </div>
      
      <!-- Boutons d'action -->
      <div class="form-actions">
        <!-- Bouton de réactivation (dupliqué en bas de formulaire) -->
        <q-btn
          v-if="!props.club.is_active"
          unelevated
          color="positive"
          icon="restart_alt"
          label="Réactiver le club"
          class="reactivate-btn"
          @click="reactivateClub"
          :loading="saving"
        />
        
        <q-space></q-space>
        
        <q-btn
          flat
          color="grey-7"
          label="Réinitialiser"
          icon="refresh"
          :disabled="!isModified || saving || !props.club.is_active"
          @click="resetForm"
        />
        <q-btn
          unelevated
          type="submit"
          color="primary"
          label="Enregistrer"
          icon="save"
          :loading="saving"
          :disabled="!isModified || !props.club.is_active"
        />
      </div>
    </q-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { useQuasar } from 'quasar';

/* ───────── Types ───────── */
interface Club {
  id: number;
  name: string;
  street: string;
  city: string;
  postal_code: string;
  phone: string;
  email: string;
  website?: string;
  is_active: boolean;
  created_at: string;
}

interface ClubForm {
  name: string;
  street: string;
  city: string;
  postal_code: string;
  phone: string;
  email: string;
  website: string | '';
}

/* ───────── Props & Emits ───────── */
const props = defineProps<{ club: Club }>();
const emit  = defineEmits<{ (e: 'club-updated'): void }>();

/* ───────── State ───────── */
const $q      = useQuasar();
const saving  = ref(false);

const originalForm = ref<ClubForm>({
  name: '',
  street: '',
  city: '',
  postal_code: '',
  phone: '',
  email: '',
  website: ''
});

const form = reactive({
  name: '',
  street: '',
  city: '',
  postal_code: '',
  phone: '',
  email: '',
  website: ''
});

/* ───────── Computed ───────── */
const isModified = computed(() => {
  return Object.keys(form).some(key => {
    const typedKey = key as keyof ClubForm;
    return form[typedKey] !== originalForm.value[typedKey];
  });
});

/* ───────── Sync form on prop change ───────── */
watch(() => props.club, syncForm, { immediate: true });
function syncForm() {
  // Copier les propriétés du club dans le formulaire
  Object.assign(form, props.club);
  // S'assurer que website n'est jamais undefined
  form.website = props.club.website || '';
  // Créer une copie pour originalForm
  originalForm.value = {
    name: props.club.name,
    street: props.club.street,
    city: props.club.city,
    postal_code: props.club.postal_code,
    phone: props.club.phone,
    email: props.club.email,
    website: props.club.website || ''
  };
}

/* ───────── Reset form ───────── */
function resetForm() {
  Object.assign(form, originalForm.value);
  $q.notify({ 
    color: 'info', 
    message: 'Formulaire réinitialisé', 
    icon: 'refresh',
    position: 'top-right',
    timeout: 2000
  });
}

/* ───────── Validations ───────── */
const r = {
  required: (v: string) => !!v || 'Champ requis',
  email:    (v: string) => !v || /^[^@]+@[^@]+\.[^@]+$/.test(v) || 'Email invalide',
  url:      (v: string) => !v || /^https?:\/\/.+/.test(v) || 'URL invalide'
};

/* ───────── Save ───────── */
async function save() {
  if (!isModified.value) return;
  
  saving.value = true;
  try {
    const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const res = await fetch(`${API}/clubs/${props.club.id}`, {
      method:      'PUT',
      credentials: 'include',
      headers:     { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:        form.name,
        street:      form.street,
        city:        form.city,
        postal_code: form.postal_code,
        phone:       form.phone,
        email:       form.email,
        website:     form.website || undefined,
        is_active:   true
      })
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Une erreur est survenue');
    }

    // Mettre à jour le formulaire original
    originalForm.value = {...form};
    
    $q.notify({ 
      color: 'positive', 
      message: 'Club mis à jour', 
      icon: 'check',
      position: 'top-right',
      timeout: 2000
    });
    emit('club-updated');
  } catch (err: unknown) {
    // Gérer les erreurs avec le bon typage
    let errorMessage = 'Erreur lors de la mise à jour du club';
    
    if (err instanceof Error) {
      errorMessage = err.message;
    } else if (typeof err === 'object' && err !== null && 'message' in err) {
      errorMessage = String(err.message);
    }
    
    $q.notify({ 
      color: 'negative', 
      message: errorMessage, 
      icon: 'error',
      position: 'top-right', 
      timeout: 4000
    });
  } finally {
    saving.value = false;
  }
}

/* ───────── Delete ───────── */
function confirmDelete() {
  if (!props.club.is_active) {
    $q.notify({
      color: 'warning',
      message: 'Ce club est déjà désactivé',
      icon: 'info',
      position: 'top-right',
      timeout: 2000
    });
    return;
  }

  $q.dialog({
    title:   'Supprimer le club',
    message: 'Êtes-vous sûr ? Le club ne peut être supprimé que s\'il n\'y a plus de joueurs et si vous êtes le dernier administrateur ou gestionnaire.',
    ok:      { label: 'Supprimer', color: 'negative', icon: 'delete' },
    cancel:  { label: 'Annuler', flat: true },
    persistent: true
  }).onOk(deleteClub);
}

async function deleteClub() {
  if (!props.club.is_active) {
    $q.notify({
      color: 'warning',
      message: 'Ce club est déjà désactivé',
      icon: 'info',
      position: 'top-right',
      timeout: 2000
    });
    return;
  }

  saving.value = true;
  try {
    const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const res = await fetch(`${API}/clubs/${props.club.id}`, {
      method:      'PUT',
      credentials: 'include',
      headers:     { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: false })
    });

    // Différents cas d'erreur selon les codes de statut
    if (res.status === 409 || res.status === 403) {
      const errorData = await res.json();
      $q.notify({
        color:   'warning',
        message: errorData.error || 'Impossible de supprimer le club',
        icon:    'warning',
        position: 'top-right',
        timeout: 6000
      });
      return;
    }
    
    // Gérer les autres erreurs
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Une erreur est survenue');
    }

    $q.notify({ 
      color: 'positive', 
      message: 'Club désactivé', 
      icon: 'check',
      position: 'top-right',
      timeout: 2000
    });
    emit('club-updated');
  } catch (err: unknown) {
    // Gérer les erreurs avec le bon typage
    let errorMessage = 'Erreur lors de la suppression du club';
    
    if (err instanceof Error) {
      errorMessage = err.message;
    } else if (typeof err === 'object' && err !== null && 'message' in err) {
      errorMessage = String(err.message);
    }
    
    $q.notify({ 
      color: 'negative', 
      message: errorMessage, 
      icon: 'error',
      position: 'top-right', 
      timeout: 4000
    });
  } finally {
    saving.value = false;
  }
}

/* ───────── Reactivate club ───────── */
async function reactivateClub() {
  if (props.club.is_active) {
    $q.notify({
      color: 'info',
      message: 'Ce club est déjà actif',
      icon: 'info',
      position: 'top-right',
      timeout: 2000
    });
    return;
  }

  saving.value = true;
  try {
    const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const res = await fetch(`${API}/clubs/${props.club.id}`, {
      method:      'PUT',
      credentials: 'include',
      headers:     { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        // Utiliser les valeurs actuelles du formulaire
        name: form.name,
        email: form.email,
        phone: form.phone,
        street: form.street,
        city: form.city,
        postal_code: form.postal_code,
        website: form.website || undefined,
        is_active: true
      })
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Une erreur est survenue');
    }

    $q.notify({ 
      color: 'positive', 
      message: 'Club réactivé avec succès', 
      icon: 'check_circle',
      position: 'top-right',
      timeout: 2000
    });
    emit('club-updated');
  } catch (err: unknown) {
    // Gérer les erreurs avec le bon typage
    let errorMessage = 'Erreur lors de la réactivation du club';
    
    if (err instanceof Error) {
      errorMessage = err.message;
    } else if (typeof err === 'object' && err !== null && 'message' in err) {
      errorMessage = String(err.message);
    }
    
    $q.notify({ 
      color: 'negative', 
      message: errorMessage, 
      icon: 'error',
      position: 'top-right', 
      timeout: 4000
    });
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.club-info-container {
  width: 100%;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 24px;
  position: relative;
}

/* Style pour un club désactivé */
.disabled-club {
  position: relative;
  background-color: #f8f8f8;
  border: 1px solid #e0e0e0;
}

.disabled-club::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  backdrop-filter: blur(1px);
  background-color: rgba(249, 249, 249, 0.5);
  pointer-events: none;
  z-index: 1;
  border-radius: 8px;
}

/* Assurer que le bouton de réactivation soit au-dessus du flou */
.reactivate-btn {
  position: relative;
  z-index: 2; /* Z-index supérieur à celui du flou */
}

.buttons-container {
  position: relative;
  z-index: 2; /* Assurez-vous que les boutons sont au-dessus du flou */
}

.club-disabled-indicator {
  position: absolute;
  top: -12px;
  right: 20px;
  z-index: 2;
}

.disabled-badge {
  padding: 6px 10px;
  font-weight: bold;
  letter-spacing: 0.5px;
}

.disabled-info {
  background-color: #e3f2fd;
  border-left: 4px solid #2196f3;
  padding: 12px;
  border-radius: 4px;
  font-size: 14px;
  display: flex;
  align-items: center;
  position: relative;
  z-index: 2; /* Info au-dessus du flou */
}

.club-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 1px solid #f2f2f2;
  padding-bottom: 16px;
}

.club-title {
  display: flex;
  align-items: center;
  position: relative;
  z-index: 2; /* Titre au-dessus du flou */
}

.club-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  padding-left: 4px;
}

.form-row {
  display: flex;
  gap: 16px;
}

.city-field {
  flex: 2;
}

.postal-field {
  flex: 1;
}

.form-actions {
  display: flex;
  justify-content: space-between; /* Modifié pour placer le bouton de réactivation à gauche */
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f2f2f2;
  position: relative;
  z-index: 2; /* Boutons au-dessus du flou */
}

/* Animation d'entrée */
.animate-fade-in {
  animation: fade 0.25s ease-out both;
}

@keyframes fade {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>