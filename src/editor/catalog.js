/* CC0-1.0 — https://creativecommons.org/publicdomain/zero/1.0/ */
/* Named documents. CATALOG is filled from catalog/*.txt when the editor is built. */

function requestedTemplate() {
    try {
        const value = new URLSearchParams(location.search).get("template");
        if (value && Object.prototype.hasOwnProperty.call(CATALOG, value)) return value;
    } catch (error) { /* a file URL has no search to read */ }
    return "";
}

function templateLang(id) {
    if (id.indexOf("softwareontwikkelaar") === 0 || id.indexOf("verpleegkundige") === 0 || id.indexOf("publieksdienst") === 0) return "nl";
    return "en";
}

function openRequestedTemplate() {
    const id = requestedTemplate();
    if (!id) return false;
    if (!requestedLang()) lang = templateLang(id);
    doc = emptyCv();
    doc.lang = lang;
    doc.theme = cvTheme();
    normalize(doc);
    applyMarked(CATALOG[id]);
    currentSaveId = "";
    filenameCustom = false;
    documentLive = true;
    const name = document.getElementById("pdf-name");
    const person = plainName();
    if (name) name.value = person;
    try { localStorage.setItem(STORAGE_NAME, person); } catch (error) { /* ignore */ }
    return true;
}
