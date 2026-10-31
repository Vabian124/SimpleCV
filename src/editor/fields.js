function h(tag, attrs, children) {
    const node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
        if (key === "class") node.className = attrs[key];
        else if (key === "i18n") node.dataset.i18n = attrs[key];
        else if (key === "i18nTitle") node.dataset.i18nTitle = attrs[key];
        else if (key === "text") node.textContent = attrs[key];
        else node.setAttribute(key, attrs[key]);
    });
    (children || []).forEach(function (child) { if (child) node.appendChild(child); });
    return node;
}

function keepSelection(button) {
    button.addEventListener("mousedown", function (event) { event.preventDefault(); });
    return button;
}

function colorField(id, labelKey) {
    return h("label", { class: "swatch" }, [
        h("span", { i18n: labelKey }),
        h("input", { id: id, type: "color" })
    ]);
}

function bindColor(id, apply) {
    const input = document.getElementById(id);
    let snapped = false;
    input.addEventListener("pointerdown", function () { snapped = false; });
    input.addEventListener("input", function () {
        if (!snapped) {
            snapshot();
            snapped = true;
        }
        apply(input.value);
    });
    input.addEventListener("change", function () { snapped = false; });
}

const SECTION_HEADS = [
    ["work", /^(werkervaring(?:en)?|experience|work experience|employment|loopbaan)$/i],
    ["study", /^(opleiding(?:en)?|education|studies?|scholing)$/i],
    ["skills", /^(vaardigheden|skills|kundigheden)$/i],
    ["strengths", /^(competenties|strengths|kernkwaliteiten)$/i],
    ["projects", /^(projecten|projects)$/i],
    ["profile", /^(profiel|profile|over mij|about(?: me)?|in het kort|samenvatting|summary)$/i],
    ["contact", /^(contact|contactgegevens)$/i]
];

function headingId(line) {
    const clean = String(line || "").trim().replace(/[:.]$/, "");
    for (let i = 0; i < SECTION_HEADS.length; i++) {
        if (SECTION_HEADS[i][1].test(clean)) return SECTION_HEADS[i][0];
    }
    return "";
}

function isBullet(line) {
    return /^([-*•]|\d+[.)])\s+/.test(String(line || "").trim());
}

function bulletText(line) {
    return String(line || "").trim().replace(/^([-*•]|\d+[.)])\s+/, "").trim();
}

function looksLikeDate(line) {
    const value = String(line || "").trim();
    if (!value || value.length > 42) return false;
    return /(\d{4}\s*[–—-]\s*(?:\d{4}|heden|present|nu|now))|((?:jan(?:uari)?|feb(?:ruari)?|mrt|maart|apr(?:il)?|mei|jun(?:i)?|jul(?:i)?|aug(?:ustus)?|sep(?:tember)?|okt(?:ober)?|nov(?:ember)?|dec(?:ember)?|january|february|march|april|may|june|july|august|september|october|november|december)[a-z.]*\s+\d{4})|^(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})$/i.test(value);
}

function buildCvData(data) {
    const next = { version: 1, lang: lang, kind: "cv", theme: doc.theme, sidebar: [], main: [] };
    next.sidebar.push(block("name", { html: textToHtml(data.name || t("ph.name")) }));
    next.sidebar.push(block("role", { html: textToHtml(data.role || t("ph.role")) }));
    const contacts = [
        ["city", data.city],
        ["phone", data.phone],
        ["email", data.email],
        ["born", data.born]
    ].filter(function (row) { return row[1]; });
    if (contacts.length) {
        next.sidebar.push(barHeading("doc.contact"));
        contacts.forEach(function (row) {
            next.sidebar.push(block("contact", { labelKey: row[0], label: "", html: textToHtml(row[1]) }));
        });
    }
    const skills = data.skills || [];
    if (skills.length) {
        next.sidebar.push(barHeading("doc.skills"));
        skills.forEach(function (skill) { next.sidebar.push(block("skill", { html: textToHtml(skill) })); });
    }
    (data.strengths || []).forEach(function (item, index) {
        if (index === 0) next.sidebar.push(barHeading("doc.strengths"));
        next.sidebar.push(block("competence", { title: textToHtml(item.title), body: textToHtml(item.body) }));
    });
    (data.projects || []).forEach(function (item, index) {
        if (index === 0) next.sidebar.push(barHeading("doc.projects"));
        next.sidebar.push(block("project", { title: textToHtml(item.title), body: textToHtml(item.body) }));
    });
    if (data.intro) {
        next.main.push(barHeading("doc.profile"));
        next.main.push(block("intro", { html: textToHtml(data.intro) }));
    }
    if ((data.jobs || []).length) {
        next.main.push(barHeading("doc.work"));
        data.jobs.forEach(function (item) { pushTimeline(next.main, item); });
    }
    if ((data.studies || []).length) {
        next.main.push(barHeading("doc.education"));
        data.studies.forEach(function (item) { pushTimeline(next.main, item); });
    }
    return next;
}

function buildLetterData(data) {
    const next = { version: 1, lang: lang, kind: "letter", theme: doc.theme, sidebar: [], main: [] };
    next.sidebar.push(block("name", { html: textToHtml(data.name || t("ph.name")) }));
    next.sidebar.push(block("role", { html: textToHtml(data.role || t("ph.role")) }));
    const contacts = [["city", data.city], ["phone", data.phone], ["email", data.email]].filter(function (row) { return row[1]; });
    if (contacts.length) {
        next.sidebar.push(barHeading("doc.contact"));
        contacts.forEach(function (row) {
            next.sidebar.push(block("contact", { labelKey: row[0], label: "", html: textToHtml(row[1]) }));
        });
    }
    const head = data.letter || {};
    next.main.push(makeLetterhead(
        textToHtml(head.date || ""),
        nameToHtml(head.to || ""),
        textToHtml(head.subject || ""),
        ""
    ));
    if (data.intro) next.main.push(block("intro", { html: textToHtml(data.intro) }));
    (head.paragraphs || []).forEach(function (paragraph) {
        next.main.push(block("paragraph", { html: textToHtml(paragraph) }));
    });
    if (head.closing) next.main.push(block("closing", { paragraphs: [textToHtml(head.closing)] }));
    if (head.sign || data.name) next.main.push(block("signature", { html: textToHtml(head.sign || data.name || "") }));
    return next;
}

