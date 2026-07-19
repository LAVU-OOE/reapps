// ============================================================
//  GLOBALE KONFIGURATION
// ============================================================
const API_URL = "https://reapps-api.lavu-ooe.workers.dev/";
let reapps = [];
let currentLang = "en";

// PWA‑Installations‑Globals
let deferredPrompt = null;
const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

// ============================================================
//  ÜBERSETZUNGEN (alle Texte der Seite)
// ============================================================
const translations = {
    de: {
        title: "LAVU OOE - Re:Apps",
        subtitle: "Zentrale Software-Infrastruktur & digitale Logistikwerkzeuge",
        loading: "Lade Anwendungen...",
        addApp: "App hinzufügen",
        editApp: "Bearbeiten",
        deleteApp: "Löschen",
        deleteConfirm: "Möchten Sie diese App wirklich löschen?",
        badgeSustainable: "Nachhaltig",
        badgeInnovative: "Innovativ",
        badgeMunicipal: "Kommunal",
        statAsz: "Altstoffsammelzentren (ASZ)",
        statRec: "Jährlich gesammelte Wertstoffe",
        statStaff: "Engagierte Teammitglieder",
        statCirc: "Kreislaufwirtschaft Oberösterreich",
        footer: "Erstellt mit ♥ von Karli",
        modalTitleAdd: "Neue App hinzufügen",
        modalTitleEdit: "App bearbeiten",
        labelNameDe: "Name der Anwendung (DE) *",
        labelNameEn: "Name der Anwendung (EN) *",
        labelUrl: "Anwendungs-URL (Link) *",
        labelDescDe: "Beschreibung (DE)",
        labelDescEn: "Beschreibung (EN)",
        labelIcon: "Emoji Icon",
        labelPassword: "Admin Passwort *",
        btnCancel: "Abbrechen",
        btnSave: "Speichern",
        btnUpdate: "Aktualisieren",
        btnSaving: "Wird gespeichert...",
        btnDeleting: "Wird gelöscht...",
        errFetch: "Fehler beim Laden des API-Verzeichnisses.",
        errSave: "Fehler beim Speichern der Anwendung.",
        errDelete: "Fehler beim Löschen der Anwendung.",
        installBtnText: "App",
        installBtnOpen: "Als App öffnen…",
        installBtnClose: "Schließen",
        installFallback: "Die App kann über das Browser-Menü oder den Installationsbanner installiert werden.",
        toggleStatsHide: "Info ausblenden",
        toggleStatsShow: "Info einblenden"
    },
    en: {
        title: "LAVU OOE - Re:Apps",
        subtitle: "Central software infrastructure & digital logistics tools",
        loading: "Loading applications...",
        addApp: "Add Application",
        editApp: "Edit",
        deleteApp: "Delete",
        deleteConfirm: "Do you really want to delete this app?",
        badgeSustainable: "Sustainable",
        badgeInnovative: "Innovative",
        badgeMunicipal: "Municipal",
        statAsz: "Recycling Centers (ASZ)",
        statRec: "Waste materials collected annually",
        statStaff: "Dedicated team members",
        statCirc: "Circular Economy Upper Austria",
        footer: "Built with ♥ by Karli",
        modalTitleAdd: "Add New Application",
        modalTitleEdit: "Edit Application",
        labelNameDe: "Application Name (DE) *",
        labelNameEn: "Application Name (EN) *",
        labelUrl: "Application URL (Link) *",
        labelDescDe: "Description (DE)",
        labelDescEn: "Description (EN)",
        labelIcon: "Emoji Icon",
        labelPassword: "Admin Password *",
        btnCancel: "Cancel",
        btnSave: "Save",
        btnUpdate: "Update",
        btnSaving: "Saving...",
        btnDeleting: "Deleting...",
        errFetch: "Error loading the application log from API.",
        errSave: "Could not save the application.",
        errDelete: "Could not delete the application.",
        installBtnText: "Install",
        installBtnOpen: "Open as…",
        installBtnClose: "Close",
        installFallback: "You can install this app via the browser menu or the installation banner.",
        toggleStatsHide: "Hide Info",
        toggleStatsShow: "Show Info"
    }
};

// ============================================================
//  INITIALISIERUNG (mit Spracherkennung & localStorage)
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
    // 1. Sprache laden oder erkennen
    const savedLang = localStorage.getItem('preferredLanguage');
    if (savedLang) {
        currentLang = savedLang;
    } else {
        const browserLang = navigator.language || navigator.languages?.[0] || 'en';
        currentLang = browserLang.startsWith('de') ? 'de' : 'en';
        localStorage.setItem('preferredLanguage', currentLang);
    }
    setLanguage(currentLang);

    // 2. Stats-Sichtbarkeit aus localStorage wiederherstellen
    const statsHidden = localStorage.getItem('statsHidden') === 'true';
    const statsSection = document.getElementById('lavuStatsDashboard');
    if (statsSection) {
        if (statsHidden) {
            statsSection.classList.add('hidden');
        } else {
            statsSection.classList.remove('hidden');
        }
    }
    updateStatsButtonText();

    // 3. PWA-Events und Re:Apps laden
    registerInstallEvents();
    updateInstallButton();
    loadAppsFromAPI();
});

