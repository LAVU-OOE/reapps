// ============================================================
//  GLOBALE KONFIGURATION
// ============================================================
const API_URL = "https://apps-api.lavu-ooe.workers.dev/";
let apps = [];
let currentLang = "de";

// PWA‑Installations‑Globals
let deferredPrompt = null;
const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

// ============================================================
//  ÜBERSETZUNGEN (alle Texte der Seite)
// ============================================================
const translations = {
    de: {
        title: "LAVU OÖ - Anwendungs-Verzeichnis",
        subtitle: "Zentrale Software-Infrastruktur & digitale Logistikwerkzeuge",
        loading: "Lade Anwendungen...",
        addApp: "App hinzufügen",
        badgeSustainable: "Nachhaltig",
        badgeInnovative: "Innovativ",
        badgeMunicipal: "Kommunal",
        statAsz: "Altstoffsammelzentren (ASZ)",
        statRec: "Jährlich gesammelte Wertstoffe",
        statStaff: "Engagierte Teammitglieder",
        statCirc: "Kreislaufwirtschaft Oberösterreich",
        footer: "Erstellt mit ♥ von Karli",
        modalTitle: "Neue App hinzufügen",
        labelNameDe: "Name der Anwendung (DE) *",
        labelNameEn: "Name der Anwendung (EN) *",
        labelUrl: "Anwendungs-URL (Link) *",
        labelDescDe: "Beschreibung (DE)",
        labelDescEn: "Beschreibung (EN)",
        labelIcon: "Emoji Icon",
        labelPassword: "Admin Passwort *",
        btnCancel: "Abbrechen",
        btnSave: "Speichern",
        btnSaving: "Wird gespeichert...",
        errFetch: "Fehler beim Laden des API-Verzeichnisses.",
        errSave: "Fehler beim Speichern der Anwendung.",
        // Install‑Button‑Texte
        installBtnText: "App",
        installBtnOpen: "Als App öffnen…",
        installBtnClose: "Schließen",
        installFallback: "Die App kann über das Browser-Menü oder den Installationsbanner installiert werden."
    },
    en: {
        title: "LAVU OÖ - Application Directory",
        subtitle: "Central software infrastructure & digital logistics tools",
        loading: "Loading applications...",
        addApp: "Add Application",
        badgeSustainable: "Sustainable",
        badgeInnovative: "Innovative",
        badgeMunicipal: "Municipal",
        statAsz: "Recycling Centers (ASZ)",
        statRec: "Waste materials collected annually",
        statStaff: "Dedicated team members",
        statCirc: "Circular Economy Upper Austria",
        footer: "Built with ♥ by Karli",
        modalTitle: "Add New Application",
        labelNameDe: "Application Name (DE) *",
        labelNameEn: "Application Name (EN) *",
        labelUrl: "Application URL (Link) *",
        labelDescDe: "Description (DE)",
        labelDescEn: "Description (EN)",
        labelIcon: "Emoji Icon",
        labelPassword: "Admin Password *",
        btnCancel: "Cancel",
        btnSave: "Save",
        btnSaving: "Saving...",
        errFetch: "Error loading the application log from API.",
        errSave: "Could not save the application.",
        // Install‑Button‑Texte
        installBtnText: "Install",
        installBtnOpen: "Open as…",
        installBtnClose: "Close",
        installFallback: "You can install this app via the browser menu or the installation banner."
    }
};

// ============================================================
//  INITIALISIERUNG
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
    loadAppsFromAPI();
    updateInstallButton();          // initialen Zustand setzen
    registerInstallEvents();        // PWA‑Events abonnieren
});

// ============================================================
//  PWA‑INSTALLATIONS‑LOGIK (wie auf gaestehaus22.at)
// ============================================================
function registerInstallEvents() {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        updateInstallButton();
    });

    window.addEventListener('appinstalled', () => {
        deferredPrompt = null;
        localStorage.setItem('pwaInstalled', 'true');
        updateInstallButton();
    });

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            updateInstallButton();
        }
    });
}

