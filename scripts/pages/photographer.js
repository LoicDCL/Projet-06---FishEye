// ============================================================================
// PAGE PHOTOGRAPHE - Gestion complète de la page individuelle
// ============================================================================
// Fichier : photographer.js
// Description : Affiche le profil d'un photographe et sa galerie de médias
// Fonctionnalités :
// - Affichage du header photographe
// - Galerie de médias avec tri (popularité, date, titre)
// - Badge tarif/jour avec compteur de likes
// - Intégration lightbox et système de likes
// ============================================================================

// ============================================================================
// 1. IMPORTS
// ============================================================================
import { getDB } from "../utils/api.js";
import { mediaFactory } from "../factories/mediaFactory.js";
import { setupLightbox } from "../components/lightbox.js";

// ============================================================================
// 2. VARIABLES GLOBALES
// ============================================================================

let items = [];                 // Liste des médias du photographe
let currentSort = "popularity"; // Clé de tri actuellement sélectionnée

// Session de likes (persiste dans la session utilisateur)
window.__likeSession = window.__likeSession || new Map();

// ============================================================================
// 3. RÉCUPÉRATION DE L'ID PHOTOGRAPHE
// ============================================================================

/**
 * Récupère l'ID du photographe depuis l'URL (?id=243)
 * @returns {number} - ID du photographe (NaN si absent)
 */
function getPhotographerIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return Number(params.get("id"));
}

// ============================================================================
// 4. SYSTÈME DE TRI
// ============================================================================

/**
 * Trie une liste de médias selon la clé fournie
 * @param {Array} list - Liste de médias à trier
 * @param {string} key - Clé de tri ("date", "title", "popularity")
 * @returns {Array} - Nouvelle liste triée
 */
function sortItems(list, key) {
    switch (key) {
        case "date":
            // Tri par date décroissante (plus récent d'abord)
            return [...list].sort((a, b) => new Date(b.date) - new Date(a.date));

        case "title":
            // Tri alphabétique (insensible à la casse, locale française)
            return [...list].sort((a, b) =>
                a.title.localeCompare(b.title, "fr", { sensitivity: "base" })
            );

        case "popularity":
        default:
            // Tri par likes décroissants (plus populaire d'abord)
            return [...list].sort((a, b) => (b.likes || 0) - (a.likes || 0));
    }
}

/**
 * Applique le tri sélectionné et re-génère la galerie
 * @param {string} key - Clé de tri à appliquer
 */
function applySortAndRender(key) {
    currentSort = key;

    // Tri et reconstruction de la galerie
    const sorted = sortItems(items, key);
    buildGallery(sorted);
    setupLightbox(); // Re-branche la lightbox (DOM modifié)

    // Mise à jour de l'UI du menu
    updateSortUI(key);
}

/**
 * Met à jour l'interface du menu de tri (bouton + options)
 * @param {string} key - Clé de tri sélectionnée
 */
function updateSortUI(key) {
    const labels = {
        date: "Date",
        title: "Titre",
        popularity: "Popularité"
    };
    const label = labels[key] || "Popularité";

    // Met à jour le texte du bouton
    const btnValue = document.querySelector(".sort__value");
    if (btnValue) {
        btnValue.dataset.sort = key;
        btnValue.textContent = label;
    }

    // Met à jour aria-selected sur les options
    document.querySelectorAll("#sort-list [role='option']").forEach(option => {
        const isSelected = option.dataset.sort === key;
        option.setAttribute("aria-selected", isSelected ? "true" : "false");
    });
}

// ============================================================================
// 5. CONTRÔLE DE TRI (MENU DÉROULANT)
// ============================================================================

/**
 * Monte le contrôle de tri (menu déroulant accessible)
 * Gère les interactions souris + clavier selon les specs ARIA
 */