function parseLoose(text, kind) {
    const lines = String(text || "").replace(/\r/g, "").split("\n");
    const flat = lines.join("\n");
    const email = (flat.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i) || [""])[0];
    const phoneMatch = flat.match(/(?:\+\d{1,3}[\s().-]*)?(?:\(?0\)?[\s.-]*)?\d(?:[\s().-]*\d){8,12}/);
    const phone = phoneMatch ? phoneMatch[0].replace(/\s+/g, " ").trim() : "";
    const born = (lines.map(function (line) { return line.trim(); }).find(function (line) { return /^\d{2}[-/.]\d{2}[-/.]\d{4}$/.test(line); }) || "");
    const sections = { preamble: [], profile: [], skills: [], strengths: [], projects: [], work: [], study: [], contact: [] };
    let current = "preamble";
    lines.forEach(function (line) {
        const id = headingId(line);
        if (id) {
            current = id;
            return;
        }
        sections[current].push(line);
    });
    function grouped(list) {
        const chunks = [];
        let buf = [];
        function flush() {
            if (buf.some(function (line) { return line.trim(); })) chunks.push(buf);
            buf = [];
        }
        list.forEach(function (line) {
            if (!line.trim()) flush();
            else buf.push(line);
        });
        flush();
        return chunks.map(function (chunk) {
            const bullets = [];
            const heads = [];
            chunk.forEach(function (line) {
                if (isBullet(line)) bullets.push(bulletText(line));
                else heads.push(line.trim());
            });
            const date = heads.find(looksLikeDate) || "";
            const rest = heads.filter(function (line) { return line !== date; });
            return { title: rest[0] || "", org: rest.slice(1).join(", "), date: date, items: bullets };
        }).filter(function (entry) { return entry.title || entry.org || entry.date || entry.items.length; });
    }
    const preamble = sections.preamble.map(function (line) { return line.trim(); }).filter(Boolean);
    const leftovers = preamble.filter(function (line) {
        if (email && line.indexOf(email) >= 0) return false;
        if (phone && line.replace(/\s/g, "").indexOf(phone.replace(/\s/g, "")) >= 0) return false;
        if (born && line === born) return false;
        if (isBullet(line)) return false;
        return true;
    });
    let name = "";
    let role = "";
    if (kind !== "letter") {
        name = leftovers.find(function (line) {
            return line.length < 42 && line.split(/\s+/).length <= 5 && !looksLikeDate(line) && line.indexOf(":") < 0;
        }) || "";
        const after = leftovers.slice(leftovers.indexOf(name) + 1);
        role = after.find(function (line) {
            return line.length < 48 && line.split(/\s+/).length <= 7 && !looksLikeDate(line);
        }) || "";
        if (role.length > 40) role = "";
    }
    const used = {};
    [name, role, email, phone, born].forEach(function (value) { if (value) used[value] = true; });
    const city = leftovers.find(function (line) {
        return !used[line] && line.length < 32 && !looksLikeDate(line) && line.indexOf("@") < 0 && !/\d{3}/.test(line) && line.split(/\s+/).length <= 3;
    }) || "";
    if (city) used[city] = true;
    const introLines = [];
    if (kind !== "letter") {
        leftovers.forEach(function (line) { if (!used[line]) introLines.push(line); });
        sections.profile.forEach(function (line) { if (line.trim()) introLines.push(line.trim()); });
    }
    function titled(list) {
        return list.map(function (line) { return line.trim(); }).filter(Boolean).map(function (line) {
            const value = isBullet(line) ? bulletText(line) : line;
            const split = value.indexOf(":");
            return split < 0
                ? { title: value, body: "" }
                : { title: value.slice(0, split).trim(), body: value.slice(split + 1).trim() };
        });
    }
    const skills = sections.skills.map(function (line) { return line.trim(); }).filter(Boolean).map(function (line) {
        return isBullet(line) ? bulletText(line) : line;
    });
    if (!skills.length && kind !== "letter") {
        preamble.filter(isBullet).forEach(function (line) { skills.push(bulletText(line)); });
    }
    const data = {
        name: name,
        role: role,
        city: city,
        phone: phone,
        email: email,
        born: born,
        intro: introLines.join("\n").trim(),
        skills: skills,
        strengths: titled(sections.strengths),
        projects: titled(sections.projects),
        jobs: grouped(sections.work),
        studies: grouped(sections.study),
        letter: null
    };
    if (kind === "letter") {
        const bodyLines = lines.map(function (line) { return line.trim(); });
        const subjectLine = bodyLines.find(function (line) { return /^(onderwerp|betreft|subject|re)\s*:/i.test(line); }) || "";
        const greetAt = bodyLines.findIndex(function (line) { return /^(beste|geachte|dear|hi|hallo)\b/i.test(line); });
        const closeAt = bodyLines.findIndex(function (line) { return /^(met vriendelijke groet|hoogachtend|kind regards|yours sincerely|sincerely|groeten)\b/i.test(line); });
        const date = bodyLines.find(function (line) { return looksLikeDate(line); }) || "";
        const topEnd = greetAt > 0 ? greetAt : Math.min(bodyLines.length, 8);
        const top = bodyLines.slice(0, topEnd).filter(Boolean).filter(function (line) {
            return line !== date && line !== subjectLine && line.indexOf(email) < 0 && line !== phone && !headingId(line);
        });
        const person = top.length ? top[0] : "";
        const start = greetAt >= 0 ? greetAt + 1 : 0;
        const end = closeAt >= 0 ? closeAt : bodyLines.length;
        const paragraphs = bodyLines.slice(start, end).join("\n").split(/\n{2,}/).map(function (part) { return part.trim(); }).filter(Boolean);
        const after = closeAt >= 0 ? bodyLines.slice(closeAt + 1).filter(Boolean) : [];
        data.name = person || data.name;
        data.letter = {
            date: date,
            to: top.filter(function (line) { return line !== person; }).join("\n"),
            subject: subjectLine.replace(/^(onderwerp|betreft|subject|re)\s*:\s*/i, ""),
            paragraphs: paragraphs,
            closing: closeAt >= 0 ? bodyLines[closeAt] : "",
            sign: after.length ? after[after.length - 1] : person
        };
    }
    return data;
}

