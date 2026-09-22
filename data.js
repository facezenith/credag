// data.js

// CLÉ UNIQUE UTILISÉE POUR LE STOCKAGE LOCAL DE L'ÉTAT DE LA SESSION
const LS_KEY_USER_DATA = 'ma_banque_currentUserData';

/**
 * Récupère les données de session (ID de document et état auth) depuis le localStorage.
 * NE contient PLUS le solde ou d'autres données du compte.
 * @returns {object|null} Les données de session utilisateur.
 */
function getCurrentUser() {
    const storedData = localStorage.getItem(LS_KEY_USER_DATA);

    if (storedData) {
        return JSON.parse(storedData); 
    }
    
    return null;
}

/**
 * Sauvegarde les données de session utilisateur (docId et isAuthenticated) dans le localStorage.
 * @param {object} userSession - L'objet contenant { docId, isAuthenticated, ... autres IDs importants }.
 */
function saveCurrentUser(userSession) {
    localStorage.setItem(LS_KEY_USER_DATA, JSON.stringify(userSession));
}

/**
 * Fonction pour réinitialiser les données de session lors de la déconnexion.
 */
function initializeData() {
    localStorage.removeItem(LS_KEY_USER_DATA);
    // Assurez-vous d'ajouter ici toute autre clé de stockage qui doit être effacée
    localStorage.removeItem('authType');
}
