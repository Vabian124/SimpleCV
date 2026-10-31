function showToast(message, tone, actions) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    window.clearTimeout(toastTimer);
    toast.replaceChildren();
    if (!message) {
        toast.hidden = true;
        return;
    }
    toast.hidden = false;
    toast.className = "toast" + (tone === "error" ? " is-error" : tone === "warn" ? " is-warn" : "");
    toast.setAttribute("role", tone === "error" || tone === "warn" ? "alert" : "status");
    const text = document.createElement("p");
    text.textContent = message;
    toast.appendChild(text);
    (actions || []).forEach(function (action) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = action.primary ? "btn-primary" : "btn";
        button.textContent = action.label;
        button.addEventListener("click", action.run);
        toast.appendChild(button);
    });
    if (tone !== "error" && tone !== "warn") {
        toastTimer = window.setTimeout(function () { toast.hidden = true; }, 4200);
    }
}

function showStatus(message) {
    const box = document.getElementById("status");
    if (box) {
        box.hidden = !message;
        box.textContent = message || "";
    }
    if (message) showToast(message, "ok");
}

function markCatalog() {
    return [
        { types: ["name"], key: "name", shape: "NAME: Voornaam<br>Achternaam" },
        { types: ["role"], key: "role", shape: "ROLE: " },
        { types: ["contact"], key: "contact", shape: "@@@CONTACT\nCITY: \nPHONE: \nEMAIL: \nBORN: \nLABEL: \nVALUE: " },
        { types: ["skill"], key: "skill", shape: "@@@SKILLS\n- " },
        { types: ["competence"], key: "competence", shape: "@@@STRENGTHS\n- titel: tekst" },
        { types: ["project"], key: "project", shape: "@@@PROJECTS\n- titel: tekst" },
        { types: ["intro"], key: "intro", shape: "@@@PROFILE\nSUMMARY: " },
        { types: ["timeline"], key: "timeline", shape: "@@@JOB\nTITLE: \nDATE: \nORGANIZATION: \n- \n@@@STUDY" },
        { types: ["heading"], key: "heading", shape: "@@@HEADING\nTEXT: \nSTYLE: bar" },
        { types: ["paragraph"], key: "paragraph", shape: "@@@PARAGRAPH" },
        { types: ["list"], key: "list", shape: "@@@LIST\n- " },
        { types: ["letterhead"], key: "letterhead", shape: "@@@LETTERHEAD\nTITLE: \nDATE: \nTO: \nSUBJECT: " },
        { types: ["closing"], key: "closing", shape: "@@@CLOSING\nSIGN: " },
        { types: ["signature"], key: "signature", shape: "SIGN: " },
        { types: ["spacer"], key: "spacer", shape: "@@@SPACER\nSIZE: 12" },
        { types: ["photo"], key: "photo", shape: "@@@PHOTO\nCAPTION: " }
    ];
}

function uncoveredBlocks() {
    const known = {};
    markCatalog().forEach(function (entry) {
        entry.types.forEach(function (type) { known[type] = true; });
    });
    return ALL_BLOCKS.filter(function (type) { return !known[type]; });
}

function fieldSketch(type) {
    try {
        return Object.keys(createBlock(type).fields).filter(function (key) {
            return key !== "src" && key !== "original";
        }).join(", ");
    } catch (error) {
        return type;
    }
}

function themeBlock(theme) {
    const source = theme || (setupState.kind === "letter" ? letterTheme() : cvTheme());
    return [
        "@@@THEME",
        "SIDEBAR: " + source.sidebar,
        "SIDEBARTEXT: " + source.sidebarText,
        "ACCENT: " + source.accent,
        "ACCENTLIGHT: " + source.accentLight,
        "PAGE: " + source.page,
        "TEXT: " + source.text,
        "SIZE: " + source.baseSize,
        "COLUMN: " + source.sidebarWidth,
        "FONT: " + (source.font || "roboto")
    ].join("\n");
}

