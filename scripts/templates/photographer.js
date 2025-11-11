// ============================================================================
// TEMPLATE PHOTOGRAPHE - Génération de cartes photographes
// ============================================================================
// Fichier : photographer.js (template)
// Description : Factory pour créer des cartes photographes sur la page d'accueil
// Utilise le pattern Factory pour encapsuler la logique de création
// ============================================================================

/**
 * FONCTION : photographerTemplate
 * --------------------------------
 * Crée un objet contenant les méthodes pour générer une carte photographe
 * Utilisé sur la page d'accueil (index.html)
 * 
 * @param {Object} p - Objet photographe provenant du JSON
 * @param {string} p.name - Nom complet du photographe
 * @param {number} p.id - Identifiant unique
 * @param {string} p.city - Ville
 * @param {string} p.country - Pays
 * @param {string} p.tagline - Phrase d'accroche
 * @param {number} p.price - Tarif journalier en euros
 * @param {string} p.portrait - Nom du fichier portrait
 * 
 * @returns {Object} - Objet avec méthode getUserCardDOM()
 * 
 * @example
 * const template = photographerTemplate(photographer);
 * const card = template.getUserCardDOM();
 * container.appendChild(card);
 */
export default function photographerTemplate(p) {
  // Déstructuration des propriétés du photographe
  const { name, id, city, country, tagline, price, portrait } = p;
  
  // Construction du chemin complet vers l'image de portrait
  const picture = `assets/photographers/${portrait}`;

  /**
   * Génère l'élément DOM de la carte photographe
   * @returns {HTMLElement} - Lien <a> contenant la carte complète
   */
  function getUserCardDOM() {
    // Création du lien cliquable vers la page du photographe
    const link = document.createElement('a');
    link.href = `photographer.html?id=${id}`;
    link.className = 'card';
    link.setAttribute('aria-label', `${name}, ${city}, ${country}`);
    
    // Construction du HTML de la carte
    link.innerHTML = `
      <article>
        <img class="card__img" src="${picture}" alt="${name}" loading="lazy" />
        <h2 class="card__name">${name}</h2>
        <p class="card__location">${city}, ${country}</p>
        <p class="card__tagline">${tagline}</p>
        <p class="card__price">${price}€/jour</p>
      </article>
    `;
    
    return link;
  }

  // Renvoie un objet avec la méthode publique
  return { getUserCardDOM };
}