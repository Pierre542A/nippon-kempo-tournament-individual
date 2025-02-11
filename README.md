# Site Web Nippon Kempo Tournois

## À propos

Ce site web fait partie du projet de gestion des tournois de Nippon Kempo. Il permet aux utilisateurs de consulter le calendrier des tournois, de s'inscrire aux compétitions et de suivre leurs résultats en ligne.

### Fonctionnalités [à retravailler]

- Système d'inscription aux compétitions
- Visualisation des résultats personnels
- Interface utilisateur des tournois
- Gestion du compte utilisateurs
- Affichage des statistiques des compétitions

## Technologies

- Frontend: Vue.js avec "Quasar Framework"
- Style: CSS
- Backend: Node.js avec "Fastify"
- Base de données: MySQL2
- Authentication: JWT

## Installation [à retravailler]

1. Cloner le repository
```bash
git clone [URL_DU_REPO]
cd nippon-kempo-web
```

2. Installer les dépendances
```bash
npm install
```

3. Lancer le développement
```bash
quasar dev
```

## Structure du projet [à retravailler]

```
src/
├── assets/        # Images, fonts et autres assets
├── boot/          # Scripts de démarrage Quasar
├── components/    # Composants Vue réutilisables
├── css/           # Fichiers CSS/Stylesheets
├── layouts/       # Layouts de l'application
├── pages/         # Pages de l'application
├── router/        # Configuration des routes
├── App.vue        # Composant racine
└── app.d.ts       # Déclarations TypeScript
```

## Rôles utilisateurs [à retravailler]

- **Visiteur**: Consultation du calendrier
- **Utilisateur**: Inscription aux tournois, consultation des résultats
- **Administrateur**: Gestion des tournois et des utilisateurs
- **Gestionnaire**: Administration des compétitions

## Tests [à retravailler]

```bash
# Tests unitaires
npm run test

# Tests e2e
npm run test:e2e
```

## Contact

Pierre SPREDER
Projet CESI École d'ingénieurs 2024-2025