// Global Configuration
const API_URL = "https://apps-api.lavu-ooe.workers.dev/"; //[cite: 35]
let apps = []; //[cite: 35]
let currentLang = "de"; //[cite: 35]

// Dual Language Context Matrix
const translations = { //[cite: 35]
    de: { //[cite: 35]
        title: "Anwendungs-Verzeichnis", //[cite: 35]
        loading: "Lade Anwendungen...", //[cite: 35]
        addApp: "App hinzufügen", //[cite: 35]
        modalTitle: "Neue App hinzufügen", //[cite: 35]
        labelName: "Name der Anwendung *", //[cite: 35]
        labelUrl: "Anwendungs-URL (Link) *", //[cite: 35]
        labelDesc: "Beschreibung", //[cite: 35]
        labelIcon: "Emoji Icon", //[cite: 35]
        btnCancel: "Abbrechen", //[cite: 35]
        btnSave: "Speichern", //[cite: 35]
        btnSaving: "Wird gespeichert...", //[cite: 35]
        errFetch: "Fehler beim Laden des API-Verzeichnisses.", //[cite: 35]
        errSave: "Fehler beim Speichern der Anwendung." //[cite: 35]
    }, //[cite: 35]
    en: { //[cite: 35]
        title: "Application Directory", //[cite: 35]
        loading: "Loading applications...", //[cite: 35]
        addApp: "Add Application", //[cite: 35]
        modalTitle: "Add New Application", //[cite: 35]
        labelName: "Application Name *", //[cite: 35]
        labelUrl: "Application URL (Link) *", //[cite: 35]
        labelDesc: "Description", //[cite: 35]
        labelIcon: "Emoji Icon", //[cite: 35]
        btnCancel: "Cancel", //[cite: 35]
        btnSave: "Save", //[cite: 35]
        btnSaving: "Saving...", //[cite: 35]
        errFetch: "Error loading the application log from API.", //[cite: 35]
        errSave: "Could not save the application." //[cite: 35]
    } //[cite: 35]
}; //[cite: 35]

// Initialize Dashboard
document.addEventListener("DOMContentLoaded", () => { //[cite: 35]
    loadAppsFromAPI(); //[cite: 35]
}); //[cite: 35]

// Fetch Application Array from Worker Endpoint
async function loadAppsFromAPI() { //[cite: 35]
    const grid = document.getElementById("app-grid"); //[cite: 35]
    try { //[cite: 35]
        const response = await fetch(API_URL, { method: "GET" }); //[cite: 35]
        if (!response.ok) throw new Error(`HTTP Status ${response.status}`); //[cite: 35]
        
        apps = await response.json(); //[cite: 35]
        renderApps(); //[cite: 35]
    } catch (error) { //[cite: 35]
        console.error("API load failed, falling back to basic layout:", error); //[cite: 35]
        // Fallback array if database is offline or empty
        apps = [ //[cite: 35]
            { //[cite: 35]
                name: "Etiketten-Druckstudio", //[cite: 35]
                url: "https://lavu-ooe.github.io/Etiketten-Druckstudio/", //[cite: 35]
                desc: "Studio for creating and printing standardized container and sorting labels.", //[cite: 35]
                icon: "🏷️" //[cite: 35]
            } //[cite: 35]
        ]; //[cite: 35]
        renderApps(); //[cite: 35]
    } //[cite: 35]
} //[cite: 35]

// Render active items and appends the dynamic operational placeholder card
function renderApps() { //[cite: 35]
    const grid = document.getElementById("app-grid"); //[cite: 35]
    if (!grid) return; //[cite: 35]
    grid.innerHTML = ""; //[cite: 35]

    // 1. Map existing entries to standard card templates
    apps.forEach(app => { //[cite: 35]
        const card = document.createElement("a"); //[cite: 35]
        card.className = "app-card"; //[cite: 35]
        card.href = app.url; //[cite: 35]
        card.target = "_blank"; //[cite: 35]
        card.innerHTML = `
            <div class="app-icon">${app.icon || "🚀"}</div>
            <h3>${app.name}</h3>
            <p>${app.desc || ""}</p>
        `; //[cite: 35]
        grid.appendChild(card); //[cite: 35]
    }); //[cite: 35]

    // 2. Inject the 'Add App' Interactive Box into the grid slot
    const addCard = document.createElement("div"); //[cite: 35]
    addCard.className = "app-card add-placeholder-card"; //[cite: 35]
    addCard.innerHTML = `
        <div class="add-card-content">
            <span class="add-icon">➕</span>
            <span class="add-text" id="addPlaceholderText">${translations[currentLang].addApp}</span>
        </div>
    `; //[cite: 35]
    addCard.addEventListener("click", openModal); //[cite: 35]
    grid.appendChild(addCard); //[cite: 35]
} //[cite: 35]

