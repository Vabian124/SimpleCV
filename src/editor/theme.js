/* CC0-1.0 — https://creativecommons.org/publicdomain/zero/1.0/ */
/* Page colours, contrast, and the palette preview. */

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

function applyTheme() {
    const sheet = document.getElementById("sheet");
    const theme = doc.theme;
    [sheet, document.getElementById("library")].forEach(function (node) {
        if (!node) return;
        node.style.setProperty("--sidebar", theme.sidebar);
        node.style.setProperty("--sidebar-text", theme.sidebarText);
        node.style.setProperty("--accent", theme.accent);
        node.style.setProperty("--accent-light", theme.accentLight || theme.accent);
        node.style.setProperty("--page", theme.page);
        node.style.setProperty("--text", theme.text);
        node.style.setProperty("--skill-fill", mixHex(theme.sidebar, "#ffffff", 0.1));
        node.style.setProperty("--skill-fill-main", mixHex(theme.page, theme.accent, 0.1));
        node.style.setProperty("--intro-fill", mixHex(theme.page, theme.accent, 0.12));
        node.style.setProperty("--rule", mixHex(theme.page, "#64748b", 0.45));
        node.style.setProperty("--rule-side", mixHex(theme.sidebar, "#ffffff", 0.28));
    });
    sheet.dataset.kind = doc.kind === "letter" ? "letter" : "cv";
    sheet.style.setProperty("--base-size", theme.baseSize + "pt");
    sheet.style.setProperty("--sidebar-width", theme.sidebarWidth + "%");
    sheet.style.fontFamily = fontChoice().family + ', "Segoe UI", sans-serif';
    const library = document.getElementById("library");
    if (library) library.style.fontFamily = sheet.style.fontFamily;
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
    const size = document.getElementById("theme-size");
    const width = document.getElementById("theme-width");
    if (size) size.value = theme.baseSize;
    if (width) width.value = theme.sidebarWidth;
    const sizeValue = document.getElementById("theme-size-value");
    const widthValue = document.getElementById("theme-width-value");
    if (sizeValue) sizeValue.textContent = theme.baseSize + " pt";
    if (widthValue) widthValue.textContent = theme.sidebarWidth + "%";
    const font = document.getElementById("theme-font");
    if (font) font.value = theme.font || "roboto";
    paintContrastWarning();
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
