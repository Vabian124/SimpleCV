/* CC0-1.0 — https://creativecommons.org/publicdomain/zero/1.0/ */
/* Which setup step is showing, and creating the document from that choice. */

function showSetupStep(step) {
    setupState.step = step < 1 ? 1 : step;
    document.querySelectorAll(".setup-step").forEach(function (node) {
        node.hidden = Number(node.dataset.setupStep) !== setupState.step;
    });
    document.querySelectorAll("#setup-dots span").forEach(function (dot, index) {
        dot.classList.toggle("is-current", index === setupState.step - 1);
        dot.classList.toggle("is-done", index < setupState.step - 1);
    });
    const kicker = document.getElementById("setup-kicker");
    if (kicker) kicker.textContent = t("setup.step").replace("{n}", String(setupState.step)) + " · " + t("shell.kicker");
    document.querySelectorAll("#view-setup [data-kind]").forEach(function (button) {
        button.classList.toggle("is-selected", button.dataset.kind === setupState.kind);
    });
    document.querySelectorAll("#view-setup [data-source]").forEach(function (button) {
        button.classList.toggle("is-selected", button.dataset.source === setupState.source);
    });
    document.querySelectorAll("#view-setup [data-palette]").forEach(function (button) {
        button.classList.toggle("is-selected", button.dataset.palette === setupState.palette);
    });
    const pasteWrap = document.getElementById("setup-paste-wrap");
    if (pasteWrap) pasteWrap.hidden = !(setupState.step === 2 && setupState.source === "paste");
    const guide = document.getElementById("setup-guide");
    if (guide) guide.hidden = !(setupState.step === 2 && setupState.source === "guided");
    const model = document.getElementById("setup-model");
    if (model) model.hidden = !(setupState.step === 2 && setupState.source === "model");
    const sourceWrap = document.getElementById("setup-source");
    const sourceOpen = setupState.step === 2 && (setupState.source === "guided" || setupState.source === "model" || setupState.source === "paste");
    if (sourceWrap) sourceWrap.hidden = sourceOpen;
    if (setupState.step === 2 && setupState.source === "guided") renderGuide();
    const back = document.getElementById("setup-back");
    const cont = document.getElementById("setup-continue");
    const generate = document.getElementById("setup-generate");
    if (back) back.hidden = setupState.step === 1;
    if (cont) cont.hidden = !(setupState.step === 2 && (setupState.source === "paste" || setupState.source === "model"));
    if (generate) generate.hidden = setupState.step !== 3;
    const custom = document.getElementById("setup-custom");
    if (custom) custom.hidden = setupState.palette !== "custom";
    const backToDoc = document.getElementById("setup-return");
    const replaceNote = document.getElementById("setup-replace-note");
    const actions = document.querySelector(".setup-actions");
    const nav = document.querySelector(".setup-nav");
    if (setupState.step === 1 && actions) {
        if (backToDoc) actions.appendChild(backToDoc);
        if (replaceNote) actions.appendChild(replaceNote);
    } else if (nav && cont) {
        if (backToDoc) nav.insertBefore(backToDoc, cont);
        if (replaceNote) nav.insertBefore(replaceNote, cont);
    }
    if (backToDoc) backToDoc.hidden = !setupReturn;
    if (replaceNote) replaceNote.hidden = !setupReturn;
    if (nav) {
        nav.hidden = !Array.prototype.some.call(nav.children, function (node) {
            return node.tagName === "BUTTON" && !node.hidden;
        });
    }
    paintPalettePreview();
    paintContrastWarning();
}

function armControl(button, action) {
    if (!button.dataset.armed) {
        button.dataset.armed = "1";
        button.textContent = t("ui.replaceArmed");
        window.setTimeout(function () {
            if (!button.dataset.armed) return;
            button.dataset.armed = "";
            button.textContent = t(button.dataset.i18n || "ui.replaceArmed");
        }, 8000);
        return;
    }
    button.dataset.armed = "";
    button.textContent = t(button.dataset.i18n || "ui.replaceArmed");
    action();
}

function resetAll(button) {
    if (!button.dataset.armed) {
        button.dataset.armed = "1";
        button.textContent = t("ui.resetArmed");
        window.setTimeout(function () {
            if (!button.dataset.armed) return;
            button.dataset.armed = "";
            button.textContent = t("ui.reset");
        }, 8000);
        return;
    }
    button.dataset.armed = "";
    button.textContent = t("ui.reset");
    try {
        localStorage.removeItem(STORAGE_DOC);
        localStorage.removeItem(STORAGE_NAME);
    } catch (error) { /* private mode */ }
    clearSaves();
    past = [];
    future = [];
    selectedId = null;
    filenameCustom = false;
    doc = emptyCv();
    normalize(doc);
    const name = document.getElementById("pdf-name");
    if (name) name.value = "";
    const loose = document.getElementById("loose-text");
    if (loose) loose.value = "";
    const llm = document.getElementById("llm-input");
    if (llm) llm.value = "";
    showError("");
    showStatus("");
    documentLive = false;
    resetSetup();
    setupReturn = false;
    syncHistoryButtons();
    setPhase("setup");
    syncRoute("push");
}

