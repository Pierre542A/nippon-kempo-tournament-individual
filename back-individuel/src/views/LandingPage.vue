<template>
  <div class="landing-wrapper">
    <h1 class="landing-title">Bienvenue sur NK Master Tournament</h1>

    <div class="tabs-container">
      <button class="tab-button" :class="{ active: activeTab === 'offline' }" @click="activeTab = 'offline'">
        <img src="@/assets/img/icone-no-wifi.png" alt="Hors-ligne" class="tab-icon" />
        Création de tournoi hors-ligne
      </button>
    </div>

    <div class="tab-content">
      <LoginPage v-if="activeTab === 'offline'" />
      <LoginClubPage v-else />
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import LoginPage from "./offline/LoginPage.vue";

const activeTab = ref("offline");
</script>

<style scoped>
.landing-wrapper {
  min-height: 100vh;
  background: #0c2432;
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1rem;
  font-family: "Roboto", sans-serif;
}

.landing-title {
  font-size: 1.75rem;
  text-align: center;
  text-transform: uppercase;
  font-weight: bold;
  letter-spacing: 1px;
  margin-bottom: 2rem;
}

.tabs-container {
  display: flex;
  width: 100%;
  max-width: 1200px;
  margin-bottom: 2rem;
  border-bottom: 2px solid #2c3e50;
}

.tab-button {
  flex: 1;
  padding: 1rem;
  background: transparent;
  border: none;
  color: white;
  font-family: "Roboto", sans-serif;
  font-weight: bold;
  text-transform: uppercase;
  cursor: pointer;
  position: relative;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.tab-icon {
  width: 30px;
  height: 30px;
  background-color: white;
  border-radius: 20px;
}

.tab-button.active {
  color: #9fecfc;
}

.tab-button.active::after {
  content: "";
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: #9fecfc;
}

.tab-content {
  width: 100%;
  padding: 0 1rem;
}
</style>