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

function px(value) {
    return value * 0.75;
}

function mixHex(base, tint, amount) {
    const read = function (hex) {
        const h = String(hex || "").replace("#", "");
        if (!/^[0-9a-fA-F]{6}$/.test(h)) return [255, 255, 255];
        return [0, 2, 4].map(function (index) { return parseInt(h.slice(index, index + 2), 16); });
    };
    const from = read(base);
    const to = read(tint);
    return "#" + from.map(function (channel, index) {
        const mixed = Math.round(channel + (to[index] - channel) * amount).toString(16);
        return mixed.length === 1 ? "0" + mixed : mixed;
    }).join("");
}

function gap(height) {
    return { h: Math.max(0, height), draw: function () {} };
}

function pushText(out, value, font, size, color, width, leading) {
    const lines = wrap(font, value, size, width);
    if (!lines.join("").trim()) return;
    const step = size * (leading || 1.28);
    lines.forEach(function (line) {
        out.push({
            h: step,
            draw: function (page, x, top) {
                if (!line) return;
                page.drawText(line, { x: x, y: top - size * 0.8, size: size, font: font, color: color });
            }
        });
    });
}

function photoBox(item, width) {
    const parts = String(item.fields && item.fields.aspect || "3 / 4").split("/");
    const across = Number(parts[0]) > 0 ? Number(parts[0]) : 3;
    const down = Number(parts[1]) > 0 ? Number(parts[1]) : 4;
    const saved = Number(item.fields && item.fields.width);
    const portion = saved >= 36 && saved <= 100 ? saved : 92;
    const box = width * portion / 100;
    return { w: box, h: box * down / across, filled: Boolean(item.fields && item.fields.src) };
}

function bulletPiece(value, font, size, color, width) {
    const indent = px(12);
    const lines = wrap(font, value, size, width - indent);
    const step = size * 1.32;
    return {
        h: Math.max(step, lines.length * step),
        draw: function (page, x, top) {
            page.drawEllipse({
                x: x + 1.6,
                y: top - size * 0.48,
                xScale: 1.35,
                yScale: 1.35,
                color: color
            });
            lines.forEach(function (line, index) {
                if (!line) return;
                page.drawText(line, {
                    x: x + indent,
                    y: top - size * 0.8 - index * step,
                    size: size,
                    font: font,
                    color: color
                });
            });
        }
    };
}

