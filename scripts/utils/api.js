// ============================================================================
// API - Récupération des données photographes
// ============================================================================
// Fichier : api.js
// Description : Module centralisé pour la récupération des données JSON
// Fonctionnalités :
// - Charge le fichier photographers.json
// - Vérifie le statut HTTP
// - Gère les erreurs de chargement
// ============================================================================

/**
 * FONCTION : getDB
 * ----------------
 * Récupère la base de données complète (photographes + médias)
 * Utilisée par les pages index.html et photographer.html
 * 
 * @returns {Promise<Object>} - Objet contenant :
 *   - photographers {Array} : Liste des photographes
 *   - media {Array} : Liste de tous les médias
 * 
 * @throws {Error} - Si le chargement échoue (404, erreur réseau, etc.)
 * 
 * @example
 * const { photographers, media } = await getDB();
 */
export async function getDB() {
    // Lancement de la requête HTTP GET vers le fichier JSON
    // fetch() renvoie une Promesse qui se résout en objet Response
    const res = await fetch("data/photographers.json");

    // Vérification du statut HTTP
    // res.ok est true pour les codes 200-299 (succès)
    // Si échec, on rejette la Promesse avec une erreur
    if (!res.ok) throw new Error("Chargement des données impossible");

    // Conversion du contenu JSON en objet JavaScript
    // res.json() parse le JSON et renvoie une Promesse
    return res.json();
}