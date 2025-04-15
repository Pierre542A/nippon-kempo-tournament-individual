# Système de Gestion des Tournois de Nippon Kempo

![Logo Nippon Kempo](./src/assets/logo.png)

## 📋 Présentation

Ce projet est une plateforme web complète dédiée à la gestion des tournois de Nippon Kempo. Elle permet aux utilisateurs de consulter le calendrier des événements, de s'inscrire aux compétitions et de suivre leurs résultats en ligne dans une interface intuitive et responsive.

## ✨ Fonctionnalités

- **Gestion des tournois** : Calendrier des compétitions, détails des événements
- **Système d'inscription** : Inscription des participants aux différentes catégories
- **Suivi des résultats** : Tableau des scores et classements en temps réel
- **Espace personnel** : Historique des participations et performances individuelles
- **Administration** : Interface de gestion pour les organisateurs de tournois
- **Statistiques** : Visualisation des données et analyse des compétitions

## 🛠️ Technologies

### Frontend
- **Framework** : Vue.js 3 avec Composition API
- **UI Framework** : Quasar Framework
- **Styling** : CSS/SCSS
- **État** : Pinia (gestionnaire d'état)

### Backend
- **Runtime** : Node.js
- **Framework** : Fastify
- **Base de données** : MySQL 2
- **Authentication** : JWT (JSON Web Tokens)
- **Mailing** : Mailjet

## 🚀 Installation

### Prérequis
- Node.js (v16 ou supérieur)
- Docker et Docker Compose
- Git

### Étapes d'installation

1. **Cloner le dépôt**
   ```bash
   git clone https://github.com/username/nippon-kempo-tournament.git
   cd nippon-kempo-tournament
   ```

2. **Configuration**
   Créez un fichier `.env` à la racine du projet avec les variables suivantes :
   ```
   MYSQL_HOST=mysql-bdd
   MYSQL_USER=user
   MYSQL_ROOT_PASSWORD=rootpassword
   MYSQL_PASSWORD=password
   MYSQL_DATABASE=mydatabase_nippon_kempo_project
   JWT_SECRET=test
   VITE_API_URL=http://localhost:3000
   MJ_APIKEY_PUBLIC=bcf15c6b66dc91b906cf73c904da0fdd
   MJ_APIKEY_PRIVATE=159499a6b3db43bc7d2fcaa41f57845b
   RECAPTCHA_SECRET=null
   COOKIE_SECRET=a-secret-with-at-least-32-characters
   ```

3. **Lancement**
   ```bash
   # Assurez-vous que Docker est en cours d'exécution
   # Puis lancez le fichier start.bat (Windows)
   start.bat
   
   # Ou si vous êtes sur Linux/Mac
   ./start.sh
   ```

## 📁 Structure du projet

```
src/
├── assets/            # Images, polices et autres ressources
├── boot/              # Scripts d'initialisation Quasar
├── components/        # Composants Vue réutilisables
│   ├── tournaments/   # Composants liés aux tournois
│   ├── users/         # Composants liés aux utilisateurs
│   └── common/        # Composants communs (boutons, modals, etc.)
├── css/               # Fichiers CSS/SCSS
├── layouts/           # Mises en page de l'application
├── pages/             # Pages de l'application
├── router/            # Configuration des routes
├── services/          # Services API et logique métier
├── store/             # Magasins Pinia
├── App.vue            # Composant racine
└── app.d.ts           # Déclarations TypeScript
```

## 👥 Rôles utilisateurs

| Rôle | Permissions |
|------|-------------|
| **Visiteur** | Consultation du calendrier, visualisation des résultats publics |
| **Utilisateur** | Inscription aux tournois, gestion du profil, consultation des résultats personnels |
| **Gestionnaire** | Administration des compétitions, gestion des participants |
| **Administrateur** | Gestion complète des tournois, des utilisateurs et de la plateforme |

## 🧪 Tests

```bash
# Exécuter les tests unitaires
npm run test

# Exécuter les tests end-to-end
npm run test:e2e
```

## 📱 Compatibilité

- Navigateurs modernes (Chrome, Firefox, Safari, Edge)
- Design responsive pour mobile, tablette et desktop

## 📞 Contact

**SPREDER Pierre**  
Projet CESI École d'ingénieurs  
NIPPON KEMPO 2025

---

&copy; 2025 SPREDER Pierre | Tous droits réservés
