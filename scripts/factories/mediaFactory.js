// ============================================================================
// MEDIA FACTORY - Fabrique de vignettes médias pour galerie photo
// ============================================================================
// Fichier : mediaFactory.js
// Description : Génère dynamiquement des cartes médias (photos/vidéos) avec
//               système de likes et intégration lightbox
// Architecture : Factory Pattern avec fonctions spécialisées par type de média
// ============================================================================

// ============================================================================
// 1. CONSTANTES ET CONFIGURATION
// ============================================================================

/**
 * Temps de prévisualisation pour les vignettes vidéo (en secondes)
 * Permet d'afficher une frame représentative au lieu d'un écran noir
 */
const VIDEO_PREVIEW_TIME = 0.12;

/**
 * Ratio de la durée totale utilisé pour calculer le temps de preview
 * Exemple : pour une vidéo de 100s, 2% = 2 secondes de preview
 */
const VIDEO_PREVIEW_RATIO = 0.02;


// ============================================================================
// 2. FONCTIONS DE RENDU PAR TYPE DE MÉDIA
// ============================================================================

/**
 * FONCTION : renderVideo
 * ----------------------
 * Crée une vignette vidéo interactive avec preview et icône play
 * 
 * Fonctionnalités :
 * - Affiche une frame de prévisualisation (évite l'écran noir)
 * - Ajoute une icône play en overlay pour indiquer la nature vidéo
 * 
 * @param {string} mediaSrc - Chemin complet vers le fichier vidéo
 * @returns {HTMLElement} - Container div avec vidéo + icône play
 */
function renderVideo(mediaSrc) {
    // --- Container principal de la vignette vidéo ---
    const thumb = document.createElement("div");
    thumb.className = "video-thumb";

    // --- Élément vidéo (affichage statique d'une frame) ---
    const video = document.createElement("video");
    video.src = mediaSrc;
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.controls = false;
    video.tabIndex = -1;
    video.setAttribute("aria-hidden", "true");
    video.style.pointerEvents = "none";

    // --- Gestion de la frame de prévisualisation ---
    // Positionne la vidéo à un moment précis pour afficher une image
    video.addEventListener("loadedmetadata", () => {
        const previewTime = Math.min(
            VIDEO_PREVIEW_TIME, 
            (video.duration || 1) * VIDEO_PREVIEW_RATIO
        );
        video.currentTime = previewTime;
    }, { once: true });

    // --- Mise en pause après le positionnement ---
    video.addEventListener("seeked", () => {
        video.pause();
    }, { once: true });

    // --- Icône play en overlay ---
    const icon = document.createElement("span");
    icon.className = "play-icon";
    icon.setAttribute("aria-hidden", "true");

    // Assemblage du container
    thumb.append(video, icon);
    return thumb;
}


/**
 * FONCTION : renderPhoto
 * ----------------------
 * Crée un élément image pour afficher une photo
 * 
 * Fonctionnalités :
 * - Lazy loading natif (l'image ne charge que quand elle est visible)
 * - Alt text pour accessibilité
 * 
 * @param {string} imageSrc - Chemin complet vers le fichier image
 * @param {string} title - Titre de l'image (utilisé pour alt text)
 * @returns {HTMLElement} - Élément img configuré
 */
function renderPhoto(imageSrc, title) {
    const img = document.createElement("img");
    
    // --- Configuration de base ---
    img.alt = title;
    img.src = imageSrc;
    img.loading = "lazy";
    img.decoding = "async";

    return img;
}


// ============================================================================
// 3. FONCTION PRINCIPALE : FACTORY DE VIGNETTES MÉDIAS
// ============================================================================

/**
 * FONCTION : mediaFactory (EXPORT PRINCIPAL)
 * -------------------------------------------
 * Point d'entrée principal - Fabrique une carte média complète
 * 
 * Architecture :
 * 1. Détection du type de média (vidéo ou photo)
 * 2. Création du container <figure> avec métadonnées
 * 3. Rendu du contenu via renderVideo() OU renderPhoto()
 * 4. Ajout de la légende (titre + bouton like)
 * 5. Gestion des interactions (likes avec persistance session)
 * 
 * Structure HTML générée :
 * <figure class="media-card" data-*>
 *   <div class="video-thumb">...</div>  OU  <img>
 *   <figcaption class="media-caption">
 *     <span class="media-title">...</span>
 *     <button class="like-btn">...</button>
 *   </figcaption>
 * </figure>
 * 
 * @param {Object} media - Objet média provenant de l'API/JSON
 * @param {number} media.id - Identifiant unique du média
 * @param {string} media.title - Titre du média
 * @param {string} [media.image] - Nom du fichier image (si photo)
 * @param {string} [media.video] - Nom du fichier vidéo (si vidéo)
 * @param {number} media.photographerId - ID du photographe (pour chemin)
 * @param {number} [media.likes=0] - Nombre de likes initial
 * @returns {HTMLElement} - Figure complète prête à insérer dans le DOM
 */
