# Site Web Nippon Kempo Tournois

## À propos

Ce site web fait partie du projet de gestion des tournois de Nippon Kempo. Il permet aux utilisateurs de consulter le calendrier des tournois, de s'inscrire aux compétitions et de suivre leurs résultats en ligne.

### Fonctionnalités

- Calendrier interactif des tournois
- Système d'inscription aux compétitions
- Visualisation des résultats personnels
- Interface d'administration des tournois
- Gestion des comptes utilisateurs
- Affichage des statistiques des compétitions

## Technologies

- Frontend: Vue.js avec Quasar Framework
- Style: TailwindCSS
- Backend: Node.js avec Fastify
- Base de données: MySQL
- Authentication: JWT

## Installation

1. Cloner le repository
```bash
git clone [URL_DU_REPO]
cd nippon-kempo-web
```

2. Installer les dépendances
```bash
npm install
```

3. Configurer l'environnement
```bash
cp .env.example .env
# Éditer le fichier .env avec vos configurations
```

4. Lancer en développement
```bash
npm run dev
```

## Structure du projet

```
├── src/
│   ├── components/    # Composants réutilisables
│   ├── views/        # Pages du site
│   ├── services/     # Services API
│   ├── store/        # État global
│   └── utils/        # Fonctions utilitaires
├── public/           # Assets statiques
└── tests/           # Tests unitaires
```

## Rôles utilisateurs

- **Visiteur**: Consultation du calendrier
- **Utilisateur**: Inscription aux tournois, consultation des résultats
- **Administrateur**: Gestion des tournois et des utilisateurs
- **Gestionnaire**: Administration des compétitions

## Tests

```bash
# Tests unitaires
npm run test

# Tests e2e
npm run test:e2e
```

## Déploiement

```bash
npm run build
```
Les fichiers de production seront générés dans le dossier `dist/`

## Contact

Pierre SPREDER
Projet CESI École d'ingénieurs 2024-2025