function installDocument(next, keepTheme) {
    if (keepTheme && doc) next.theme = doc.theme;
    snapshot();
    doc = next;
    normalize(doc);
    selectedId = null;
    filenameCustom = false;
    syncFilenameFromPerson();
    showError("");
    applyLanguage();
    render();
    documentLive = true;
    save();
}

function browserLooksLikeChrome() {
    const ua = navigator.userAgent || "";
    return /Chrome\/\d/.test(ua) && !/Edg\/|OPR\/|Firefox|FxiOS|SamsungBrowser|CriOS/.test(ua);
}

function chromeLimited() {
    return !browserLooksLikeChrome() && !chromeProceed;
}

function markChromeLimits() {
    const limited = chromeLimited();
    document.querySelectorAll("[data-chrome-only]").forEach(function (node) {
        node.classList.toggle("is-limited", limited);
        if (node.tagName === "BUTTON") node.setAttribute("aria-disabled", limited ? "true" : "false");
    });
}

function askChrome(note, action) {
    if (!chromeLimited()) {
        action();
        return;
    }
    chromeAction = action;
    document.querySelectorAll(".chrome-gate").forEach(function (gate) { gate.hidden = true; });
    if (!note) return;
    note.hidden = false;
    const go = note.querySelector("[data-chrome-go]");
    if (go) go.focus();
}

function allowChromeAndRun() {
    const action = chromeAction;
    chromeProceed = true;
    chromeAction = null;
    document.querySelectorAll(".chrome-gate").forEach(function (gate) { gate.hidden = true; });
    markChromeLimits();
    if (action) action();
}

function browserModelApi() {
    if (typeof LanguageModel !== "undefined") return LanguageModel;
    if (window.ai && window.ai.languageModel) return window.ai.languageModel;
    return null;
}

async function formatWithBrowserModel(text) {
    const api = browserModelApi();
    if (!api) throw new Error(t("guide.modelMissing"));
    const options = {
        expectedInputs: [{ type: "text", languages: ["en"] }],
        expectedOutputs: [{ type: "text", languages: ["en"] }]
    };
    let availability = "unavailable";
    try {
        availability = await api.availability(options);
    } catch (error) {
        try { availability = await api.availability(); } catch (again) { availability = "unavailable"; }
    }
    if (!availability || availability === "unavailable") throw new Error(t("guide.modelMissing"));
    const session = await api.create(Object.assign({}, options, {
        initialPrompts: [{
            role: "system",
            content: "Turn the user's CV or motivation letter into marked text. Output only the block from @@@CV or @@@LETTER through @@@END, with no markdown. Keep these English field names: NAME, ROLE, CITY, PHONE, EMAIL, BORN, TITLE, DATE, ORGANIZATION, SUMMARY, SUBJECT, TO, SIGN, HEADING, BODY. A point is a line starting with POINT: . Write the person's own words in the same language as the input. Use @@@CONTACT, @@@SKILLS, @@@STRENGTHS, @@@PROJECTS, @@@PROFILE, @@@JOB, @@@STUDY, @@@PARAGRAPH, @@@OPENING, @@@SECTION and @@@CLOSING where they fit."
        }]
    }));
    try {
        const answer = await session.prompt(text);
        applyMarked(typeof answer === "string" ? answer : String(answer || ""));
    } finally {
        if (session && session.destroy) session.destroy();
    }
}

function describeLoose(data) {
    const bits = [];
    if (data.name) bits.push(data.name);
    if (data.role) bits.push(data.role);
    if (data.skills && data.skills.length) bits.push(t("doc.skills") + " " + data.skills.length);
    if (data.jobs && data.jobs.length) bits.push(t("doc.work") + " " + data.jobs.length);
    if (data.studies && data.studies.length) bits.push(t("doc.education") + " " + data.studies.length);
    if (data.letter && data.letter.paragraphs && data.letter.paragraphs.length) bits.push(t("shell.body"));
    return bits.join(", ");
}

function applyLooseText(text, kind) {
    const data = parseLoose(text, kind);
    if (kind === "letter" && data.letter) installDocument(buildLetterData(data), true);
    else installDocument(buildCvData(data), true);
    return data;
}

