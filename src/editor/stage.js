/* CC0-1.0 — https://creativecommons.org/publicdomain/zero/1.0/ */
/* Render the page, selection, zoom, and text formatting. */

function render() {
    const sidebar = document.getElementById("col-sidebar");
    const main = document.getElementById("col-main");
    sidebar.replaceChildren();
    main.replaceChildren();
    doc.sidebar.forEach(function (item) { sidebar.appendChild(renderBlock(item)); });
    doc.main.forEach(function (item) { main.appendChild(renderBlock(item)); });
    if (!doc.sidebar.length) sidebar.appendChild(columnHint());
    if (!doc.main.length) main.appendChild(columnHint());
    applyTheme();
    syncThemeInputs();
    syncTemplateState();
    if (selectedId && selectedBlock()) select(selectedId);
    else {
        selectedId = null;
        updateInspector();
    }
    fillBlockGrid();
    syncSpellLocale();
    requestAnimationFrame(updatePageGuides);
}

function columnHint() {
    const hint = document.createElement("p");
    hint.className = "column-hint";
    hint.textContent = t("ui.emptyColumn");
    return hint;
}

function blurField() {
    const active = document.activeElement;
    if (active && active !== document.body && active.isContentEditable && typeof active.blur === "function") active.blur();
    const selection = window.getSelection();
    if (selection) selection.removeAllRanges();
}

function clearFocus() {
    blurField();
    selectedId = null;
    document.querySelectorAll(".block.is-selected").forEach(function (node) {
        node.classList.remove("is-selected");
    });
    updateInspector();
}

function select(id) {
    selectedId = id;
    document.querySelectorAll(".block.is-selected").forEach(function (node) {
        node.classList.remove("is-selected");
    });
    const node = document.querySelector('.block[data-id="' + id + '"]');
    if (node) {
        node.classList.add("is-selected");
        setAddTarget(node.parentElement && node.parentElement.id === "col-sidebar" ? "sidebar" : "main");
    }
    updateInspector();
}

function defaultTextColor(item) {
    return columnOf(item.id) === "sidebar" ? doc.theme.sidebarText : doc.theme.text;
}

function updateInspector() {
    const item = selectedBlock();
    const bar = document.getElementById("floatbar");
    const inStudio = document.body.dataset.phase === "studio";
    document.body.classList.toggle("has-selection", !!(item && inStudio));
    syncLibraryHint();
    if (!bar) return;
    if (!item || !inStudio) {
        bar.hidden = true;
        return;
    }
    bar.hidden = false;
    setColorInput("block-color", item.color || defaultTextColor(item));
    setColorInput("block-bg", item.background || "#ffffff");
    const sizeInput = document.getElementById("block-size");
    const sizeLabel = document.getElementById("block-size-value");
    if (sizeInput && sizeLabel) {
        if (item.type === "photo") {
            const width = photoWidth(item);
            sizeInput.min = "36";
            sizeInput.max = "100";
            sizeInput.step = "2";
            sizeInput.value = String(width);
            sizeInput.title = t("photo.size");
            sizeLabel.textContent = width + "%";
        } else if (item.type === "spacer") {
            const size = Number(item.fields.size) || 12;
            sizeInput.min = "8";
            sizeInput.max = "80";
            sizeInput.step = "1";
            sizeInput.value = String(size);
            sizeInput.title = t("ui.blockSize");
            sizeLabel.textContent = size + " px";
        } else {
            const size = item.fontSize || doc.theme.baseSize;
            sizeInput.min = "8";
            sizeInput.max = "28";
            sizeInput.step = "0.5";
            sizeInput.value = String(size);
            sizeInput.title = t("ui.blockSize");
            sizeLabel.textContent = size + " pt";
        }
    }
    const photoUrl = document.getElementById("photo-url");
    if (photoUrl) {
        const showUrl = item.type === "photo";
        photoUrl.hidden = !showUrl;
        if (showUrl && document.activeElement !== photoUrl) photoUrl.value = item.fields.url || "";
    }
    const lines = item.type === "list" || item.type === "timeline" || item.type === "closing";
    const addLine = document.getElementById("add-line");
    if (addLine) addLine.hidden = !lines;
    bar.title = t("ui.hint");
    syncLibraryHint();
    positionFloatbar();
}

function syncLibraryHint() {
    const note = document.getElementById("library-hint");
    if (!note) return;
    const item = selectedBlock();
    const lines = item && (item.type === "list" || item.type === "timeline" || item.type === "closing");
    const hint = narrowStudio() ? t("ui.dragHintTouch") : t("ui.dragHint");
    note.textContent = lines ? t("shell.addItem") + " " + t("ui.hint") : hint;
}

function positionFloatbar() {
    const bar = document.getElementById("floatbar");
    const node = selectedId && document.querySelector('.block[data-id="' + selectedId + '"]');
    if (!bar || bar.hidden || !node) return;
    const rect = node.getBoundingClientRect();
    const width = bar.offsetWidth || 280;
    let left = rect.left + rect.width / 2 - width / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
    const chrome = document.getElementById("topbar");
    const limit = chrome ? chrome.getBoundingClientRect().bottom + 8 : 68;
    let top = rect.top - bar.offsetHeight - 10;
    if (top < limit) top = Math.min(rect.bottom + 10, window.innerHeight - bar.offsetHeight - 8);
    bar.style.left = left + "px";
    bar.style.top = top + "px";
}

