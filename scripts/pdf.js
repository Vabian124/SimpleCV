/* CC0-1.0 — https://creativecommons.org/publicdomain/zero/1.0/ */
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const PDFLib = require(path.join(__dirname, "..", "vendor", "pdf-lib.min.js"));

const root = path.join(__dirname, "..");
const pageWidth = 595.28;
const pageHeight = 841.89;

function decode(value) {
    return String(value).replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|nbsp);/gi, function (_, ent) {
        const name = ent.toLowerCase();
        if (name === "amp") return "&";
        if (name === "lt") return "<";
        if (name === "gt") return ">";
        if (name === "nbsp") return "\u00a0";
        if (name.charAt(0) === "#") {
            const code = name.charAt(1) === "x" ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10);
            return String.fromCharCode(code);
        }
        return _;
    });
}

function Holder() {
    this.nodes = [];
}

Object.defineProperty(Holder.prototype, "innerHTML", {
    set: function (html) {
        const text = String(html || "");
        const nodes = [];
        const re = /<br\s*\/?>/gi;
        let last = 0;
        let match;
        while ((match = re.exec(text))) {
            if (match.index > last) nodes.push({ type: "text", value: decode(text.slice(last, match.index)) });
            nodes.push({ type: "br" });
            last = match.index + match[0].length;
        }
        if (last < text.length) nodes.push({ type: "text", value: decode(text.slice(last)) });
        this.nodes = nodes;
    },
    get: function () { return ""; }
});

Object.defineProperty(Holder.prototype, "textContent", {
    get: function () {
        return this.nodes.map(function (node) {
            return node.type === "text" ? node.value : "";
        }).join("");
    },
    set: function (value) {
        this.nodes = [{ type: "text", value: String(value || "") }];
    }
});

Holder.prototype.querySelectorAll = function (selector) {
    const self = this;
    if (selector !== "br") return [];
    return this.nodes.filter(function (node) { return node.type === "br"; }).map(function (node) {
        return {
            replaceWith: function (value) {
                const index = self.nodes.indexOf(node);
                if (index >= 0) self.nodes.splice(index, 1, { type: "text", value: String(value) });
            }
        };
    });
};

function editorContext() {
    const context = {
        console: console,
        document: {
            body: { dataset: { phase: "setup" } },
            createElement: function () { return new Holder(); },
            getElementById: function (id) {
                if (id === "pdf-name") return { value: "" };
                return null;
            },
            querySelectorAll: function () { return []; }
        },
        localStorage: { setItem: function () {}, getItem: function () { return null; } },
        seq: 0,
        past: [],
        future: [],
        doc: null,
        lang: "en",
        selectedId: null,
        STORAGE_NAME: "name",
        STORAGE_DOC: "doc",
        STORAGE_LANG: "lang",
        documentLive: false,
        saveOk: true,
        snapArmed: false,
        showError: function () {},
        applyLanguage: function () {},
        render: function () {},
        importPhotoAddress: function () {},
        showToast: function () {},
        updateFilenamePreview: function () {},
        refreshIdentity: function () {},
        markSaved: function () {},
        photoWidth: function (item) {
            const saved = Number(item.fields && item.fields.width);
            if (saved >= 36 && saved <= 100) return saved;
            return 92;
        }
    };
    vm.createContext(context);
    vm.runInContext(
        fs.readFileSync(path.join(root, "src", "editor", "i18n-nl.js"), "utf8") + "\n" +
        fs.readFileSync(path.join(root, "src", "editor", "i18n-en.js"), "utf8") + "\n" +
        fs.readFileSync(path.join(root, "src", "editor", "i18n.js"), "utf8") + "\n" +
        fs.readFileSync(path.join(root, "src", "editor", "templates.js"), "utf8") + "\n" +
        fs.readFileSync(path.join(root, "src", "editor", "history.js"), "utf8") + "\n" +
        fs.readFileSync(path.join(root, "src", "editor", "marked.js"), "utf8") + "\n" +
        "this.applyMarked = applyMarked;\nthis.t = t;\nthis.markedText = markedText;\n",
        context
    );
    return context;
}

function loadDocument(text, uiLang) {
    const context = editorContext();
    context.lang = uiLang === "nl" ? "nl" : "en";
    context.doc = {
        version: 1,
        lang: context.lang,
        kind: "cv",
        theme: {
            sidebar: "#1e293b",
            sidebarText: "#f8fafc",
            accent: "#0284c7",
            accentLight: "#38bdf8",
            page: "#ffffff",
            text: "#334155",
            baseSize: 9.5,
            sidebarWidth: 33,
            font: "roboto"
        },
        sidebar: [],
        main: []
    };
    context.applyMarked(text);
    return { doc: context.doc, label: context.t, plain: context.markedText };
}

