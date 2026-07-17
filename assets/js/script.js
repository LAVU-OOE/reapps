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
    const grid = document.getElementById("app-grid");
    try {
        const response = await fetch(API_URL, { method: "GET" });
        if (!response.ok) throw new Error(`HTTP Status ${response.status}`);
        
        apps = await response.json();
        renderApps();
    } catch (error) {
        console.error("API load failed, falling back to basic layout:", error);
        // Fallback array if database is offline or not created yet
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
        card.target = "_blank"; // Open applications in a new tab
        card.innerHTML = `
            <div class="app-icon">${app.icon || "🚀"}</div>
            <h3>${app.name}</h3>
            <p>${app.desc || ""}</p>
        `;
        grid.appendChild(card);
    });

    // 2. Inject the 'Add App' Interactive Box into the next sequential slot (the 3rd slot!)
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
    document.getElementById("addAppModal").classList.remove("hidden");
}

function closeModal() {
    document.getElementById("addAppModal").classList.add("hidden");
    document.getElementById("addAppForm").reset();
}

// Handle Form Execution and Save Data Dynamically
async function handleFormSubmit(event) {
    event.preventDefault();
    
    const submitBtn = document.getElementById("submitBtn");
    submitBtn.disabled = true;
    submitBtn.innerText = translations[currentLang].btnSaving;

    const appData = {
        name: document.getElementById("appName").value,
        url: document.getElementById("appUrl").value,
        desc: document.getElementById("appDesc").value,
        icon: document.getElementById("appIcon").value.trim() || "🚀"
    };

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(appData)
        });

        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

        const contentType = response.headers.get("content-type");
        let responseData = null;
        
        if (contentType && contentType.includes("application/json")) {
            responseData = await response.json();
        } else {
            await response.text(); 
        }

        // Smart state assignment based on API behavior
        if (Array.isArray(responseData)) {
            apps = responseData;
        } else if (responseData && responseData.added) {
            apps.push(responseData.added);
        } else {
            apps.push(appData); // Edge-case local sync fallback
        }

        renderApps();
        closeModal();
    } catch (error) {
        console.error("Error submitting new application link:", error);
        alert(translations[currentLang].errSave);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = translations[currentLang].btnSave;
    }
}

// Update Local Language String Matrix Options
function setLanguage(lang) {
    currentLang = lang;
    
    // Toggle active link visual highlights
    document.getElementById("langBtnDe").classList.toggle("active", lang === "de");
    document.getElementById("langBtnEn").classList.toggle("active", lang === "en");

    // Dynamic document DOM string injection
    document.getElementById("titleText").innerText = translations[lang].title;
    document.getElementById("modalTitle").innerText = translations[lang].modalTitle;
    document.getElementById("labelName").innerText = translations[lang].labelName;
    document.getElementById("labelUrl").innerText = translations[lang].labelUrl;
    document.getElementById("labelDesc").innerText = translations[lang].labelDesc;
    document.getElementById("labelIcon").innerText = translations[lang].labelIcon;
    document.getElementById("btnCancel").innerText = translations[lang].btnCancel;
    document.getElementById("submitBtn").innerText = translations[lang].btnSave;
    
    const loadingEl = document.getElementById("gridLoading");
    if (loadingEl) loadingEl.innerText = translations[lang].loading;

    // Refresh display layout text layers
    renderApps();
}