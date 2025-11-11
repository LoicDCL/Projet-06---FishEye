// ============================================================================
// PAGE D'ACCUEIL - Affichage de la liste des photographes
// ============================================================================
// Fichier : index.js
// Description : Charge et affiche tous les photographes sur la page d'accueil
// Fonctionnalités :
// - Récupération des données depuis le fichier JSON
// - Génération dynamique des cartes photographes
// - Gestion des erreurs de chargement
// ============================================================================

// ============================================================================
// 1. IMPORTS
// ============================================================================
import photographerTemplate from '../templates/photographer.js';

// ============================================================================
// 2. RÉCUPÉRATION DES DONNÉES
// ============================================================================

/**
 * Récupère les données depuis le fichier JSON
 * @returns {Promise<Object>} - Objet contenant photographers et media
 */
async function getPhotographers() {
    // Requête HTTP GET vers le fichier JSON
    const res = await fetch('./data/photographers.json');

    // Vérification du statut HTTP (200-299 = succès)
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    // Conversion du contenu en objet JavaScript
    const data = await res.json();

    // Log pour vérification en développement
    console.log('Données chargées :', data);

    // Renvoie les données
    return data;
}

// ============================================================================
// 3. AFFICHAGE DES DONNÉES
// ============================================================================

/**
 * Construit et affiche les cartes de photographes dans le DOM
 * @param {Array} photographers - Tableau des photographes à afficher
 */
function displayData(photographers) {
    // Sélection du conteneur où injecter les cartes
    const section = document.querySelector('.photographer_section');

    // Nettoyage complet du conteneur
    section.innerHTML = '';

    // Parcours du tableau et création d'une carte pour chaque photographe
    photographers.forEach(photographer => {
        // Construction de la carte selon le template défini
        const card = photographerTemplate(photographer).getUserCardDOM();

        // Insertion de la carte à la fin du conteneur
        section.appendChild(card);
    });
}

// ============================================================================
// 4. INITIALISATION
// ============================================================================

/**
 * Fonction d'initialisation - Point d'entrée de l'application
 * Charge les données et affiche les photographes
 */
async function init() {
    // Récupération de la propriété "photographers" depuis les données
    const { photographers } = await getPhotographers();

    // Affichage des cartes dans la page
    displayData(photographers);
}

// ============================================================================
// 5. DÉMARRAGE
// ============================================================================

// Appel immédiat de la fonction d'initialisation au chargement du script
init();