function cancelDrag() {
    if (typeof activeDragCancel !== "function") return false;
    const cancel = activeDragCancel;
    activeDragCancel = null;
    cancel();
    return true;
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
        const tag = document.createElement("span");
        tag.className = "page-break-label";
        tag.textContent = t("ui.pageBreak").replace("{n}", String(index + 1));
        line.appendChild(tag);
        guides.appendChild(line);
    }
    const label = pages === 1 ? t("ui.pageOne") : t("ui.pageMany").replace("{n}", String(pages));
    if (status) status.textContent = label;
    const chip = document.getElementById("page-chip");
    if (chip) {
        chip.textContent = label;
        chip.classList.toggle("is-warn", !!(doc && doc.kind === "letter" && pages > 1));
    }
    applyStageScale(stageScale);
}

function pageCount() {
    const sheet = document.getElementById("sheet");
    if (!sheet || !sheet.offsetWidth) return 1;
    const pagePx = sheet.offsetWidth * (297 / 210);
    return Math.max(1, Math.ceil((sheet.scrollHeight - 1) / pagePx));
}

function previewFitScale() {
    const preview = document.getElementById("preview");
    const sheet = document.getElementById("sheet");
    if (!preview || !sheet || !sheet.offsetWidth) return 1;
    const styles = getComputedStyle(preview);
    const pad = (parseFloat(styles.paddingLeft) || 0) + (parseFloat(styles.paddingRight) || 0);
    const available = preview.clientWidth - pad - 8;
    if (!available) return 1;
    return Math.max(0.4, Math.min(1, available / sheet.offsetWidth));
}

function setZoom(scale, touched) {
    zoomTouched = !!touched;
    const next = Math.max(0.4, Math.min(1.3, scale || 1));
    const zoom = document.getElementById("zoom");
    const pct = Math.round(next * 100);
    if (zoom) zoom.value = String(pct);
    const label = document.getElementById("zoom-value");
    if (label) label.textContent = pct + "%";
    applyStageScale(next);
}

function fitStage(retry) {
    if (document.body.dataset.phase !== "studio") return;
    const sheet = document.getElementById("sheet");
    if (!sheet || !sheet.offsetWidth) {
        if (!retry) requestAnimationFrame(function () { fitStage(true); });
        return;
    }
    setZoom(previewFitScale(), false);
    updatePageGuides();
}

function applyStageScale(scale) {
    stageScale = scale || 1;
    const stage = document.getElementById("stage");
    const inner = document.getElementById("stage-scale");
    const sheet = document.getElementById("sheet");
    if (!stage || !inner || !sheet) return;
    inner.style.transform = stageScale === 1 ? "" : "scale(" + stageScale + ")";
    const width = sheet.offsetWidth;
    const height = sheet.offsetHeight;
    if (!width || !height) return;
    stage.style.width = Math.ceil(width * stageScale) + "px";
    stage.style.height = Math.ceil(height * stageScale) + "px";
}

function useTemplate(kind) {
    snapshot();
    doc = kind === "letter" ? emptyLetter() : emptyCv();
    selectedId = null;
    filenameCustom = false;
    applyLanguage();
    render();
    syncFilenameFromPerson();
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
    const field = node && node.querySelector(".editable");
    if (field) focusEditable(field);
    else if (node) node.scrollIntoView({ block: "nearest" });
}

function moveBlock(delta) {
    const item = selectedBlock();
    if (!item) return;
    const column = columnOf(item.id);
    const index = doc[column].findIndex(function (entry) { return entry.id === item.id; });
    const next = index + delta;
    if (index < 0 || next < 0 || next >= doc[column].length) return;
    snapshot();
    const moved = doc[column].splice(index, 1)[0];
    doc[column].splice(next, 0, moved);
    render();
    save();
    const node = document.querySelector('.block[data-id="' + item.id + '"]');
    if (!node) return;
    node.tabIndex = -1;
    node.focus();
    node.scrollIntoView({ block: "nearest" });
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
    const column = columnOf(item.id);
    const index = doc[column].findIndex(function (entry) { return entry.id === item.id; });
    snapshot();
    doc[column] = doc[column].filter(function (entry) { return entry.id !== item.id; });
    const next = doc[column][Math.min(index, doc[column].length - 1)] || null;
    selectedId = next ? next.id : null;
    render();
    save();
    if (!next) return;
    const node = document.querySelector('.block[data-id="' + next.id + '"]');
    if (!node) return;
    node.tabIndex = -1;
    node.focus();
}

function addLine() {
    const item = selectedBlock();
    if (!item) return;
    snapshot();
    if (item.type === "closing") item.fields.paragraphs.push("");
    else item.fields.items.push("");
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

function syncTemplateState() {
    document.querySelectorAll("[data-template]").forEach(function (button) {
        button.classList.toggle("is-current", button.dataset.template === doc.kind);
    });
}
