@echo off
chcp 65001 > nul
title 🚀 Lancement du projet - Nippon Kempo

:: Définition des couleurs
echo ======================================================
echo        🚀 DÉMARRAGE DU PROJET NIPPON KEMPO 🚀
echo ======================================================
echo.

:: Étape 1 - Arrêt des conteneurs et suppression forcée
echo 🔴 [1/5] Arrêt et suppression des anciens conteneurs...
docker rm -f fastify-api front-quasar mysql-bdd phpmyadmin > nul 2>&1
docker-compose down -v
echo ✅ Conteneurs arrêtés et supprimés avec succès !
echo.

:: Étape 2 - Démarrage de la base de données
echo 🔵 [2/5] Démarrage de la base de données MySQL...
docker-compose up -d mysql-bdd phpmyadmin
if %errorlevel% neq 0 (
    echo ❌ Erreur lors du démarrage de la base de données !
    pause
    exit /b
)
echo ✅ Base de données démarrée avec succès !
echo.

:: Étape 3 - Construction et démarrage de l'API Fastify
echo 🟢 [3/5] Construction et démarrage de l'API Fastify...
docker-compose up -d --build api-fastify
if %errorlevel% neq 0 (
    echo ❌ Erreur lors du démarrage de l'API Fastify !
    pause
    exit /b
)
echo ✅ API Fastify lancée avec succès !
echo.

:: Étape 4 - Construction et démarrage du front Quasar
echo 🟡 [4/5] Construction et démarrage du front Quasar...
docker-compose up -d --build front-quasar
if %errorlevel% neq 0 (
    echo ❌ Erreur lors du démarrage du Front Quasar !
    pause
    exit /b
)
echo ✅ Front Quasar opérationnel !
start http://localhost:8080
echo.

:: Étape 6 - Vérification des conteneurs en cours d'exécution
echo 🏗️  [5/5] Liste des conteneurs en cours d'exécution :
docker ps
echo.

echo ======================================================
echo       🎉 🚀 Tout est lancé avec succès ! 🚀 🎉
echo ======================================================
echo 📌 Accès à l'API      : http://localhost:3000
echo 📌 Accès à la BDD     : http://localhost:8081 (phpMyAdmin)
echo 📌 Accès au Frontend  : http://localhost:8080
echo 📌 Application Electron: Démarrée en local
echo.
echo 🌟 Bon développement ! 🌟
pause