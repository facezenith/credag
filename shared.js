// shared.js

/**
 * Fonction de formatage d'argent en EUR.
 * @param {number} amount
 * @returns {string}
 */
function formatCurrency(amount) {
    if (typeof amount !== 'number' || isNaN(amount)) return '0,00 €';
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
    }).format(amount);
}

/**
 * Vérifie l'état d'authentification de l'utilisateur.
 * Si l'utilisateur n'est pas connecté ou si les données de session ne sont pas chargées, redirige.
 * @returns {object|null} Les données de session utilisateur si l'authentification est OK, sinon null.
 */
function checkAuth() {
    if (typeof getCurrentUser !== 'function') {
        console.error("Erreur: La fonction getCurrentUser() est introuvable (data.js manquant).");
        window.location.href = 'index.html';
        return null;
    }

    const userData = getCurrentUser();

    // L'utilisateur doit être authentifié ET avoir un ID de document pour charger les données Firestore.
    if (userData && userData.isAuthenticated && userData.docId) { 
        return userData;
    } else {
        // Redirection vers la page de connexion si pas d'utilisateur ou pas authentifié
        console.log("Session non valide ou ID Firestore manquant. Redirection.");
        window.location.href = 'index.html';
        return null;
    }
}

// Fonction de déconnexion
document.addEventListener('DOMContentLoaded', () => {
    const logoutLink = document.getElementById('logoutLink');
    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (typeof initializeData === 'function') {
                initializeData();
            }
            window.location.href = 'index.html';
        });
    }
});