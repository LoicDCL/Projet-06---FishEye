
// VARIABLES GLOBALES
let previousFocusElement = null; // Élément ayant le focus avant ouverture
let focusableElements = [];      // Liste des éléments focusables dans la modale
let firstFocusable = null;       // Premier élément focusable
let lastFocusable = null;        // Dernier élément focusable


// OUVERTURE DE LA MODALE
function displayModal() {
    const modal = document.getElementById("contact_modal");
    if (!modal) return;
    updateModalTitle(); // MàJ Nom photographe
    previousFocusElement = document.activeElement;
    modal.style.display = "block";
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden"; // Bloquage scrolling
    updateFocusableElements();
    const firstInput = modal.querySelector('input[name="first-name"]');
    if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
    }
    addModalEventListeners();
}

function updateModalTitle() {
    const photographerName = document.getElementById("modal-photographer-name");
    if (!photographerName) return;
    const pageTitle = document.querySelector(".card__name");
    if (pageTitle) {
        photographerName.textContent = pageTitle.textContent.trim();
    }
}


// FERMETURE DE LA MODALE
function closeModal() {
    const modal = document.getElementById("contact_modal");
    if (!modal) return;
    modal.style.display = "none"; // Cache la modale
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";// Scrolling back
    if (previousFocusElement && previousFocusElement.focus) {
        previousFocusElement.focus();
    }
    removeModalEventListeners();
    resetForm(modal);
}

// RESET FORMULARE
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


// GESTION DU FOCUS (PIÉGEAGE)
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

// NAVIGATION CLAVIER
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

// BLOCAGE DU CLICK
function handleModalBackdropClick(e) {
    const modal = document.getElementById("contact_modal");
    const modalContent = modal.querySelector(".modal");
    // Ferme uniquement si on clique sur le fond
    if (e.target === modal && !modalContent.contains(e.target)) {
        closeModal();
    }
}


// VALIDATION DES CHAMPS
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// GESTION ERREURS MODALE
function showError(field, message) {
    const existingError = field.parentElement.querySelector(".error-message");
    if (existingError) existingError.remove();
    field.classList.add("error");
    field.setAttribute("aria-invalid", "true");
    const errorDiv = document.createElement("div");
    errorDiv.className = "error-message";
    errorDiv.textContent = message;
    errorDiv.setAttribute("role", "alert");
    field.parentElement.appendChild(errorDiv);
}

function clearError(field) {
    field.classList.remove("error");
    field.setAttribute("aria-invalid", "false");
    const errorDiv = field.parentElement.querySelector(".error-message");
    if (errorDiv) errorDiv.remove();
}

function validateForm(form) {
    let isValid = true;
    const firstName = form.querySelector('[name="first-name"]');
    const lastName = form.querySelector('[name="last-name"]');
    const email = form.querySelector('[name="email"]');
    const message = form.querySelector('[name="message"]');
    clearError(firstName);
    if (!firstName.value.trim()) {
        showError(firstName, "Le prénom est requis");
        isValid = false;
    } else if (firstName.value.trim().length < 2) {
        showError(firstName, "Le prénom doit contenir au moins 2 caractères");
        isValid = false;
    }
    clearError(lastName);
    if (!lastName.value.trim()) {
        showError(lastName, "Le nom est requis");
        isValid = false;
    } else if (lastName.value.trim().length < 2) {
        showError(lastName, "Le nom doit contenir au moins 2 caractères");
        isValid = false;
    }
    clearError(email);
    if (!email.value.trim()) {
        showError(email, "L'email est requis");
        isValid = false;
    } else if (!isValidEmail(email.value.trim())) {
        showError(email, "L'email n'est pas valide");
        isValid = false;
    }
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

// SOUMISSION DU FORMULAIRE
function handleFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    if (!validateForm(form)) {
        const firstError = form.querySelector(".error");
        if (firstError) firstError.focus();
        return;
    }
    const formData = {
        firstName: form.querySelector('[name="first-name"]').value.trim(),
        lastName: form.querySelector('[name="last-name"]').value.trim(),
        email: form.querySelector('[name="email"]').value.trim(),
        message: form.querySelector('[name="message"]').value.trim()
    };
    console.log("📧 Formulaire de contact soumis :");
    console.log("==================================");
    console.log("Prénom :", formData.firstName);
    console.log("Nom :", formData.lastName);
    console.log("Email :", formData.email);
    console.log("Message :", formData.message);
    console.log("==================================");
    closeModal();
}

// 7. GESTION DES ÉVÉNEMENTS
function addModalEventListeners() {
    const modal = document.getElementById("contact_modal");
    const form = modal.querySelector("form");
    document.addEventListener("keydown", handleModalKeydown);
    modal.addEventListener("click", handleModalBackdropClick);
    if (form) {
        form.addEventListener("submit", handleFormSubmit);
    }
    const inputs = modal.querySelectorAll("input, textarea");
    inputs.forEach(input => {
        input.addEventListener("blur", () => {
            if (input.value.trim()) {
                clearError(input);
            }
        });
    });
}

function removeModalEventListeners() {
    const modal = document.getElementById("contact_modal");
    const form = modal.querySelector("form");
    document.removeEventListener("keydown", handleModalKeydown);
    modal.removeEventListener("click", handleModalBackdropClick);
    if (form) {
        form.removeEventListener("submit", handleFormSubmit);
    }
}


// INITIALISATION
function initContactModal() {
    const modal = document.getElementById("contact_modal");
    if (!modal) return;
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "modal-title");
    modal.setAttribute("aria-hidden", "true");
}


// Chargement du DOM
document.addEventListener("DOMContentLoaded", initContactModal);
window.displayModal = displayModal;
window.closeModal = closeModal;