function modelInstructions(mode, kind) {
    const letter = (kind || setupState.kind) === "letter";
    const lines = [t("mark.preamble")
        .replace("{doc}", letter ? "@@@LETTER" : "@@@CV")
        .replace("{lang}", lang === "en" ? "English" : "Nederlands")];
    markCatalog().forEach(function (entry) {
        const title = entry.types.map(function (type) { return t("type." + type); }).join(", ");
        lines.push("", title, entry.shape);
        const say = t("mark." + entry.key);
        if (say && say !== "mark." + entry.key) lines.push(say);
    });
    uncoveredBlocks().forEach(function (type) {
        const fields = fieldSketch(type);
        lines.push("", t("mark.fallback").replace("{type}", t("type." + type)).replace("{fields}", fields));
    });
    if (mode === "advanced") lines.push("", t("mark.advanced"));
    lines.push("", t("mark.keep"));
    return lines.join("\n");
}

function blankMarked() {
    const letter = setupState.kind === "letter";
    const lines = [letter ? "@@@LETTER" : "@@@CV", "NAME: ", "ROLE: "];
    if (letter) lines.push("TITLE: ", "DATE: ", "TO: ", "SUBJECT: ", "SUMMARY: ");
    lines.push(
        "@@@CONTACT", "CITY: ", "PHONE: ", "EMAIL: ", "BORN: ",
        "@@@SKILLS", "- ",
        "@@@STRENGTHS", "- : ",
        "@@@PROJECTS", "- : "
    );
    if (!letter) lines.push("@@@PROFILE", "");
    lines.push(
        "@@@JOB", "TITLE: ", "DATE: ", "ORGANIZATION: ", "- ",
        "@@@STUDY", "TITLE: ", "DATE: ", "ORGANIZATION: ", "- ",
        "@@@HEADING", "TEXT: ", "STYLE: bar",
        "@@@PARAGRAPH", "",
        "@@@LIST", "- "
    );
    if (!letter) lines.push("@@@LETTERHEAD", "TITLE: ", "DATE: ", "TO: ", "SUBJECT: ");
    lines.push("@@@PHOTO", "CAPTION: ", "@@@CLOSING", "", "SIGN: ", "@@@SPACER", "SIZE: 12", "@@@END");
    return lines.join("\n");
}

function modelBundle(mode) {
    let body = blankMarked();
    if (mode === "advanced") body = body.replace("@@@END", themeBlock() + "\n@@@END");
    if (mode === "plain") return body;
    return modelInstructions(mode) + "\n\n" + body;
}

function filledBundle(mode) {
    let body = exportMarked();
    if (mode === "advanced" && doc && doc.theme) body = body.replace("@@@END", themeBlock(doc.theme) + "\n@@@END");
    if (mode === "plain") return body;
    return modelInstructions(mode, doc && doc.kind) + "\n\n" + body;
}

async function copyModelText(mode, filled) {
    const text = filled ? filledBundle(mode) : modelBundle(mode);
    const box = document.getElementById(filled ? "llm-input" : "setup-model-text");
    if (box) {
        box.value = text;
        box.scrollTop = 0;
    }
    try {
        await navigator.clipboard.writeText(text);
        if (filled) showStatus(t("ui.copied"));
        else setupMessage(t("ui.copied"), false);
    } catch (error) {
        if (box) {
            box.focus();
            box.select();
        }
        if (filled) showError(t("ui.copyFailed"));
        else setupMessage(t("ui.copyFailed"), true);
    }
}

async function copyForModel() {
    const pick = document.getElementById("model-mode");
    copyModelText(pick ? pick.value : "guide", true);
}

function applyModelText() {
    const input = document.getElementById("llm-input");
    try {
        applyMarked(input ? input.value : "");
        showStatus(t("ui.applied"));
    } catch (error) {
        showError(error && error.message ? error.message : t("ui.parseError"));
    }
}