// ============================================================
//  STATS TOGGLE
// ============================================================
function toggleStats() {
    const statsSection = document.getElementById('lavuStatsDashboard');
    if (!statsSection) return;

    const isHidden = statsSection.classList.contains('hidden');
    if (isHidden) {
        statsSection.classList.remove('hidden');
        localStorage.setItem('statsHidden', 'false');
    } else {
        statsSection.classList.add('hidden');
        localStorage.setItem('statsHidden', 'true');
    }
    updateStatsButtonText();
}

function updateStatsButtonText() {
    const statsSection = document.getElementById('lavuStatsDashboard');
    const textSpan = document.getElementById('infoStatsText');
    if (!statsSection || !textSpan) return;

    const isHidden = statsSection.classList.contains('hidden');
    const t = translations[currentLang];
    textSpan.innerText = isHidden ? t.toggleStatsShow : t.toggleStatsHide;
}

// ============================================================
//  PWA‑INSTALLATIONS‑LOGIK (unverändert)
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
        if (!document.hidden) updateInstallButton();
    });
}

function updateInstallButton() {
    const btn = document.getElementById('installAppBtn');
    const icon = document.getElementById('installIcon');
    const text = document.getElementById('installText');
    if (!btn) return;

    const isInstalled = localStorage.getItem('pwaInstalled') === 'true' || isStandalone;
    const isInStandalone = isStandalone || window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

    if (isInStandalone) {
        icon.textContent = '❌';
        text.textContent = translations[currentLang].installBtnClose;
        btn.onclick = () => window.close();
        btn.style.background = '#718096';
        return;
    }
    if (isInstalled) {
        icon.textContent = '📲';
        text.textContent = translations[currentLang].installBtnOpen;
        btn.onclick = openInstalledApp;
        btn.style.background = '#38a169';
        return;
    }
    icon.textContent = '📲';
    text.textContent = translations[currentLang].installBtnText;
    btn.onclick = installApp;
    btn.style.background = '#38a169';
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
//  APP‑VERWALTUNG (Laden, Rendern, Speichern, Löschen)
// ============================================================
async function loadAppsFromAPI() {
    const grid = document.getElementById("app-grid");
    try {
        const response = await fetch(API_URL, { method: "GET" });
        if (!response.ok) throw new Error(`HTTP Status ${response.status}`);
        reapps = await response.json();
        renderApps();
    } catch (error) {
        console.error("API load failed, falling back to basic layout:", error);
        reapps = [
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

    reapps.forEach((app, index) => {
        const card = document.createElement("div");
        card.className = "app-card";
        card.style.position = "relative";

        let name = "Unbenannt";
        if (currentLang === 'de' && app.nameDe) {
            name = app.nameDe;
        } else if (currentLang === 'en' && app.nameEn) {
            name = app.nameEn;
        } else if (app.name) {
            name = app.name;
        } else if (app.nameDe) {
            name = app.nameDe;
        } else if (app.nameEn) {
            name = app.nameEn;
        }

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

        const openText = currentLang === 'de' ? 'Öffnen' : 'Open';
        card.innerHTML = `
            <div class="app-icon">${app.icon || "🚀"}</div>
            <h3>${name}</h3>
            <p>${desc}</p>
            <div style="margin-top: auto; display: flex; justify-content: space-between; align-items: center; padding-top: 12px; border-top: 1px solid #edf2f7;">
                <div style="display: flex; gap: 6px;">
                    <button class="edit-card-btn" data-index="${index}" title="${translations[currentLang].editApp}">✏️</button>
                    <button class="delete-card-btn" data-index="${index}" title="${translations[currentLang].deleteApp}">🗑️</button>
                </div>
                <button class="open-app-btn" data-url="${app.url}">
                    ➡️ ${openText}
                </button>
            </div>
        `;

        const openBtn = card.querySelector('.open-app-btn');
        openBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            window.open(app.url, '_blank');
        });

        card.addEventListener('click', (e) => {
            if (e.target.closest('button')) return;
            window.open(app.url, '_blank');
        });

        const editBtn = card.querySelector('.edit-card-btn');
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            editApp(index);
        });

        const deleteBtn = card.querySelector('.delete-card-btn');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteApp(index);
        });

        grid.appendChild(card);
    });

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
    editIndex = null;
    document.getElementById('editIndex').value = '';
    document.getElementById('addAppForm').reset();
    document.getElementById('modalTitle').innerText = translations[currentLang].modalTitleAdd;
    document.getElementById('submitBtn').innerText = translations[currentLang].btnSave;
    document.getElementById('addAppModal').classList.remove('hidden');
}

