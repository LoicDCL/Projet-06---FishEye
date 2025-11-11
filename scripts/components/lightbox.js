// ============================================================================
// LIGHTBOX - Visualisation plein écran des médias
// ============================================================================
// Fichier : lightbox.js
// Description : Gère l'affichage et la navigation dans la lightbox
// Fonctionnalités : 
// - Ouverture/fermeture avec gestion du focus
// - Navigation clavier (flèches, Échap)
// - Lecture automatique des vidéos
// - Piégeage du focus pour accessibilité
// ============================================================================

// ============================================================================
// 1. VARIABLES GLOBALES
// ============================================================================

let items = [];              // Liste des médias disponibles
let current = -1;            // Index du média actuellement affiché
let lastFocused = null;      // Élément qui avait le focus avant ouverture

// ============================================================================
// 2. ÉLÉMENTS DOM (RÉCUPÉRÉS UNE SEULE FOIS)
// ============================================================================

let lb = null;               // Conteneur principal de la lightbox
let area = null;             // Zone d'affichage du média
let caption = null;          // Zone de texte pour le titre
let btnClose = null;         // Bouton fermer
let btnPrev = null;          // Bouton précédent
let btnNext = null;          // Bouton suivant

// ============================================================================
// 3. INITIALISATION
// ============================================================================

/**
 * FONCTION PRINCIPALE : setupLightbox
 * -----------------------------------
 * Point d'entrée pour initialiser la lightbox
 * À appeler après chaque modification du DOM (tri, chargement initial)
 */
export function setupLightbox() {
    // Récupère les éléments DOM
    lb = document.getElementById("lightbox");
    if (!lb) return; // Si lightbox absente, arrête l'initialisation

    area = lb.querySelector(".lightbox__media");
    caption = lb.querySelector(".lightbox__caption");
    btnClose = lb.querySelector(".lightbox__close");
    btnPrev = lb.querySelector(".lightbox__prev");
    btnNext = lb.querySelector(".lightbox__next");

    // Prépare la liste des médias depuis les cartes de la page
    buildMediaList();

    // Attache les événements d'ouverture aux cartes
    attachCardListeners();

    // Attache les événements de navigation
    attachNavigationListeners();
}

// ============================================================================
// 4. CONSTRUCTION DE LA LISTE DES MÉDIAS
// ============================================================================

/**
 * Construit la liste des médias à partir des cartes présentes dans le DOM
 * Stocke index, type, source et titre de chaque média
 */
function buildMediaList() {
    const cards = Array.from(document.querySelectorAll(".media-card"));
    
    items = cards.map((card, idx) => {
        const title = card.querySelector(".media-title")?.textContent?.trim() || "";
        const kind = card.dataset.kind || "image";
        const src = card.dataset.src || card.querySelector("img")?.src || "";
        
        // Stocke l'index sur la carte pour faciliter l'ouverture
        card.dataset.index = String(idx);
        
        return { kind, src, title };
    });
}

// ============================================================================
// 5. GESTION DES MÉDIAS (VIDÉO)
// ============================================================================

/**
 * Arrête la vidéo en cours si elle existe
 * Remet le temps de lecture à zéro
 */
function stopCurrentVideo() {
    const video = area.querySelector("video");
    if (video) {
        video.pause();
        video.currentTime = 0;
    }
}

// ============================================================================
// 6. RENDU DU MÉDIA DANS LA LIGHTBOX
// ============================================================================

/**
 * Affiche un média dans la lightbox selon son index
 * @param {number} index - Index du média à afficher
 */
function render(index) {
    const item = items[index];
    if (!item) return;

    current = index;
    area.innerHTML = "";

    let mediaElement;

    if (item.kind === "video") {
        // Création de l'élément vidéo
        mediaElement = document.createElement("video");
        mediaElement.src = item.src;
        mediaElement.controls = true;
        mediaElement.muted = true;
        mediaElement.autoplay = true;
        mediaElement.playsInline = true;
        mediaElement.setAttribute("aria-label", item.title || "Vidéo");
        
        // Démarre la lecture dès que possible
        mediaElement.addEventListener("canplay", () => {
            mediaElement.play().catch(() => {});
        }, { once: true });
    } else {
        // Création de l'élément image
        mediaElement = document.createElement("img");
        mediaElement.src = item.src;
        mediaElement.alt = item.title || "";
    }

    // Insertion du média dans la zone d'affichage
    area.appendChild(mediaElement);
    
    // Mise à jour du titre
    caption.textContent = item.title || "";
    
    // Focus sur le média (navigation clavier)
    mediaElement.tabIndex = -1;
    mediaElement.focus({ preventScroll: true });
}

