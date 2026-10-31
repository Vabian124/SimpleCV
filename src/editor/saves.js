/* CC0-1.0 — https://creativecommons.org/publicdomain/zero/1.0/ */
/* Named copies of the open document, kept in this browser. */

const STORAGE_SAVES = "cv-tool-saves";
const SAVE_LIMIT = 24;

function readSaves() {
    try {
        const raw = JSON.parse(localStorage.getItem(STORAGE_SAVES) || "[]");
        if (!Array.isArray(raw)) return [];
        return raw.filter(function (item) {
            return item && typeof item.id === "string" && item.doc && item.doc.version === 1 && Array.isArray(item.doc.sidebar) && Array.isArray(item.doc.main);
        });
    } catch (error) {
        return [];
    }
}

function writeSaves(list) {
    try {
        localStorage.setItem(STORAGE_SAVES, JSON.stringify(list));
    } catch (error) {
        showToast(t("ui.saveFail"), "error");
    }
    const count = String(list.length || "");
    document.querySelectorAll(".saves-count").forEach(function (node) {
        node.textContent = count;
    });
}

function saveTitle() {
    const input = document.getElementById("pdf-name");
    const named = input && input.value.trim();
    if (named) return named;
    const person = typeof plainName === "function" ? plainName().replace(/\s+/g, " ").trim() : "";
    if (person && person !== t("ph.name")) return person;
    return doc && doc.kind === "letter" ? t("ui.savesKindLetter") : t("ui.savesKindCv");
}

