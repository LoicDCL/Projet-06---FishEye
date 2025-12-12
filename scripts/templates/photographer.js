
// TEMPLATE PHOTOGRAPHE

export default function photographerTemplate(p) {
  const { name, id, city, country, tagline, price, portrait } = p;
  const picture = `assets/photographers/${portrait}`;

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