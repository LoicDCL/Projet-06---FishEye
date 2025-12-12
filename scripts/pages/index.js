
// IMPORTS
import photographerTemplate from '../templates/photographer.js';


// RÉCUPÉRATION DES DONNÉES
async function getPhotographers() {
    const res = await fetch('./data/photographers.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    console.log('Données chargées :', data);
    return data;
}


// AFFICHAGE DES DONNÉES
function displayData(photographers) {
    // Sélection du conteneur
    const section = document.querySelector('.photographer_section');
    section.innerHTML = '';
    // Parcours et création carte pour photographe
    photographers.forEach(photographer => {
        // Construction carte selon template
        const card = photographerTemplate(photographer).getUserCardDOM();
        // Insertion carte fin conteneur
        section.appendChild(card);
    });
}


// INITIALISATION
async function init() {
    // Récupération propriété "photographers"
    const { photographers } = await getPhotographers();
    // Affichage cartes page
    displayData(photographers);
}

init();