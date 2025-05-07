import { defineRouter } from '#q-app/wrappers';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';
import routes from './routes';
import { useUserStore } from 'src/stores/user';
import { Notify } from 'quasar';

export default defineRouter(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : (process.env.VUE_ROUTER_MODE === 'history' ? createWebHistory : createWebHashHistory);

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(process.env.VUE_ROUTER_BASE),
  });

  // Navigation Guard pour gérer les accès selon le rôle
  Router.beforeEach(async (to, from, next) => {
    const userStore = useUserStore();
    
    // Pages accessibles sans connexion
    const publicPages = ['/', '/tournaments', '/reset-password'];
    // Pages qui nécessitent une connexion
    const authRequired = !publicPages.includes(to.path) && !to.path.startsWith('/reset-password');
    
    // Important : Vérifier la session avant de prendre une décision
    // Si l'utilisateur n'est pas connecté mais a un cookie, essayons de récupérer la session
    if (!userStore.connected) {
      try {
        // Utilisez un flag pour éviter les boucles infinies
        if (!userStore.loading) {
          await userStore.fetchSession();
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de session:', error);
      }
    }
    
    // Vérification de connexion après tentative de récupération de session
    const loggedIn = userStore.connected;
    // Rôle de l'utilisateur
    const userRole = userStore.user?.id_role;
    
    // Si la page nécessite une connexion et l'utilisateur n'est pas connecté
    if (authRequired && !loggedIn) {
      Notify.create({
        color: 'negative',
        message: 'Vous devez être connecté pour accéder à cette page',
        position: 'top',
        timeout: 2000
      });
      return next('/');
    }
    
    // Règles spécifiques aux rôles
    
    // Admin : accès à /admin uniquement
    if (to.path.startsWith('/admin') && userRole !== 1) {
      Notify.create({
        color: 'negative',
        message: 'Accès réservé aux administrateurs',
        position: 'top',
        timeout: 2000
      });
      return next('/');
    }
    
    // Gestionnaire : accès à /manager uniquement
    if (to.path.startsWith('/manager') && userRole !== 2) {
      Notify.create({
        color: 'negative',
        message: 'Accès réservé aux gestionnaires',
        position: 'top',
        timeout: 2000
      });
      return next('/');
    }
    
    // Si tout est OK, continuer
    next();
  });

  return Router;
});