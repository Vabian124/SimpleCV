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
    if (backToDoc) backToDoc.hidden = !setupReturn;
    const replaceNote = document.getElementById("setup-replace-note");
    if (replaceNote) replaceNote.hidden = !setupReturn;
    const nav = document.querySelector(".setup-nav");
    if (nav) nav.hidden = ![back, cont, generate, backToDoc].some(function (button) { return button && !button.hidden; });
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

function blankGuide() {
    return {
        name: "", role: "", city: "", phone: "", email: "", born: "",
        intro: "", skills: "",
        strengths: [], projects: [], jobs: [], studies: [],
        date: "", to: "", subject: "", body: "", closing: "", sign: ""
    };
}

function guidePlan() {
    const letter = setupState.kind === "letter";
    const contactInputs = [["city", "doc.city"], ["phone", "doc.phone"], ["email", "doc.email"]];
    if (!letter) contactInputs.push(["born", "doc.born"]);
    const steps = [
        { id: "name", title: "guide.nameTitle", hint: "guide.nameHint", inputs: [["name", "ph.name"]] },
        { id: "role", title: "guide.roleTitle", hint: "guide.roleHint", inputs: [["role", "ph.role"]] },
        { id: "contact", title: "guide.contactTitle", hint: "guide.contactHint", inputs: contactInputs }
    ];
    if (letter) {
        steps.push(
            { id: "letterhead", title: "guide.letterheadTitle", hint: "guide.letterheadHint", inputs: [["date", "ph.date"], ["subject", "ph.subject"]], area: ["to", "ph.to"] },
            { id: "intro", title: "guide.introTitle", hint: "guide.introHint", area: ["intro", "doc.intro"] },
            { id: "body", title: "guide.bodyTitle", hint: "guide.bodyHint", area: ["body", "guide.bodyTitle"] },
            { id: "close", title: "guide.closeTitle", hint: "guide.closeHint", inputs: [["closing", "guide.greeting"], ["sign", "ph.name"]] }
        );
        return steps;
    }
    steps.push(
        { id: "intro", title: "guide.introTitle", hint: "guide.introHint", area: ["intro", "doc.intro"] },
        { id: "job", title: "guide.workTitle", hint: "guide.workHint", repeat: "jobs", inputs: [["title", "guide.jobTitle"], ["date", "guide.period"], ["org", "ph.org"]], area: ["points", "guide.points"] },
        { id: "study", title: "guide.studyTitle", hint: "guide.studyHint", repeat: "studies", inputs: [["title", "guide.jobTitle"], ["date", "guide.period"], ["org", "ph.org"]], area: ["points", "guide.points"] },
        { id: "skills", title: "guide.skillsTitle", hint: "guide.skillsHint", area: ["skills", "guide.points"] },
        { id: "strength", title: "guide.strengthTitle", hint: "guide.strengthHint", repeat: "strengths", inputs: [["title", "ph.title"], ["body", "ph.text"]] },
        { id: "project", title: "guide.projectTitle", hint: "guide.projectHint", repeat: "projects", inputs: [["title", "ph.title"], ["body", "ph.text"]] }
    );
    return steps;
}

function readGuideInputs() {
    const values = {};
    document.querySelectorAll("#setup-guide [data-guide-key]").forEach(function (input) {
        values[input.dataset.guideKey] = input.value;
    });
    return values;
}

function storeGuideStep() {
    if (setupState.source !== "guided" || !setupState.answers) return;
    const step = guidePlan()[setupState.guideIndex || 0];
    if (!step || step.repeat) return;
    const values = readGuideInputs();
    Object.keys(values).forEach(function (key) { setupState.answers[key] = values[key]; });
}

function commitRepeat(step) {
    const values = readGuideInputs();
    const draft = {
        title: values.title || "",
        body: values.body || "",
        date: values.date || "",
        org: values.org || "",
        points: values.points || ""
    };
    if (!Object.keys(draft).some(function (key) { return String(draft[key]).trim(); })) return;
    setupState.answers[step.repeat].push(draft);
}

