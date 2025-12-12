
// CONSTANTES ET CONFIGURATION
const VIDEO_PREVIEW_TIME = 0.12;
const VIDEO_PREVIEW_RATIO = 0.02;

// FONCTIONS DE RENDU PAR TYPE DE MÉDIA
function renderVideo(mediaSrc) {
    // Container principal de la vignette vidéo
    const thumb = document.createElement("div");
    thumb.className = "video-thumb";
    // Élément vidéo (affichage statique d'une frame)
    const video = document.createElement("video");
    video.src = mediaSrc;
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.controls = false;
    video.tabIndex = -1;
    video.setAttribute("aria-hidden", "true");
    video.style.pointerEvents = "none";
    // Gestion de la frame de prévisualisation
    video.addEventListener("loadedmetadata", () => {
        const previewTime = Math.min(
            VIDEO_PREVIEW_TIME, 
            (video.duration || 1) * VIDEO_PREVIEW_RATIO
        );
        video.currentTime = previewTime;
    }, { once: true });
    // Mise en pause après le positionnement
    video.addEventListener("seeked", () => {
        video.pause();
    }, { once: true });
    // Icône play en overlay
    const icon = document.createElement("span");
    icon.className = "play-icon";
    icon.setAttribute("aria-hidden", "true");
    // Assemblage du container
    thumb.append(video, icon);
    return thumb;
}

function renderPhoto(imageSrc, title) {
    const img = document.createElement("img");
    img.alt = title;
    img.src = imageSrc;
    img.loading = "lazy";
    img.decoding = "async";
    return img;
}


// 3. FONCTION PRINCIPALE : FACTORY DE VIGNETTES MÉDIAS
export function mediaFactory(media) {
    const baseDir = `assets/medias/${media.photographerId}/`;
    const isVideo = !!media.video;
    const mediaSrc = baseDir + (media.image || media.video);
    const figure = document.createElement("figure");
    figure.className = "media-card" + (isVideo ? " is-video" : "");
    figure.dataset.mediaId = media.id;                  // ID unique du média
    figure.dataset.photographerId = media.photographerId; // ID du photographe
    figure.dataset.kind = isVideo ? "video" : "image";  // Type de média
    figure.dataset.src = mediaSrc;                      // Chemin complet du fichier
    figure.tabIndex = 0;                                // Rend la carte focusable au clavier
    figure.setAttribute("role", "button");              // Indique que c'est un élément cliquable
    figure.setAttribute("aria-label", `${media.title} — aperçu`); // Label pour lecteurs d'écran

    // RENDU DU CONTENU (VIDÉO OU PHOTO)
    if (isVideo) {
        // CAS VIDÉO
        const videoElement = renderVideo(mediaSrc);
        figure.appendChild(videoElement);
    } else {
        // CAS PHOTO
        const photoElement = renderPhoto(baseDir + media.image, media.title);
        figure.appendChild(photoElement);
    }

    // CRÉATION DE LA LÉGENDE
    const figcap = document.createElement("figcaption");
    figcap.className = "media-caption";
    const titleSpan = document.createElement("span");
    titleSpan.className = "media-title";
    titleSpan.textContent = media.title;

    // SYSTÈME DE LIKES
    const likeBtn = document.createElement("button");
    likeBtn.className = "like-btn";
    likeBtn.type = "button";  // Évite soumission formulaire
    likeBtn.setAttribute("aria-label", `Aimer ${media.title}`);
    likeBtn.setAttribute("aria-pressed", "false");  // État initial
    likeBtn.dataset.mediaId = media.id;  // identifier média dans événements
    // Récupération état likes depuis session
    const sessionDelta = window.__likeSession.get(media.id) || 0;
    const currentLikes = (media.likes || 0) + sessionDelta;
    if (sessionDelta > 0) {
        likeBtn.setAttribute("aria-pressed", "true");
    }
    // Compteur likes
    const likeCount = document.createElement("span");
    likeCount.className = "like-count";
    likeCount.textContent = currentLikes;
    // cœur
    const heart = document.createElement("span");
    heart.className = "heart";
    heart.setAttribute("aria-hidden", "true");  // Décoratif uniquement
    heart.textContent = "❤";
    likeBtn.append(likeCount, heart);

    //  GESTION DES INTERACTIONS
    likeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        // Détermine l'état actuel du bouton
        const isPressed = likeBtn.getAttribute("aria-pressed") === "true";
        let newDelta;   // Nouveau delta pour la session
        let likesDelta; // Variation du nombre de likes (+1 ou -1)
        if (isPressed) {
            newDelta = 0;      // Retour à l'état initial dans la session
            likesDelta = -1;   // Décrémente le total
            likeBtn.setAttribute("aria-pressed", "false");
        } else {
            newDelta = 1;      // Marque comme liké dans la session
            likesDelta = 1;    // Incrémente le total
            likeBtn.setAttribute("aria-pressed", "true");
        }
        // MàJ session
        window.__likeSession.set(media.id, newDelta);
        // MàJ affichage local
        const newCount = (media.likes || 0) + newDelta;
        likeCount.textContent = newCount;
        // MàJ compteur total de likes
        const event = new CustomEvent("media:like-changed", {
            detail: { 
                mediaId: media.id,   // ID du média concerné
                likesDelta           // Variation (+1 ou -1)
            },
            bubbles: true  // L'événement remonte dans l'arbre DOM
        });
        document.dispatchEvent(event);
    });

    likeBtn.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
        likeBtn.click();
    }
    });

    figure.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();   // ⬅️ LA LIGNE CRUCIALE
        figure.click();
    }
    });



    // ASSEMBLAGE FINAL ET RETOUR
    figcap.appendChild(titleSpan);
    figcap.appendChild(likeBtn);
    figure.appendChild(figcap);
    return figure;
}