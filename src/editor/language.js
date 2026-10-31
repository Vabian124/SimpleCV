/* CC0-1.0 — https://creativecommons.org/publicdomain/zero/1.0/ */
/* Stored language, ?lang=, buttons, fixed headings, and the FAQ schema text. */

function spellLocale() {
    return lang === "en" ? "en-US" : "nl-NL";
}

function retargetSpell(node, code) {
    if (!node) return;
    node.lang = code;
    node.setAttribute("lang", code);
    if (node.spellcheck === false) return;
    const focused = document.activeElement === node;
    node.spellcheck = false;
    node.setAttribute("spellcheck", "false");
    node.spellcheck = true;
    node.setAttribute("spellcheck", "true");
    if (focused) {
        node.blur();
        node.focus();
    }
}

function syncSpellLocale() {
    const code = spellLocale();
    document.documentElement.lang = code;
    document.body.lang = code;
    ["sheet", "setup-paste", "setup-model-text", "loose-text", "llm-input"].forEach(function (id) {
        retargetSpell(document.getElementById(id), code);
    });
    document.querySelectorAll(".editable, #setup-guide input, #setup-guide textarea, .drawer textarea").forEach(function (node) {
        retargetSpell(node, code);
    });
    const fileName = document.getElementById("pdf-name");
    if (fileName) {
        fileName.lang = code;
        fileName.spellcheck = false;
        fileName.setAttribute("spellcheck", "false");
    }
}

function applyLanguage() {
    syncSpellLocale();
    document.querySelectorAll("[data-i18n]").forEach(function (node) {
        const value = t(node.dataset.i18n);
        if (value !== node.dataset.i18n) node.textContent = value;
    });
    document.querySelectorAll("[data-i18n-title]").forEach(function (node) {
        const value = t(node.dataset.i18nTitle);
        if (value !== node.dataset.i18nTitle) node.title = value;
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (node) {
        const value = t(node.dataset.i18nPlaceholder);
        if (value !== node.dataset.i18nPlaceholder) node.placeholder = value;
    });
    document.querySelectorAll("[data-i18n-label]").forEach(function (node) {
        const value = t(node.dataset.i18nLabel);
        if (value !== node.dataset.i18nLabel) node.setAttribute("aria-label", value);
    });
    document.querySelectorAll(".lang-switch button").forEach(function (button) {
        button.classList.toggle("is-active", button.dataset.lang === lang);
        button.setAttribute("aria-pressed", button.dataset.lang === lang ? "true" : "false");
    });
    document.querySelectorAll(".lang-switch").forEach(function (node) {
        node.title = t("ui.langHint");
    });
    const nameInput = document.getElementById("pdf-name");
    if (nameInput) nameInput.setAttribute("aria-label", t("ui.fileName"));
    const zoom = document.getElementById("zoom");
    if (zoom) zoom.setAttribute("aria-label", t("ui.zoom"));
    syncLibraryHint();
    syncHistoryButtons();
    refreshIdentity();
    updateFilenamePreview();
    paintContrastWarning();
    syncFaqSchema();
    refreshAiBox(false);
    const morePages = document.getElementById("more-pages");
    if (morePages) morePages.setAttribute("aria-label", t("site.morePages"));
}

function syncFaqSchema() {
    const node = document.getElementById("faq-ld");
    if (!node) return;
    const pairs = ["qPrice", "qUpload", "qDutch", "qPdf", "qCode"];
    node.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": pairs.map(function (key) {
            return {
                "@type": "Question",
                "name": t("site." + key),
                "acceptedAnswer": { "@type": "Answer", "text": t("site.a" + key.slice(1)) }
            };
        })
    });
}

function setLanguage(next) {
    if (setupState.source === "guided") storeGuideStep();
    lang = next === "en" ? "en" : "nl";
    doc.lang = lang;
    try { localStorage.setItem(STORAGE_LANG, lang); } catch (error) { /* ignore */ }
    applyLanguage();
    render();
    save();
    if (document.body.dataset.phase === "setup") showSetupStep(setupState.step);
}

function savedLang() {
    try {
        const stored = localStorage.getItem(STORAGE_LANG);
        if (stored === "nl") return "nl";
        if (stored === "en") return "en";
    } catch (error) { /* keep the English default */ }
    return "en";
}

function requestedLang() {
    try {
        const value = new URLSearchParams(location.search).get("lang");
        if (value === "nl" || value === "en") return value;
    } catch (error) { /* a file URL has no search to read */ }
    return "";
}
