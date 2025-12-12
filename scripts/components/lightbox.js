
// VARIABLES GLOBALES
let items = [];              // Liste des médias disponibles
let current = -1;            // Index du média actuellement affiché
let lastFocused = null;      // Élément qui avait le focus avant ouverture


// 2. ÉLÉMENTS DOM
let lb = null;               // Conteneur principal de la lightbox
let area = null;             // Zone d'affichage du média
let caption = null;          // Zone de texte pour le titre
let btnClose = null;         // Bouton fermer
let btnPrev = null;          // Bouton précédent
let btnNext = null;          // Bouton suivant


// INITIALISATION
export function setupLightbox() {
    // Récupère les éléments DOM
    lb = document.getElementById("lightbox");
    if (!lb) return; // Si lightbox absente, arrête l'initialisation
    area = lb.querySelector(".lightbox__media");
    caption = lb.querySelector(".lightbox__caption");
    btnClose = lb.querySelector(".lightbox__close");
    btnPrev = lb.querySelector(".lightbox__prev");
    btnNext = lb.querySelector(".lightbox__next");
    // Prépare liste médias depuis cartes page
    buildMediaList();
    // Attache événements d'ouverture cartes
    attachCardListeners();
    // Attache événements navigation
    attachNavigationListeners();
}


// CONSTRUCTION DE LA LISTE DES MÉDIAS
function buildMediaList() {
    const cards = Array.from(document.querySelectorAll(".media-card"));
    items = cards.map((card, idx) => {
        const title = card.querySelector(".media-title")?.textContent?.trim() || "";
        const kind = card.dataset.kind || "image";
        const src = card.dataset.src || card.querySelector("img")?.src || "";
        card.dataset.index = String(idx);
        return { kind, src, title };
    });
}


// GESTION DES MÉDIAS (VIDÉO)
function stopCurrentVideo() {
    const video = area.querySelector("video");
    if (video) {
        video.pause();
        video.currentTime = 0;
    }
}


// RENDU DU MÉDIA DANS LA LIGHTBOX
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
}

// OUVERTURE ET FERMETURE
function open(index) {
    if (index < 0 || index >= items.length) return;
    // Sauvegarde l'élément avait focus
    lastFocused = document.activeElement;
    // Affiche média
    current = index;
    render(current);
    // Lightbox visible
    lb.hidden = false;
    lb.setAttribute("aria-hidden", "false");
    // Focus immédiat bouton fermer
    btnClose.focus();
    // Active écouteurs
    document.addEventListener("keydown", handleKeydown);
    document.body.style.overflow = "hidden"; // Scrolling désactivé
}

function close() {
    stopCurrentVideo();
    lb.hidden = true;
    lb.setAttribute("aria-hidden", "true");
    area.innerHTML = "";
    document.removeEventListener("keydown", handleKeydown);
    document.body.style.overflow = ""; // Scrolling actif
    if (lastFocused && typeof lastFocused.focus === "function") {
        lastFocused.focus();
    }
}


// NAVIGATION
function next() {
    stopCurrentVideo();
    current = (current + 1) % items.length;
    render(current);
}

function prev() {
    stopCurrentVideo();
    current = (current - 1 + items.length) % items.length;
    render(current);
}


// GESTION DU CLAVIER
function handleKeydown(e) {
    if (lb.hidden) return;
    // Focus trap
    if (e.key === "Tab") {
        return trapFocus(e);
    }
    // Touches autorisées
    if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    const active = document.activeElement;
    if (active === btnClose) {
        return close();
    }
    if (active === btnNext) {
        return next();
    }
    if (active === btnPrev) {
        return prev();
    }
    return;
}

    // Tout le reste est bloqué
    e.preventDefault();
    e.stopPropagation();
}



// PIÉGEAGE DU FOCUS (ACCESSIBILITÉ)
function trapFocus(e) {
    if (lb.hidden || e.key !== "Tab") return;
    const focusables = [btnClose, btnPrev, btnNext];
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
    } 
    else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
    }
}



// ÉVÉNEMENTS D'OUVERTURE (DEPUIS LES CARTES)
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


// ÉVÉNEMENTS DE NAVIGATION
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