function mountTools() {
    const root = document.getElementById("drawer");
    const topbar = document.getElementById("topbar");
    const bar = document.getElementById("floatbar");
    const nl = keepSelection(h("button", { type: "button", "data-lang": "nl", text: "NL" }));
    const en = keepSelection(h("button", { type: "button", "data-lang": "en", text: "EN" }));
    nl.addEventListener("click", function () { setLanguage("nl"); });
    en.addEventListener("click", function () { setLanguage("en"); });

    const download = keepSelection(h("button", { id: "download", class: "btn-primary", type: "button", i18n: "ui.download" }));
    function closeMore() {
        const menu = document.querySelector(".more-menu");
        if (menu) menu.open = false;
    }
    const freshBtn = keepSelection(h("button", { class: "btn", type: "button", i18n: "shell.new" }));
    freshBtn.addEventListener("click", function () {
        closeMore();
        resetSetup();
        setupReturn = true;
        setPhase("setup");
        syncRoute("push");
    });
    const wipeMenu = keepSelection(h("button", { id: "reset-all", class: "btn menu-reset", type: "button", i18n: "ui.reset" }));
    wipeMenu.addEventListener("click", function () { resetAll(wipeMenu); });
    const settingsBtn = keepSelection(h("button", { class: "btn", type: "button", i18n: "shell.settings" }));
    settingsBtn.addEventListener("click", function () {
        closeMore();
        toggleDrawer();
    });
    const fillBtn = keepSelection(h("button", { class: "btn", type: "button", i18n: "shell.fill" }));
    fillBtn.addEventListener("click", function () {
        closeMore();
        const kind = doc && doc.kind === "letter" ? "letter" : "cv";
        resetSetup();
        setupReturn = true;
        setPhase("setup");
        chooseKind(kind);
    });
    const pasteBtn = keepSelection(h("button", { class: "btn", type: "button", i18n: "guide.paste" }));
    pasteBtn.addEventListener("click", function () {
        closeMore();
        toggleDrawer(true);
        const box = document.getElementById("loose-text");
        if (box) box.focus();
    });
    const importer = keepSelection(h("button", { id: "import", class: "btn", type: "button", i18n: "ui.import" }));
    const file = h("input", { id: "pdf-file", type: "file", accept: "application/pdf,.pdf", hidden: "hidden" });
    download.addEventListener("click", downloadPdf);
    importer.addEventListener("click", function () { file.click(); });
    file.addEventListener("change", function () {
        const picked = file.files && file.files[0];
        file.value = "";
        if (!picked) return;
        picked.arrayBuffer().then(function (buffer) {
            return importPdfBytes(new Uint8Array(buffer));
        }).catch(function () { showError(t("ui.importFail")); });
    });

    const name = h("input", {
        id: "pdf-name",
        class: "topbar-name",
        type: "text",
        autocomplete: "off",
        "data-i18n-placeholder": "ui.fileName"
    });
    name.addEventListener("keydown", function (event) {
        if (event.key !== "Enter") return;
        event.preventDefault();
        name.blur();
    });
    name.addEventListener("input", function () {
        filenameCustom = true;
        try { localStorage.setItem(STORAGE_NAME, name.value); } catch (error) { /* ignore */ }
        updateFilenamePreview();
    });
    const stamp = h("input", { id: "pdf-timestamp", type: "checkbox" });
    const finalBox = h("input", { id: "pdf-final", type: "checkbox" });
    stamp.addEventListener("change", updateFilenamePreview);
    finalBox.addEventListener("change", updateFilenamePreview);

    const undoBtn = keepSelection(h("button", { id: "undo-btn", class: "btn", type: "button", i18n: "ui.undo" }));
    const redoBtn = keepSelection(h("button", { id: "redo-btn", class: "btn", type: "button", i18n: "ui.redo" }));
    undoBtn.addEventListener("click", undo);
    redoBtn.addEventListener("click", redo);

    const cvBtn = keepSelection(h("button", { class: "btn", type: "button", i18n: "ui.emptyCv" }));
    const letterBtn = keepSelection(h("button", { class: "btn", type: "button", i18n: "ui.emptyLetter" }));
    cvBtn.addEventListener("click", function () { armControl(cvBtn, function () { useTemplate("cv"); }); });
    letterBtn.addEventListener("click", function () { armControl(letterBtn, function () { useTemplate("letter"); }); });

    const zoom = h("input", { id: "zoom", type: "range", min: "40", max: "130", value: "100", "aria-label": t("ui.zoom") });
    zoom.addEventListener("input", function () {
        setZoom(Number(zoom.value) / 100, true);
        updatePageGuides();
    });

    function themeRange(id, key, labelKey, min, max, step) {
        const input = h("input", { id: id, type: "range", min: min, max: max, step: step });
        let snapped = false;
        input.addEventListener("pointerdown", function () { snapped = false; });
        input.addEventListener("input", function () {
            if (!snapped) {
                snapshot();
                snapped = true;
            }
            doc.theme[key] = Number(input.value);
            applyTheme();
            save();
            syncThemeInputs();
        });
        input.addEventListener("change", function () { snapped = false; });
        return h("label", { class: "field" }, [
            h("span", { i18n: labelKey }),
            input,
            h("span", { id: id + "-value" })
        ]);
    }

    const grid = h("div", { id: "block-grid", class: "library-grid" });

    const sidebarRadio = h("input", { type: "radio", name: "add-target", value: "sidebar" });
    const mainRadio = h("input", { type: "radio", name: "add-target", value: "main", checked: "checked" });
    sidebarRadio.addEventListener("change", function () { if (sidebarRadio.checked) setAddTarget("sidebar"); });
    mainRadio.addEventListener("change", function () { if (mainRadio.checked) setAddTarget("main"); });

    const bold = keepSelection(h("button", { class: "btn", type: "button", text: "B", i18nTitle: "ui.bold", "data-command": "bold" }));
    const italic = keepSelection(h("button", { class: "btn", type: "button", text: "I", i18nTitle: "ui.italic", "data-command": "italic" }));
    const underline = keepSelection(h("button", { class: "btn", type: "button", text: "U", i18nTitle: "ui.underline", "data-command": "underline" }));
    bold.addEventListener("click", function () { format("bold"); });
    italic.addEventListener("click", function () { format("italic"); });
    underline.addEventListener("click", function () { format("underline"); });

    const addLineBtn = keepSelection(h("button", { id: "add-line", class: "btn", type: "button", i18n: "ui.addLine" }));
    addLineBtn.addEventListener("click", addLine);
    const duplicateBtn = keepSelection(h("button", { class: "btn", type: "button", i18n: "ui.duplicate" }));
    const deleteBtn = keepSelection(h("button", { class: "btn", type: "button", i18n: "ui.delete" }));
    const resetBtn = keepSelection(h("button", { class: "btn", type: "button", i18n: "ui.resetStyle" }));
    duplicateBtn.addEventListener("click", duplicateBlock);
    deleteBtn.addEventListener("click", deleteBlock);
    resetBtn.addEventListener("click", resetStyle);
    deleteBtn.classList.add("btn-danger");

    const loose = h("textarea", { id: "loose-text", rows: "8" });
    const llm = h("textarea", { id: "llm-input", rows: "10", spellcheck: "false" });
    const formatBtn = keepSelection(h("button", { class: "btn-primary", type: "button", i18n: "guide.formatLocal" }));
    const modelBtn = keepSelection(h("button", { class: "btn", type: "button", i18n: "guide.formatModel", "data-chrome-only": "1" }));
    const copyBtn = keepSelection(h("button", { class: "btn-primary", type: "button", i18n: "ui.copy" }));
    const applyBtn = keepSelection(h("button", { class: "btn", type: "button", i18n: "ui.applyText" }));
    formatBtn.addEventListener("click", function () {
        const data = applyLooseText(loose.value, doc.kind === "letter" ? "letter" : "cv");
        const found = describeLoose(data);
        showStatus(t("ui.applied") + (found ? " " + t("ui.found").replace("{list}", found) : ""));
    });
    const chromeNote = h("div", { class: "chrome-gate", hidden: "hidden" }, [
        h("p", { i18n: "setup.chromeWarn" }),
        keepSelection(h("button", { class: "btn", type: "button", "data-chrome-go": "1", i18n: "setup.chromeProceed" }))
    ]);
    modelBtn.addEventListener("click", function () {
        askChrome(chromeNote, function () {
            showStatus(t("guide.modelWorking"));
            formatWithBrowserModel(loose.value).then(function () {
                showStatus(t("guide.modelReady"));
            }).catch(function () {
                applyLooseText(loose.value, doc.kind === "letter" ? "letter" : "cv");
                showError(t("guide.modelMissing"));
            });
        });
    });
    copyBtn.addEventListener("click", function () { copyForModel(); });
    applyBtn.addEventListener("click", applyModelText);
    const fontSelect = h("select", { id: "theme-font" }, [
        h("option", { value: "roboto", text: "Roboto" }),
        h("option", { value: "merriweather", text: "Merriweather" }),
        h("option", { value: "lora", text: "Lora" })
    ]);

    const more = document.createElement("details");
    more.className = "more-menu";
    const summary = document.createElement("summary");
    summary.className = "btn";
    summary.dataset.i18n = "ui.more";
    more.append(summary, h("div", { class: "more-panel" }, [freshBtn, fillBtn, pasteBtn, importer, settingsBtn]));
    const ai = document.createElement("details");
    ai.className = "ai-menu";
    const aiSummary = document.createElement("summary");
    aiSummary.className = "btn";
    aiSummary.dataset.i18n = "ui.ai";
    ai.append(aiSummary, h("div", { class: "ai-panel" }, [
        h("p", { class: "ai-title", i18n: "ui.model" }),
        h("p", { class: "note", i18n: "ui.modelHint" }),
        llm,
        h("div", { class: "menu-actions" }, [
            copyBtn,
            applyBtn,
            h("select", { id: "model-mode" }, [
                h("option", { value: "guide", i18n: "setup.copyGuide" }),
                h("option", { value: "plain", i18n: "setup.copyPlain" }),
                h("option", { value: "advanced", i18n: "setup.copyAdvanced" })
            ])
        ])
    ]));
    ai.addEventListener("toggle", function () {
        if (!ai.open) return;
        more.open = false;
        refreshAiBox(false);
    });
    more.addEventListener("toggle", function () {
        if (more.open) ai.open = false;
    });
    const zoomSlot = document.getElementById("zoom-slot");
    if (zoomSlot) zoomSlot.appendChild(zoom);
    topbar.append(
        h("h1", { id: "doc-title" }),
        h("div", { class: "lang-switch" }, [nl, en]),
        h("span", { id: "save-state", class: "save-state" }),
        h("div", { class: "spacer" }),
        undoBtn,
        redoBtn,
        name,
        ai,
        download,
        more,
        file
    );
    bar.append(
        bold,
        italic,
        underline,
        h("input", { id: "block-color", type: "color", i18nTitle: "ui.blockColor" }),
        h("input", { id: "block-bg", type: "color", i18nTitle: "ui.blockBg" }),
        h("input", { id: "block-size", type: "range", min: "8", max: "28", step: "0.5" }),
        h("span", { id: "block-size-value", class: "size-readout" }),
        addLineBtn,
        duplicateBtn,
        deleteBtn,
        resetBtn
    );
    root.append(
        h("p", { id: "error", class: "error", hidden: "hidden" }),
        h("p", { id: "status", class: "note", hidden: "hidden" }),
        h("section", { class: "menu-block" }, [
            h("h2", { i18n: "ui.file" }),
            h("label", { class: "check" }, [stamp, h("span", { i18n: "ui.timestamp" })]),
            h("label", { class: "check" }, [finalBox, h("span", { i18n: "ui.final" })]),
            h("p", { id: "pdf-preview", class: "filename" }),
            h("p", { id: "page-status", class: "page-status" }),
            wipeMenu
        ]),
        h("section", { class: "menu-block" }, [
            h("h2", { i18n: "guide.pasteTitle" }),
            h("p", { class: "note", i18n: "guide.pasteHint" }),
            loose,
            h("div", { class: "menu-actions" }, [formatBtn, modelBtn]),
            chromeNote
        ]),
        h("section", { class: "menu-block" }, [
            h("h2", { i18n: "ui.templates" }),
            h("div", { class: "menu-actions" }, [cvBtn, letterBtn])
        ]),
        h("section", { class: "menu-block" }, [
            h("h2", { i18n: "ui.theme" }),
            h("label", { class: "field" }, [h("span", { i18n: "shell.font" }), fontSelect]),
            h("div", { class: "menu-colors" }, [
                colorField("theme-sidebar", "ui.sidebarColor"),
                colorField("theme-sidebar-text", "ui.sidebarText"),
                colorField("theme-accent", "ui.accent"),
                colorField("theme-page", "ui.page"),
                colorField("theme-text", "ui.text")
            ]),
            h("p", { id: "theme-contrast", class: "note contrast-note", hidden: "hidden" }),
            themeRange("theme-size", "baseSize", "ui.baseSize", "8", "14", "0.5"),
            themeRange("theme-width", "sidebarWidth", "ui.column", "24", "50", "1")
        ])
    );
    const modelMode = document.getElementById("model-mode");
    if (modelMode) modelMode.addEventListener("change", function () { refreshAiBox(true); });
    refreshAiBox(true);
    document.getElementById("library").append(
        h("h2", { i18n: "ui.blocks" }),
        h("p", { id: "library-hint", class: "note" }),
        h("div", { class: "row library-target" }, [
            h("span", { class: "note", i18n: "ui.addTo" }),
            h("label", { class: "check" }, [sidebarRadio, h("span", { i18n: "ui.sidebar" })]),
            h("label", { class: "check" }, [mainRadio, h("span", { i18n: "ui.main" })])
        ]),
        grid
    );

    bindColor("theme-sidebar", function (value) { doc.theme.sidebar = value; applyTheme(); save(); paintContrastWarning(); });
    bindColor("theme-sidebar-text", function (value) { doc.theme.sidebarText = value; applyTheme(); save(); paintContrastWarning(); });
    bindColor("theme-accent", function (value) { doc.theme.accent = value; applyTheme(); save(); paintContrastWarning(); });
    bindColor("theme-page", function (value) { doc.theme.page = value; applyTheme(); save(); paintContrastWarning(); });
    bindColor("theme-text", function (value) { doc.theme.text = value; applyTheme(); save(); paintContrastWarning(); });
    fontSelect.addEventListener("change", function () {
        snapshot();
        doc.theme.font = fontSelect.value;
        fontConfigPromise = null;
        fontConfigKey = "";
        applyTheme();
        save();
    });

    const blockColor = document.getElementById("block-color");
    let blockColorSnapped = false;
    blockColor.addEventListener("pointerdown", function () { blockColorSnapped = false; });
    blockColor.addEventListener("input", function () {
        const selection = window.getSelection();
        if (activeField && selection && !selection.isCollapsed && activeField.contains(selection.anchorNode)) return;
        const item = selectedBlock();
        if (!item) return;
        if (!blockColorSnapped) {
            snapshot();
            blockColorSnapped = true;
        }
        item.color = blockColor.value;
        const node = document.querySelector('.block[data-id="' + item.id + '"]');
        if (node) node.style.color = item.color;
        save();
    });
    blockColor.addEventListener("change", function () {
        applyTextStyle({ color: blockColor.value });
        blockColorSnapped = false;
    });

    const blockBg = document.getElementById("block-bg");
    let blockBgSnapped = false;
    blockBg.addEventListener("pointerdown", function () { blockBgSnapped = false; });
    blockBg.addEventListener("input", function () {
        const item = selectedBlock();
        if (!item) return;
        if (!blockBgSnapped) {
            snapshot();
            blockBgSnapped = true;
        }
        item.background = blockBg.value;
        const node = document.querySelector('.block[data-id="' + item.id + '"]');
        if (node) node.style.background = item.background;
        save();
    });
    blockBg.addEventListener("change", function () { blockBgSnapped = false; });

    const blockSize = document.getElementById("block-size");
    blockSize.addEventListener("pointerdown", function () { photoWidthSnapped = false; });
    blockSize.addEventListener("input", function () {
        const item = selectedBlock();
        const label = document.getElementById("block-size-value");
        if (item && item.type === "photo") {
            setPhotoWidth(item, blockSize.value, true);
            if (label) label.textContent = blockSize.value + "%";
            return;
        }
        if (label) label.textContent = blockSize.value + (item && item.type === "spacer" ? " px" : " pt");
    });
    blockSize.addEventListener("change", function () {
        photoWidthSnapped = false;
        const value = Number(blockSize.value);
        const item = selectedBlock();
        if (item && item.type === "photo") return;
        if (item && item.type === "spacer") {
            snapshot();
            item.fields.size = value;
            item.fontSize = 0;
            const node = document.querySelector('.block[data-id="' + item.id + '"]');
            if (node) node.style.height = value + "px";
            save();
            return;
        }
        if (applyTextStyle({ fontSize: value + "pt" })) return;
        if (!item) return;
        snapshot();
        item.fontSize = value;
        const node = document.querySelector('.block[data-id="' + item.id + '"]');
        if (node) node.style.fontSize = value + "pt";
        save();
    });
}

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