// ============================================================================
// 7. OUVERTURE ET FERMETURE
// ============================================================================

/**
 * Ouvre la lightbox à un index donné
 * @param {number} index - Index du média à afficher
 */
function open(index) {
    if (index < 0 || index >= items.length) return;

    // Sauvegarde l'élément qui avait le focus
    lastFocused = document.activeElement;

    // Affiche le média
    current = index;
    render(current);

    // Rend la lightbox visible
    lb.hidden = false;
    lb.setAttribute("aria-hidden", "false");

    // Focus immédiat sur le bouton fermer
    btnClose.focus();

    // Active les écouteurs
    document.addEventListener("keydown", handleKeydown);
    document.addEventListener("focus", trapFocus, true);
}

/**
 * Ferme la lightbox et restaure l'état initial
 */
function close() {
    stopCurrentVideo();

    // Cache la lightbox
    lb.hidden = true;
    lb.setAttribute("aria-hidden", "true");

    // Vide le contenu
    area.innerHTML = "";

    // Retire les écouteurs
    document.removeEventListener("keydown", handleKeydown);
    document.removeEventListener("focus", trapFocus, true);

    // Restaure le focus
    if (lastFocused && typeof lastFocused.focus === "function") {
        lastFocused.focus();
    }
}

// ============================================================================
// 8. NAVIGATION
// ============================================================================

/**
 * Affiche le média suivant (navigation circulaire)
 */
function next() {
    stopCurrentVideo();
    current = (current + 1) % items.length;
    render(current);
}

/**
 * Affiche le média précédent (navigation circulaire)
 */
function prev() {
    stopCurrentVideo();
    current = (current - 1 + items.length) % items.length;
    render(current);
}

// ============================================================================
// 9. GESTION DU CLAVIER
// ============================================================================

/**
 * Gère les touches clavier dans la lightbox
 * @param {KeyboardEvent} e - Événement clavier
 */
function handleKeydown(e) {
    if (lb.hidden) return;

    switch (e.key) {
        case "Escape":
            return close();
        case "ArrowRight":
            return next();
        case "ArrowLeft":
            return prev();
        case "Enter":
        case " ":
            e.preventDefault();
            return;
    }
}

// ============================================================================
// 10. PIÉGEAGE DU FOCUS (ACCESSIBILITÉ)
// ============================================================================

/**
 * Empêche le focus de sortir de la lightbox
 * @param {FocusEvent} e - Événement focus
 */
function trapFocus(e) {
    if (lb.hidden) return;

    // Si le focus tente de sortir de la lightbox
    if (!lb.contains(e.target)) {
        e.stopPropagation();
        btnClose.focus();
    }
}

// ============================================================================
// 11. ÉVÉNEMENTS D'OUVERTURE (DEPUIS LES CARTES)
// ============================================================================

/**
 * Attache les événements d'ouverture à toutes les cartes
 */
function attachCardListeners() {
    const cards = document.querySelectorAll(".media-card");

    cards.forEach((card) => {
        // Gestionnaire commun pour ouverture
        function openFromCard(ev) {
            ev.preventDefault();
            const idx = Number(card.dataset.index || "0");
            open(idx);
        }

        // Clic sur la carte
        card.addEventListener("click", openFromCard);

        // Entrée ou Espace sur carte focusée
        card.addEventListener("keydown", (ev) => {
            if (ev.key === "Enter" || ev.key === " ") {
                ev.preventDefault();
                openFromCard(ev);
            }
        });
    });
}

// ============================================================================
// 12. ÉVÉNEMENTS DE NAVIGATION
// ============================================================================

/**
 * Attache les événements de navigation de la lightbox
 */
function attachNavigationListeners() {
    // Bouton fermer
    btnClose.addEventListener("click", close);

    // Boutons suivant/précédent
    btnNext.addEventListener("click", next);
    btnPrev.addEventListener("click", prev);

    // Fermeture au clic sur le fond
    lb.addEventListener("click", (e) => {
        if (e.target === lb) close();
    });
}