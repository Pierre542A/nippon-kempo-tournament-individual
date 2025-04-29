import { createRouter, createWebHistory } from 'vue-router';
import LoginPage from '../views/offline/LoginPage.vue';
import HomePage from '../views/offline/HomePage.vue';
import TournamentEditPage from '../views/offline/TournamentEditPage.vue';
import TournamentManagePage from '../views/offline/TournamentManagePage.vue';
import MatchScoreboardPage from '../views/offline/MatchScoreboardPage.vue';
import MatchScoreboardFictifPage from '@/views/offline/MatchScoreboardFictifPage.vue';
import MatchScoreboardFictifAdminPage from '@/views/offline/MatchScoreboardFictifAdminPage.vue';
import LandingPage from '@/views/LandingPage.vue';
import HomeClubPage from '@/views/online/HomeClubPage.vue';
import { isAuthenticated } from '@/utils/auth';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", component: LandingPage },

    {
      path: "/offline-login-page",
      component: LoginPage,
      meta: { requiresAuth: true }
    }, // marqué comme nécessitant une authentification },

    // routes protégées (nécessitent une authentification) - partie hors ligne
    {
      path: "/home-page",
      component: HomePage,
      meta: { requiresAuth: true } // marqué comme nécessitant une authentification
    },
    {
      path: "/tournament/non-started/:id",
      component: TournamentEditPage,
      meta: { requiresAuth: true } // nécessite authentification - partie hors ligne
    },
    {
      path: "/tournament/started/:id",
      component: TournamentManagePage,
      meta: { requiresAuth: true } // nécessite authentification - partie hors ligne
    },
    {
      path: "/match/:id",
      component: MatchScoreboardPage,
      meta: { requiresAuth: true } // nécessite authentification - partie hors ligne
    },
    {
      path: '/fictive-control',
      component: MatchScoreboardFictifAdminPage,
      meta: { requiresAuth: true } // nécessite authentification - partie hors ligne
    },
    {
      path: '/fictive-display',
      component: MatchScoreboardFictifPage,
      meta: { requiresAuth: true } // nécessite authentification - partie hors ligne
    },


    {
      path: '/home-club',
      component: HomeClubPage,
    }
  ],
});

// nav guard pour vérifier l'authentification avant chaque route
router.beforeEach((to, from, next) => {
  if (to.matched.some(record => record.meta.requiresAuth)) {
    // cette route nécessite une authentification
    if (!isAuthenticated()) {
      // user non authentifié, redirection vers la page d'accueil
      next('/'); // Redirige vers la page d'accueil au lieu de la page de connexion
    } else {
      // user authentifié, continuer vers la route demandée
      next();
    }
  } else {
    // route qui ne nécessite pas d'authentification
    next();
  }
});

export default router;