function decodeFont(b64) {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
}

function fontChoice() {
    const key = doc && doc.theme && doc.theme.font;
    if (key === "merriweather") return { key: "merriweather", family: "Merriweather" };
    if (key === "lora") return { key: "lora", family: "Lora" };
    return { key: "roboto", family: "Roboto" };
}

function getFontConfig() {
    const choice = fontChoice();
    if (!fontConfigPromise || fontConfigKey !== choice.family) {
        fontConfigKey = choice.family;
        const pack = typeof FONT_DATA !== "undefined" ? FONT_DATA[choice.key] : null;
        if (!pack) {
            fontConfigPromise = Promise.reject(new Error(t("ui.fontError")));
        } else {
            const regular = decodeFont(pack.regular);
            const bold = decodeFont(pack.bold);
            const italic = decodeFont(pack.italic);
            const boldItalic = decodeFont(pack.boldItalic);
            const faces = [
                [regular, 400, "normal"],
                [regular, 500, "normal"],
                [bold, 600, "normal"],
                [bold, 700, "normal"],
                [bold, 800, "normal"],
                [italic, 400, "italic"],
                [italic, 500, "italic"],
                [boldItalic, 600, "italic"],
                [boldItalic, 700, "italic"],
                [boldItalic, 800, "italic"]
            ];
            fontConfigPromise = Promise.resolve(faces.map(function (face) {
                return { fontFamily: choice.family, fontBytes: face[0], fontWeight: face[1], fontStyle: face[2] };
            }));
        }
    }
    return fontConfigPromise;
}