function resetSetup() {
    setupState = { step: 1, kind: "", source: "", palette: "", guideIndex: 0, answers: null };
    const paste = document.getElementById("setup-paste");
    if (paste) paste.value = "";
    const model = document.getElementById("setup-model-text");
    if (model) model.value = "";
}

function modelTemplate() {
    return modelBundle("guide");
}

function setupMessage(message, isError) {
    const box = document.getElementById("setup-message");
    if (!box) return;
    box.hidden = !message;
    box.textContent = message || "";
    box.className = isError ? "error" : "note";
}

function openFromText(text) {
    const kind = setupState.kind === "letter" ? "letter" : "cv";
    const theme = Object.assign({}, kind === "letter" ? letterTheme() : cvTheme(), activePalette());
    const raw = String(text || "");
    const previous = doc;
    let built = null;
    try {
        if (raw.indexOf("@@@") >= 0) {
            doc = { version: 1, lang: lang, kind: kind, theme: theme, sidebar: [], main: [] };
            applyMarked(raw);
            doc.theme = theme;
        } else {
            const data = parseLoose(raw, kind);
            built = kind === "letter" ? buildLetterData(data) : buildCvData(data);
            built.kind = kind;
            built.theme = theme;
        }
    } catch (error) {
        doc = previous;
        throw error;
    }
    currentSaveId = "";
    setupReturn = false;
    setPhase("studio");
    if (built) installDocument(built, false);
    else {
        applyTheme();
        render();
        save();
    }
    documentLive = true;
    toggleDrawer(false);
    syncRoute("push");
}

function chooseKind(kind) {
    setupState.kind = kind === "letter" ? "letter" : "cv";
    setupState.palette = setupState.kind === "letter" ? "groen" : "zakelijk";
    const palette = PALETTES[setupState.palette];
    document.getElementById("setup-sidebar").value = palette.sidebar;
    document.getElementById("setup-accent").value = palette.accent;
    document.getElementById("setup-page").value = palette.page;
    document.getElementById("setup-text").value = palette.text;
    showSetupStep(2);
    syncRoute("push");
}

function chooseSource(source) {
    if (source === "paste") {
        askChrome(document.getElementById("chrome-gate"), function () {
            setupState.source = "paste";
            showSetupStep(2);
            const box = document.getElementById("setup-paste");
            if (box) box.focus();
            syncRoute("push");
        });
        return;
    }
    setupState.source = source;
    if (source === "guided") {
        setupState.guideIndex = 0;
        setupState.answers = blankGuide();
        showSetupStep(2);
        syncRoute("push");
        return;
    }
    if (source === "model") {
        showSetupStep(2);
        const box = document.getElementById("setup-model-text");
        if (box) {
            box.value = modelTemplate();
            box.focus();
            box.setSelectionRange(0, 0);
            box.scrollTop = 0;
        }
        syncRoute("push");
        return;
    }
    showSetupStep(2);
    syncRoute("replace");
    showSetupStep(3);
    syncRoute("push");
}

function choosePalette(name) {
    setupState.palette = name;
    if (name !== "custom" && PALETTES[name]) {
        document.getElementById("setup-sidebar").value = PALETTES[name].sidebar;
        document.getElementById("setup-accent").value = PALETTES[name].accent;
        document.getElementById("setup-page").value = PALETTES[name].page;
        document.getElementById("setup-text").value = PALETTES[name].text;
    }
    showSetupStep(3);
    syncRoute("replace");
}

function generateDocument() {
    const kind = setupState.kind === "letter" ? "letter" : "cv";
    let next;
    if (setupState.source === "demo") next = kind === "letter" ? demoLetter() : demoCv();
    else if (setupState.source === "guided") next = buildGuideDocument();
    else     if (setupState.source === "model") {
        try {
            openFromText(document.getElementById("setup-model-text").value);
            setupMessage("");
            setupReturn = false;
        } catch (error) {
            setupMessage(error && error.message ? error.message : t("ui.parseError"), true);
            showSetupStep(2);
        }
        return;
    } else if (setupState.source === "paste") {
        const text = document.getElementById("setup-paste").value;
        const data = parseLoose(text, kind);
        next = kind === "letter" ? buildLetterData(data) : buildCvData(data);
    } else next = kind === "letter" ? emptyLetter() : emptyCv();
    next.kind = kind;
    next.theme = Object.assign({}, kind === "letter" ? letterTheme() : cvTheme(), activePalette());
    setupReturn = false;
    setPhase("studio");
    installDocument(next, false);
    toggleDrawer(false);
    syncRoute("push");
}
