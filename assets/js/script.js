// Global Configuration
const API_URL = "https://apps-api.lavu-ooe.workers.dev/";
let apps = [];
let currentLang = "de";

// Dual Language Context Matrix
const translations = {
    de: {
        title: "Anwendungs-Verzeichnis",
        loading: "Lade Anwendungen...",
        addApp: "App hinzufügen",
        modalTitle: "Neue App hinzufügen",
        labelName: "Name der Anwendung *",
        labelUrl: "Anwendungs-URL (Link) *",
        labelDesc: "Beschreibung",
        labelIcon: "Emoji Icon",
        btnCancel: "Abbrechen",
        btnSave: "Speichern",
        btnSaving: "Wird gespeichert...",
        errFetch: "Fehler beim Laden des API-Verzeichnisses.",
        errSave: "Fehler beim Speichern der Anwendung."
    },
    en: {
        title: "Application Directory",
        loading: "Loading applications...",
        addApp: "Add Application",
        modalTitle: "Add New Application",
        labelName: "Application Name *",
        labelUrl: "Application URL (Link) *",
        labelDesc: "Description",
        labelIcon: "Emoji Icon",
        btnCancel: "Cancel",
        btnSave: "Save",
        btnSaving: "Saving...",
        errFetch: "Error loading the application log from API.",
        errSave: "Could not save the application."
    }
};

// Initialize Dashboard
document.addEventListener("DOMContentLoaded", () => {
    loadAppsFromAPI();
});

// Fetch Application Array from Worker Endpoint
async function loadAppsFromAPI() {
    try {
        const response = await fetch(API_URL, { method: "GET" });
        if (!response.ok) throw new Error(`HTTP Status ${response.status}`);
        
        apps = await response.json();
        renderApps();
    } catch (error) {
        console.error("API load failed, falling back to basic layout:", error);
        // Fallback array if database is offline or empty
        apps = [
            {
                name: "Etiketten-Druckstudio",
                url: "https://lavu-ooe.github.io/Etiketten-Druckstudio/",
                desc: "Studio for creating and printing standardized container and sorting labels.",
                icon: "🏷️"
            }
        ];
        renderApps();
    }
}

// Render active items and appends the dynamic operational placeholder card
function renderApps() {
    const grid = document.getElementById("app-grid");
    if (!grid) return;
    grid.innerHTML = "";

    // 1. Map existing entries to standard card templates
    apps.forEach(app => {
        const card = document.createElement("a");
        card.className = "app-card";
        card.href = app.url;
        card.target = "_blank";
        card.innerHTML = `
            <div class="app-icon">${app.icon || "🚀"}</div>
            <h3>${app.name}</h3>
            <p>${app.desc || ""}</p>
        `;
        grid.appendChild(card);
    });

    // 2. Inject the 'Add App' Interactive Box into the grid slot
    const addCard = document.createElement("div");
    addCard.className = "app-card add-placeholder-card";
    addCard.innerHTML = `
        <div class="add-card-content">
            <span class="add-icon">➕</span>
            <span class="add-text" id="addPlaceholderText">${translations[currentLang].addApp}</span>
        </div>
    `;
    addCard.addEventListener("click", openModal);
    grid.appendChild(addCard);
}

// Modal Toggle Mechanics
function openModal() {
    const modal = document.getElementById("addAppModal") || document.getElementById("add-app-modal");
    if (modal) modal.classList.remove("hidden");

    const submitBtn = document.getElementById("submitBtn") || document.getElementById("submit-btn");
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerText = translations[currentLang].btnSave;
    }
}

function closeModal() {
    const modal = document.getElementById("addAppModal") || document.getElementById("add-app-modal");
    if (modal) modal.classList.add("hidden");
    
    const form = document.getElementById("addAppForm") || document.getElementById("add-app-form");
    if (form) form.reset();
}