function updateInstallButton() {
    const btn = document.getElementById('installAppBtn');
    const icon = document.getElementById('installIcon');
    const text = document.getElementById('installText');
    if (!btn) return;

    const isInstalled = localStorage.getItem('pwaInstalled') === 'true' || isStandalone;
    const isInStandalone = isStandalone || window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

    // 1. Standalone-Modus → Schließen
    if (isInStandalone) {
        icon.textContent = '❌';
        text.textContent = translations[currentLang].installBtnClose;
        btn.onclick = () => window.close();
        btn.style.background = '#718096';
        return;
    }

    // 2. Installiert, aber im Browser → Als App öffnen
    if (isInstalled) {
        icon.textContent = '📲';
        text.textContent = translations[currentLang].installBtnOpen;
        btn.onclick = openInstalledApp;
        btn.style.background = '#38a169'; // grün
        return;
    }

    // 3. Nicht installiert → Installieren
    icon.textContent = '📲';
    text.textContent = translations[currentLang].installBtnText;
    btn.onclick = installApp;
    btn.style.background = '#3182ce';
}

function installApp() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                localStorage.setItem('pwaInstalled', 'true');
                updateInstallButton();
            }
            deferredPrompt = null;
        });
    } else {
        alert(translations[currentLang].installFallback);
    }
}

function openInstalledApp() {
    const url = window.location.href;
    const intentUrl = `intent://${url.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end;`;
    window.location.href = intentUrl;
    setTimeout(() => {
        window.open(url, '_blank');
    }, 2000);
}

// ============================================================
//  APP‑VERWALTUNG (Laden, Rendern, Speichern)
// ============================================================
async function loadAppsFromAPI() {
    const grid = document.getElementById("app-grid");
    try {
        const response = await fetch(API_URL, { method: "GET" });
        if (!response.ok) throw new Error(`HTTP Status ${response.status}`);
        apps = await response.json();
        renderApps();
    } catch (error) {
        console.error("API load failed, falling back to basic layout:", error);
        apps = [
            {
                nameDe: "Etiketten-Druckstudio",
                nameEn: "Label Printing Studio",
                url: "https://lavu-ooe.github.io/Etiketten-Druckstudio/",
                descDe: "Studio zum Erstellen und Drucken von standardisierten Behälter- und Sortieretiketten.",
                descEn: "Studio for creating and printing standardized container and sorting labels.",
                icon: "🏷️"
            }
        ];
        renderApps();
    }
}

