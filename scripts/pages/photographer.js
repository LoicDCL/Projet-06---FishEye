
// PAGE PHOTOGRAPHE - Gestion complète de la page individuelle

// IMPORTS
import { getDB } from "../utils/api.js";
import { mediaFactory } from "../factories/mediaFactory.js";
import { setupLightbox } from "../components/lightbox.js";


// VARIABLES GLOBALES
let items = [];                 // Liste des médias du photographe
let currentSort = "popularity"; // Clé de tri actuellement sélectionnée
let pageRoot = null;

// Session de likes (persiste dans la session utilisateur)
window.__likeSession = window.__likeSession || new Map();


// RÉCUPÉRATION DE L'ID PHOTOGRAPHE
function getPhotographerIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return Number(params.get("id"));
}

// SYSTÈME DE TRI
function sortItems(list, key) {
    switch (key) {
        case "date":
            return [...list].sort((a, b) => new Date(b.date) - new Date(a.date));
        case "title":
            return [...list].sort((a, b) =>
                a.title.localeCompare(b.title, "fr", { sensitivity: "base" })
            );
        case "popularity":
        default:
            return [...list].sort((a, b) => (b.likes || 0) - (a.likes || 0));
    }
}

function applySortAndRender(key) {
    currentSort = key;
    const sorted = sortItems(items, key);
    buildGallery(sorted);
    setupLightbox(); // Re-branche la lightbox (DOM modifié)
    updateSortUI(key);
}

function updateSortUI(key) {
    const labels = {
        date: "Date",
        title: "Titre",
        popularity: "Popularité"
    };
    const label = labels[key] || "Popularité";
    const btnValue = document.querySelector(".sort__value");
    if (btnValue) {
        btnValue.dataset.sort = key;
        btnValue.textContent = label;
    }
    document.querySelectorAll("#sort-list [role='option']").forEach(option => {
        const isSelected = option.dataset.sort === key;
        option.setAttribute("aria-selected", isSelected ? "true" : "false");
    });
}


// CONTRÔLE DE TRI
function mountSortControl() {
    const wrapper = document.querySelector(".sort");
    const btn = document.getElementById("sort-button");
    const list = document.getElementById("sort-list");
    if (!wrapper || !btn || !list) return;
    function open() {
        wrapper.dataset.open = "true";
        btn.setAttribute("aria-expanded", "true");
        list.hidden = false;
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

    // Navigation clavier (Bouton)
    btn.addEventListener("keydown", (e) => {
        if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            open();
        }
    });

    // Eléments focusable page
    function getPageFocusables() {
    if (!pageRoot) return [];
    return Array.from(
        pageRoot.querySelectorAll(
            "a[href], button, input, select, textarea, [tabindex]:not([tabindex='-1'])"
        )
    ).filter(el => !el.hasAttribute("disabled") && el.offsetParent !== null);
    }


    // Le piège à focus (tab)
    function trapPageFocus(e) {
    if (e.key !== "Tab") return;
    // Si une modale est ouverte, pas touche
    const lightboxOpen = !document.getElementById("lightbox")?.hidden;
    const contactOpen = document.getElementById("contact_modal")?.getAttribute("aria-hidden") === "false";
    if (lightboxOpen || contactOpen) return;
    const focusables = getPageFocusables();
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
    }
}


    // Navigation clavier (Liste déroulante)
    list.addEventListener("keydown", (e) => {
        const options = Array.from(list.querySelectorAll("[role='option']"));
        const currentIndex = options.indexOf(document.activeElement);
        if (e.key === "Escape") {
            e.preventDefault();
            close();
            return;
        }
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            const activeOption = document.activeElement;
            if (activeOption && activeOption.dataset.sort) {
                applySortAndRender(activeOption.dataset.sort);
                close();
            }
            return;
        }
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
        if (e.key === "Home") {
            e.preventDefault();
            options[0].focus();
        }
        if (e.key === "End") {
            e.preventDefault();
            options[options.length - 1].focus();
        }
    });


    // Fermeture au clic extérieur
    document.addEventListener("click", (e) => {
        if (!wrapper.contains(e.target) && wrapper.dataset.open === "true") {
            close();
        }
    });
}


// AFFICHAGE DES DONNÉES
function updateDailyRate(photographer, totalLikes = 0) {
    const rate = document.querySelector("#daily-rate");
    if (!rate) return;
    rate.classList.add("photographer-stats");
    rate.innerHTML = `
        <div class="likes-bloc">
            <span class="total-likes" aria-label="Nombre total de likes">${totalLikes}</span>
            <span class="heart" aria-hidden="true">❤</span>
        </div>
        <span class="price"><strong>${photographer.price}€</strong> / jour</span>
    `;
}

function buildGallery(mediaList) {
    const grid = document.querySelector("#media-gallery");
    if (!grid) return;
    grid.innerHTML = "";
    const fragment = document.createDocumentFragment();
    mediaList.forEach(media => {
        fragment.appendChild(mediaFactory(media));
    });
    grid.appendChild(fragment);
}


// HEADER PHOTOGRAPHE
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
    if (!photographer) photographer = photographers[0];
    if (!photographer) {
        container.insertAdjacentText("afterbegin", "Aucun photographe trouvé.");
        return;
    }

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

    const contactBtn = container.querySelector(".contact_button");
    if (contactBtn) {
        container.insertAdjacentHTML("afterbegin", markup);
    } else {
        container.innerHTML = markup;
    }
}


// GESTION DES LIKES
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


// INITIALISATION PRINCIPALE
async function init() {
    // Récupère l'ID du photographe dans l'URL
    pageRoot = document.getElementById("main");
    const id = getPhotographerIdFromUrl();
    const { photographers, media } = await getDB();
    // Trouve le photographe correspondant
    const photographer = photographers.find(p => p.id === id) || photographers[0];
    if (!photographer) return;
    items = sortItems(
        media.filter(m => m.photographerId === photographer.id),
        "popularity"
    );
    // total de likes initial
    const totalLikes = items.reduce((sum, m) => sum + (Number(m.likes) || 0), 0);
    // badge tarif-total de likes   
    updateDailyRate(photographer, totalLikes);
    setupLikeListener(totalLikes);
    buildGallery(items);
    setupLightbox();
    mountSortControl();
    document.addEventListener("keydown", trapPageFocus);
}


// DÉMARRAGE AU CHARGEMENT DU DOM
document.addEventListener("DOMContentLoaded", init);
document.addEventListener("DOMContentLoaded", mountPhotographHeader);