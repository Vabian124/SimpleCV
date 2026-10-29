/* CC0-1.0 — https://creativecommons.org/publicdomain/zero/1.0/ */

const STORAGE_DOC = "cv-tool-document";
const STORAGE_LANG = "cv-tool-lang";
const STORAGE_NAME = "cv-tool-filename";
const BLOCK_TYPES = [
    "name", "role", "contact", "heading", "skill", "competence", "project",
    "timeline", "intro", "paragraph", "list", "letterhead", "closing", "signature"
];

const I18N = {
    nl: {
        ui: {
            title: "Blok-editor",
            download: "Download PDF",
            import: "Importeer PDF",
            fileName: "Bestandsnaam",
            timestamp: "Tijdstip in de naam",
            final: "Voeg final toe",
            undo: "Ongedaan",
            redo: "Opnieuw",
            templates: "Sjabloon",
            showcase: "Showcase",
            emptyCv: "Lege CV",
            emptyLetter: "Lege brief",
            theme: "Document",
            sidebarColor: "Zijbalkkleur",
            sidebarText: "Tekst in de zijbalk",
            accent: "Accent",
            page: "Paginakleur",
            text: "Tekstkleur",
            baseSize: "Basisgrootte",
            column: "Kolombreedte",
            block: "Geselecteerd blok",
            none: "Klik een blok in de pagina.",
            blockColor: "Tekstkleur van het blok",
            blockBg: "Achtergrond van het blok",
            blockSize: "Tekstgrootte van het blok",
            resetStyle: "Stijl wissen",
            duplicate: "Dupliceer",
            delete: "Verwijder",
            add: "Blok toevoegen",
            addTo: "Toevoegen aan",
            sidebar: "Zijbalk",
            main: "Pagina",
            format: "Opmaak",
            bold: "Vet",
            italic: "Cursief",
            underline: "Onderstrepen",
            addLine: "Regel toevoegen",
            hint: "Selecteer tekst in een blok om alleen dat stuk een kleur of grootte te geven.",
            working: "PDF maken…",
            importFail: "Deze PDF komt niet uit deze editor. Download hem hier eerst, daarna kun je hem weer openen.",
            importBad: "De bijlage in deze PDF is geen geldig document.",
            pdfError: "De PDF lukte niet.",
            libError: "De PDF-bibliotheek is niet geladen.",
            fontError: "Het lettertype lukte niet.",
            toolName: "Blok-editor",
            pageOne: "1 pagina",
            pageMany: "{n} pagina's",
            zoom: "Zoom"
        },
        prefix: { letter: "Motivatiebrief" },
        doc: {
            contact: "Contact",
            skills: "Vaardigheden",
            strengths: "Competenties",
            projects: "Projecten",
            profile: "Profiel",
            work: "Werkervaring",
            education: "Opleiding",
            letter: "Brief",
            city: "Woonplaats",
            phone: "Telefoon",
            email: "E-mail",
            born: "Geboren",
            intro: "In het kort"
        },
        ph: {
            name: "Je naam",
            role: "Je rol",
            text: "Tekst",
            heading: "Kop",
            label: "Label",
            title: "Titel",
            date: "2024 – 2026",
            org: "Organisatie",
            to: "Aan de ontvanger",
            subject: "Onderwerp"
        },
        type: {
            name: "Naam",
            role: "Rol",
            contact: "Contactregel",
            heading: "Tussenkop",
            skill: "Vaardigheid",
            competence: "Competentie",
            project: "Project",
            timeline: "Tijdlijn",
            intro: "Introvak",
            paragraph: "Alinea",
            list: "Lijst",
            letterhead: "Briefkop",
            closing: "Afsluiting",
            signature: "Handtekening"
        }
    },
    en: {
        ui: {
            title: "Block editor",
            download: "Download PDF",
            import: "Import PDF",
            fileName: "File name",
            timestamp: "Add a timestamp",
            final: "Add final",
            undo: "Undo",
            redo: "Redo",
            templates: "Template",
            showcase: "Showcase",
            emptyCv: "Empty CV",
            emptyLetter: "Empty letter",
            theme: "Document",
            sidebarColor: "Sidebar colour",
            sidebarText: "Sidebar text",
            accent: "Accent",
            page: "Page colour",
            text: "Text colour",
            baseSize: "Base size",
            column: "Column width",
            block: "Selected block",
            none: "Click a block on the page.",
            blockColor: "Block text colour",
            blockBg: "Block background",
            blockSize: "Block text size",
            resetStyle: "Clear style",
            duplicate: "Duplicate",
            delete: "Delete",
            add: "Add a block",
            addTo: "Add to",
            sidebar: "Sidebar",
            main: "Page",
            format: "Format",
            bold: "Bold",
            italic: "Italic",
            underline: "Underline",
            addLine: "Add a line",
            hint: "Select text inside a block to colour or resize only that part.",
            working: "Making the PDF…",
            importFail: "This PDF did not come from this editor. Download it here first, then you can open it again.",
            importBad: "The attachment in this PDF is not a valid document.",
            pdfError: "The PDF failed.",
            libError: "The PDF library did not load.",
            fontError: "The font failed to load.",
            toolName: "Block editor",
            pageOne: "1 page",
            pageMany: "{n} pages",
            zoom: "Zoom"
        },
        prefix: { letter: "Motivation_letter" },
        doc: {
            contact: "Contact",
            skills: "Skills",
            strengths: "Strengths",
            projects: "Projects",
            profile: "Profile",
            work: "Experience",
            education: "Education",
            letter: "Letter",
            city: "City",
            phone: "Phone",
            email: "Email",
            born: "Born",
            intro: "In short"
        },
        ph: {
            name: "Your name",
            role: "Your role",
            text: "Text",
            heading: "Heading",
            label: "Label",
            title: "Title",
            date: "2024 – 2026",
            org: "Organisation",
            to: "Recipient",
            subject: "Subject"
        },
        type: {
            name: "Name",
            role: "Role",
            contact: "Contact line",
            heading: "Section heading",
            skill: "Skill",
            competence: "Strength",
            project: "Project",
            timeline: "Timeline",
            intro: "Intro box",
            paragraph: "Paragraph",
            list: "List",
            letterhead: "Letter header",
            closing: "Closing",
            signature: "Signature"
        }
    }
};

