<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title>
          Nippon Kempo Tournament
        </q-toolbar-title>

        <div>Quasar v{{ $q.version }}</div>
        
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
    >
      <q-list>
        <router-link to="/">
          <q-img
            src="/src/assets/logo.png"
            alt="Logo"
            style="cursor: pointer;"
          />
        </router-link>

        <div
          class="q-pa-md"
          style="width: 100%; display: flex; flex-direction: column; align-items: center; border-top: 1px solid lightgrey; border-bottom: 1px solid lightgrey;"
        >
          <span style="font-size: 20px; font-weight: bold;">SPREDER Pierre</span>
          <span style="font-size: 12px; color: grey;">
            <router-link 
              to="/profile/edit"
              style="font-size: 12px; color: grey; text-decoration: none;"
              class="hover-underline"
            >
              modifier mon profil
            </router-link>
          </span>
        </div>

        <q-item-label
          header
        >
        </q-item-label>

        <EssentialLink
          v-for="link in linksList"
          :key="link.title"
          v-bind="link"
        />
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import EssentialLink, { type EssentialLinkProps } from 'components/EssentialLink.vue';

const linksList: EssentialLinkProps[] = [
  {
    title: 'Mon Profil',
    caption: 'Consultez vos informations personnelles.',
    icon: 'account_circle',
    link: '/profile',
  },
  {
    title: 'Tournois',
    caption: 'Consultez les prochains tournois et inscrivez-vous !',
    icon: 'view_list',
    link: '/tournaments',
  },
];

const leftDrawerOpen = ref(false);

function toggleLeftDrawer () {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}
</script>
