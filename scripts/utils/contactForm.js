// ============================================================================
// MODALE DE CONTACT - Gestion complète avec accessibilité
// ============================================================================
// Fichier : contactForm.js
// Description : Gère l'ouverture, la fermeture et la validation du formulaire
// Fonctionnalités :
// - Piégeage du focus dans la modale (accessibilité)
// - Validation en temps réel des champs
// - Affichage des messages d'erreur
// - Soumission et affichage dans la console
// ============================================================================

// ============================================================================
// 1. VARIABLES GLOBALES
// ============================================================================

let previousFocusElement = null; // Élément ayant le focus avant ouverture
let focusableElements = [];      // Liste des éléments focusables dans la modale
let firstFocusable = null;       // Premier élément focusable
let lastFocusable = null;        // Dernier élément focusable

// ============================================================================
// 2. OUVERTURE DE LA MODALE
// ============================================================================

/**
 * Affiche la modale de contact
 * Gère le focus et active les écouteurs d'événements
 */
function displayModal() {
    const modal = document.getElementById("contact_modal");
    if (!modal) return;

    // Met à jour le nom du photographe dans le titre
    updateModalTitle();

    // Sauvegarde l'élément qui avait le focus
    previousFocusElement = document.activeElement;

    // Affiche la modale
    modal.style.display = "block";
    modal.setAttribute("aria-hidden", "false");

    // Bloque le scroll du body
    document.body.style.overflow = "hidden";

    // Récupère tous les éléments focusables
    updateFocusableElements();

    // Focus sur le premier champ
    const firstInput = modal.querySelector('input[name="first-name"]');
    if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
    }

    // Active les écouteurs
    addModalEventListeners();
}

/**
 * Met à jour le titre de la modale avec le nom du photographe
 */
function updateModalTitle() {
    const photographerName = document.getElementById("modal-photographer-name");
    if (!photographerName) return;

    // Récupère le nom depuis le header de la page
    const pageTitle = document.querySelector(".card__name");
    if (pageTitle) {
        photographerName.textContent = pageTitle.textContent.trim();
    }
}

// ============================================================================
// 3. FERMETURE DE LA MODALE
// ============================================================================

/**
 * Ferme la modale et restaure l'état initial
 */
function closeModal() {
    const modal = document.getElementById("contact_modal");
    if (!modal) return;

    // Cache la modale
    modal.style.display = "none";
    modal.setAttribute("aria-hidden", "true");

    // Restaure le scroll
    document.body.style.overflow = "";

    // Restaure le focus
    if (previousFocusElement && previousFocusElement.focus) {
        previousFocusElement.focus();
    }

    // Retire les écouteurs
    removeModalEventListeners();

    // Réinitialise le formulaire
    resetForm(modal);
}

/**
 * Réinitialise le formulaire et supprime les erreurs
 * @param {HTMLElement} modal - Élément de la modale
 */
function resetForm(modal) {
    const form = modal.querySelector("form");
    if (form) form.reset();

    // Supprime les messages d'erreur
    modal.querySelectorAll(".error-message").forEach(msg => msg.remove());
    modal.querySelectorAll(".error").forEach(field => {
        field.classList.remove("error");
        field.setAttribute("aria-invalid", "false");
    });
}

// ============================================================================
// 4. GESTION DU FOCUS (PIÉGEAGE)
// ============================================================================

/**
 * Met à jour la liste des éléments focusables dans la modale
 */
function updateFocusableElements() {
    const modal = document.getElementById("contact_modal");
    if (!modal) return;

    const focusableSelectors = [
        'input:not([disabled])',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])'
    ].join(', ');

    focusableElements = Array.from(modal.querySelectorAll(focusableSelectors));
    firstFocusable = focusableElements[0];
    lastFocusable = focusableElements[focusableElements.length - 1];
}

/**
 * Gère la navigation au clavier (piégeage du focus)
 * @param {KeyboardEvent} e - Événement clavier
 */
function handleModalKeydown(e) {
    // Échap : ferme la modale
    if (e.key === "Escape") {
        e.preventDefault();
        closeModal();
        return;
    }

    // Tab : piège le focus dans la modale
    if (e.key === "Tab") {
        if (e.shiftKey) {
            // Shift + Tab : navigation arrière
            if (document.activeElement === firstFocusable) {
                e.preventDefault();
                lastFocusable.focus();
            }
        } else {
            // Tab : navigation avant
            if (document.activeElement === lastFocusable) {
                e.preventDefault();
                firstFocusable.focus();
            }
        }
    }
}

/**
 * Empêche le clic sur le fond de fermer la modale par accident
 * @param {MouseEvent} e - Événement de clic
 */
function handleModalBackdropClick(e) {
    const modal = document.getElementById("contact_modal");
    const modalContent = modal.querySelector(".modal");

    // Ferme uniquement si on clique sur le fond
    if (e.target === modal && !modalContent.contains(e.target)) {
        closeModal();
    }
}

// ============================================================================
// 5. VALIDATION DES CHAMPS
// ============================================================================

/**
 * Valide un champ email avec une regex
 * @param {string} email - Email à valider
 * @returns {boolean} - True si email valide
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Affiche un message d'erreur sous un champ
 * @param {HTMLElement} field - Champ de formulaire
 * @param {string} message - Message d'erreur à afficher
 */