function guideControl(key, labelKey, value, multiline) {
    const input = document.createElement(multiline ? "textarea" : "input");
    if (!multiline) input.type = "text";
    else input.rows = 4;
    input.dataset.guideKey = key;
    input.value = value || "";
    input.placeholder = t(labelKey);
    input.lang = spellLocale();
    input.setAttribute("lang", input.lang);
    input.spellcheck = key !== "phone" && key !== "email" && key !== "born" && key !== "date";
    input.setAttribute("spellcheck", input.spellcheck ? "true" : "false");
    input.autocomplete = "off";
    input.enterKeyHint = multiline ? "enter" : "next";
    return h("label", { class: "field" }, [h("span", { text: t(labelKey) }), input]);
}

function renderGuide() {
    const host = document.getElementById("setup-guide");
    if (!host) return;
    if (!setupState.answers) setupState.answers = blankGuide();
    const steps = guidePlan();
    const index = Math.max(0, Math.min(setupState.guideIndex || 0, steps.length - 1));
    setupState.guideIndex = index;
    const step = steps[index];
    const answers = setupState.answers;
    host.replaceChildren(
        h("p", { class: "kicker", text: t("guide.step").replace("{n}", String(index + 1)).replace("{m}", String(steps.length)) }),
        h("h2", { text: t(step.title) }),
        h("p", { class: "setup-lead", text: t(step.hint) })
    );
    (step.inputs || []).forEach(function (pair) {
        host.appendChild(guideControl(pair[0], pair[1], step.repeat ? "" : answers[pair[0]], false));
    });
    if (step.area) host.appendChild(guideControl(step.area[0], step.area[1], step.repeat ? "" : answers[step.area[0]], true));
    if (step.repeat) {
        host.appendChild(h("p", { class: "note", text: t("guide.added").replace("{n}", String(answers[step.repeat].length)) }));
    }
    const skip = h("button", { type: "button", class: "btn", text: t("guide.leaveEmpty") });
    const another = h("button", { type: "button", class: "btn", text: t("guide.another") });
    const next = h("button", { type: "button", class: "btn-primary", text: index === steps.length - 1 ? t("guide.toColours") : t("guide.next") });
    if (!step.repeat) another.hidden = true;
    function refreshSkip() {
        const values = readGuideInputs();
        const typed = Object.keys(values).some(function (key) { return String(values[key] || "").trim(); });
        skip.textContent = typed ? t("guide.skip") : t("guide.leaveEmpty");
    }
    skip.addEventListener("click", function () {
        if (index >= steps.length - 1) {
            if (step.repeat) commitRepeat(step);
            else storeGuideStep();
            showSetupStep(3);
            syncRoute("push");
            focusPaletteCard();
            return;
        }
        moveGuide(1);
    });
    another.addEventListener("click", function () {
        commitRepeat(step);
        renderGuide();
    });
    next.addEventListener("click", pressGuidePrimary);
    host.appendChild(h("div", { class: "guide-actions" }, [skip, another, next]));
    host.querySelectorAll("input, textarea").forEach(function (input) {
        input.addEventListener("input", refreshSkip);
    });
    refreshSkip();
    const first = host.querySelector("input, textarea");
    if (first) {
        first.focus();
        if (first.setSelectionRange) first.setSelectionRange(first.value.length, first.value.length);
    }
}

function focusPaletteCard() {
    const card = document.querySelector("#view-setup [data-palette].is-selected") || document.querySelector("#view-setup [data-palette]");
    if (card) card.focus();
}

function pressGuidePrimary() {
    const steps = guidePlan();
    const index = Math.max(0, Math.min(setupState.guideIndex || 0, steps.length - 1));
    const step = steps[index];
    if (!step) return;
    if (step.repeat) commitRepeat(step);
    if (index >= steps.length - 1) {
        if (!step.repeat) storeGuideStep();
        showSetupStep(3);
        syncRoute("push");
        focusPaletteCard();
        return;
    }
    moveGuide(1);
}

function moveGuide(delta) {
    storeGuideStep();
    setupState.guideIndex = (setupState.guideIndex || 0) + delta;
    renderGuide();
    if (delta > 0) syncRoute("push");
}

