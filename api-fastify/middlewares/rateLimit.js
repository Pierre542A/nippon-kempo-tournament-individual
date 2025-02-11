// Durées de blocage pour chaque nombre d'infractions (de 1 à 15) :
// Infraction  1 : 1 minute
// Infraction  2 : 10 minutes
// Infraction  3 : 1 heure, 40 minutes
// Infraction  4 : 16 heures, 40 minutes
// Infraction  5 : 6 jours, 22 heures, 40 minutes
// Infraction  6 : 69 jours, 10 heures, 40 minutes
// Infraction  7 : 1 an, 329 jours, 1 heure, 46 minutes, 40 secondes
// Infraction  8 : 19 ans, 6 mois, 22 jours, 17 heures, 46 minutes, 40 secondes
// Infraction  9 : 190 ans, 11 mois, 19 jours, 11 heures, 46 minutes, 40 secondes
// Infraction 10 : 1 909 ans, 3 mois, 17 jours, 19 heures, 46 minutes, 40 secondes
// Infraction 11 : 19 093 ans, 7 mois, 25 jours, 15 heures, 46 minutes, 40 secondes
// Infraction 12 : 190 937 ans, 1 mois, 3 jours, 11 heures, 46 minutes, 40 secondes
// Infraction 13 : 1 909 372 ans, 0 mois, 9 jours, 7 heures, 46 minutes, 40 secondes
// Infraction 14 : 19 093 724 ans, 4 mois, 17 jours, 3 heures, 46 minutes, 40 secondes
// Infraction 15 : 190 937 248 ans, 10 mois, 24 jours, 23 heures, 46 minutes, 40 secondes

const rateLimitData = {};
const RATE_LIMIT_WINDOW = 60 * 1000; // Fenêtre de 1 minute pour le comptage des requêtes
const MAX_REQUESTS = 60; // Nombre maximal de requêtes autorisées dans la fenêtre
const BASE_BLOCK_TIME = 60 * 1000; // Durée de blocage initiale de 1 minute
const RESET_TIME = 24 * 60 * 60 * 1000; // Réinitialisation des infractions après 1 jour
const MULTIPLIER = 10; // Multiplicateur exponentiel pour la durée de blocage

function formatTime(ms) {
  const units = [
    { label: 'an(s)', ms: 365 * 24 * 60 * 60 * 1000 },
    { label: 'mois', ms: 30 * 24 * 60 * 60 * 1000 },
    { label: 'jour(s)', ms: 24 * 60 * 60 * 1000 },
    { label: 'heure(s)', ms: 60 * 60 * 1000 },
    { label: 'minute(s)', ms: 60 * 1000 },
    { label: 'seconde(s)', ms: 1000 },
  ];

  let remainingMs = ms;
  const parts = [];

  for (const unit of units) {
    const value = Math.floor(remainingMs / unit.ms);
    if (value > 0) {
      parts.push(`${value} ${unit.label}`);
      remainingMs %= unit.ms;
    }
  }

  if (parts.length === 0) {
    return "0s";
  }

  return parts.join(', ');
}

async function rateLimit(req, reply) {
  const ip = req.ip;
  const currentTime = Date.now();

  if (!rateLimitData[ip]) {
    rateLimitData[ip] = {
      count: 1,
      startTime: currentTime,
      violations: 0,
      blockUntil: 0,
    };
    return;
  }

  const ipData = rateLimitData[ip];

  if (currentTime - ipData.blockUntil > RESET_TIME) {
    ipData.violations = 0;
  }

  let isBlocked = false;
  let blockTime = 0;

  if (currentTime < ipData.blockUntil) {
    isBlocked = true;
    blockTime = ipData.blockUntil - currentTime;
  } else {
    const elapsedTime = currentTime - ipData.startTime;

    if (elapsedTime < RATE_LIMIT_WINDOW) {
      ipData.count += 1;

      if (ipData.count > MAX_REQUESTS) {
        ipData.violations += 1;

        blockTime = BASE_BLOCK_TIME * Math.pow(MULTIPLIER, ipData.violations - 1);
        ipData.blockUntil = currentTime + blockTime;
        isBlocked = true;

        ipData.count = 0;
        ipData.startTime = currentTime;
      }
    } else {
      ipData.count = 1;
      ipData.startTime = currentTime;
    }
  }

  if (isBlocked) {
    const remainingTimeMs = ipData.blockUntil - currentTime;
    const formattedTime = formatTime(remainingTimeMs);

    return reply.code(429).send({
      error: `On vous voit venir avec votre IP (${ip})... Trop de requêtes en si peu de temps ? Intéressant. Continuez comme ça, et on va tester ensemble à quel point vous aimez attendre. 😏`,
      details: `Vous êtes bloqué(e) pour encore ${formattedTime}.`,
    });
    
  }
}

module.exports = rateLimit;