function editApp(index) {
    const app = reapps[index];
    if (!app) return;

    editIndex = index;
    document.getElementById('editIndex').value = index;
    document.getElementById('appNameDe').value = app.nameDe || '';
    document.getElementById('appNameEn').value = app.nameEn || '';
    document.getElementById('appUrl').value = app.url || '';
    document.getElementById('appDescDe').value = app.descDe || '';
    document.getElementById('appDescEn').value = app.descEn || '';
    document.getElementById('appIcon').value = app.icon || '';

    document.getElementById('modalTitle').innerText = translations[currentLang].modalTitleEdit;
    document.getElementById('submitBtn').innerText = translations[currentLang].btnUpdate;
    document.getElementById('addAppModal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('addAppModal').classList.add('hidden');
    document.getElementById('addAppForm').reset();
    document.getElementById('editIndex').value = '';
    editIndex = null;
}

async function handleFormSubmit(event) {
    event.preventDefault();
    const submitBtn = document.getElementById('submitBtn');
    const isEdit = document.getElementById('editIndex').value !== '';

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = translations[currentLang].btnSaving;
    }

    const appData = {
        nameDe: document.getElementById('appNameDe')?.value || '',
        nameEn: document.getElementById('appNameEn')?.value || '',
        url: document.getElementById('appUrl')?.value || '',
        descDe: document.getElementById('appDescDe')?.value || '',
        descEn: document.getElementById('appDescEn')?.value || '',
        icon: document.getElementById('appIcon')?.value?.trim() || '🚀',
        password: document.getElementById('adminPassword')?.value || ''
    };

    if ((!appData.nameDe && !appData.nameEn) || !appData.url) {
        alert('Bitte fülle alle Pflichtfelder (Name und URL) aus.');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerText = isEdit ? translations[currentLang].btnUpdate : translations[currentLang].btnSave;
        }
        return;
    }

    try {
        let response;
        if (isEdit) {
            const index = parseInt(document.getElementById('editIndex').value);
            response = await fetch(API_URL, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ index, app: appData })
            });
        } else {
            response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(appData)
            });
        }

        if (!response.ok) {
            if (response.status === 403) throw new Error('Passwort falsch');
            throw new Error('Netzwerkfehler');
        }

        closeModal();
        location.reload();
    } catch (error) {
        console.error('Fehler beim Speichern:', error);
        alert('Fehler beim Speichern: ' + error.message);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerText = isEdit ? translations[currentLang].btnUpdate : translations[currentLang].btnSave;
        }
    }
}

async function deleteApp(index) {
    if (!confirm(translations[currentLang].deleteConfirm)) return;

    try {
        const response = await fetch(API_URL, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ index })
        });

        if (!response.ok) {
            if (response.status === 403) throw new Error('Passwort falsch');
            throw new Error('Netzwerkfehler');
        }

        location.reload();
    } catch (error) {
        console.error('Fehler beim Löschen:', error);
        alert(translations[currentLang].errDelete + ': ' + error.message);
    }
}

// ============================================================
//  SPRACHUMSCHALTUNG (alle Texte aktualisieren)
// ============================================================
function setLanguage(lang) {
    localStorage.setItem('preferredLanguage', lang);
    currentLang = lang;
    const t = translations[lang];

    document.getElementById("langBtnDe").classList.toggle("active", lang === "de");
    document.getElementById("langBtnEn").classList.toggle("active", lang === "en");

    document.getElementById("titleText").innerText = t.title;
    document.getElementById("subtitleText").innerText = t.subtitle;

    document.getElementById("badgeSustainable").innerText = t.badgeSustainable;
    document.getElementById("badgeInnovative").innerText = t.badgeInnovative;
    document.getElementById("badgeMunicipal").innerText = t.badgeMunicipal;

    document.getElementById("lblStatAsz").innerText = t.statAsz;
    document.getElementById("lblStatRec").innerText = t.statRec;
    document.getElementById("lblStatStaff").innerText = t.statStaff;
    document.getElementById("lblStatCirc").innerText = t.statCirc;

    document.getElementById("footerTextEl").innerHTML = t.footer;

    const isEdit = document.getElementById('editIndex').value !== '';
    document.getElementById("modalTitle").innerText = isEdit ? t.modalTitleEdit : t.modalTitleAdd;
    document.getElementById("labelNameDe").innerText = t.labelNameDe;
    document.getElementById("labelNameEn").innerText = t.labelNameEn;
    document.getElementById("labelUrl").innerText = t.labelUrl;
    document.getElementById("labelDescDe").innerText = t.labelDescDe;
    document.getElementById("labelDescEn").innerText = t.labelDescEn;
    document.getElementById("labelIcon").innerText = t.labelIcon;
    document.getElementById("labelPassword").innerText = t.labelPassword;
    document.getElementById("btnCancel").innerText = t.btnCancel;
    document.getElementById("submitBtn").innerText = isEdit ? t.btnUpdate : t.btnSave;

    const loadingEl = document.getElementById("gridLoading");
    if (loadingEl) loadingEl.innerText = t.loading;

    const addText = document.getElementById("addPlaceholderText");
    if (addText) addText.innerText = t.addApp;

    updateInstallButton();
    updateStatsButtonText();
    renderApps();
}