// Handle Form Execution and Save Data Dynamically
// Handle Form Execution and Save Data Dynamically
async function handleFormSubmit(event) {
    event.preventDefault();
    
    const submitBtn = document.getElementById("submitBtn") || document.getElementById("submit-btn");
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = translations[currentLang].btnSaving;
    }

    // 1. Hier lesen wir deine NEUEN, sprachspezifischen Felder aus!
    // Falls deine IDs im HTML anders heißen (z.B. mit Bindestrich), fängt der Code beide Varianten ab.
    const appData = {
        nameDe: (document.getElementById("appNameDe") || document.getElementById("app-name-de"))?.value || "",
        nameEn: (document.getElementById("appNameEn") || document.getElementById("app-name-en"))?.value || "",
        url: (document.getElementById("appUrl") || document.getElementById("app-url"))?.value || "",
        descDe: (document.getElementById("appDescDe") || document.getElementById("app-desc-de"))?.value || "",
        descEn: (document.getElementById("appDescEn") || document.getElementById("app-desc-en"))?.value || "",
        icon: (document.getElementById("appIcon") || document.getElementById("app-icon"))?.value?.trim() || "🚀",
        password: (document.getElementById("adminPassword") || document.getElementById("admin-password"))?.value || ""
    };

    // 2. Aktualisierte Validierung: Es muss mindestens ein Name (DE oder EN) UND die URL da sein!
    if ((!appData.nameDe && !appData.nameEn) || !appData.url) {
        alert("Bitte fülle alle Pflichtfelder (Name und URL) aus.");
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerText = translations[currentLang].btnSave;
        }
        return;
    }

    // Optional: Hier könntest du sogar direkt prüfen, ob das Passwort eingegeben wurde
    if (!appData.password) {
        alert("Bitte gib das Admin-Passwort ein.");
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerText = translations[currentLang].btnSave;
        }
        return;
    }

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(appData) // Schickt das komplette Paket inkl. Passwort an den Worker
        });

        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

        const contentType = response.headers.get("content-type");
        let responseData = null;
        
        if (contentType && contentType.includes("application/json")) {
            responseData = await response.json();
        }

        if (Array.isArray(responseData)) {
            apps = responseData;
        } else if (responseData && responseData.added) {
            apps.push(responseData.added);
        } else {
            apps.push(appData);
        }

        renderApps();
        closeModal();
    } catch (error) {
        console.error("Error submitting new application link:", error);
        alert(translations[currentLang].errSave);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerText = translations[currentLang].btnSave;
        }
    }
}

// Update Local Language String Matrix Options
function setLanguage(lang) {
    currentLang = lang;
    
    // Toggle active link visual highlights
    const btnDe = document.getElementById("langBtnDe") || document.getElementById("lang-btn-de");
    const btnEn = document.getElementById("langBtnEn") || document.getElementById("lang-btn-en");
    if (btnDe) btnDe.classList.toggle("active", lang === "de");
    if (btnEn) btnEn.classList.toggle("active", lang === "en");

    // Dynamic document DOM string injection
    const titleText = document.getElementById("titleText") || document.getElementById("title-text");
    const modalTitle = document.getElementById("modalTitle") || document.getElementById("modal-title");
    const labelName = document.getElementById("labelName") || document.getElementById("label-name");
    const labelUrl = document.getElementById("labelUrl") || document.getElementById("label-url");
    const labelDesc = document.getElementById("labelDesc") || document.getElementById("label-desc");
    const labelIcon = document.getElementById("labelIcon") || document.getElementById("label-icon");
    const btnCancel = document.getElementById("btnCancel") || document.getElementById("btn-cancel");
    
    if (titleText) titleText.innerText = translations[lang].title;
    if (modalTitle) modalTitle.innerText = translations[lang].modalTitle;
    if (labelName) labelName.innerText = translations[lang].labelName;
    if (labelUrl) labelUrl.innerText = translations[lang].labelUrl;
    if (labelDesc) labelDesc.innerText = translations[lang].labelDesc;
    if (labelIcon) labelIcon.innerText = translations[lang].labelIcon;
    if (btnCancel) btnCancel.innerText = translations[lang].btnCancel;
    
    const submitBtn = document.getElementById("submitBtn") || document.getElementById("submit-btn");
    if (submitBtn) submitBtn.innerText = translations[lang].btnSave;
    
    const loadingEl = document.getElementById("gridLoading") || document.getElementById("grid-loading");
    if (loadingEl) loadingEl.innerText = translations[lang].loading;

    // Refresh display layout text layers
    renderApps();
}