function mountSortControl() {
    const wrapper = document.querySelector(".sort");
    const btn = document.getElementById("sort-button");
    const list = document.getElementById("sort-list");

    if (!wrapper || !btn || !list) return;

    // ------------------------------------------------------------------------
    // Fonctions d'ouverture/fermeture
    // ------------------------------------------------------------------------
    function open() {
        wrapper.dataset.open = "true";
        btn.setAttribute("aria-expanded", "true");
        list.hidden = false;

        // Focus sur l'option sélectionnée
        const selected = list.querySelector("[aria-selected='true']") || list.firstElementChild;
        if (selected) selected.focus();
    }

    function close() {
        wrapper.dataset.open = "false";
        btn.setAttribute("aria-expanded", "false");
        list.hidden = true;
        btn.focus();
    }

    function toggle() {
        wrapper.dataset.open === "true" ? close() : open();
    }

    // ------------------------------------------------------------------------
    // Interactions souris
    // ------------------------------------------------------------------------
    btn.addEventListener("click", (e) => {
        e.preventDefault();
        toggle();
    });

    list.addEventListener("click", (e) => {
        const option = e.target.closest("[role='option']");
        if (!option) return;

        applySortAndRender(option.dataset.sort);
        close();
    });

    // ------------------------------------------------------------------------
    // Navigation clavier (Bouton)
    // ------------------------------------------------------------------------
    btn.addEventListener("keydown", (e) => {
        if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            open();
        }
    });

    // ------------------------------------------------------------------------
    // Navigation clavier (Liste déroulante)
    // ------------------------------------------------------------------------
    list.addEventListener("keydown", (e) => {
        const options = Array.from(list.querySelectorAll("[role='option']"));
        const currentIndex = options.indexOf(document.activeElement);

        // Échap : ferme le menu
        if (e.key === "Escape") {
            e.preventDefault();
            close();
            return;
        }

        // Entrée / Espace : valide la sélection
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            const activeOption = document.activeElement;
            if (activeOption && activeOption.dataset.sort) {
                applySortAndRender(activeOption.dataset.sort);
                close();
            }
            return;
        }

        // Flèches : navigation entre options
        if (e.key === "ArrowDown") {
            e.preventDefault();
            const nextOption = options[currentIndex + 1] || options[currentIndex];
            nextOption.focus();
        }
        if (e.key === "ArrowUp") {
            e.preventDefault();
            const prevOption = options[currentIndex - 1] || options[currentIndex];
            prevOption.focus();
        }

        // Home / End : première / dernière option
        if (e.key === "Home") {
            e.preventDefault();
            options[0].focus();
        }
        if (e.key === "End") {
            e.preventDefault();
            options[options.length - 1].focus();
        }
    });

    // ------------------------------------------------------------------------
    // Fermeture au clic extérieur
    // ------------------------------------------------------------------------
    document.addEventListener("click", (e) => {
        if (!wrapper.contains(e.target) && wrapper.dataset.open === "true") {
            close();
        }
    });
}

// ============================================================================
// 6. AFFICHAGE DES DONNÉES
// ============================================================================

/**
 * Met à jour le badge tarif/jour (prix + compteur de likes)
 * @param {Object} photographer - Objet photographe
 * @param {number} totalLikes - Nombre total de likes
 */
function updateDailyRate(photographer, totalLikes = 0) {
    const rate = document.querySelector("#daily-rate");
    if (!rate) return;

    rate.classList.add("photographer-stats");
    rate.innerHTML = `
        <div class="likes-bloc">
            <span class="total-likes" aria-label="Nombre total de likes">${totalLikes}</span>
            <span class="heart" aria-hidden="true">♥</span>
        </div>
        <span class="price"><strong>${photographer.price}€</strong> / jour</span>
    `;
}

/**
 * Construit et injecte la grille de médias dans le DOM
 * @param {Array} mediaList - Liste des médias à afficher
 */
function buildGallery(mediaList) {
    const grid = document.querySelector("#media-gallery");
    if (!grid) return;

    // Vide le contenu actuel
    grid.innerHTML = "";

    // Utilise un fragment pour optimiser les insertions
    const fragment = document.createDocumentFragment();

    // Crée et ajoute chaque carte média
    mediaList.forEach(media => {
        fragment.appendChild(mediaFactory(media));
    });

    // Insertion en une seule fois (limite les reflows)
    grid.appendChild(fragment);
}