function renderApps() {
    const grid = document.getElementById("app-grid");
    if (!grid) return;
    grid.innerHTML = "";

    // Bestehende Apps
    apps.forEach(app => {
        const card = document.createElement("a");
        card.className = "app-card";
        card.href = app.url;
        card.target = "_blank";

        // ----- Flexibler Name -----
        let name = "Unbenannt";
        if (currentLang === 'de' && app.nameDe) {
            name = app.nameDe;
        } else if (currentLang === 'en' && app.nameEn) {
            name = app.nameEn;
        } else if (app.name) {
            name = app.name;               // Fallback auf generisches Feld
        } else if (app.nameDe) {
            name = app.nameDe;
        } else if (app.nameEn) {
            name = app.nameEn;
        }

        // ----- Flexible Beschreibung -----
        let desc = "";
        if (currentLang === 'de' && app.descDe) {
            desc = app.descDe;
        } else if (currentLang === 'en' && app.descEn) {
            desc = app.descEn;
        } else if (app.desc) {
            desc = app.desc;
        } else if (app.descDe) {
            desc = app.descDe;
        } else if (app.descEn) {
            desc = app.descEn;
        }

        card.innerHTML = `
            <div class="app-icon">${app.icon || "🚀"}</div>
            <h3>${name}</h3>
            <p>${desc}</p>
        `;
        grid.appendChild(card);
    });

    // "App hinzufügen"-Kachel (unverändert)
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

// ============================================================
//  MODAL (Hinzufügen / Bearbeiten)
// ============================================================
function openModal() {
    document.getElementById("addAppModal").classList.remove("hidden");
}

function closeModal() {
    document.getElementById("addAppModal").classList.add("hidden");
    document.getElementById("addAppForm").reset();
}

async function handleFormSubmit(event) {
    event.preventDefault();
    const submitBtn = document.getElementById("submitBtn");
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = translations[currentLang].btnSaving;
    }

    const appData = {
        nameDe: document.getElementById("appNameDe")?.value || "",
        nameEn: document.getElementById("appNameEn")?.value || "",
        url: document.getElementById("appUrl")?.value || "",
        descDe: document.getElementById("appDescDe")?.value || "",
        descEn: document.getElementById("appDescEn")?.value || "",
        icon: document.getElementById("appIcon")?.value?.trim() || "🚀",
        password: document.getElementById("adminPassword")?.value || ""
    };

    if ((!appData.nameDe && !appData.nameEn) || !appData.url) {
        alert("Bitte fülle alle Pflichtfelder (Name und URL) aus.");
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
            body: JSON.stringify(appData)
        });

        if (!response.ok) {
            if (response.status === 403) throw new Error("Passwort falsch");
            throw new Error("Netzwerkfehler");
        }

        closeModal();
        location.reload();
    } catch (error) {
        console.error("Fehler beim Speichern:", error);
        alert("Fehler beim Speichern: " + error.message);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerText = translations[currentLang].btnSave;
        }
    }
}

// ============================================================
//  SPRACHUMSCHALTUNG (alle Texte aktualisieren)
// ============================================================
function setLanguage(lang) {
    currentLang = lang;
    const t = translations[lang];

    // Sprach‑Buttons
    document.getElementById("langBtnDe").classList.toggle("active", lang === "de");
    document.getElementById("langBtnEn").classList.toggle("active", lang === "en");

    // Header
    document.getElementById("titleText").innerText = t.title;
    document.getElementById("subtitleText").innerText = t.subtitle;

    // Badges
    document.getElementById("badgeSustainable").innerText = t.badgeSustainable;
    document.getElementById("badgeInnovative").innerText = t.badgeInnovative;
    document.getElementById("badgeMunicipal").innerText = t.badgeMunicipal;

    // Stats
    document.getElementById("lblStatAsz").innerText = t.statAsz;
    document.getElementById("lblStatRec").innerText = t.statRec;
    document.getElementById("lblStatStaff").innerText = t.statStaff;
    document.getElementById("lblStatCirc").innerText = t.statCirc;

    // Footer
    document.getElementById("footerTextEl").innerHTML = t.footer;

    // Modal
    document.getElementById("modalTitle").innerText = t.modalTitle;
    document.getElementById("labelNameDe").innerText = t.labelNameDe;
    document.getElementById("labelNameEn").innerText = t.labelNameEn;
    document.getElementById("labelUrl").innerText = t.labelUrl;
    document.getElementById("labelDescDe").innerText = t.labelDescDe;
    document.getElementById("labelDescEn").innerText = t.labelDescEn;
    document.getElementById("labelIcon").innerText = t.labelIcon;
    document.getElementById("labelPassword").innerText = t.labelPassword;
    document.getElementById("btnCancel").innerText = t.btnCancel;
    document.getElementById("submitBtn").innerText = t.btnSave;

    // Grid‑Ladehinweis
    const loadingEl = document.getElementById("gridLoading");
    if (loadingEl) loadingEl.innerText = t.loading;

    // Add‑Button im Grid
    const addText = document.getElementById("addPlaceholderText");
    if (addText) addText.innerText = t.addApp;

    // Install‑Button aktualisieren (Texte und Zustand)
    updateInstallButton();

    // Apps neu rendern (für die mehrsprachigen Karten)
    renderApps();
}