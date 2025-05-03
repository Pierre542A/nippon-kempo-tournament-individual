<template>
  <div class="login-wrapper">
    <!-- logo centre en haut -->

    <!-- carte de connexion centree -->
    <VaCard class="login-card">
      <!-- titre -->
      <img src="@/assets/logo.png" alt="logo" class="logo" />
      <h1 class="title">NIPPON KEMPO</h1>

      <!-- formulaire de connexion -->
      <VaForm @submit.prevent="handleLogin">
        <!-- champ mot de passe -->
        <VaInput
          v-model="password"
          :type="showPassword ? 'text' : 'password'"
          label="Mot de passe"
          placeholder="Entrez votre mot de passe"
          class="password-input"
        >
          <!-- icone de cle a gauche -->
          <template #prependInner>
            <VaIcon name="lock" color="primary" size="22px" />
          </template>

          <!-- icone oeil pour afficher ou cacher le mot de passe -->
          <template #appendInner>
            <VaButton icon size="small" class="eye-button" @click="togglePassword">
              <VaIcon :name="showPassword ? 'visibility_off' : 'visibility'" />
            </VaButton>
          </template>
        </VaInput>

        <!-- bouton de connexion -->
        <VaButton block color="primary" class="mt-4" :disabled="!password" type="submit">
          Se connecter
        </VaButton>
      </VaForm>
    </VaCard>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vuestic-ui";
import { createAuthCookie } from "@/utils/auth"; // Import de la fonction d'authentification

const router = useRouter();
const toast = useToast();
const password = ref("");
const showPassword = ref(false);

// recuperation du mot de passe correct depuis le fichier d environnement (.env)
const correctPassword = import.meta.env.VITE_APP_MDP;

// fonction pour basculer entre affichage et masquage du mot de passe
const togglePassword = () => {
  showPassword.value = !showPassword.value;
};

// fonction de connexion
const handleLogin = () => {
  // verif si le mot de passe saisi correspond a celui stocke
  if (password.value === correctPassword) {
    // création d'un cookie de connexion valide pour 24 heures
    const expirationDate = new Date();
    expirationDate.setTime(expirationDate.getTime() + 24 * 60 * 60 * 1000);
    document.cookie = `nk_auth=true; expires=${expirationDate.toUTCString()}; path=/`;

    // affichage d'un message de succes
    toast.init({ message: "Connexion réussie", color: "success", position: "top-center" });

    // redirection vers la page home
    router.push("/home-page");
  } else {
    // affichage d'une notification d'erreur si le mot de passe est incorrect
    toast.init({
      message: "Erreur mot de passe incorrect",
      color: "danger",
      position: "top-center",
    });
  }
};
</script>

<style scoped>
/* ----------------------------------------------------------------- */
/* styles globaux */
/* ----------------------------------------------------------------- */

/* container principal centre */
.login-wrapper {
  display: flex;
  height: 70vh;
  align-items: center;
  justify-content: center;  /* Ajoutez cette ligne */
  background: url("@/assets/img/background.svg") no-repeat center center;
  background-size: cover;
  padding: 10px;
  flex-direction: column;
}

/* logo centre en haut */
.logo {
  width: 150px;
  height: 150px;
  margin-bottom: 10px;
}

/* ----------------------------------------------------------------- */
/* styles de la carte de connexion */
/* ----------------------------------------------------------------- */

/* carte de connexion */
.login-card {
  width: 100%;
  max-width: 400px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  text-align: center;
}

/* titre */
.title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 20px;
  text-align: center;
  color: var(--primary-blue);
}

/* ----------------------------------------------------------------- */
/* styles des champs et boutons */
/* ----------------------------------------------------------------- */

/* champ mot de passe */
.password-input {
  width: 100%;
  text-align: left;
}

/* icone oeil et cle */
.eye-button {
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;
}
</style>