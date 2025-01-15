import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'), // Utilise MainLayout comme wrapper principal
    children: [
      {
        path: '',
        component: () => import('pages/IndexPage.vue'), // Page d'accueil
      },
      {
        path: 'profile',
        component: () => import('pages/ProfilePage.vue'), // Route pour "Mon Profil"
      },
      {
        path: 'profile/edit',
        component: () => import('pages/ProfileEditPage.vue'),
      },
      {
        path: 'tournaments',
        component: () => import('pages/TournamentsPage.vue'), // Route pour "Tournois"
      },
    ],
  },
  {
    path: '/:catchAll(.*)*',
    redirect: '/', // Redirige vers la page d'accueil en cas de route inconnue
  },
];

export default routes;