function blocksFor(items, width, ctx) {
    const out = [];
    const letter = ctx.kind === "letter";
    const base = ctx.base;
    const blockGap = px(letter ? 5 : 8);
    items.forEach(function (item, index) {
        const fields = item.fields || {};
        const text = function (html) { return ctx.plain(html || ""); };
        const ink = item.color ? rgbOf(item.color, "#334155") : ctx.ink;
        const size = Number(item.fontSize) >= 8 && Number(item.fontSize) <= 28 ? Number(item.fontSize) : base;
        if (item.type === "photo") {
            const box = photoBox(item, width);
            const fill = rgbOf("#d6dee8", "#d6dee8");
            const mark = rgbOf("#94a3b8", "#94a3b8");
            out.push({
                h: box.h,
                draw: function (page, x, top) {
                    const rect = { x: x, y: top - box.h, width: box.w, height: box.h };
                    if (box.filled) rect.color = fill;
                    else {
                        rect.borderColor = ink;
                        rect.borderWidth = 1;
                    }
                    page.drawRectangle(rect);
                    if (!box.filled) return;
                    page.drawEllipse({
                        x: x + box.w * 0.5,
                        y: top - box.h * 0.37,
                        xScale: box.w * 0.19,
                        yScale: box.w * 0.19,
                        color: mark
                    });
                    page.drawEllipse({
                        x: x + box.w * 0.5,
                        y: top - box.h * 0.84,
                        xScale: box.w * 0.31,
                        yScale: box.h * 0.18,
                        color: mark
                    });
                }
            });
            pushText(out, text(fields.caption), ctx.fonts.regular, size * 0.92, ink, box.w, 1.3);
            out.push(gap(blockGap));
        } else if (item.type === "name") {
            pushText(out, text(fields.html).toUpperCase(), ctx.fonts.bold, letter ? 20 : 22, ink, width, 1.08);
            out.push(gap(px(letter ? 4 : 6)));
        } else if (item.type === "role") {
            pushText(out, text(fields.html).toUpperCase(), ctx.fonts.bold, base, ctx.side ? ctx.accentLight : ctx.accent, width, 1.2);
            out.push(gap(px(letter ? 6 : 8)));
        } else if (item.type === "heading") {
            const heading = fields.key ? ctx.label(fields.key) : text(fields.html);
            const labelStyle = fields.style === "label";
            if (heading) {
                if (!labelStyle && index > 0) out.push(gap(px(letter && ctx.side ? 8 : 10)));
                pushText(out, heading.toUpperCase(), ctx.fonts.bold, labelStyle ? base * 0.95 : base * 1.05, labelStyle ? ctx.accent : ink, width, 1.15);
                if (!labelStyle) {
                    out.push({
                        h: px(5),
                        draw: function (page, x, top) {
                            page.drawLine({
                                start: { x: x, y: top - px(2) },
                                end: { x: x + width, y: top - px(2) },
                                thickness: 0.7,
                                color: ctx.rule
                            });
                        }
                    });
                }
                out.push(gap(px(labelStyle ? 2 : 3)));
            }
        } else if (item.type === "contact") {
            const rowLabel = fields.labelKey && fields.labelKey !== "custom" ? ctx.label("doc." + fields.labelKey) : text(fields.label);
            pushText(out, rowLabel.toUpperCase(), ctx.fonts.bold, base * 0.78, ctx.side ? ctx.accentLight : ctx.accent, width, 1.15);
            pushText(out, text(fields.html), ctx.fonts.regular, base * 0.92, ink, width, 1.25);
            out.push(gap(px(letter ? 3 : 5)));
        } else if (item.type === "skill") {
            const point = size * 0.92;
            const lines = wrap(ctx.fonts.regular, text(fields.html), point, width - px(16));
            const step = point * 1.25;
            const h = px(letter ? 6 : 10) + lines.length * step;
            const fill = item.background ? rgbOf(item.background, "#243044") : ctx.skillFill;
            out.push({
                h: h,
                draw: function (page, x, top) {
                    page.drawRectangle({ x: x, y: top - h, width: width, height: h, color: fill });
                    page.drawRectangle({ x: x, y: top - h, width: px(3), height: h, color: ctx.side ? ctx.accentLight : ctx.accent });
                    lines.forEach(function (line, lineIndex) {
                        if (!line) return;
                        page.drawText(line, {
                            x: x + px(8),
                            y: top - px(3) - point * 0.8 - lineIndex * step,
                            size: point,
                            font: ctx.fonts.regular,
                            color: ink
                        });
                    });
                }
            });
            out.push(gap(px(letter ? 3 : 4)));
        } else if (item.type === "competence" || item.type === "project") {
            pushText(out, text(fields.title), ctx.fonts.bold, size * 0.92, ink, width, 1.25);
            pushText(out, text(fields.body), ctx.fonts.regular, size * 0.88, ink, width, 1.3);
            out.push(gap(px(letter ? 4 : 6)));
        } else if (item.type === "letterhead") {
            const title = text(fields.title).toUpperCase();
            const date = text(fields.date);
            const point = 16;
            const titleLines = wrap(ctx.fonts.bold, title, point, width * 0.62);
            const row = Math.max(titleLines.length * point * 1.05, date ? point : point * 0.4);
            out.push({
                h: row + px(6),
                draw: function (page, x, top) {
                    titleLines.forEach(function (line, lineIndex) {
                        if (!line) return;
                        page.drawText(line, {
                            x: x,
                            y: top - point * 0.8 - lineIndex * point * 1.05,
                            size: point,
                            font: ctx.fonts.bold,
                            color: ctx.accent
                        });
                    });
                    if (date) {
                        const dateSize = base * 0.92;
                        const shown = winAnsi(date);
                        const dateWidth = ctx.fonts.bold.widthOfTextAtSize(shown, dateSize);
                        page.drawText(shown, {
                            x: x + width - dateWidth,
                            y: top - point * 0.72,
                            size: dateSize,
                            font: ctx.fonts.bold,
                            color: rgbOf("#4b5563", "#4b5563")
                        });
                    }
                    page.drawLine({
                        start: { x: x, y: top - row - px(2) },
                        end: { x: x + width, y: top - row - px(2) },
                        thickness: 1.4,
                        color: ctx.accent
                    });
                }
            });
            pushText(out, text(fields.to), ctx.fonts.regular, base * 0.92, ink, width, 1.3);
            out.push(gap(px(3)));
            pushText(out, text(fields.subject), ctx.fonts.bold, base, ctx.accent, width, 1.25);
            out.push(gap(px(6)));
        } else if (item.type === "intro") {
            const label = ctx.label("doc.intro");
            const body = text(fields.html);
            const pad = px(6);
            const bar = px(4);
            const inner = width - pad * 2 - bar;
            const labelSize = base * 0.85;
            const bodyLines = wrap(ctx.fonts.regular, body, size, inner);
            const bodyStep = size * 1.32;
            const h = pad * 2 + labelSize * 1.25 + bodyLines.length * bodyStep;
            out.push({
                h: h,
                draw: function (page, x, top) {
                    page.drawRectangle({ x: x, y: top - h, width: width, height: h, color: ctx.introFill });
                    page.drawRectangle({ x: x, y: top - h, width: bar, height: h, color: ctx.accent });
                    if (label) {
                        page.drawText(winAnsi(label), {
                            x: x + bar + pad,
                            y: top - pad - labelSize * 0.8,
                            size: labelSize,
                            font: ctx.fonts.bold,
                            color: ink
                        });
                    }
                    bodyLines.forEach(function (line, lineIndex) {
                        if (!line) return;
                        page.drawText(line, {
                            x: x + bar + pad,
                            y: top - pad - labelSize * 1.35 - size * 0.8 - lineIndex * bodyStep,
                            size: size,
                            font: ctx.fonts.regular,
                            color: ink
                        });
                    });
                }
            });
            out.push(gap(px(letter ? 4 : 8)));
        } else if (item.type === "timeline") {
            const title = text(fields.title);
            const date = text(fields.date);
            const titleSize = size;
            const dateSize = size * 0.85;
            if (title || date) {
                const titleWidth = date ? width * 0.62 : width;
                const titleLines = wrap(ctx.fonts.bold, title, titleSize, titleWidth);
                const step = titleSize * 1.2;
                out.push({
                    h: Math.max(titleLines.length, 1) * step,
                    draw: function (page, x, top) {
                        titleLines.forEach(function (line, lineIndex) {
                            if (!line) return;
                            page.drawText(line, {
                                x: x,
                                y: top - titleSize * 0.8 - lineIndex * step,
                                size: titleSize,
                                font: ctx.fonts.bold,
                                color: ink
                            });
                        });
                        if (!date) return;
                        const shown = winAnsi(date);
                        const dateWidth = ctx.fonts.bold.widthOfTextAtSize(shown, dateSize);
                        page.drawText(shown, {
                            x: x + width - dateWidth,
                            y: top - dateSize * 0.8,
                            size: dateSize,
                            font: ctx.fonts.bold,
                            color: ctx.dateInk
                        });
                    }
                });
            }
            pushText(out, text(fields.org), ctx.fonts.bold, size * 0.92, ctx.accent, width, 1.25);
            (fields.items || []).forEach(function (itemText) {
                const line = text(itemText);
                if (line) out.push(bulletPiece(line, ctx.fonts.regular, size * 0.92, ink, width));
            });
            out.push(gap(px(letter ? 4 : 7)));
        } else if (item.type === "list") {
            (fields.items || []).forEach(function (itemText) {
                const line = text(itemText);
                if (line) out.push(bulletPiece(line, ctx.fonts.regular, size, ink, width));
            });
            out.push(gap(px(4)));
        } else if (item.type === "paragraph") {
            pushText(out, text(fields.html), ctx.fonts.regular, size, ink, width, letter ? 1.32 : 1.4);
            out.push(gap(px(letter ? 4 : 6)));
        } else if (item.type === "closing") {
            (fields.paragraphs || []).forEach(function (paragraph) {
                pushText(out, text(paragraph), ctx.fonts.bold, size, ctx.accent, width, 1.32);
            });
            out.push(gap(px(6)));
        } else if (item.type === "signature") {
            pushText(out, text(fields.html), ctx.fonts.bold, Math.max(size, 12), ctx.accent, width, 1.2);
            out.push(gap(px(4)));
        } else if (item.type === "spacer") {
            out.push(gap(Math.max(4, Math.min(48, Number(fields.size) || 12)) * 0.75));
        }
    });
    return out;
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
    const letter = doc.kind === "letter";
    const sideWidth = Math.max(140, Math.min(260, pageWidth * (Number(theme.sidebarWidth) || 33) / 100));
    const sidePad = px(letter ? 14 : 22);
    const mainPad = px(letter ? 16 : 26);
    const topPad = px(letter ? 18 : 36);
    const base = Number(theme.baseSize) >= 8 && Number(theme.baseSize) <= 14 ? Number(theme.baseSize) : 9.5;
    const accent = rgbOf(theme.accent, "#0284c7");
    const shared = {
        fonts: fonts,
        kind: letter ? "letter" : "cv",
        label: loaded.label,
        plain: loaded.plain,
        base: base,
        accent: accent,
        accentLight: rgbOf(theme.accentLight || theme.accent, "#38bdf8"),
        introFill: rgbOf(mixHex(theme.page || "#ffffff", theme.accent || "#0284c7", 0.12), "#e8f4fb")
    };
    const sidePieces = blocksFor(doc.sidebar, sideWidth - sidePad * 2, Object.assign({}, shared, {
        side: true,
        ink: rgbOf(theme.sidebarText, "#f8fafc"),
        skillFill: rgbOf(mixHex(theme.sidebar || "#1e293b", "#ffffff", 0.1), "#243044"),
        rule: rgbOf(mixHex(theme.sidebar || "#1e293b", "#ffffff", 0.28), "#3d524c"),
        dateInk: rgbOf(mixHex(theme.sidebarText || "#f8fafc", theme.sidebar || "#1e293b", 0.35), "#cbd5e1")
    }));
    const mainPieces = blocksFor(doc.main, pageWidth - sideWidth - mainPad - px(letter ? 18 : 28), Object.assign({}, shared, {
        side: false,
        ink: rgbOf(theme.text, "#334155"),
        skillFill: rgbOf(mixHex(theme.page || "#ffffff", theme.accent || "#0284c7", 0.1), "#e0f2fe"),
        rule: rgbOf(mixHex(theme.page || "#ffffff", "#64748b", 0.45), "#d5d5d5"),
        dateInk: rgbOf("#64748b", "#64748b")
    }));
    let page = null;
    let sideAt = 0;
    let mainAt = 0;
    let sideY = 0;
    let mainY = 0;
    let fresh = false;
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
        sideY = pageHeight - topPad;
        mainY = sideY;
        fresh = true;
    }
    newPage();
    while (sideAt < sidePieces.length || mainAt < mainPieces.length) {
        let moved = false;
        const side = sidePieces[sideAt];
        const main = mainPieces[mainAt];
        if (side && (sideY - side.h >= 28 || fresh)) {
            side.draw(page, sidePad, sideY);
            sideY -= side.h;
            sideAt += 1;
            moved = true;
            fresh = false;
        }
        if (main && (mainY - main.h >= 28 || (fresh && sideAt >= sidePieces.length))) {
            main.draw(page, sideWidth + mainPad, mainY);
            mainY -= main.h;
            mainAt += 1;
            moved = true;
            fresh = false;
        }
        if (!moved) newPage();
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
