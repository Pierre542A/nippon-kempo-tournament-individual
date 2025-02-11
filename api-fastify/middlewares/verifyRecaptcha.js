// middlewares/verifyRecaptcha.js

module.exports = function (recaptchaSecret) {
  return async function (req, reply) {
    // Middleware vide pour le moment
    // Vous pourrez implémenter la vérification reCAPTCHA ultérieurement
    // Actuellement, il permet simplement de continuer la requête
  };
};
