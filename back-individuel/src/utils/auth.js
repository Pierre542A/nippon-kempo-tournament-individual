/**
 * verif si l'utilisateur est authentifié via le cookie nk_auth
 * @returns {boolean} true si authentifié, false sinon
 */
export function isAuthenticated() {
    return document.cookie.split(';').some((item) => item.trim().startsWith('nk_auth='));
}

/**
 * creee un cookie d'authentification valide pour 24 heures
 */
export function createAuthCookie() {
    const expirationDate = new Date();
    expirationDate.setTime(expirationDate.getTime() + (24 * 60 * 60 * 1000));
    document.cookie = `nk_auth=true; expires=${expirationDate.toUTCString()}; path=/`;
}