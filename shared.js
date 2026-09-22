/* ==========================================================================
   SHARED.JS - Gestion de l'authentification & Firestore (GTCO / Banque)
   ========================================================================== */

// --- 1. CONFIGURATION & INITIALISATION FIREBASE FIRESTORE ---
// Remplacez ces valeurs par vos propres identifiants Firebase si ce n'est pas déjà fait
const firebaseConfig = {
    apiKey: "AIzaSyBXQnoenWmWvYgoKT2qWQfk5j4cVLWZr4Y",
            authDomain: "acs-v-e6ef3.firebaseapp.com",
            projectId: "acs-v-e6ef3",
            storageBucket: "acs-v-e6ef3.firebasestorage.app",
            messagingSenderId: "849135031406",
            appId: "1:849135031406:web:88f7deadc5569357d4027f"
        };

// Initialisation sécurisée de Firebase (évite les erreurs de réinitialisation)
let db;
if (typeof firebase !== 'undefined') {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    db = firebase.firestore();
} else {
    console.warn("Firebase SDK n'est pas encore chargé sur cette page.");
}

// --- 2. GESTION DE L'AUTHENTIFICATION & DU PROFIL ---

/**
 * Vérifie si l'utilisateur est connecté et valide ses privilèges.
 * @param {boolean} requireAdmin - Si true, bloque l'accès aux non-administrateurs.
 * @returns {Object|null} L'objet utilisateur courant ou null en cas de redirection.
 */
function checkAuth(requireAdmin = false) {
    const userJson = localStorage.getItem('currentUser');

    if (!userJson) {
        console.warn("Aucune session active. Redirection vers la page de connexion.");
        redirectToLogin();
        return null;
    }

    let user;
    try {
        user = JSON.parse(userJson);
    } catch (e) {
        console.error("Session corrompue.");
        logout();
        return null;
    }

    // Vérification du rôle Administrateur pour manage.html
    if (requireAdmin && !user.isAdmin) {
        alert("Accès refusé. Droits d'administration requis.");
        window.location.href = 'dashboard.html';
        return null;
    }

    return user;
}

/**
 * Redirige l'utilisateur vers la page de connexion
 */
function redirectToLogin() {
    if (!window.location.pathname.endsWith('index.html') && !window.location.pathname.endsWith('login.html')) {
        window.location.href = 'index.html';
    }
}

/**
 * Déconnecte l'utilisateur et efface la session
 */
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// --- 3. SYNCHRONISATION EN TEMPS RÉEL AVEC FIRESTORE ---

/**
 * Ecoute les modifications en direct dans Firestore pour l'utilisateur connecté
 * Maintient à jour le localStorage et rafraîchit l'interface.
 */
function syncCurrentUserFromFirestore(callback) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || !currentUser.clientCode || !db) return;

    // Écoute en temps réel sur la collection "users"
    db.collection('users')
      .where('clientCode', '==', currentUser.clientCode)
      .onSnapshot((snapshot) => {
          if (!snapshot.empty) {
              snapshot.forEach((doc) => {
                  const updatedData = { id: doc.id, ...doc.data() };
                  
                  // Mettre à jour la session locale
                  localStorage.setItem('currentUser', JSON.stringify(updatedData));
                  
                  // Si le compte est bloqué à distance par l'admin, alerte et déconnexion
                  if (updatedData.isLocked && !updatedData.isAdmin) {
                      alert("Votre compte a été bloqué par l'administration. Motif : " + (updatedData.lockReason || "Sécurité"));
                      logout();
                      return;
                  }

                  // Exécuter la fonction de mise à jour UI spécifique à la page si elle existe
                  if (typeof callback === 'function') {
                      callback(updatedData);
                  }
              });
          }
      }, (error) => {
          console.error("Erreur de synchronisation Firestore :", error);
      });
}

/**
 * Récupère la liste complète de tous les utilisateurs (pour la page admin manage.html)
 */
async function getAllUsersFromFirestore() {
    if (!db) return [];
    try {
        const snapshot = await db.collection('users').get();
        const users = [];
        snapshot.forEach(doc => {
            users.push({ id: doc.id, ...doc.data() });
        });
        // Mettre en cache localement
        localStorage.setItem('users', JSON.stringify(users));
        return users;
    } catch (error) {
        console.error("Erreur de récupération des utilisateurs :", error);
        return JSON.parse(localStorage.getItem('users')) || [];
    }
}

/**
 * Met à jour un utilisateur dans Firestore depuis le panneau admin
 */
async function updateUserInFirestore(userId, updatedFields) {
    if (!db || !userId) return false;
    try {
        await db.collection('users').doc(userId).update(updatedFields);
        return true;
    } catch (error) {
        console.error("Erreur lors de la mise à jour Firestore :", error);
        throw error;
    }
}

// --- 4. UTILITIES (FORMATAGE DE DEVISES & INITIALISATION AUTO) ---

/**
 * Formate un nombre en devises (Ex: 1 250,00 €)
 */
function formatCurrency(amount) {
    const numericAmount = parseFloat(amount) || 0;
    return numericAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
}

// Attacher l'événement de déconnexion globalement si le lien existe sur la page
document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logoutLink');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
});