function newSaveId() {
    return "s" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function updateLinkedSave() {
    if (saveSwap || !currentSaveId || !doc) return;
    const list = readSaves();
    const index = list.findIndex(function (item) { return item.id === currentSaveId; });
    if (index < 0) {
        currentSaveId = "";
        return;
    }
    list[index].doc = JSON.parse(JSON.stringify(doc));
    list[index].name = saveTitle();
    list[index].kind = doc.kind === "letter" ? "letter" : "cv";
    list[index].lang = doc.lang === "en" ? "en" : "nl";
    list[index].updated = Date.now();
    try { localStorage.setItem(STORAGE_SAVES, JSON.stringify(list)); } catch (error) { /* the live copy still saved */ }
}

function rememberSave(asCopy) {
    if (!doc) return;
    const list = readSaves();
    const fresh = asCopy || !currentSaveId || !list.some(function (item) { return item.id === currentSaveId; });
    const id = fresh ? newSaveId() : currentSaveId;
    const next = {
        id: id,
        name: saveTitle(),
        kind: doc.kind === "letter" ? "letter" : "cv",
        lang: doc.lang === "en" ? "en" : "nl",
        updated: Date.now(),
        doc: JSON.parse(JSON.stringify(doc))
    };
    const index = list.findIndex(function (item) { return item.id === id; });
    if (index >= 0) list[index] = next;
    else list.unshift(next);
    if (list.length > SAVE_LIMIT) list.length = SAVE_LIMIT;
    writeSaves(list);
    currentSaveId = id;
    paintSaves();
    showStatus(t(asCopy ? "ui.savesCopied" : "ui.savesStored"));
}

function clearSaves() {
    currentSaveId = "";
    try { localStorage.removeItem(STORAGE_SAVES); } catch (error) { /* private mode */ }
    writeSaves([]);
    paintSaves();
}

function forgetSave(id) {
    const list = readSaves().filter(function (item) { return item.id !== id; });
    if (currentSaveId === id) currentSaveId = "";
    writeSaves(list);
    paintSaves();
}

function openSave(id) {
    const item = readSaves().find(function (entry) { return entry.id === id; });
    if (!item) return;
    snapshot();
    doc = JSON.parse(JSON.stringify(item.doc));
    normalize(doc);
    lang = doc.lang === "en" ? "en" : "nl";
    currentSaveId = item.id;
    filenameCustom = true;
    selectedId = null;
    documentLive = true;
    setupReturn = false;
    const name = document.getElementById("pdf-name");
    if (name) name.value = item.name || saveTitle();
    try { localStorage.setItem(STORAGE_NAME, name ? name.value : item.name); } catch (error) { /* ignore */ }
    try { localStorage.setItem(STORAGE_LANG, lang); } catch (error) { /* ignore */ }
    applyLanguage();
    render();
    setPhase("studio");
    save();
    syncRoute("push");
    toggleSaves(false);
    showStatus(t("ui.savesOpen"));
}

function saveWhen(stamp) {
    try {
        return new Date(stamp).toLocaleDateString(lang === "en" ? "en-GB" : "nl-NL", { day: "numeric", month: "short", year: "numeric" });
    } catch (error) {
        return "";
    }
}

function paintSaves() {
    const listNode = document.getElementById("save-manager-list");
    const empty = document.getElementById("save-manager-empty");
    if (!listNode) return;
    const list = readSaves();
    listNode.textContent = "";
    if (empty) empty.hidden = list.length > 0;
    list.forEach(function (item) {
        const kind = item.kind === "letter" ? t("ui.savesKindLetter") : t("ui.savesKindCv");
        const edit = h("button", { type: "button", class: "btn", i18n: "ui.savesEdit", text: t("ui.savesEdit") });
        const pdf = h("button", { type: "button", class: "btn", i18n: "ui.savesPdf", i18nTitle: "ui.savesDownload", text: t("ui.savesPdf"), title: t("ui.savesDownload") });
        const copy = h("button", { type: "button", class: "btn", i18n: "ui.savesDuplicate", text: t("ui.savesDuplicate") });
        const remove = h("button", { type: "button", class: "btn", i18n: "ui.savesDelete", text: t("ui.savesDelete") });
        edit.addEventListener("click", function () { openSave(item.id); });
        pdf.addEventListener("click", function () { downloadSaved(item.id, pdf); });
        copy.addEventListener("click", function () { duplicateSave(item.id); });
        remove.addEventListener("click", function () {
            if (remove.dataset.armed !== "1") {
                listNode.querySelectorAll("button[data-armed]").forEach(function (button) {
                    button.dataset.armed = "";
                    button.textContent = t(button.dataset.i18n || "ui.savesDelete");
                });
                remove.dataset.armed = "1";
                remove.textContent = t("ui.savesDeleteArmed");
                return;
            }
            forgetSave(item.id);
        });
        const row = h("li", { class: "save-row" }, [
            h("strong", { text: item.name || kind }),
            h("p", { class: "note", text: kind + " · " + saveWhen(item.updated) }),
            h("div", { class: "save-row-actions" }, [edit, pdf, copy, remove])
        ]);
        if (item.id === currentSaveId) row.classList.add("is-current");
        listNode.appendChild(row);
    });
    document.querySelectorAll(".saves-count").forEach(function (node) {
        node.textContent = list.length ? String(list.length) : "";
    });
}

function duplicateSave(id) {
    const item = readSaves().find(function (entry) { return entry.id === id; });
    if (!item) return;
    const copy = JSON.parse(JSON.stringify(item));
    copy.id = newSaveId();
    copy.updated = Date.now();
    const list = readSaves();
    list.unshift(copy);
    if (list.length > SAVE_LIMIT) list.length = SAVE_LIMIT;
    writeSaves(list);
    paintSaves();
    showStatus(t("ui.savesStored"));
}

let savesReturn = null;

function toggleSaves(force) {
    const panel = document.getElementById("save-manager");
    if (!panel) return;
    const open = typeof force === "boolean" ? force : panel.hidden;
    panel.hidden = !open;
    document.querySelectorAll(".saves-open").forEach(function (button) {
        button.setAttribute("aria-expanded", open ? "true" : "false");
    });
    if (open) {
        paintSaves();
        const store = document.getElementById("save-manager-store");
        if (store) store.focus();
        return;
    }
    if (savesReturn && document.body.contains(savesReturn)) savesReturn.focus();
}

async function downloadSaved(id, button) {
    const item = readSaves().find(function (entry) { return entry.id === id; });
    if (!item || saveSwap) return;
    const nameInput = document.getElementById("pdf-name");
    const studio = document.getElementById("studio");
    const backup = {
        doc: JSON.parse(JSON.stringify(doc)),
        lang: lang,
        name: nameInput ? nameInput.value : "",
        custom: filenameCustom,
        id: currentSaveId,
        hidden: !!(studio && studio.hidden)
    };
    saveSwap = true;
    if (button) {
        button.disabled = true;
        button.textContent = t("ui.working");
    }
    try {
        doc = JSON.parse(JSON.stringify(item.doc));
        normalize(doc);
        lang = doc.lang === "en" ? "en" : "nl";
        if (nameInput) nameInput.value = item.name || "";
        render();
        if (studio && studio.hidden) {
            studio.hidden = false;
            document.body.classList.add("pdf-offstage");
        }
        await ensurePdfLibs();
        downloadBlob(await buildPdfBytes(), pdfFilename());
        showStatus(t("ui.downloaded").replace("{name}", pdfFilename()));
    } catch (error) {
        showError(t("ui.pdfError") + " " + (error && error.message ? error.message : ""));
    } finally {
        document.body.classList.remove("pdf-offstage");
        doc = backup.doc;
        normalize(doc);
        lang = backup.lang;
        currentSaveId = backup.id;
        filenameCustom = backup.custom;
        if (nameInput) nameInput.value = backup.name;
        if (studio && backup.hidden) studio.hidden = true;
        render();
        saveSwap = false;
        if (button) {
            button.disabled = false;
            button.textContent = t("ui.savesPdf");
        }
    }
}

function mountSaves() {
    if (document.getElementById("save-manager")) return;
    const close = h("button", { id: "save-manager-close", class: "btn", type: "button", i18n: "ui.cancel" });
    const store = h("button", { id: "save-manager-store", class: "btn-primary", type: "button", i18n: "ui.savesStore" });
    const copy = h("button", { id: "save-manager-copy", class: "btn", type: "button", i18n: "ui.savesCopy" });
    const panel = h("div", { id: "save-manager", class: "save-manager", hidden: "hidden" });
    const card = h("div", { class: "save-manager-card", role: "dialog", "aria-modal": "true", "aria-labelledby": "save-manager-title", "aria-describedby": "save-manager-lead" }, [
        h("div", { class: "save-manager-head" }, [
            h("h2", { id: "save-manager-title", i18n: "ui.savesTitle" }),
            close
        ]),
        h("p", { id: "save-manager-lead", class: "note", i18n: "ui.savesLead" }),
        h("div", { class: "save-manager-actions" }, [store, copy]),
        h("p", { id: "save-manager-empty", class: "note", i18n: "ui.savesEmpty" }),
        h("ul", { id: "save-manager-list", class: "save-list" })
    ]);
    panel.appendChild(card);
    document.body.appendChild(panel);
    close.addEventListener("click", function () { toggleSaves(false); });
    store.addEventListener("click", function () { rememberSave(false); });
    copy.addEventListener("click", function () { rememberSave(true); });
    panel.addEventListener("click", function (event) {
        if (event.target === panel) toggleSaves(false);
    });
    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && panel.hidden === false) toggleSaves(false);
    });
    document.querySelectorAll(".saves-open").forEach(function (button) {
        button.setAttribute("aria-expanded", "false");
        button.addEventListener("click", function () {
            savesReturn = button;
            toggleSaves();
        });
    });
    paintSaves();
}