// ============================================================================
// 7. HEADER PHOTOGRAPHE
// ============================================================================

/**
 * Monte le header photographe (carte avec infos personnelles)
 * Préserve le bouton contact s'il existe déjà
 */
async function mountPhotographHeader() {
    const container = document.querySelector(".photograph-header");
    if (!container) return;

    // Récupère l'ID depuis l'URL
    const id = new URLSearchParams(window.location.search).get("id");

    // Charge les données JSON
    let data;
    try {
        const response = await fetch("data/photographers.json");
        data = await response.json();
    } catch (err) {
        container.insertAdjacentHTML(
            "afterbegin",
            `<p style="color:#c00">Impossible de charger les données.<br>${err}</p>`
        );
        return;
    }

    // Trouve le photographe correspondant
    const { photographers = [] } = data;
    let photographer = photographers.find(p => String(p.id) === String(id));

    // Fallback : prend le premier si ID invalide
    if (!photographer) photographer = photographers[0];

    if (!photographer) {
        container.insertAdjacentText("afterbegin", "Aucun photographe trouvé.");
        return;
    }

    // Construction du markup
    const markup = `
        <div class="card">
            <article class="card__body">
                <div class="card__avatar">
                    <img class="card__img"
                        src="assets/photographers/${photographer.portrait}"
                        alt="${photographer.name}"
                        loading="lazy" />
                </div>
            </article>
        </div>
        <div class="cardtext">
            <article class="card__data">
                <h2 class="card__name">${photographer.name}</h2>
                <p class="card__location">${photographer.city}, ${photographer.country}</p>
                <p class="card__tagline">${photographer.tagline}</p>
            </article>
        </div>
    `;

    // Préserve le bouton contact s'il existe
    const contactBtn = container.querySelector(".contact_button");
    if (contactBtn) {
        container.insertAdjacentHTML("afterbegin", markup);
    } else {
        container.innerHTML = markup;
    }
}

// ============================================================================
// 8. GESTION DES LIKES
// ============================================================================

/**
 * Écoute les changements de likes et met à jour le compteur total
 * @param {number} totalLikes - Total initial de likes
 */
function setupLikeListener(totalLikes) {
    function onLikeChanged(e) {
        const { likesDelta } = e.detail;
        totalLikes += likesDelta;

        const totalElement = document.querySelector(".total-likes");
        if (totalElement) {
            totalElement.textContent = String(totalLikes);
        }
    }

    document.addEventListener("media:like-changed", onLikeChanged, { passive: true });
}

// ============================================================================
// 9. INITIALISATION PRINCIPALE
// ============================================================================

/**
 * Point d'entrée de la page photographe
 * Charge les données, construit la galerie, active les fonctionnalités
 */
async function init() {
    // Récupère l'ID du photographe dans l'URL
    const id = getPhotographerIdFromUrl();

    // Charge la base de données (photographers + media)
    const { photographers, media } = await getDB();

    // Trouve le photographe correspondant (fallback sur le 1er)
    const photographer = photographers.find(p => p.id === id) || photographers[0];
    if (!photographer) return;

    // Filtre et tri les médias de ce photographe
    items = sortItems(
        media.filter(m => m.photographerId === photographer.id),
        "popularity"
    );

    // Calcul du total de likes initial
    const totalLikes = items.reduce((sum, m) => sum + (Number(m.likes) || 0), 0);

    // Affiche le badge tarif avec le total de likes
    updateDailyRate(photographer, totalLikes);

    // Écoute les changements de likes
    setupLikeListener(totalLikes);

    // Construction de la galerie et activation des fonctionnalités
    buildGallery(items);
    setupLightbox();
    mountSortControl();
}

// ============================================================================
// 10. DÉMARRAGE AU CHARGEMENT DU DOM
// ============================================================================

document.addEventListener("DOMContentLoaded", init);
document.addEventListener("DOMContentLoaded", mountPhotographHeader);