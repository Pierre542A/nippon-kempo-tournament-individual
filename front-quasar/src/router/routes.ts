import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        component: () => import('pages/IndexPage.vue'),
        meta: {
          title: 'Nippon Kempo Tournament'
        }
      },
      {
        path: 'profile',
        component: () => import('pages/ProfilePage.vue'),
        meta: {
          title: 'Mon Profil'
        }
      },
      {
        path: 'profile/edit',
        component: () => import('pages/ProfileEditPage.vue'),
        meta: {
          title: 'Modification du profil'
        }
      },
      {
        path: 'tournaments',
        component: () => import('pages/TournamentsPage.vue'),
        meta: {
          title: 'Tournois'
        }
      },
      {
        path: 'admin',
        component: () => import('pages/AdminPage.vue'),
        meta: {
          title: 'Administration',
          requiresAuth: true,
          requiresAdmin: true
        }
      },
      {
        path: 'manager',
        component: () => import('pages/ManagerPage.vue'),
        meta: {
          title: 'Espace Gestionnaire',
          requiresAuth: true,
          requiresManager: true
        }
      },
      {
        path: 'reset-password',
        component: () => import('pages/ResetPasswordPage.vue'),
        meta: {
          title: 'Réinitialisation de mot de passe'
        }
      },
    ],
  },
  {
    path: '/:catchAll(.*)*',
    redirect: '/',
  },
];

export default routes;