function rgbOf(hex, fallback) {
    const value = /^#[0-9a-fA-F]{6}$/.test(hex || "") ? hex : fallback;
    const n = parseInt(value.slice(1), 16);
    return PDFLib.rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

function winAnsi(text) {
    return Array.from(String(text || "")
        .replace(/\u2013|\u2014/g, "-")
        .replace(/\u2018|\u2019/g, "'")
        .replace(/\u201c|\u201d/g, "\"")
        .replace(/\u00a0/g, " "))
        .filter(function (ch) { return ch.charCodeAt(0) <= 255; })
        .join("");
}

function wrap(font, text, size, width) {
    const lines = [];
    winAnsi(text).split(/\n/).forEach(function (paragraph) {
        const words = paragraph.split(/\s+/).filter(Boolean);
        if (!words.length) {
            lines.push("");
            return;
        }
        let line = "";
        words.forEach(function (word) {
            const next = line ? line + " " + word : word;
            if (font.widthOfTextAtSize(next, size) <= width) line = next;
            else {
                if (line) lines.push(line);
                line = word;
            }
        });
        if (line) lines.push(line);
    });
    return lines.length ? lines : [""];
}

function runsFor(item, width, fonts, label, plain, color, accent) {
    const size = Number(item.fontSize) >= 8 && Number(item.fontSize) <= 28 ? Number(item.fontSize) : 0;
    const bodySize = size || 9.5;
    const text = function (html) { return plain(html || ""); };
    const add = function (value, font, paint, point) {
        wrap(font, value, point, width).forEach(function (line) {
            runs.push({ text: line, font: font, size: point, color: paint });
        });
    };
    const runs = [];
    const fields = item.fields || {};
    if (item.type === "name") add(text(fields.html), fonts.bold, color, 16);
    else if (item.type === "role") add(text(fields.html), fonts.bold, color, 11);
    else if (item.type === "heading") {
        const heading = fields.key ? label(fields.key) : text(fields.html);
        if (heading) add(heading, fonts.bold, accent || color, 10);
    } else if (item.type === "contact") {
        const rowLabel = fields.labelKey && fields.labelKey !== "custom" ? label("doc." + fields.labelKey) : text(fields.label);
        const value = text(fields.html);
        if (rowLabel || value) add((rowLabel ? rowLabel + "  " : "") + value, fonts.regular, color, bodySize);
    } else if (item.type === "skill") add(text(fields.html), fonts.regular, color, bodySize);
    else if (item.type === "competence" || item.type === "project") {
        const title = text(fields.title);
        const body = text(fields.body);
        if (title) add(title, fonts.bold, color, bodySize);
        if (body) add(body, fonts.regular, color, bodySize);
    } else if (item.type === "letterhead") {
        if (text(fields.title)) add(text(fields.title), fonts.bold, accent || color, 12);
        if (text(fields.date)) add(text(fields.date), fonts.regular, color, bodySize);
        if (text(fields.to)) add(text(fields.to), fonts.regular, color, bodySize);
        if (text(fields.subject)) add(text(fields.subject), fonts.bold, color, bodySize);
    } else if (item.type === "intro" || item.type === "paragraph") add(text(fields.html), fonts.regular, color, bodySize);
    else if (item.type === "timeline") {
        if (text(fields.title)) add(text(fields.title), fonts.bold, color, bodySize + 0.5);
        const when = [text(fields.date), text(fields.org)].filter(Boolean).join("  ");
        if (when) add(when, fonts.regular, color, bodySize);
        (fields.items || []).forEach(function (itemText) {
            const line = text(itemText);
            if (line) add(line, fonts.regular, color, bodySize);
        });
    } else if (item.type === "list") {
        (fields.items || []).forEach(function (itemText) {
            const line = text(itemText);
            if (line) add(line, fonts.regular, color, bodySize);
        });
    } else if (item.type === "closing") {
        (fields.paragraphs || []).forEach(function (paragraph) {
            if (text(paragraph)) add(text(paragraph), fonts.regular, color, bodySize);
        });
    } else if (item.type === "signature") add(text(fields.html), fonts.bold, color, 12);
    else if (item.type === "spacer") runs.push({ text: "", font: fonts.regular, size: Math.max(4, Math.min(24, Number(fields.size) || 12)), color: color });
    return runs;
}

async function renderMarkedPdf(text, uiLang) {
    const loaded = loadDocument(text, uiLang);
    const doc = loaded.doc;
    const theme = doc.theme || {};
    const pdf = await PDFLib.PDFDocument.create();
    const fonts = {
        regular: await pdf.embedFont(PDFLib.StandardFonts.Helvetica),
        bold: await pdf.embedFont(PDFLib.StandardFonts.HelveticaBold)
    };
    const sideWidth = Math.max(140, Math.min(260, pageWidth * (Number(theme.sidebarWidth) || 33) / 100));
    const sideInk = rgbOf(theme.sidebarText, "#f8fafc");
    const mainInk = rgbOf(theme.text, "#334155");
    const accent = rgbOf(theme.accent, "#0284c7");
    const sideRuns = [];
    const mainRuns = [];
    doc.sidebar.forEach(function (item) {
        if (item.type === "photo") return;
        runsFor(item, sideWidth - 28, fonts, loaded.label, loaded.plain, sideInk, sideInk).forEach(function (run) {
            sideRuns.push(run);
        });
    });
    doc.main.forEach(function (item) {
        if (item.type === "photo") return;
        runsFor(item, pageWidth - sideWidth - 36, fonts, loaded.label, loaded.plain, mainInk, accent).forEach(function (run) {
            mainRuns.push(run);
        });
    });
    let page = null;
    let sideAt = 0;
    let mainAt = 0;
    function newPage() {
        page = pdf.addPage([pageWidth, pageHeight]);
        page.drawRectangle({
            x: 0,
            y: 0,
            width: sideWidth,
            height: pageHeight,
            color: rgbOf(theme.sidebar, "#1e293b")
        });
        page.drawRectangle({
            x: sideWidth,
            y: 0,
            width: pageWidth - sideWidth,
            height: pageHeight,
            color: rgbOf(theme.page, "#ffffff")
        });
        return pageHeight - 36;
    }
    let y = newPage();
    while (sideAt < sideRuns.length || mainAt < mainRuns.length) {
        const side = sideRuns[sideAt];
        const main = mainRuns[mainAt];
        const need = Math.max(side ? side.size + 4 : 0, main ? main.size + 4 : 0, 12);
        if (y - need < 28) {
            y = newPage();
            continue;
        }
        if (side) {
            if (side.text) {
                page.drawText(side.text, { x: 14, y: y - side.size, size: side.size, font: side.font, color: side.color });
            }
            sideAt += 1;
        }
        if (main) {
            if (main.text) {
                page.drawText(main.text, {
                    x: sideWidth + 16,
                    y: y - main.size,
                    size: main.size,
                    font: main.font,
                    color: main.color
                });
            }
            mainAt += 1;
        }
        y -= need;
    }
    const person = doc.sidebar.concat(doc.main).find(function (item) { return item.type === "name"; });
    const title = person ? loaded.plain(person.fields.html).replace(/\n/g, " ") : "LibreCV";
    pdf.setTitle(title);
    pdf.setCreator("LibreCV");
    await pdf.attach(new TextEncoder().encode(JSON.stringify(doc)), "document.json", {
        mimeType: "application/json",
        description: "LibreCV document",
        creationDate: new Date(),
        modificationDate: new Date()
    });
    return pdf.save();
}

function langOf(file) {
    const base = path.basename(file);
    if (base.indexOf("softwareontwikkelaar") === 0 || base.indexOf("verpleegkundige") === 0) return "nl";
    return "en";
}

function resolveInput(value) {
    if (!value) return "";
    const direct = path.resolve(value);
    if (fs.existsSync(direct) && fs.statSync(direct).isFile()) return direct;
    const named = path.join(root, "catalog", value.replace(/\.txt$/i, "") + ".txt");
    if (fs.existsSync(named)) return named;
    return "";
}

function parseArgs(argv) {
    const out = { input: "", output: "", lang: "" };
    for (let i = 2; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === "-o" || arg === "--output") {
            out.output = argv[i + 1] || "";
            i += 1;
        } else if (arg === "--lang") {
            out.lang = argv[i + 1] || "";
            i += 1;
        } else if (!out.input) out.input = arg;
        else {
            out.input = "";
            break;
        }
    }
    return out;
}

async function cli() {
    const args = parseArgs(process.argv);
    const input = resolveInput(args.input);
    if (!input || (args.lang && args.lang !== "en" && args.lang !== "nl")) {
        process.stderr.write("Usage: node scripts/pdf.js <file-or-id> [-o out.pdf] [--lang en|nl]\n");
        process.exit(1);
    }
    const output = path.resolve(args.output || path.basename(input).replace(/\.txt$/i, "") + ".pdf");
    const bytes = await renderMarkedPdf(fs.readFileSync(input, "utf8"), args.lang || langOf(input));
    fs.writeFileSync(output, bytes);
    process.stdout.write(output + "\n");
}

if (require.main === module) {
    cli().catch(function (error) {
        process.stderr.write((error && error.stack ? error.stack : String(error)) + "\n");
        process.exit(1);
    });
}

module.exports = { renderMarkedPdf, resolveInput, langOf };