async function buildPdfBytes() {
    if (!window.dompdf || typeof dompdf.renderToBytes !== "function" || !window.PDFLib) {
        throw new Error(t("ui.libError"));
    }
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    const previousScale = stageScale;
    applyStageScale(1);
    document.body.classList.add("pdf-exporting");
    const stamped = [];
    document.querySelectorAll("#sheet .skill, #sheet .intro, #sheet .heading").forEach(function (node) {
        stamped.push([node, node.getAttribute("style")]);
        const computed = getComputedStyle(node);
        if (node.classList.contains("skill") || node.classList.contains("intro")) {
            node.style.backgroundColor = computed.backgroundColor;
            node.style.borderLeftWidth = computed.borderLeftWidth;
            node.style.borderLeftStyle = "solid";
            node.style.borderLeftColor = computed.borderLeftColor;
        }
        if (node.classList.contains("heading") && !node.classList.contains("is-label")) {
            node.style.borderBottomWidth = "1px";
            node.style.borderBottomStyle = "solid";
            node.style.borderBottomColor = computed.borderBottomColor;
        }
    });
    const photoSources = [];
    document.querySelectorAll("#sheet .photo-frame img").forEach(function (img) {
        const src = img.getAttribute("src") || "";
        if (src.indexOf("data:image/svg") !== 0) return;
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || 240;
        canvas.height = img.naturalHeight || 320;
        try {
            canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
            photoSources.push([img, src]);
            img.setAttribute("src", canvas.toDataURL("image/png"));
        } catch (error) { /* keep the drawing */ }
    });
    try {
        const family = fontChoice().family;
        await document.fonts.load("16px " + family);
        await document.fonts.load("700 16px " + family);
        await document.fonts.ready;
        await new Promise(function (resolve) {
            requestAnimationFrame(function () { requestAnimationFrame(resolve); });
        });
        const rendered = await dompdf.renderToBytes(document.getElementById("sheet"), {
            format: "a4",
            pagination: true,
            pageConfig: {
                header: { content: "", height: 0 },
                footer: { content: "", height: 0 }
            },
            backgroundColor: doc.theme.page || "#ffffff",
            marginPt: 0,
            compress: true,
            useCORS: true,
            fontConfig: await getFontConfig(),
            metadata: {
                title: pdfFilename().replace(/\.pdf$/i, ""),
                author: document.getElementById("pdf-name").value || "",
                creator: t("ui.toolName")
            }
        });
        const pdf = await PDFLib.PDFDocument.load(rendered);
        await pdf.attach(new TextEncoder().encode(JSON.stringify(doc)), "document.json", {
            mimeType: "application/json",
            description: "LibreCV document",
            creationDate: new Date(),
            modificationDate: new Date()
        });
        return await pdf.save();
    } finally {
        stamped.forEach(function (pair) {
            if (pair[1] === null) pair[0].removeAttribute("style");
            else pair[0].setAttribute("style", pair[1]);
        });
        photoSources.forEach(function (pair) { pair[0].setAttribute("src", pair[1]); });
        applyStageScale(previousScale);
        document.body.classList.remove("pdf-exporting");
    }
}

