<template>
    <div class="informations-club">
        <!-- toolbar avec titre et bouton d edition -->
        <div class="toolbar">
            <h2>Informations du club</h2>
            <VaButton v-if="canModify" color="primary" class="edit-toggle" @click="toggleEdit">
                <VaIcon :name="editMode ? 'close' : 'edit'" />
                {{ editMode ? 'Annuler' : 'Modifier' }}
            </VaButton>
        </div>

        <!-- contenu principal -->
        <div class="content">
            <!-- mode affichage -->
            <div v-if="!editMode" class="view">
                <h3 class="club-name">{{ club.name }}</h3>
                <p class="club-address">{{ club.address }}</p>
                <p class="club-desc">{{ club.description }}</p>

                <div class="gallery">
                    <div v-for="key in imageKeys" :key="key" class="thumb">
                        <p class="image-warning">
                            ⚠️ Note : l image affichée peut ne pas être la version finale (latence de traitement).
                        </p>
                        <img v-if="club[key]" :src="club[key]" @load="onLoad($event, key)" alt="Image club" />
                        <div v-else class="no-image">Pas d image</div>
                        <div v-if="dims[key]" class="dim-label">
                            {{ dims[key].w }} × {{ dims[key].h }}
                        </div>
                    </div>
                </div>
            </div>

            <!-- mode edition -->
            <VaForm v-else @submit.prevent="save" class="edit no-scroll-form">
                <div class="fields">
                    <VaInput v-model="form.name" label="Nom du club" />
                    <VaInput v-model="form.address" label="Adresse" />
                    <VaTextarea v-model="form.description" label="Description" rows="4" />
                </div>

                <div class="gallery-edit">
                    <div v-for="key in imageKeys" :key="key" class="thumb-edit">
                        <p class="image-warning">
                            ⚠️ Note : l image affichée peut ne pas être la version finale (latence de traitement).
                        </p>

                        <img v-if="preview[key]" :src="preview[key]" @load="onLoad($event, key)" alt="Preview" />
                        <div v-else class="no-image">Pas d image</div>
                        <div v-if="dims[key]" class="dim-label">
                            {{ dims[key].w }} × {{ dims[key].h }}
                            <span v-if="sizes[key]"> ({{ formatSize(sizes[key]) }})</span>
                        </div>

                        <div class="overlay">
                            <VaButton icon size="small" color="white" @click="() => fileRefs[key].click()">
                                <VaIcon name="upload" />
                            </VaButton>
                            <VaButton v-if="preview[key]" icon size="small" color="white" @click="remove(key)">
                                <VaIcon name="delete" />
                            </VaButton>
                            <input type="file" accept="image/*" :ref="el => fileRefs[key] = el"
                                @change="onFile($event, key)" hidden />
                        </div>
                    </div>
                </div>

                <div class="actions">
                    <VaButton type="submit" color="success" style="justify-content: center;">Enregistrer</VaButton>
                </div>
            </VaForm>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import axios from 'axios'
import { useUserStore } from '@/stores/user'
import { useToast } from 'vuestic-ui'

const toast = useToast()

// props et emits
const props = defineProps({ club: Object })
const emit = defineEmits(['update'])

// store utilisateur et permissions
const userStore = useUserStore()
const canModify = computed(() => userStore.canModifyClubInfo)

// etats du composant
const editMode = ref(false)
const imageKeys = ['image_1', 'image_2', 'image_3']
const fileRefs = reactive({})

// donnees du formulaire
const form = reactive({
    name: props.club?.name || '',
    address: props.club?.address || '',
    description: props.club?.description || '',
    image_1: null,
    image_2: null,
    image_3: null
})

// preview des images
const preview = reactive({
    image_1: props.club?.image_1 || null,
    image_2: props.club?.image_2 || null,
    image_3: props.club?.image_3 || null
})

// dimensions et tailles des images
const dims = reactive({ image_1: null, image_2: null, image_3: null })
const sizes = reactive({ image_1: null, image_2: null, image_3: null })

// url de l api
const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// fonction pour formater la taille en ko
function formatSize(bytes) {
    return (bytes / 1024).toFixed(1) + ' KB'
}

// etat des images supprimees
const deleted = reactive({ image_1: false, image_2: false, image_3: false })

// reinitialisation du formulaire
function resetForm() {
    form.name = props.club.name
    form.address = props.club.address
    form.description = props.club.description

    imageKeys.forEach(key => {
        form[key] = null
        preview[key] = props.club[key]
        dims[key] = null
        sizes[key] = null
        deleted[key] = false     // reinitialisation du flag
    })
}

