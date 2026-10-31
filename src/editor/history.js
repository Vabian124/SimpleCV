/* CC0-1.0 — https://creativecommons.org/publicdomain/zero/1.0/ */
/* Undo, redo, and saving the document in this browser. */

function normalize(data) {
    data.version = 1;
    data.sidebar = Array.isArray(data.sidebar) ? data.sidebar : [];
    data.main = Array.isArray(data.main) ? data.main : [];
    if (data.kind !== "letter" && data.kind !== "cv") data.kind = "cv";
    const base = data.kind === "letter" ? letterTheme() : cvTheme();
    const saved = data.theme || {};
    const hadLight = Object.prototype.hasOwnProperty.call(saved, "accentLight");
    data.theme = Object.assign(base, saved);
    data.theme.baseSize = Number(data.theme.baseSize) || base.baseSize;
    data.theme.sidebarWidth = Number(data.theme.sidebarWidth) || base.sidebarWidth;
    if (!hadLight) data.theme.accentLight = base.accentLight;
    if (data.theme.font !== "merriweather" && data.theme.font !== "lora") data.theme.font = "roboto";
    data.lang = data.lang === "en" ? "en" : "nl";
    let max = 1;
    data.sidebar.concat(data.main).forEach(function (item) {
        const n = Number(String(item.id || "").replace(/\D/g, ""));
        if (n > max) max = n;
        item.fields = item.fields || {};
        item.color = item.color || "";
        item.background = item.background || "";
        item.fontSize = Number(item.fontSize) || 0;
    });
    seq = max;
}

function snapshot() {
    past.push(JSON.stringify(doc));
    if (past.length > 60) past.shift();
    future = [];
    syncHistoryButtons();
}

function rememberSnapshot() {
    if (snapArmed) return;
    snapshot();
    snapArmed = true;
}

function restore(next) {
    doc = next;
    normalize(doc);
    lang = doc.lang;
    try { localStorage.setItem(STORAGE_LANG, lang); } catch (error) { /* keep going */ }
    if (!selectedBlock()) selectedId = null;
    applyLanguage();
    render();
    save();
}

function syncHistoryButtons() {
    const undoBtn = document.getElementById("undo-btn");
    const redoBtn = document.getElementById("redo-btn");
    if (undoBtn) undoBtn.disabled = !past.length;
    if (redoBtn) redoBtn.disabled = !future.length;
}

function undo() {
    if (!past.length) return;
    future.push(JSON.stringify(doc));
    restore(JSON.parse(past.pop()));
    syncHistoryButtons();
}

function redo() {
    if (!future.length) return;
    past.push(JSON.stringify(doc));
    restore(JSON.parse(future.pop()));
    syncHistoryButtons();
}

function markSaved(ok) {
    const node = document.getElementById("save-state");
    saveOk = ok;
    if (!node) {
        if (!ok) showToast(t("ui.saveFail"), "error");
        return;
    }
    node.classList.toggle("is-fail", !ok);
    node.dataset.state = ok ? "ok" : "fail";
    node.textContent = ok ? t("ui.saved") : "";
    window.clearTimeout(saveTimer);
    if (!ok) showToast(t("ui.saveFail"), "error");
    if (ok) {
        saveTimer = window.setTimeout(function () {
            if (node.dataset.state === "ok") node.textContent = "";
        }, 1600);
    }
}

function save() {
    if (document.body.dataset.phase === "setup") return;
    try {
        localStorage.setItem(STORAGE_DOC, JSON.stringify(doc));
        documentLive = true;
        if (!saveOk || document.getElementById("save-state")) markSaved(true);
    } catch (error) {
        if (saveOk) markSaved(false);
    }
    updateFilenamePreview();
    refreshIdentity();
}

function syncFilenameFromPerson() {
    if (filenameCustom) {
        refreshIdentity();
        return;
    }
    const input = document.getElementById("pdf-name");
    const person = plainName().replace(/\s+/g, " ").trim();
    const next = !person || person === t("ph.name") ? "" : person;
    if (input && input.value !== next) {
        input.value = next;
        try { localStorage.setItem(STORAGE_NAME, next); } catch (error) { /* ignore */ }
    }
    updateFilenamePreview();
    refreshIdentity();
}

function refreshIdentity() {
    const title = document.getElementById("doc-title");
    if (document.body.dataset.phase !== "studio") document.title = t("site.title");
    if (!doc) return;
    const kind = doc.kind === "letter" ? t("setup.letter") : t("setup.cv");
    const person = plainName().replace(/\s+/g, " ").trim();
    const named = person && person !== t("ph.name");
    const label = named ? kind + " · " + person : kind;
    if (title) title.textContent = label;
    if (document.body.dataset.phase === "studio") document.title = label + " — " + t("ui.title");
}

function selectedBlock() {
    if (!selectedId || !doc) return null;
    return doc.sidebar.concat(doc.main).find(function (item) { return item.id === selectedId; }) || null;
}

function columnOf(id) {
    if (doc.sidebar.some(function (item) { return item.id === id; })) return "sidebar";
    return "main";
}

function plainName() {
    const found = doc.sidebar.concat(doc.main).find(function (item) { return item.type === "name"; });
    if (!found) return "";
    const holder = document.createElement("div");
    holder.innerHTML = found.fields.html || "";
    return (holder.textContent || "").replace(/\s+/g, " ").trim();
}