function plainFieldText(html) {
    const holder = document.createElement("div");
    holder.innerHTML = html || "";
    return (holder.textContent || "").replace(/\s+/g, " ").trim();
}

function downloadWarnings() {
    const known = {};
    ["name", "role", "text", "heading", "label", "title", "date", "org", "to", "subject"].forEach(function (key) {
        known[t("ph." + key)] = true;
    });
    let placeholders = 0;
    doc.sidebar.concat(doc.main).forEach(function (item) {
        Object.keys(item.fields || {}).forEach(function (key) {
            const value = item.fields[key];
            const list = Array.isArray(value) ? value : [value];
            list.forEach(function (entry) {
                if (typeof entry === "string" && known[plainFieldText(entry)]) placeholders += 1;
            });
        });
    });
    const notes = [];
    if (!plainName()) notes.push(t("ui.nameWarn"));
    if (placeholders) notes.push(t("ui.placeholderWarn"));
    const pages = pageCount();
    if (doc.kind === "letter" && pages > 1) notes.push(t("ui.letterPages").replace("{n}", String(pages)));
    if (contrastNotes(doc.theme).length) notes.push(t("ui.contrastWarn"));
    return notes;
}

async function downloadPdf(force) {
    if (force !== true) {
        const notes = downloadWarnings();
        if (notes.length) {
            showToast(notes.join(" "), "warn", [
                { label: t("ui.downloadAnyway"), primary: true, run: function () { showToast(""); downloadPdf(true); } },
                { label: t("ui.cancel"), run: function () { showToast(""); } }
            ]);
            return;
        }
    }
    const button = document.getElementById("download");
    button.disabled = true;
    button.textContent = t("ui.working");
    showError("");
    try {
        await ensurePdfLibs();
        const filename = pdfFilename();
        downloadBlob(await buildPdfBytes(), filename);
        showStatus(t("ui.downloaded").replace("{name}", filename));
    } catch (error) {
        console.error(error);
        showError(t("ui.pdfError") + " " + (error && error.message ? error.message : ""));
    } finally {
        button.disabled = false;
        button.textContent = t("ui.download");
    }
}