// basculement entre mode edition et affichage
function toggleEdit() {
    if (editMode.value) resetForm()
    editMode.value = !editMode.value
}

// gestion du chargement des images
function onLoad(e, key) {
    dims[key] = {
        w: e.target.naturalWidth,
        h: e.target.naturalHeight
    }
}

// gestion de la selection d un fichier
function onFile(e, key) {
    const f = e.target.files[0]
    if (!f) return

    // verification que c est une image
    if (!f.type.startsWith('image/')) {
        toast.init({
            message: 'Veuillez sélectionner un fichier image',
            color: 'warning'
        })
        return
    }

    // verification de la taille (max 5MB)
    if (f.size > 5 * 1024 * 1024) {
        toast.init({
            message: 'L image est trop volumineuse (max 5MB)',
            color: 'warning'
        })
        return
    }

    form[key] = f
    preview[key] = URL.createObjectURL(f)
    dims[key] = null
    deleted[key] = false
    sizes[key] = f.size
}

// suppression d une image
function remove(key) {
    form[key] = null
    preview[key] = null
    dims[key] = null
    deleted[key] = true        // marquage de la suppression
    if (fileRefs[key]) fileRefs[key].value = null
}

// watch sur les changements du club
watch(() => props.club, resetForm, { deep: true })

// sauvegarde des modifications
async function save() {
    try {
        const formData = new FormData()
        // texte
        formData.append('name', form.name)
        formData.append('address', form.address)
        formData.append('description', form.description)

        // images : upload et suppression
        imageKeys.forEach(key => {
            if (form[key] instanceof File) {
                // remplacement ou ajout → envoi du fichier
                formData.append(key, form[key])
            } else if (deleted[key]) {
                // suppression → envoi du flag delete
                formData.append(`delete_${key}`, '1')
            }
            // sinon → on ne change pas l image existante
        })

        const { data: updated } = await axios.put(
            `${apiBaseUrl}/clubs/${props.club.id}`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${userStore.token}`
                },
                timeout: 30000
            }
        )

        emit('update', updated)
        editMode.value = false
        toast.init({ message: 'Modifications enregistrées !', color: 'success' })

    } catch (error) {
        console.error('Save error:', error)
        toast.init({
            message: error.response?.data?.error || 'Erreur lors de la sauvegarde',
            color: 'danger',
            description: error.response?.data?.details || error.message
        })
    }
}
</script>

<style scoped>
.informations-club {
    width: 100%;
    padding: 2px;
    box-sizing: border-box;
}

.toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    margin-bottom: 16px;
}

.toolbar h2 {
    font-size: 1.75rem;
    color: #333;
}

.edit-toggle {
    margin-top: 5px;
}

.content {
    display: flex;
    flex-direction: column;
    gap: 24px;
    overflow: visible !important;
}

.view .club-name {
    margin: 0;
    font-size: 1.5rem;
    color: #1e3a8a;
}

.club-address {
    color: #666;
    margin: 8px 0;
}

.club-desc {
    color: #444;
    line-height: 1.6;
    margin-bottom: 16px;
}

.gallery,
.gallery-edit {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 100px;
}

.thumb,
.thumb-edit {
    position: relative;
    width: 100%;
    padding-top: 100%;
    /* ratio 1:1 */
    background: #eee;
    border-radius: 8px;
    overflow: hidden;
}

.thumb img,
.thumb-edit img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.no-image {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #aaa;
    font-size: 0.85rem;
    padding: 8px;
    text-align: center;
}

.dim-label {
    position: absolute;
    bottom: 4px;
    left: 4px;
    background: rgba(0, 0, 0, 0.4);
    color: #fff;
    font-size: 0.75rem;
    padding: 2px 4px;
    border-radius: 4px;
}

.fields {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 40px;
    margin-bottom: 16px;
}

/* desactivation du scroll interne */
.no-scroll-form {
    overflow: visible !important;
}

.no-scroll-form .va-form {
    overflow: visible !important;
    max-height: none !important;
}

.overlay {
    position: absolute;
    bottom: 4px;
    right: 4px;
    display: flex;
    gap: 4px;
    background: rgba(0, 0, 0, 0.3);
    padding: 4px;
    border-radius: 4px;
}

.image-warning {
    position: absolute;
    top: 8px;
    left: 8px;
    z-index: 10;
    background: rgba(255, 255, 255, 0.8);
    padding: 2px 6px;
    font-size: 0.75rem;
    border-radius: 4px;
    line-height: 1.2;
}

.actions {
    margin-top: 16px;
}

.actions .va-button {
    width: 100% !important;
    display: flex;
    justify-content: center;
}
</style>