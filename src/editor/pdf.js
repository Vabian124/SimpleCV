/* CC0-1.0 — https://creativecommons.org/publicdomain/zero/1.0/ */
/* File name, lazy PDF libraries, download, and import. */

function filePrefix() {
    return doc.kind === "letter" ? t("prefix.letter") : "CV";
}

function pdfFilename() {
    const safe = function (value) {
        return Array.from(String(value || "").replace(/\.pdf$/i, "")).filter(function (char) {
            return char.charCodeAt(0) >= 32 && "<>:\"/\\|?*".indexOf(char) === -1;
        }).join("")
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
    if (box) {
        box.hidden = !message;
        box.textContent = message || "";
    }
    if (message) showToast(message, "error");
    else showToast("");
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
    currentSaveId = "";
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
