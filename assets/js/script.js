const API_URL = "https://apps-api.lavu-ooe.workers.dev/";
let apps = [];
let currentLang = "de";

// Dual Language Context Matrix
const translations = {
    de: {
        title: "LAVU OÖ - Anwendungs-Verzeichnis", // Aktualisiert
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
        title: "LAVU OÖ - Application Directory", // Aktualisiert
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
    setLanguage(currentLang); // Sorgt dafür, dass die deutschen Texte sofort geladen werden
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
        // Fallback array utilizing standard fields and localized alternative options
        apps = [
            {
                name_de: "Etiketten-Druckstudio",
                name_en: "Label Printing Studio",
                url: "https://lavu-ooe.github.io/Etiketten-Druckstudio/",
                desc_de: "Studio zur Erstellung und zum Druck von standardisierten Behälter- und Sortieretiketten.",
                desc_en: "Studio for creating and printing standardized container and sorting labels.",
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

    // 1. Map entries dynamically focusing on local translation properties
    apps.forEach(app => {
        const card = document.createElement("a");
        card.className = "app-card";
        card.href = app.url;
        card.target = "_blank"; 

        // Smart translation matching: Uses localized keys (name_de/name_en) if available, otherwise falls back to standard properties
        const appName = app[`name_${currentLang}`] || app.name || "Unnamed App";
        const appDesc = app[`desc_${currentLang}`] || app.desc || "";

        card.innerHTML = `
            <div class="app-icon">${app.icon || "🚀"}</div>
            <h3>${appName}</h3>
            <p>${appDesc}</p>
        `;
        grid.appendChild(card);
    });

    // 2. Inject the 'Add App' Interactive Box into the sequential slot
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

// Stats Container Toggle Link Activity
function toggleStats() {
    const statsSection = document.getElementById("lavuStatsDashboard");
    if (statsSection) {
        statsSection.classList.toggle("hidden");
    }
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
        submitBtn.disabled = false;
        submitBtn.innerText = translations[currentLang].btnSave;
    }
}

// Update Local Language Matrix Options
function setLanguage(lang) {
    currentLang = lang;
    
    // Toggle active link visual highlights
    document.getElementById("langBtnDe").classList.toggle("active", lang === "de");
    document.getElementById("langBtnEn").classList.toggle("active", lang === "en");

    // Dynamic document DOM string injection (Header & Structure)
    document.getElementById("titleText").innerText = translations[lang].title;
    document.getElementById("subtitleText").innerText = translations[lang].subtitle;
    
    // Badges & Toggle Controls
    document.getElementById("badgeSustainable").innerText = translations[lang].badgeSustainable;
    document.getElementById("badgeInnovative").innerText = translations[lang].badgeInnovative;
    document.getElementById("badgeMunicipal").innerText = translations[lang].badgeMunicipal;
    document.getElementById("btnInfoStats").innerHTML = `<span>ℹ️</span> ${translations[lang].btnInfo.replace('ℹ️ ', '')}`;

    // Statistics Card Metrics Labels
    document.getElementById("lblStatAsz").innerText = translations[lang].statAsz;
    document.getElementById("lblStatRec").innerText = translations[lang].statRec;
    document.getElementById("lblStatStaff").innerText = translations[lang].statStaff;
    document.getElementById("lblStatCirc").innerText = translations[lang].statCirc;

    // Modal Form Labels
    document.getElementById("modalTitle").innerText = translations[lang].modalTitle;
    document.getElementById("labelName").innerText = translations[lang].labelName;
    document.getElementById("labelUrl").innerText = translations[lang].labelUrl;
    document.getElementById("labelDesc").innerText = translations[lang].labelDesc;
    document.getElementById("labelIcon").innerText = translations[lang].labelIcon;
    document.getElementById("btnCancel").innerText = translations[lang].btnCancel;
    document.getElementById("submitBtn").innerText = translations[lang].btnSave;
    
    // Modal Input Form Placeholders
    document.getElementById("appName").placeholder = translations[lang].phName;
    document.getElementById("appUrl").placeholder = translations[lang].phUrl;
    document.getElementById("appDesc").placeholder = translations[lang].phDesc;
    document.getElementById("appIcon").placeholder = translations[lang].phIcon;
    
    // Footer & Async Loading Indicators
    document.getElementById("footerTextEl").innerHTML = translations[lang].footerText;
    const loadingEl = document.getElementById("gridLoading");
    if (loadingEl) loadingEl.innerText = translations[lang].loading;

    // Refresh dynamic app layout grid fields 
    renderApps();
}