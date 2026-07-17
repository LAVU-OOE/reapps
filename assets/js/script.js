const API_URL = "https://apps-api.lavu-ooe.workers.dev/";

// Funktion zum Absenden des Formulars - angepasst an deine HTML-IDs
async function handleFormSubmit(event) {
    event.preventDefault();
    
    const submitBtn = document.getElementById("submitBtn");
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = "Wird gespeichert...";
    }

    // Sammelt Daten aus den im HTML definierten IDs[cite: 13]
    const appData = {
        nameDe: document.getElementById("appNameDe")?.value || "",
        nameEn: document.getElementById("appNameEn")?.value || "",
        url: document.getElementById("appUrl")?.value || "", // Korrigiert auf appUrl[cite: 13]
        descDe: document.getElementById("appDescDe")?.value || "",
        descEn: document.getElementById("appDescEn")?.value || "",
        icon: document.getElementById("appIcon")?.value?.trim() || "🚀",
        password: document.getElementById("adminPassword")?.value || ""
    };

    // Validierung: Name (DE oder EN) und URL müssen vorhanden sein
    if ((!appData.nameDe && !appData.nameEn) || !appData.url) {
        alert("Bitte fülle alle Pflichtfelder (Name und URL) aus.");
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerText = "Speichern";
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
            // Fehlerbehandlung falls das Passwort falsch ist (403 Forbidden)
            if (response.status === 403) throw new Error("Passwort falsch");
            throw new Error("Netzwerkfehler");
        }

        closeModal();
        location.reload(); // Seite neu laden für die Aktualisierung[cite: 14]
    } catch (error) {
        console.error("Fehler beim Speichern:", error);
        alert("Fehler beim Speichern: " + error.message);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerText = "Speichern";
        }
    }
}

// Modal schließen Funktion
function closeModal() {
    const modal = document.getElementById("addAppModal");
    if (modal) modal.classList.add("hidden");
    
    const form = document.getElementById("addAppForm");
    if (form) form.reset();
}