async function readAttachment(bytes) {
    const pdf = await PDFLib.PDFDocument.load(bytes);
    const names = pdf.catalog.lookup(PDFLib.PDFName.of("Names"), PDFLib.PDFDict);
    if (!names) throw new Error("missing");
    const embedded = names.lookup(PDFLib.PDFName.of("EmbeddedFiles"), PDFLib.PDFDict);
    if (!embedded) throw new Error("missing");
    const list = embedded.lookup(PDFLib.PDFName.of("Names"), PDFLib.PDFArray);
    if (!list) throw new Error("missing");
    let fallback = "";
    for (let i = 0; i < list.size(); i += 2) {
        const nameObj = list.lookup(i);
        const name = nameObj && typeof nameObj.decodeText === "function" ? nameObj.decodeText() : "";
        const spec = list.lookup(i + 1, PDFLib.PDFDict);
        const ef = spec.lookup(PDFLib.PDFName.of("EF"), PDFLib.PDFDict);
        const stream = ef.lookup(PDFLib.PDFName.of("F"));
        const text = new TextDecoder().decode(PDFLib.decodePDFRawStream(stream).decode());
        if (name === "document.json") return text;
        if (!fallback && text.indexOf('"version"') !== -1) fallback = text;
    }
    if (fallback) return fallback;
    throw new Error("missing");
}

async function importPdfBytes(bytes) {
    try {
        await ensurePdfLibs();
    } catch (error) {
        showError(t("ui.libError"));
        return;
    }
    let text = "";
    try {
        text = await readAttachment(bytes);
    } catch (error) {
        showError(t("ui.importFail"));
        return;
    }
    let data = null;
    try {
        data = JSON.parse(text);
    } catch (error) {
        showError(t("ui.importBad"));
        return;
    }
    if (!data || data.version !== 1 || !Array.isArray(data.sidebar) || !Array.isArray(data.main)) {
        showError(t("ui.importBad"));
        return;
    }
    snapshot();
    doc = data;
    normalize(doc);
    lang = doc.lang;
    try { localStorage.setItem(STORAGE_LANG, lang); } catch (error) { /* ignore */ }
    selectedId = null;
    filenameCustom = false;
    showError("");
    applyLanguage();
    render();
    syncFilenameFromPerson();
    setupReturn = false;
    documentLive = true;
    setPhase("studio");
    save();
    showStatus(t("ui.imported"));
    syncRoute("push");
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

function hexChannels(hex) {
    const raw = String(hex || "").replace("#", "");
    const full = raw.length === 3 ? raw.split("").map(function (part) { return part + part; }).join("") : raw;
    if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
    return [0, 2, 4].map(function (index) { return parseInt(full.slice(index, index + 2), 16); });
}

function contrastRatio(a, b) {
    function lum(hex) {
        const channels = hexChannels(hex);
        if (!channels) return 0;
        const linear = channels.map(function (channel) {
            const value = channel / 255;
            return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
    }
    const left = lum(a);
    const right = lum(b);
    const lighter = Math.max(left, right);
    const darker = Math.min(left, right);
    return (lighter + 0.05) / (darker + 0.05);
}

function contrastNotes(colors) {
    if (!colors) return [];
    const notes = [];
    if (contrastRatio(colors.sidebar, colors.sidebarText) < 4.5) notes.push("sidebar");
    if (contrastRatio(colors.page, colors.text) < 4.5) notes.push("page");
    return notes;
}

function paintContrastWarning() {
    const setupNote = document.getElementById("setup-contrast");
    if (setupNote) {
        let bad = [];
        try { bad = contrastNotes(activePalette()); } catch (error) { bad = []; }
        setupNote.hidden = !bad.length;
        setupNote.textContent = bad.length ? t("ui.contrastWarn") : "";
    }
    const themeNote = document.getElementById("theme-contrast");
    if (themeNote && doc && doc.theme) {
        const bad = contrastNotes(doc.theme);
        themeNote.hidden = !bad.length;
        themeNote.textContent = bad.length ? t("ui.contrastWarn") : "";
    }
}

function readableOn(hex) {
    const raw = String(hex || "").replace("#", "");
    const full = raw.length === 3 ? raw.split("").map(function (part) { return part + part; }).join("") : raw;
    const n = parseInt(full, 16);
    if (!isFinite(n)) return "#f8fafc";
    const y = ((n >> 16) & 255) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114;
    return y > 160000 ? "#18181b" : "#f8fafc";
}

function accentLightFor(accent, sidebar) {
    if (readableOn(sidebar) === "#18181b") return accent;
    const known = { "#0284c7": "#38bdf8", "#047857": "#6ee7b7" };
    const hit = known[String(accent || "").toLowerCase()];
    if (hit) return hit;
    const n = parseInt(String(accent || "").replace("#", ""), 16);
    if (!isFinite(n)) return accent;
    const channels = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(function (channel) {
        const mixed = Math.round(channel + (255 - channel) * 0.45);
        const hex = Math.max(0, Math.min(255, mixed)).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    });
    return "#" + channels.join("");
}

function activePalette() {
    let colors;
    if (setupState.palette === "custom") {
        const sidebar = document.getElementById("setup-sidebar").value;
        colors = {
            sidebar: sidebar,
            sidebarText: readableOn(sidebar),
            accent: document.getElementById("setup-accent").value,
            page: document.getElementById("setup-page").value,
            text: document.getElementById("setup-text").value
        };
    } else if (PALETTES[setupState.palette]) {
        colors = Object.assign({}, PALETTES[setupState.palette]);
    } else {
        colors = Object.assign({}, setupState.kind === "letter" ? PALETTES.groen : PALETTES.zakelijk);
    }
    if (!colors.accentLight) colors.accentLight = accentLightFor(colors.accent, colors.sidebar);
    return colors;
}

function paintPalettePreview() {
    const node = document.getElementById("palette-preview");
    if (!node) return;
    const colors = activePalette();
    const side = node.querySelector(".pp-side");
    const main = node.querySelector(".pp-main");
    side.style.background = colors.sidebar;
    side.style.color = colors.sidebarText;
    main.style.background = colors.page;
    main.style.color = colors.text;
    node.style.setProperty("--pp-accent", colors.accent);
}