export function mediaFactory(media) {
    
    // ========================================================================
    // 3.1 INITIALISATION ET DÉTECTION DU TYPE
    // ========================================================================
    
    // Construction du chemin de base vers les fichiers du photographe
    const baseDir = `assets/medias/${media.photographerId}/`;

    // Détection du type : vidéo si la propriété "video" existe
    const isVideo = !!media.video;

    // Chemin complet du fichier média (utilisé par la lightbox)
    const mediaSrc = baseDir + (media.image || media.video);

    
    // ========================================================================
    // 3.2 CRÉATION DU CONTENEUR PRINCIPAL (<figure>)
    // ========================================================================
    
    const figure = document.createElement("figure");
    
    // --- Classes CSS ---
    // Classe de base + classe conditionnelle pour les vidéos
    figure.className = "media-card" + (isVideo ? " is-video" : "");
    
    // --- Attributs data (métadonnées pour la lightbox) ---
    figure.dataset.mediaId = media.id;                  // ID unique du média
    figure.dataset.photographerId = media.photographerId; // ID du photographe
    figure.dataset.kind = isVideo ? "video" : "image";  // Type de média
    figure.dataset.src = mediaSrc;                      // Chemin complet du fichier
    
    // --- Accessibilité ---
    figure.tabIndex = 0;                                // Rend la carte focusable au clavier
    figure.setAttribute("role", "button");              // Indique que c'est un élément cliquable
    figure.setAttribute("aria-label", `${media.title} — aperçu`); // Label pour lecteurs d'écran

    
    // ========================================================================
    // 3.3 RENDU DU CONTENU (VIDÉO OU PHOTO)
    // ========================================================================
    // Utilisation du IF obligatoire pour choisir la fonction de rendu
    
    if (isVideo) {
        // --- CAS VIDÉO ---
        // Appel de la fonction spécialisée pour les vidéos
        const videoElement = renderVideo(mediaSrc);
        figure.appendChild(videoElement);
    } else {
        // --- CAS PHOTO ---
        // Appel de la fonction spécialisée pour les photos
        const photoElement = renderPhoto(baseDir + media.image, media.title);
        figure.appendChild(photoElement);
    }

    
    // ========================================================================
    // 3.4 CRÉATION DE LA LÉGENDE (TITRE + LIKES)
    // ========================================================================
    
    const figcap = document.createElement("figcaption");
    figcap.className = "media-caption";
    
    // --- Titre du média ---
    const titleSpan = document.createElement("span");
    titleSpan.className = "media-title";
    titleSpan.textContent = media.title;  // textContent échappe automatiquement le HTML (sécurité XSS)
    
    
    // ========================================================================
    // 3.5 SYSTÈME DE LIKES
    // ========================================================================
    
    // --- Création du bouton like ---
    const likeBtn = document.createElement("button");
    likeBtn.className = "like-btn";
    likeBtn.type = "button";  // Évite la soumission de formulaire
    likeBtn.setAttribute("aria-label", `Aimer ${media.title}`);
    likeBtn.setAttribute("aria-pressed", "false");  // État initial : non pressé
    likeBtn.dataset.mediaId = media.id;  // Pour identifier le média dans les événements

    // --- Récupération de l'état des likes depuis la session ---
    // La session stocke les changements temporaires (avant sauvegarde serveur)
    const sessionDelta = window.__likeSession.get(media.id) || 0;
    const currentLikes = (media.likes || 0) + sessionDelta;

    // Si déjà liké pendant cette session, marque le bouton comme pressé
    if (sessionDelta > 0) {
        likeBtn.setAttribute("aria-pressed", "true");
    }

    // --- Compteur de likes (affichage numérique) ---
    const likeCount = document.createElement("span");
    likeCount.className = "like-count";
    likeCount.textContent = currentLikes;

    // --- Icône cœur ---
    const heart = document.createElement("span");
    heart.className = "heart";
    heart.setAttribute("aria-hidden", "true");  // Décoratif uniquement
    heart.textContent = "♥";

    // Assemblage du bouton
    likeBtn.append(likeCount, heart);

    
    // ========================================================================
    // 3.6 GESTION DES INTERACTIONS : CLIC SUR LE BOUTON LIKE
    // ========================================================================
    
    likeBtn.addEventListener("click", (e) => {
        // Empêche la propagation vers la figure (évite d'ouvrir la lightbox)
        e.stopPropagation();

        // Détermine l'état actuel du bouton
        const isPressed = likeBtn.getAttribute("aria-pressed") === "true";
        let newDelta;   // Nouveau delta pour la session
        let likesDelta; // Variation du nombre de likes (+1 ou -1)

        if (isPressed) {
            // --- CAS : Bouton déjà pressé (on retire le like) ---
            newDelta = 0;      // Retour à l'état initial dans la session
            likesDelta = -1;   // Décrémente le total
            likeBtn.setAttribute("aria-pressed", "false");
        } else {
            // --- CAS : Bouton non pressé (on ajoute le like) ---
            newDelta = 1;      // Marque comme liké dans la session
            likesDelta = 1;    // Incrémente le total
            likeBtn.setAttribute("aria-pressed", "true");
        }

        // --- Mise à jour de la session ---
        // Stocke le changement dans l'objet session global
        window.__likeSession.set(media.id, newDelta);

        // --- Mise à jour de l'affichage local ---
        const newCount = (media.likes || 0) + newDelta;
        likeCount.textContent = newCount;

        // --- Émission d'un événement custom pour synchronisation globale ---
        // Permet au compteur total de likes (header) de se mettre à jour
        const event = new CustomEvent("media:like-changed", {
            detail: { 
                mediaId: media.id,   // ID du média concerné
                likesDelta           // Variation (+1 ou -1)
            },
            bubbles: true  // L'événement remonte dans l'arbre DOM
        });
        document.dispatchEvent(event);
    });

    
    // ========================================================================
    // 3.7 ASSEMBLAGE FINAL ET RETOUR
    // ========================================================================
    
    // Assemble la légende (titre + bouton like)
    figcap.appendChild(titleSpan);
    figcap.appendChild(likeBtn);
    
    // Ajoute la légende à la figure
    figure.appendChild(figcap);

    // Retourne la carte média complète
    return figure;
}