function showError(field, message) {
    // Supprime l'ancienne erreur si elle existe
    const existingError = field.parentElement.querySelector(".error-message");
    if (existingError) existingError.remove();

    // Ajoute la classe d'erreur au champ
    field.classList.add("error");
    field.setAttribute("aria-invalid", "true");

    // Crée le message d'erreur
    const errorDiv = document.createElement("div");
    errorDiv.className = "error-message";
    errorDiv.textContent = message;
    errorDiv.setAttribute("role", "alert");

    // Insère après le champ
    field.parentElement.appendChild(errorDiv);
}

/**
 * Retire le message d'erreur d'un champ
 * @param {HTMLElement} field - Champ de formulaire
 */
function clearError(field) {
    field.classList.remove("error");
    field.setAttribute("aria-invalid", "false");

    const errorDiv = field.parentElement.querySelector(".error-message");
    if (errorDiv) errorDiv.remove();
}

/**
 * Valide tous les champs du formulaire
 * @param {HTMLFormElement} form - Formulaire à valider
 * @returns {boolean} - True si tous les champs sont valides
 */
function validateForm(form) {
    let isValid = true;

    // Récupère les champs
    const firstName = form.querySelector('[name="first-name"]');
    const lastName = form.querySelector('[name="last-name"]');
    const email = form.querySelector('[name="email"]');
    const message = form.querySelector('[name="message"]');

    // Validation prénom
    clearError(firstName);
    if (!firstName.value.trim()) {
        showError(firstName, "Le prénom est requis");
        isValid = false;
    } else if (firstName.value.trim().length < 2) {
        showError(firstName, "Le prénom doit contenir au moins 2 caractères");
        isValid = false;
    }

    // Validation nom
    clearError(lastName);
    if (!lastName.value.trim()) {
        showError(lastName, "Le nom est requis");
        isValid = false;
    } else if (lastName.value.trim().length < 2) {
        showError(lastName, "Le nom doit contenir au moins 2 caractères");
        isValid = false;
    }

    // Validation email
    clearError(email);
    if (!email.value.trim()) {
        showError(email, "L'email est requis");
        isValid = false;
    } else if (!isValidEmail(email.value.trim())) {
        showError(email, "L'email n'est pas valide");
        isValid = false;
    }

    // Validation message
    clearError(message);
    if (!message.value.trim()) {
        showError(message, "Le message est requis");
        isValid = false;
    } else if (message.value.trim().length < 10) {
        showError(message, "Le message doit contenir au moins 10 caractères");
        isValid = false;
    }

    return isValid;
}

// ============================================================================
// 6. SOUMISSION DU FORMULAIRE
// ============================================================================

/**
 * Gère la soumission du formulaire
 * @param {Event} e - Événement de soumission
 */
function handleFormSubmit(e) {
    e.preventDefault();

    const form = e.target;

    // Valide le formulaire
    if (!validateForm(form)) {
        // Focus sur le premier champ en erreur
        const firstError = form.querySelector(".error");
        if (firstError) firstError.focus();
        return;
    }

    // Récupère les données du formulaire
    const formData = {
        firstName: form.querySelector('[name="first-name"]').value.trim(),
        lastName: form.querySelector('[name="last-name"]').value.trim(),
        email: form.querySelector('[name="email"]').value.trim(),
        message: form.querySelector('[name="message"]').value.trim()
    };

    // Affiche les données dans la console
    console.log("📧 Formulaire de contact soumis :");
    console.log("==================================");
    console.log("Prénom :", formData.firstName);
    console.log("Nom :", formData.lastName);
    console.log("Email :", formData.email);
    console.log("Message :", formData.message);
    console.log("==================================");

    // Ferme la modale
    closeModal();
}

// ============================================================================
// 7. GESTION DES ÉVÉNEMENTS
// ============================================================================

/**
 * Ajoute tous les écouteurs d'événements de la modale
 */
function addModalEventListeners() {
    const modal = document.getElementById("contact_modal");
    const form = modal.querySelector("form");

    // Événements clavier
    document.addEventListener("keydown", handleModalKeydown);

    // Clic sur le fond
    modal.addEventListener("click", handleModalBackdropClick);

    // Soumission du formulaire
    if (form) {
        form.addEventListener("submit", handleFormSubmit);
    }

    // Validation en temps réel (améliore l'UX)
    const inputs = modal.querySelectorAll("input, textarea");
    inputs.forEach(input => {
        input.addEventListener("blur", () => {
            if (input.value.trim()) {
                clearError(input);
            }
        });
    });
}

/**
 * Retire tous les écouteurs d'événements de la modale
 */
function removeModalEventListeners() {
    const modal = document.getElementById("contact_modal");
    const form = modal.querySelector("form");

    document.removeEventListener("keydown", handleModalKeydown);
    modal.removeEventListener("click", handleModalBackdropClick);

    if (form) {
        form.removeEventListener("submit", handleFormSubmit);
    }
}

// ============================================================================
// 8. INITIALISATION
// ============================================================================

/**
 * Initialise la modale au chargement de la page
 * Configure les attributs ARIA
 */
function initContactModal() {
    const modal = document.getElementById("contact_modal");
    if (!modal) return;

    // Attributs ARIA initiaux
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "modal-title");
    modal.setAttribute("aria-hidden", "true");
}

// ============================================================================
// 9. DÉMARRAGE
// ============================================================================

// Lance l'initialisation au chargement du DOM
document.addEventListener("DOMContentLoaded", initContactModal);

// Expose les fonctions globalement pour les onclick du HTML
window.displayModal = displayModal;
window.closeModal = closeModal;