// Modal Toggle Mechanics
function openModal() { //[cite: 35]
    document.getElementById("addAppModal").classList.remove("hidden"); //[cite: 35]
    // Fehler behoben: Kein unauffindbares Element mehr auf disabled setzen!
    const submitBtn = document.getElementById("submitBtn"); //[cite: 35]
    if (submitBtn) { //[cite: 35]
        submitBtn.disabled = false; //[cite: 35]
        submitBtn.innerText = translations[currentLang].btnSave; //[cite: 35]
    }
} //[cite: 35]

function closeModal() { //[cite: 35]
    document.getElementById("addAppModal").classList.add("hidden"); //[cite: 35]
    document.getElementById("addAppForm").reset(); //[cite: 35]
} //[cite: 35]

// Handle Form Execution and Save Data Dynamically
async function handleFormSubmit(event) { //[cite: 35]
    event.preventDefault(); //[cite: 35]
    
    const submitBtn = document.getElementById("submitBtn"); //[cite: 35]
    if (submitBtn) { //[cite: 35]
        submitBtn.disabled = true; //[cite: 35]
        submitBtn.innerText = translations[currentLang].btnSaving; //[cite: 35]
    } //[cite: 35]

    const appData = { //[cite: 35]
        name: document.getElementById("appName").value, //[cite: 35]
        url: document.getElementById("appUrl").value, //[cite: 35]
        desc: document.getElementById("appDesc").value, //[cite: 35]
        icon: document.getElementById("appIcon").value.trim() || "🚀" //[cite: 35]
    }; //[cite: 35]

    try { //[cite: 35]
        const response = await fetch(API_URL, { //[cite: 35]
            method: "POST", //[cite: 35]
            headers: { "Content-Type": "application/json" }, //[cite: 35]
            body: JSON.stringify(appData) //[cite: 35]
        }); //[cite: 35]

        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`); //[cite: 35]

        const contentType = response.headers.get("content-type"); //[cite: 35]
        let responseData = null; //[cite: 35]
        
        if (contentType && contentType.includes("application/json")) { //[cite: 35]
            responseData = await response.json(); //[cite: 35]
        } //[cite: 35]

        // Smart state assignment based on API behavior
        if (Array.isArray(responseData)) { //[cite: 35]
            apps = responseData; //[cite: 35]
        } else if (responseData && responseData.added) { //[cite: 35]
            apps.push(responseData.added); //[cite: 35]
        } else { //[cite: 35]
            apps.push(appData); //[cite: 35]
        } //[cite: 35]

        renderApps(); //[cite: 35]
        closeModal(); //[cite: 35]
    } catch (error) { //[cite: 35]
        console.error("Error submitting new application link:", error); //[cite: 35]
        alert(translations[currentLang].errSave); //[cite: 35]
    } finally { //[cite: 35]
        if (submitBtn) { //[cite: 35]
            submitBtn.disabled = false; //[cite: 35]
            submitBtn.innerText = translations[currentLang].btnSave; //[cite: 35]
        } //[cite: 35]
    } //[cite: 35]
} //[cite: 35]

// Update Local Language String Matrix Options
function setLanguage(lang) { //[cite: 35]
    currentLang = lang; //[cite: 35]
    
    // Toggle active link visual highlights
    document.getElementById("langBtnDe").classList.toggle("active", lang === "de"); //[cite: 35]
    document.getElementById("langBtnEn").classList.toggle("active", lang === "en"); //[cite: 35]

    // Dynamic document DOM string injection
    document.getElementById("titleText").innerText = translations[lang].title; //[cite: 35]
    document.getElementById("modalTitle").innerText = translations[lang].modalTitle; //[cite: 35]
    document.getElementById("labelName").innerText = translations[lang].labelName; //[cite: 35]
    document.getElementById("labelUrl").innerText = translations[lang].labelUrl; //[cite: 35]
    document.getElementById("labelDesc").innerText = translations[lang].labelDesc; //[cite: 35]
    document.getElementById("labelIcon").innerText = translations[lang].labelIcon; //[cite: 35]
    document.getElementById("btnCancel").innerText = translations[lang].btnCancel; //[cite: 35]
    
    const submitBtn = document.getElementById("submitBtn"); //[cite: 35]
    if (submitBtn) submitBtn.innerText = translations[lang].btnSave; //[cite: 35]
    
    const loadingEl = document.getElementById("gridLoading"); //[cite: 35]
    if (loadingEl) loadingEl.innerText = translations[lang].loading; //[cite: 35]

    // Refresh display layout text layers
    renderApps(); //[cite: 35]
}