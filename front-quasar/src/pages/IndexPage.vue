<template>
  <q-page class="q-pa-none">
    <!-- Hero Section -->
    <div class="hero-section">
      <q-img
        src="https://daniele-sikirdji-schwob.fr/wp-content/uploads/2020/05/Daniele-Sikirdji-Schwob-_DSF4875.jpg"
        alt="Démonstration de Nippon Kempo"
        height="400px"
        style="width: 100%;"
      >
        <div class="absolute-full flex flex-center" style="background: rgba(0,0,0,0.4)">
          <div class="text-center" style="max-width: 800px; padding: 0 16px; position: relative">
            <div class="button-shadow"></div>
            <h1 class="text-h3 text-white text-weight-bold q-my-none">NIPPON KEMPO TOURNAMENT</h1>
            <h2 class="text-h5 text-white q-mt-md text-weight-medium text-italic">Un Art Martial, Une Passion, Une Compétition</h2>
            <q-btn 
              to="/tournaments"
              color="primary" 
              unelevated 
              size="lg" 
              class="q-mt-lg q-px-xl relative-z-index"
              label="S'inscrire aux tournois"
            />
          </div>
        </div>
      </q-img>
    </div>

    <!-- Reste de la page ... -->
    <div class="q-pa-md q-mt-xl">
      <h2 class="text-h4 text-center text-weight-bold">Un Tournoi Unique</h2>
      <p class="text-body1 text-center q-mt-md max-width-800 q-mx-auto">
        Le Nippon Kempo Tournament est l'événement phare de l'année pour tous les passionnés d'arts martiaux japonais. 
        Cette compétition unique en son genre rassemble les meilleurs pratiquants de Nippon Kempo venus de toute la France 
        et de l'international pour des affrontements spectaculaires et techniques.
      </p>
      <p class="text-body1 text-center q-mt-sm max-width-800 q-mx-auto">
        Que vous soyez débutant ou pratiquant confirmé, nos différentes catégories vous permettent de vous mesurer 
        à des adversaires de votre niveau dans un cadre sécurisé et bienveillant. Les équipements de protection 
        spécifiques au Nippon Kempo garantissent des combats intenses tout en préservant l'intégrité des participants.
      </p>
    </div>

    <!-- Cartes d'information -->
    <div class="q-pa-md q-mt-xl">
      <div class="row q-col-gutter-lg justify-center">
        <!-- Carte 1 -->
        <div class="col-12 col-sm-4" style="max-width: 350px">
          <q-card flat bordered class="card-hover">
            <q-card-section class="text-center">
              <h3 class="text-h5 q-mb-md">Une Discipline Complète</h3>
              <p class="text-body2 q-mb-md">
                Le Nippon Kempo représente l'excellence des arts martiaux japonais, combinant avec harmonie :
              </p>
              <ul class="text-left q-mt-sm">
                <li>Techniques de percussion (poings, pieds, coudes, genoux)</li>
                <li>Projections et techniques de corps à corps</li>
                <li>Combat au sol et immobilisations</li>
                <li>Stratégie et gestion de l'énergie</li>
              </ul>
            </q-card-section>
          </q-card>
        </div>

        <!-- Carte 2 -->
        <div class="col-12 col-sm-4" style="max-width: 350px">
          <q-card flat bordered class="card-hover">
            <q-card-section class="text-center">
              <h3 class="text-h5 q-mb-md">Des Combats de Haut Niveau</h3>
              <p class="text-body2 q-mb-md">
                Notre tournoi attire les meilleurs combattants qui s'affrontent dans différentes catégories :
              </p>
              <ul class="text-left q-mt-sm">
                <li>Catégories de poids et de grades</li>
                <li>Combats individuels et par équipes</li>
                <li>Catégories féminines et masculines</li>
                <li>Démonstrations techniques (kata)</li>
              </ul>
            </q-card-section>
          </q-card>
        </div>

        <!-- Carte 3 -->
        <div class="col-12 col-sm-4" style="max-width: 350px">
          <q-card flat bordered class="card-hover">
            <q-card-section class="text-center">
              <h3 class="text-h5 q-mb-md">Une Expérience Unique</h3>
              <p class="text-body2 q-mb-md">
                Au-delà de la compétition, le tournoi offre :
              </p>
              <ul class="text-left q-mt-sm">
                <li>Masterclass avec des experts japonais</li>
                <li>Ateliers techniques tous niveaux</li>
                <li>Démonstrations spectaculaires</li>
                <li>Village d'exposants (équipements, livres)</li>
              </ul>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>

    <!-- Section En savoir plus -->
    <div class="q-pa-md q-mt-xl text-center">
      <q-separator class="q-mx-auto" style="max-width: 300px" />
      <div class="q-mt-lg">
        <p class="text-h6">
          Vous souhaitez en apprendre davantage sur le Nippon Kempo ?
        </p>
        <q-btn
          outline
          color="primary"
          label="Découvrir sur Wikipédia"
          icon="open_in_new"
          type="a"
          href="https://fr.wikipedia.org/wiki/Nippon_kempo"
          target="_blank"
          class="q-mt-md"
        />
      </div>
    </div>

    <!-- Crédits -->
    <div class="q-pa-md q-mt-xl text-center text-grey-7">
      <small>
        Crédits photo: © Daniele Sikirdji-Schwob - Tous droits réservés
      </small>
    </div>
  </q-page>
</template>

<script setup lang="ts">
  // Pas de logique particulière pour l'instant
</script>

<style scoped>
/* Pour que le conteneur de l'overlay couvre toute la zone de l'image */
.absolute-full {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}

/* Limite la largeur de certains paragraphes */
.max-width-800 {
  max-width: 800px;
}

/* Effet de survol sur les cartes */
.card-hover {
  transition: all 0.3s ease;
  height: 100%;
}

.card-hover:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}

/* Style pour les listes */
ul {
  list-style-type: none;
  padding-left: 0;
}

ul li {
  padding: 8px 0;
  position: relative;
  padding-left: 24px;
}

ul li:before {
  content: "•";
  position: absolute;
  left: 8px;
  color: var(--q-primary);
}

.button-shadow {
  position: absolute;
  bottom: -25px;
  left: 50%;
  transform: translateX(-50%);
  width: 350px;
  height: 100px;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.125), rgba(255, 255, 255, 0.125));
  border-radius: 50%;
  filter: blur(15px);
  z-index: 0;
}

.relative-z-index {
  position: relative;
  z-index: 1;
}
</style>