const ROBOTO_FONTS = {
    regular: "https://cdn.jsdelivr.net/fontsource/fonts/roboto@5.2.8/latin-400-normal.ttf",
    bold: "https://cdn.jsdelivr.net/fontsource/fonts/roboto@5.2.8/latin-700-normal.ttf",
    italic: "https://cdn.jsdelivr.net/fontsource/fonts/roboto@5.2.8/latin-400-italic.ttf",
    boldItalic: "https://cdn.jsdelivr.net/fontsource/fonts/roboto@5.2.8/latin-700-italic.ttf"
};

let lang = "nl";
let doc = null;
let selectedId = null;
let addTarget = "main";
let seq = 1;
let past = [];
let future = [];
let snapArmed = false;
let activeField = null;
let fontConfigPromise = null;

function t(key) {
    const parts = key.split(".");
    let node = I18N[lang] || I18N.nl;
    for (let i = 0; i < parts.length; i++) {
        if (node == null) return key;
        node = node[parts[i]];
    }
    return node == null ? key : node;
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function safeCss(value) {
    return String(value).replace(/["'<>;]/g, "");
}

function uid() {
    seq += 1;
    return "b" + seq;
}

function cvTheme() {
    return {
        sidebar: "#1e293b",
        sidebarText: "#f8fafc",
        accent: "#0284c7",
        page: "#ffffff",
        text: "#334155",
        baseSize: 10.5,
        sidebarWidth: 33
    };
}

function letterTheme() {
    return {
        sidebar: "#0b1d16",
        sidebarText: "#f8fafc",
        accent: "#047857",
        page: "#ffffff",
        text: "#334155",
        baseSize: 11,
        sidebarWidth: 32
    };
}

function block(type, fields) {
    return {
        id: uid(),
        type: type,
        color: "",
        background: "",
        fontSize: 0,
        fields: fields
    };
}

function showcase() {
    return {
        version: 1,
        lang: lang,
        kind: "showcase",
        theme: cvTheme(),
        sidebar: [
            block("name", { html: "Alex<br>Jansen" }),
            block("role", { html: "Ontwerper" }),
            block("heading", { key: "doc.contact", html: "" }),
            block("contact", { labelKey: "city", label: "", html: "Voorbeeldstad" }),
            block("contact", { labelKey: "phone", label: "", html: "+31 6 0000 0000" }),
            block("contact", { labelKey: "email", label: "", html: "alex@example.com" }),
            block("contact", { labelKey: "born", label: "", html: "01-01-1998" }),
            block("heading", { key: "doc.skills", html: "" }),
            block("skill", { html: "Schrijven" }),
            block("skill", { html: "Prototypes" }),
            block("skill", { html: "Vormgeving" }),
            block("heading", { key: "doc.strengths", html: "" }),
            block("competence", { title: "Helder schrijven", body: "Maakt van een ingewikkeld idee een korte tekst." }),
            block("heading", { key: "doc.projects", html: "" }),
            block("project", { title: "Noorderlicht", body: "Een verzonnen site voor een studio die lampen maakt." })
        ],
        main: [
            block("heading", { key: "doc.profile", html: "" }),
            block("intro", { html: "Alex is een verzonnen ontwerper. Deze tekst laat elk bloktype zien en hoort bij niemand." }),
            block("heading", { key: "doc.work", html: "" }),
            block("timeline", {
                title: "Ontwerper",
                date: "2022 \u2013 2024",
                org: "Noorderlicht BV",
                items: ["Een huisstijl voor een fictieve studio.", "Korte teksten voor de website."]
            }),
            block("timeline", {
                title: "Stagiair",
                date: "2021",
                org: "Voorbeeldbureau",
                items: ["Meegelopen bij een campagne die niet bestaat."]
            }),
            block("heading", { key: "doc.education", html: "" }),
            block("timeline", {
                title: "Communicatie",
                date: "2017 \u2013 2021",
                org: "Voorbeeld Hogeschool",
                items: ["Afstudeerproject over een denkbeeldig museum."]
            }),
            block("paragraph", { html: "Een losse alinea. Die staat niet in een tijdlijn en niet in een lijst." }),
            block("list", { items: ["Eerste punt van een lijst.", "Tweede punt, ook verzonnen."] }),
            block("letterhead", {
                date: "29 oktober 2026",
                to: "Voorbeeld Organisatie<br>Aan de commissie",
                subject: "Onderwerp: een verzonnen sollicitatie"
            }),
            block("closing", { paragraphs: ["Met vriendelijke groet,"] }),
            block("signature", { html: "Alex Jansen" })
        ]
    };
}

function emptyCv() {
    const text = escapeHtml(t("ph.text"));
    const title = escapeHtml(t("ph.title"));
    const date = escapeHtml(t("ph.date"));
    const org = escapeHtml(t("ph.org"));
    return {
        version: 1,
        lang: lang,
        kind: "cv",
        theme: cvTheme(),
        sidebar: [
            block("name", { html: escapeHtml(t("ph.name")) }),
            block("role", { html: escapeHtml(t("ph.role")) }),
            block("heading", { key: "doc.contact", html: "" }),
            block("contact", { labelKey: "city", label: "", html: text }),
            block("contact", { labelKey: "phone", label: "", html: text }),
            block("contact", { labelKey: "email", label: "", html: text }),
            block("contact", { labelKey: "born", label: "", html: text }),
            block("heading", { key: "doc.skills", html: "" }),
            block("skill", { html: text }),
            block("heading", { key: "doc.strengths", html: "" }),
            block("competence", { title: title, body: text })
        ],
        main: [
            block("heading", { key: "doc.profile", html: "" }),
            block("intro", { html: text }),
            block("heading", { key: "doc.work", html: "" }),
            block("timeline", { title: title, date: date, org: org, items: [text] }),
            block("heading", { key: "doc.education", html: "" }),
            block("timeline", { title: title, date: date, org: org, items: [text] })
        ]
    };
}

function emptyLetter() {
    const text = escapeHtml(t("ph.text"));
    return {
        version: 1,
        lang: lang,
        kind: "letter",
        theme: letterTheme(),
        sidebar: [
            block("name", { html: escapeHtml(t("ph.name")) }),
            block("role", { html: escapeHtml(t("ph.role")) }),
            block("heading", { key: "doc.contact", html: "" }),
            block("contact", { labelKey: "city", label: "", html: text }),
            block("contact", { labelKey: "phone", label: "", html: text }),
            block("contact", { labelKey: "email", label: "", html: text })
        ],
        main: [
            block("heading", { key: "doc.letter", html: "" }),
            block("letterhead", {
                date: escapeHtml(t("ph.date")),
                to: escapeHtml(t("ph.to")),
                subject: escapeHtml(t("ph.subject"))
            }),
            block("intro", { html: text }),
            block("paragraph", { html: text }),
            block("paragraph", { html: text }),
            block("closing", { paragraphs: [text] }),
            block("signature", { html: escapeHtml(t("ph.name")) })
        ]
    };
}

function createBlock(type) {
    const text = escapeHtml(t("ph.text"));
    const title = escapeHtml(t("ph.title"));
    const fields = {
        name: { html: escapeHtml(t("ph.name")) },
        role: { html: escapeHtml(t("ph.role")) },
        contact: { labelKey: "custom", label: escapeHtml(t("ph.label")), html: text },
        heading: { key: "", html: escapeHtml(t("ph.heading")) },
        skill: { html: text },
        competence: { title: title, body: text },
        project: { title: title, body: text },
        timeline: { title: title, date: escapeHtml(t("ph.date")), org: escapeHtml(t("ph.org")), items: [text] },
        intro: { html: text },
        paragraph: { html: text },
        list: { items: [text] },
        letterhead: {
            date: escapeHtml(t("ph.date")),
            to: escapeHtml(t("ph.to")),
            subject: escapeHtml(t("ph.subject"))
        },
        closing: { paragraphs: [text] },
        signature: { html: escapeHtml(t("ph.name")) }
    };
    return block(type, fields[type] || { html: text });
}

function normalize(data) {
    data.version = 1;
    data.sidebar = Array.isArray(data.sidebar) ? data.sidebar : [];
    data.main = Array.isArray(data.main) ? data.main : [];
    data.theme = Object.assign(cvTheme(), data.theme || {});
    data.theme.baseSize = Number(data.theme.baseSize) || 10.5;
    data.theme.sidebarWidth = Number(data.theme.sidebarWidth) || 33;
    data.kind = data.kind || "showcase";
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

function undo() {
    if (!past.length) return;
    future.push(JSON.stringify(doc));
    restore(JSON.parse(past.pop()));
}

function redo() {
    if (!future.length) return;
    past.push(JSON.stringify(doc));
    restore(JSON.parse(future.pop()));
}

function save() {
    try { localStorage.setItem(STORAGE_DOC, JSON.stringify(doc)); } catch (error) { /* private mode */ }
    updateFilenamePreview();
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

function serialize(root) {
    let out = "";
    root.childNodes.forEach(function (node) {
        if (node.nodeType === 3) {
            out += escapeHtml(node.textContent);
            return;
        }
        if (node.nodeType !== 1) return;
        const name = node.nodeName;
        if (name === "BR") {
            out += "<br>";
            return;
        }
        if (name === "B" || name === "STRONG") {
            out += "<strong>" + serialize(node) + "</strong>";
            return;
        }
        if (name === "I" || name === "EM") {
            out += "<em>" + serialize(node) + "</em>";
            return;
        }
        if (name === "U") {
            out += "<u>" + serialize(node) + "</u>";
            return;
        }
        if (name === "SPAN" || name === "FONT") {
            const color = (node.style && node.style.color) || node.getAttribute("color") || "";
            const size = (node.style && node.style.fontSize) || "";
            const style = [];
            if (color) style.push("color:" + safeCss(color));
            if (size) style.push("font-size:" + safeCss(size));
            const inner = serialize(node);
            out += style.length ? '<span style="' + style.join(";") + '">' + inner + "</span>" : inner;
            return;
        }
        if (name === "DIV" || name === "P") {
            if (out && !out.endsWith("<br>")) out += "<br>";
            out += serialize(node);
            return;
        }
        out += serialize(node);
    });
    return out;
}

function editable(className, html, write) {
    const node = document.createElement("div");
    node.className = "editable" + (className ? " " + className : "");
    node.contentEditable = "true";
    node.spellcheck = true;
    node.innerHTML = html || "";
    node.addEventListener("focus", function () {
        activeField = node;
        rememberSnapshot();
    });
    node.addEventListener("input", function () { write(serialize(node)); });
    node.addEventListener("paste", function (event) {
        event.preventDefault();
        const text = event.clipboardData ? event.clipboardData.getData("text/plain") : "";
        document.execCommand("insertText", false, text);
    });
    return node;
}

function paint(node, item) {
    node.style.color = item.color || "";
    node.style.background = item.background || "";
    node.style.fontSize = item.fontSize ? item.fontSize + "pt" : "";
    if (item.color) node.style.setProperty("--block-color", item.color);
    else node.style.removeProperty("--block-color");
}

function bindDrag(handle, blockEl) {
    handle.addEventListener("pointerdown", function (event) {
        if (event.button !== 0) return;
        event.preventDefault();
        event.stopPropagation();
        let snapped = false;
        function move(moveEvent) {
            const point = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY);
            const target = point && point.closest(".block");
            if (!target || target === blockEl) return;
            const parent = target.parentElement;
            if (!parent || (parent.id !== "col-sidebar" && parent.id !== "col-main")) return;
            if (!snapped) {
                snapshot();
                snapped = true;
            }
            const rect = target.getBoundingClientRect();
            const after = moveEvent.clientY > rect.top + rect.height / 2;
            parent.insertBefore(blockEl, after ? target.nextSibling : target);
        }
        function up() {
            handle.removeEventListener("pointermove", move);
            handle.removeEventListener("pointerup", up);
            if (snapped) {
                syncColumnsFromDom();
                save();
            }
        }
        handle.addEventListener("pointermove", move);
        handle.addEventListener("pointerup", up);
        try { handle.setPointerCapture(event.pointerId); } catch (error) { /* synthetic events */ }
    });
}

function syncColumnsFromDom() {
    const all = doc.sidebar.concat(doc.main);
    ["sidebar", "main"].forEach(function (name) {
        const column = document.getElementById(name === "sidebar" ? "col-sidebar" : "col-main");
        const ids = Array.from(column.children)
            .filter(function (node) { return node.classList.contains("block"); })
            .map(function (node) { return node.dataset.id; });
        doc[name] = ids.map(function (id) {
            return all.find(function (item) { return item.id === id; });
        }).filter(Boolean);
    });
}

function lineList(item, key, asList) {
    const list = document.createElement(asList ? "ul" : "div");
    list.className = asList ? "bullets" : "closing";
    const rows = item.fields[key] || [];
    rows.forEach(function (html, index) {
        const row = document.createElement(asList ? "li" : "div");
        row.className = "line";
        const field = editable("", html, function (value) {
            item.fields[key][index] = value;
            save();
        });
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "line-x";
        remove.textContent = "\u00d7";
        remove.addEventListener("mousedown", function (event) { event.preventDefault(); });
        remove.addEventListener("click", function () {
            snapshot();
            item.fields[key].splice(index, 1);
            if (!item.fields[key].length) item.fields[key].push(escapeHtml(t("ph.text")));
            render();
            save();
        });
        row.append(field, remove);
        list.appendChild(row);
    });
    return list;
}

function renderBlock(item) {
    const node = document.createElement("section");
    node.className = "block " + item.type;
    node.dataset.id = item.id;
    paint(node, item);
    const handle = document.createElement("button");
    handle.type = "button";
    handle.className = "drag-handle";
    handle.tabIndex = -1;
    handle.textContent = "\u22ee\u22ee";
    bindDrag(handle, node);
    node.appendChild(handle);
    node.addEventListener("pointerdown", function (event) {
        if (event.target.closest(".drag-handle") || event.target.closest(".line-x")) return;
        select(item.id);
    });

    const fields = item.fields;
    if (item.type === "heading") {
        node.appendChild(editable("", fields.key ? escapeHtml(t(fields.key)) : (fields.html || ""), function (html) {
            fields.key = "";
            fields.html = html;
            save();
        }));
    } else if (item.type === "contact") {
        const label = document.createElement("div");
        label.className = "contact-label";
        if (fields.labelKey && fields.labelKey !== "custom") {
            label.textContent = t("doc." + fields.labelKey);
        } else {
            label.appendChild(editable("", fields.label || "", function (html) {
                fields.label = html;
                fields.labelKey = "custom";
                save();
            }));
        }
        node.append(
            label,
            editable("", fields.html || "", function (html) { fields.html = html; save(); })
        );
    } else if (item.type === "competence" || item.type === "project") {
        node.append(
            editable("title", fields.title || "", function (html) { fields.title = html; save(); }),
            editable("body", fields.body || "", function (html) { fields.body = html; save(); })
        );
    } else if (item.type === "timeline") {
        const top = document.createElement("div");
        top.className = "timeline-top";
        top.append(
            editable("title", fields.title || "", function (html) { fields.title = html; save(); }),
            editable("date", fields.date || "", function (html) { fields.date = html; save(); })
        );
        node.append(
            top,
            editable("org", fields.org || "", function (html) { fields.org = html; save(); }),
            lineList(item, "items", true)
        );
    } else if (item.type === "intro") {
        const label = document.createElement("div");
        label.className = "intro-label";
        label.dataset.i18n = "doc.intro";
        label.textContent = t("doc.intro");
        node.append(label, editable("", fields.html || "", function (html) { fields.html = html; save(); }));
    } else if (item.type === "list") {
        node.appendChild(lineList(item, "items", true));
    } else if (item.type === "letterhead") {
        node.append(
            editable("date", fields.date || "", function (html) { fields.date = html; save(); }),
            editable("to", fields.to || "", function (html) { fields.to = html; save(); }),
            editable("subject", fields.subject || "", function (html) { fields.subject = html; save(); })
        );
    } else if (item.type === "closing") {
        node.appendChild(lineList(item, "paragraphs", false));
    } else {
        node.appendChild(editable("", fields.html || "", function (html) { fields.html = html; save(); }));
    }
    return node;
}

function applyTheme() {
    const sheet = document.getElementById("sheet");
    const theme = doc.theme;
    sheet.style.setProperty("--sidebar", theme.sidebar);
    sheet.style.setProperty("--sidebar-text", theme.sidebarText);
    sheet.style.setProperty("--accent", theme.accent);
    sheet.style.setProperty("--page", theme.page);
    sheet.style.setProperty("--text", theme.text);
    sheet.style.setProperty("--base-size", theme.baseSize + "pt");
    sheet.style.setProperty("--sidebar-width", theme.sidebarWidth + "%");
}

function setColorInput(id, value) {
    const input = document.getElementById(id);
    if (input && /^#[0-9a-fA-F]{6}$/.test(value || "")) input.value = value;
}

function syncThemeInputs() {
    const theme = doc.theme;
    setColorInput("theme-sidebar", theme.sidebar);
    setColorInput("theme-sidebar-text", theme.sidebarText);
    setColorInput("theme-accent", theme.accent);
    setColorInput("theme-page", theme.page);
    setColorInput("theme-text", theme.text);
    document.getElementById("theme-size").value = theme.baseSize;
    document.getElementById("theme-width").value = theme.sidebarWidth;
    document.getElementById("theme-size-value").textContent = theme.baseSize + " pt";
    document.getElementById("theme-width-value").textContent = theme.sidebarWidth + "%";
}

function render() {
    const sidebar = document.getElementById("col-sidebar");
    const main = document.getElementById("col-main");
    sidebar.replaceChildren();
    main.replaceChildren();
    doc.sidebar.forEach(function (item) { sidebar.appendChild(renderBlock(item)); });
    doc.main.forEach(function (item) { main.appendChild(renderBlock(item)); });
    applyTheme();
    syncThemeInputs();
    if (selectedId && selectedBlock()) select(selectedId);
    else {
        selectedId = null;
        updateInspector();
    }
    requestAnimationFrame(updatePageGuides);
}

function select(id) {
    selectedId = id;
    document.querySelectorAll(".block.is-selected").forEach(function (node) {
        node.classList.remove("is-selected");
    });
    const node = document.querySelector('.block[data-id="' + id + '"]');
    if (node) {
        node.classList.add("is-selected");
        addTarget = node.parentElement && node.parentElement.id === "col-sidebar" ? "sidebar" : "main";
        const radio = document.querySelector('input[name="add-target"][value="' + addTarget + '"]');
        if (radio) radio.checked = true;
    }
    updateInspector();
}

function defaultTextColor(item) {
    return columnOf(item.id) === "sidebar" ? doc.theme.sidebarText : doc.theme.text;
}

function updateInspector() {
    const item = selectedBlock();
    document.getElementById("inspector-empty").hidden = !!item;
    document.getElementById("inspector").hidden = !item;
    if (!item) return;
    document.getElementById("inspector-type").textContent = t("type." + item.type);
    setColorInput("block-color", item.color || defaultTextColor(item));
    setColorInput("block-bg", item.background || "#ffffff");
    const size = item.fontSize || doc.theme.baseSize;
    document.getElementById("block-size").value = size;
    document.getElementById("block-size-value").textContent = size + " pt";
    const lines = item.type === "list" || item.type === "timeline" || item.type === "closing";
    document.getElementById("add-line").hidden = !lines;
}

function updatePageGuides() {
    const sheet = document.getElementById("sheet");
    const guides = document.getElementById("guides");
    const status = document.getElementById("page-status");
    if (!sheet || !guides) return;
    const width = sheet.offsetWidth;
    if (!width) return;
    const pagePx = width * (297 / 210);
    const pages = Math.max(1, Math.ceil((sheet.scrollHeight - 1) / pagePx));
    guides.replaceChildren();
    for (let index = 1; index < pages; index++) {
        const line = document.createElement("div");
        line.className = "page-break";
        line.style.top = (index * pagePx) + "px";
        guides.appendChild(line);
    }
    if (status) {
        status.textContent = pages === 1 ? t("ui.pageOne") : t("ui.pageMany").replace("{n}", String(pages));
    }
}

function useTemplate(kind) {
    snapshot();
    doc = kind === "cv" ? emptyCv() : kind === "letter" ? emptyLetter() : showcase();
    selectedId = null;
    const name = document.getElementById("pdf-name");
    name.value = plainName();
    try { localStorage.setItem(STORAGE_NAME, name.value); } catch (error) { /* ignore */ }
    applyLanguage();
    render();
    save();
}

function addBlock(type) {
    snapshot();
    const item = createBlock(type);
    doc[addTarget].push(item);
    selectedId = item.id;
    render();
    save();
    const node = document.querySelector('.block[data-id="' + item.id + '"]');
    if (node) node.scrollIntoView({ block: "nearest" });
}

function duplicateBlock() {
    const item = selectedBlock();
    if (!item) return;
    snapshot();
    const copy = JSON.parse(JSON.stringify(item));
    copy.id = uid();
    const column = columnOf(item.id);
    const index = doc[column].findIndex(function (entry) { return entry.id === item.id; });
    doc[column].splice(index + 1, 0, copy);
    selectedId = copy.id;
    render();
    save();
}

function deleteBlock() {
    const item = selectedBlock();
    if (!item) return;
    snapshot();
    const column = columnOf(item.id);
    doc[column] = doc[column].filter(function (entry) { return entry.id !== item.id; });
    selectedId = null;
    render();
    save();
}

function addLine() {
    const item = selectedBlock();
    if (!item) return;
    snapshot();
    const text = escapeHtml(t("ph.text"));
    if (item.type === "closing") item.fields.paragraphs.push(text);
    else item.fields.items.push(text);
    render();
    save();
}

function stripSpans(fields) {
    Object.keys(fields).forEach(function (key) {
        if (typeof fields[key] === "string") {
            fields[key] = fields[key].replace(/<\/?span[^>]*>/gi, "");
        } else if (Array.isArray(fields[key])) {
            fields[key] = fields[key].map(function (entry) {
                return String(entry).replace(/<\/?span[^>]*>/gi, "");
            });
        }
    });
}

function resetStyle() {
    const item = selectedBlock();
    if (!item) return;
    snapshot();
    item.color = "";
    item.background = "";
    item.fontSize = 0;
    stripSpans(item.fields);
    render();
    save();
}

function applyTextStyle(style) {
    const selection = window.getSelection();
    if (!activeField || !selection || !selection.rangeCount || selection.isCollapsed) return false;
    if (!activeField.contains(selection.anchorNode)) return false;
    const range = selection.getRangeAt(0);
    const span = document.createElement("span");
    if (style.color) span.style.color = style.color;
    if (style.fontSize) span.style.fontSize = style.fontSize;
    try {
        range.surroundContents(span);
    } catch (error) {
        span.appendChild(range.extractContents());
        range.insertNode(span);
    }
    selection.removeAllRanges();
    activeField.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
}

function format(command) {
    document.execCommand("styleWithCSS", false, true);
    document.execCommand(command, false, null);
    if (activeField) activeField.dispatchEvent(new Event("input", { bubbles: true }));
}

function filePrefix() {
    return doc.kind === "letter" ? t("prefix.letter") : "CV";
}

function pdfFilename() {
    const safe = function (value) {
        return String(value || "")
            .replace(/\.pdf$/i, "")
            .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "")
            .trim()
            .replace(/\s+/g, "_")
            .replace(/_+/g, "_")
            .replace(/^_|_$/g, "");
    };
    const parts = [safe(filePrefix())];
    const name = safe(document.getElementById("pdf-name").value);
    if (name) parts.push(name);
    if (document.getElementById("pdf-timestamp").checked) {
        const now = new Date();
        const pad = function (value) { return String(value).padStart(2, "0"); };
        parts.push(now.getFullYear() + pad(now.getMonth() + 1) + pad(now.getDate()) + "-" + pad(now.getHours()) + pad(now.getMinutes()));
    }
    if (document.getElementById("pdf-final").checked) parts.push("final");
    return parts.filter(Boolean).join("_") + ".pdf";
}

function updateFilenamePreview() {
    const preview = document.getElementById("pdf-preview");
    if (preview && document.getElementById("pdf-name")) preview.textContent = pdfFilename();
}

function downloadBlob(bytes, filename) {
    const blob = new Blob([bytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
}

function showError(message) {
    const box = document.getElementById("error");
    if (!box) return;
    box.hidden = !message;
    box.textContent = message || "";
}

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
    return h("label", { class: "field" }, [
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

function mountTools() {
    const root = document.getElementById("tools");
    const nl = keepSelection(h("button", { type: "button", "data-lang": "nl", text: "NL" }));
    const en = keepSelection(h("button", { type: "button", "data-lang": "en", text: "EN" }));
    nl.addEventListener("click", function () { setLanguage("nl"); });
    en.addEventListener("click", function () { setLanguage("en"); });

    const download = keepSelection(h("button", { id: "download", class: "btn-primary", type: "button", i18n: "ui.download" }));
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

    const name = h("input", { id: "pdf-name", type: "text", autocomplete: "off" });
    name.addEventListener("input", function () {
        try { localStorage.setItem(STORAGE_NAME, name.value); } catch (error) { /* ignore */ }
        updateFilenamePreview();
    });
    const stamp = h("input", { id: "pdf-timestamp", type: "checkbox" });
    const finalBox = h("input", { id: "pdf-final", type: "checkbox" });
    stamp.addEventListener("change", updateFilenamePreview);
    finalBox.addEventListener("change", updateFilenamePreview);

    const undoBtn = keepSelection(h("button", { class: "btn", type: "button", i18n: "ui.undo" }));
    const redoBtn = keepSelection(h("button", { class: "btn", type: "button", i18n: "ui.redo" }));
    undoBtn.addEventListener("click", undo);
    redoBtn.addEventListener("click", redo);

    const showcaseBtn = keepSelection(h("button", { class: "btn", type: "button", i18n: "ui.showcase" }));
    const cvBtn = keepSelection(h("button", { class: "btn", type: "button", i18n: "ui.emptyCv" }));
    const letterBtn = keepSelection(h("button", { class: "btn", type: "button", i18n: "ui.emptyLetter" }));
    showcaseBtn.addEventListener("click", function () { useTemplate("showcase"); });
    cvBtn.addEventListener("click", function () { useTemplate("cv"); });
    letterBtn.addEventListener("click", function () { useTemplate("letter"); });

    const zoom = h("input", { id: "zoom", type: "range", min: "60", max: "130", value: "100" });
    zoom.addEventListener("input", function () {
        document.getElementById("stage").style.zoom = String(Number(zoom.value) / 100);
        document.getElementById("zoom-value").textContent = zoom.value + "%";
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

    const grid = h("div", { class: "block-grid" });
    BLOCK_TYPES.forEach(function (type) {
        const button = keepSelection(h("button", { class: "btn", type: "button", i18n: "type." + type }));
        button.addEventListener("click", function () { addBlock(type); });
        grid.appendChild(button);
    });

    const sidebarRadio = h("input", { type: "radio", name: "add-target", value: "sidebar" });
    const mainRadio = h("input", { type: "radio", name: "add-target", value: "main", checked: "checked" });
    sidebarRadio.addEventListener("change", function () { if (sidebarRadio.checked) addTarget = "sidebar"; });
    mainRadio.addEventListener("change", function () { if (mainRadio.checked) addTarget = "main"; });

    const bold = keepSelection(h("button", { class: "btn", type: "button", text: "B", i18nTitle: "ui.bold" }));
    const italic = keepSelection(h("button", { class: "btn", type: "button", text: "I", i18nTitle: "ui.italic" }));
    const underline = keepSelection(h("button", { class: "btn", type: "button", text: "U", i18nTitle: "ui.underline" }));
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

    root.append(
        h("div", { class: "row" }, [h("h1", { i18n: "ui.title" }), h("div", { class: "lang-switch" }, [nl, en])]),
        h("div", { class: "row" }, [download, importer, file]),
        h("p", { id: "error", class: "error", hidden: "hidden" }),
        h("label", { class: "field" }, [h("span", { i18n: "ui.fileName" }), name]),
        h("label", { class: "check" }, [stamp, h("span", { i18n: "ui.timestamp" })]),
        h("label", { class: "check" }, [finalBox, h("span", { i18n: "ui.final" })]),
        h("p", { id: "pdf-preview", class: "filename" }),
        h("p", { id: "page-status", class: "page-status" }),
        h("div", { class: "row" }, [undoBtn, redoBtn]),
        h("h2", { i18n: "ui.templates" }),
        h("div", { class: "row" }, [showcaseBtn, cvBtn, letterBtn]),
        h("label", { class: "field" }, [h("span", { i18n: "ui.zoom" }), zoom, h("span", { id: "zoom-value", text: "100%" })]),
        h("h2", { i18n: "ui.theme" }),
        colorField("theme-sidebar", "ui.sidebarColor"),
        colorField("theme-sidebar-text", "ui.sidebarText"),
        colorField("theme-accent", "ui.accent"),
        colorField("theme-page", "ui.page"),
        colorField("theme-text", "ui.text"),
        themeRange("theme-size", "baseSize", "ui.baseSize", "8", "14", "0.5"),
        themeRange("theme-width", "sidebarWidth", "ui.column", "24", "45", "1"),
        h("h2", { i18n: "ui.block" }),
        h("p", { id: "inspector-empty", class: "note", i18n: "ui.none" }),
        h("div", { id: "inspector", class: "stack", hidden: "hidden" }, [
            h("strong", { id: "inspector-type" }),
            h("div", { class: "row" }, [bold, italic, underline]),
            colorField("block-color", "ui.blockColor"),
            colorField("block-bg", "ui.blockBg"),
            h("label", { class: "field" }, [
                h("span", { i18n: "ui.blockSize" }),
                h("input", { id: "block-size", type: "range", min: "8", max: "28", step: "0.5" }),
                h("span", { id: "block-size-value" })
            ]),
            h("div", { class: "row" }, [addLineBtn, duplicateBtn, deleteBtn, resetBtn])
        ]),
        h("p", { class: "note", i18n: "ui.hint" }),
        h("h2", { i18n: "ui.add" }),
        h("div", { class: "row" }, [
            h("span", { class: "note", i18n: "ui.addTo" }),
            h("label", { class: "check" }, [sidebarRadio, h("span", { i18n: "ui.sidebar" })]),
            h("label", { class: "check" }, [mainRadio, h("span", { i18n: "ui.main" })])
        ]),
        grid
    );

    bindColor("theme-sidebar", function (value) { doc.theme.sidebar = value; applyTheme(); save(); });
    bindColor("theme-sidebar-text", function (value) { doc.theme.sidebarText = value; applyTheme(); save(); });
    bindColor("theme-accent", function (value) { doc.theme.accent = value; applyTheme(); save(); });
    bindColor("theme-page", function (value) { doc.theme.page = value; applyTheme(); save(); });
    bindColor("theme-text", function (value) { doc.theme.text = value; applyTheme(); save(); });

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
    blockSize.addEventListener("input", function () {
        document.getElementById("block-size-value").textContent = blockSize.value + " pt";
    });
    blockSize.addEventListener("change", function () {
        const value = Number(blockSize.value);
        if (applyTextStyle({ fontSize: value + "pt" })) return;
        const item = selectedBlock();
        if (!item) return;
        snapshot();
        item.fontSize = value;
        const node = document.querySelector('.block[data-id="' + item.id + '"]');
        if (node) node.style.fontSize = value + "pt";
        save();
    });
}

function applyLanguage() {
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-i18n]").forEach(function (node) {
        node.textContent = t(node.dataset.i18n);
    });
    document.querySelectorAll("[data-i18n-title]").forEach(function (node) {
        node.title = t(node.dataset.i18nTitle);
    });
    document.querySelectorAll(".lang-switch button").forEach(function (button) {
        button.classList.toggle("is-active", button.dataset.lang === lang);
    });
    document.title = t("ui.title");
    updateFilenamePreview();
}

function setLanguage(next) {
    lang = next === "en" ? "en" : "nl";
    doc.lang = lang;
    try { localStorage.setItem(STORAGE_LANG, lang); } catch (error) { /* ignore */ }
    applyLanguage();
    render();
    save();
}

function loadFontBytes(url) {
    return fetch(url).then(function (response) {
        if (!response.ok) throw new Error(t("ui.fontError") + " (" + response.status + ")");
        return response.arrayBuffer();
    }).then(function (buffer) { return new Uint8Array(buffer); });
}

function getFontConfig() {
    if (!fontConfigPromise) {
        fontConfigPromise = Promise.all([
            loadFontBytes(ROBOTO_FONTS.regular),
            loadFontBytes(ROBOTO_FONTS.bold),
            loadFontBytes(ROBOTO_FONTS.italic),
            loadFontBytes(ROBOTO_FONTS.boldItalic)
        ]).then(function (fonts) {
            const faces = [
                [fonts[0], 400, "normal"],
                [fonts[0], 500, "normal"],
                [fonts[1], 600, "normal"],
                [fonts[1], 700, "normal"],
                [fonts[1], 800, "normal"],
                [fonts[2], 400, "italic"],
                [fonts[2], 500, "italic"],
                [fonts[3], 600, "italic"],
                [fonts[3], 700, "italic"],
                [fonts[3], 800, "italic"]
            ];
            return faces.map(function (face) {
                return { fontFamily: "Roboto", fontBytes: face[0], fontWeight: face[1], fontStyle: face[2] };
            });
        });
    }
    return fontConfigPromise;
}

async function buildPdfBytes() {
    if (!window.dompdf || typeof dompdf.renderToBytes !== "function" || !window.PDFLib) {
        throw new Error(t("ui.libError"));
    }
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    const stage = document.getElementById("stage");
    const previousZoom = stage.style.zoom;
    stage.style.zoom = "1";
    document.body.classList.add("pdf-exporting");
    try {
        await document.fonts.load("16px Roboto");
        await document.fonts.load("700 16px Roboto");
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
            description: "Block editor document",
            creationDate: new Date(),
            modificationDate: new Date()
        });
        return await pdf.save();
    } finally {
        stage.style.zoom = previousZoom;
        document.body.classList.remove("pdf-exporting");
    }
}

async function downloadPdf() {
    const button = document.getElementById("download");
    button.disabled = true;
    button.textContent = t("ui.working");
    showError("");
    try {
        downloadBlob(await buildPdfBytes(), pdfFilename());
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
    const name = document.getElementById("pdf-name");
    name.value = plainName();
    try { localStorage.setItem(STORAGE_NAME, name.value); } catch (error) { /* ignore */ }
    showError("");
    applyLanguage();
    render();
    save();
}

function savedLang() {
    try { return localStorage.getItem(STORAGE_LANG) === "en" ? "en" : "nl"; } catch (error) { return "nl"; }
}

function boot() {
    try { document.execCommand("styleWithCSS", false, true); } catch (error) { /* ignore */ }
    lang = savedLang();
    try {
        const raw = localStorage.getItem(STORAGE_DOC);
        doc = raw ? JSON.parse(raw) : showcase();
    } catch (error) {
        doc = showcase();
    }
    if (!doc || doc.version !== 1 || !Array.isArray(doc.sidebar) || !Array.isArray(doc.main)) doc = showcase();
    normalize(doc);
    if (doc.lang === "en" || doc.lang === "nl") lang = doc.lang;
    mountTools();
    const name = document.getElementById("pdf-name");
    let storedName = "";
    try { storedName = localStorage.getItem(STORAGE_NAME) || ""; } catch (error) { storedName = ""; }
    name.value = storedName || plainName();
    applyLanguage();
    render();
    document.addEventListener("focusout", function (event) {
        if (event.target && event.target.isContentEditable) snapArmed = false;
    });
    document.addEventListener("keydown", function (event) {
        if (event.target && event.target.isContentEditable) return;
        if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "z") return;
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
    });
    window.addEventListener("resize", updatePageGuides);
}

boot();