function guideLines(text) {
    return String(text || "").split(/\n/).map(function (line) { return line.trim(); }).filter(Boolean);
}

function guideHtml(value) {
    const raw = String(value || "").trim();
    return raw ? textToHtml(raw) : "";
}

function guideFilled(value) {
    return String(value || "").trim().length > 0;
}

function buildGuideDocument() {
    const kind = setupState.kind === "letter" ? "letter" : "cv";
    const answers = setupState.answers || blankGuide();
    const side = [
        block("name", { html: guideFilled(answers.name) ? nameToHtml(answers.name.replace(/\n/g, "<br>")) : "" }),
        block("role", { html: guideHtml(answers.role) })
    ];
    const contactKeys = ["city", "phone", "email", "born"];
    const contacts = contactKeys.filter(function (key) { return guideFilled(answers[key]); });
    if (contacts.length) {
        side.push(barHeading("doc.contact"));
        contacts.forEach(function (key) {
            side.push(block("contact", { labelKey: key, label: "", html: guideHtml(answers[key]) }));
        });
    }
    const skills = guideLines(answers.skills);
    if (skills.length) {
        side.push(barHeading("doc.skills"));
        skills.forEach(function (skill) { side.push(block("skill", { html: textToHtml(skill) })); });
    }
    const projects = (answers.projects || []).filter(function (item) {
        return guideFilled(item.title) || guideFilled(item.body);
    });
    if (projects.length) {
        side.push(barHeading("doc.projects"));
        projects.forEach(function (item) {
            side.push(block("project", { title: guideHtml(item.title), body: guideHtml(item.body) }));
        });
    }
    const strengths = (answers.strengths || []).filter(function (item) {
        return guideFilled(item.title) || guideFilled(item.body);
    });
    if (strengths.length) {
        side.push(barHeading("doc.strengths"));
        strengths.forEach(function (item) {
            side.push(block("competence", { title: guideHtml(item.title), body: guideHtml(item.body) }));
        });
    }
    const main = [];
    if (kind === "letter") {
        main.push(makeLetterhead(guideHtml(answers.date), guideHtml(answers.to), guideHtml(answers.subject), ""));
    }
    if (guideFilled(answers.intro)) {
        if (kind !== "letter") main.push(barHeading("doc.profile"));
        main.push(block("intro", { html: guideHtml(answers.intro) }));
    }
    if (kind === "letter") {
        const parts = String(answers.body || "").split(/\n{2,}/).map(function (part) { return part.trim(); }).filter(Boolean);
        if (parts.length) parts.forEach(function (part) { main.push(block("paragraph", { html: textToHtml(part) })); });
        else main.push(block("paragraph", { html: "" }));
    }
    const jobs = (answers.jobs || []).filter(function (item) {
        return guideFilled(item.title) || guideFilled(item.date) || guideFilled(item.org) || guideFilled(item.points);
    });
    if (jobs.length) {
        main.push(barHeading("doc.work"));
        jobs.forEach(function (item) {
            const points = guideLines(item.points);
            main.push(block("timeline", {
                title: guideHtml(item.title),
                date: guideHtml(item.date),
                org: guideHtml(item.org),
                items: (points.length ? points : [""]).map(textToHtml)
            }));
        });
    }
    const studies = (answers.studies || []).filter(function (item) {
        return guideFilled(item.title) || guideFilled(item.date) || guideFilled(item.org) || guideFilled(item.points);
    });
    if (studies.length) {
        main.push(barHeading("doc.education"));
        studies.forEach(function (item) {
            const points = guideLines(item.points);
            main.push(block("timeline", {
                title: guideHtml(item.title),
                date: guideHtml(item.date),
                org: guideHtml(item.org),
                items: (points.length ? points : [""]).map(textToHtml)
            }));
        });
    }
    if (kind === "letter") {
        main.push(block("closing", { paragraphs: [guideHtml(answers.closing)] }));
        main.push(block("signature", { html: guideHtml(answers.sign || answers.name) }));
    }
    return {
        version: 1,
        lang: lang,
        kind: kind,
        theme: kind === "letter" ? letterTheme() : cvTheme(),
        sidebar: side,
        main: main
    };
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

