/* CC0-1.0 — https://creativecommons.org/publicdomain/zero/1.0/ */
/* Reorder blocks with the pointer. Escape puts a drag back. */

function dropTarget(x, y, ignore) {
    const stack = document.elementsFromPoint(x, y);
    let column = null;
    let block = null;
    for (let index = 0; index < stack.length; index += 1) {
        const node = stack[index];
        if (!node || node.nodeType !== 1) continue;
        if (ignore && (node === ignore || node.closest && ignore.contains(node))) continue;
        if (node.closest("#drag-ghost, #drop-line, #floatbar")) continue;
        if (node.closest("#toast, .crop-dialog, .topbar, .library, .drawer")) return null;
        const col = node.id === "col-sidebar" || node.id === "col-main" ? node : node.closest("#col-sidebar, #col-main");
        if (!col) continue;
        column = col;
        const hit = node.closest(".block");
        if (hit && hit !== ignore && hit.parentElement === col) block = hit;
        break;
    }
    if (!column) return null;
    if (!block) {
        const blocks = Array.from(column.children).filter(function (node) {
            return node !== ignore && node.classList.contains("block");
        });
        let before = null;
        blocks.forEach(function (node) {
            if (before) return;
            const rect = node.getBoundingClientRect();
            if (y < rect.top + rect.height / 2) before = node;
        });
        return { column: column, before: before };
    }
    const rect = block.getBoundingClientRect();
    const after = y > rect.top + rect.height / 2;
    let before = after ? block.nextElementSibling : block;
    if (before && !before.classList.contains("block")) before = null;
    return { column: column, before: before };
}

function paintDrop(spot) {
    document.querySelectorAll(".col.is-drop").forEach(function (node) { node.classList.remove("is-drop"); });
    const line = document.getElementById("drop-line");
    if (!spot) {
        if (line) line.hidden = true;
        return;
    }
    spot.column.classList.add("is-drop");
    if (!line) return;
    const columnRect = spot.column.getBoundingClientRect();
    let top = columnRect.top + 10;
    if (spot.before) top = spot.before.getBoundingClientRect().top;
    else {
        const blocks = spot.column.querySelectorAll(":scope > .block");
        const last = blocks[blocks.length - 1];
        if (last) top = last.getBoundingClientRect().bottom + 3;
    }
    line.hidden = false;
    line.style.left = (columnRect.left + 10) + "px";
    line.style.width = Math.max(24, columnRect.width - 20) + "px";
    line.style.top = top + "px";
}

function clearDrop() {
    document.querySelectorAll(".col.is-drop").forEach(function (node) { node.classList.remove("is-drop"); });
    const line = document.getElementById("drop-line");
    if (line) line.hidden = true;
    const ghost = document.getElementById("drag-ghost");
    if (ghost) ghost.hidden = true;
    document.body.classList.remove("is-dragging");
}

function ensureDragChrome() {
    if (!document.getElementById("drop-line")) {
        const line = document.createElement("div");
        line.id = "drop-line";
        line.hidden = true;
        document.body.appendChild(line);
    }
    if (!document.getElementById("drag-ghost")) {
        const ghost = document.createElement("div");
        ghost.id = "drag-ghost";
        ghost.hidden = true;
        document.body.appendChild(ghost);
    }
}

function showGhost(text, x, y) {
    ensureDragChrome();
    const ghost = document.getElementById("drag-ghost");
    ghost.hidden = false;
    ghost.textContent = text;
    ghost.style.left = (x + 14) + "px";
    ghost.style.top = (y + 16) + "px";
}

function bindDrag(handle, blockEl) {
    handle.addEventListener("pointerdown", function (event) {
        if (event.button !== 0) return;
        event.preventDefault();
        event.stopPropagation();
        const originParent = blockEl.parentElement;
        const originNext = blockEl.nextSibling;
        let cancelled = false;
        blockEl.classList.add("is-dragging");
        blockEl.style.pointerEvents = "none";
        document.body.classList.add("is-dragging");
        const bar = document.getElementById("floatbar");
        if (bar) bar.hidden = true;
        ensureDragChrome();
        function finish(commit) {
            activeDragCancel = null;
            handle.removeEventListener("pointermove", move);
            handle.removeEventListener("pointerup", up);
            handle.removeEventListener("pointercancel", up);
            blockEl.classList.remove("is-dragging");
            blockEl.style.pointerEvents = "";
            clearDrop();
            function showBar() {
                updateInspector();
                positionFloatbar();
            }
            if (!commit || cancelled) {
                if (originParent) originParent.insertBefore(blockEl, originNext);
                showBar();
                return;
            }
            const from = columnOf(blockEl.dataset.id);
            const previous = JSON.stringify(doc);
            syncColumnsFromDom();
            if (JSON.stringify(doc) === previous) {
                showBar();
                return;
            }
            past.push(previous);
            if (past.length > 60) past.shift();
            future = [];
            syncHistoryButtons();
            save();
            if (columnOf(blockEl.dataset.id) !== from) render();
            else showBar();
        }
        function move(moveEvent) {
            nudgeScroll(moveEvent.clientX, moveEvent.clientY);
            const spot = dropTarget(moveEvent.clientX, moveEvent.clientY, blockEl);
            paintDrop(spot);
            if (!spot) return;
            const before = spot.before && spot.before.parentElement === spot.column ? spot.before : null;
            if (blockEl.parentElement !== spot.column || blockEl.nextSibling !== before) {
                spot.column.insertBefore(blockEl, before);
            }
        }
        function up() { finish(true); }
        activeDragCancel = function () {
            cancelled = true;
            finish(false);
        };
        handle.addEventListener("pointermove", move);
        handle.addEventListener("pointerup", up);
        handle.addEventListener("pointercancel", up);
        try { handle.setPointerCapture(event.pointerId); } catch (error) { /* synthetic events */ }
    });
}

function bindLibraryCard(button, type) {
    let start = null;
    let dragging = false;
    let pointerId = null;
    let fromGrip = false;
    button.addEventListener("pointerdown", function (event) {
        if (event.button !== 0) return;
        fromGrip = !!(event.target.closest && event.target.closest(".library-grip"));
        if (event.pointerType === "touch" && !fromGrip) return;
        start = { x: event.clientX, y: event.clientY };
        pointerId = event.pointerId;
        dragging = false;
        if (fromGrip) event.preventDefault();
    });
    button.addEventListener("pointermove", function (event) {
        if (!start || event.pointerId !== pointerId) return;
        const dx = event.clientX - start.x;
        const dy = event.clientY - start.y;
        if (!dragging) {
            if (dx * dx + dy * dy < 36) return;
            dragging = true;
            try { button.setPointerCapture(pointerId); } catch (error) { /* already gone */ }
            if (narrowStudio()) setStudioPane("page");
            document.body.classList.add("is-dragging");
            const bar = document.getElementById("floatbar");
            if (bar) bar.hidden = true;
            ensureDragChrome();
            activeDragCancel = function () {
                dragging = false;
                start = null;
                fromGrip = false;
                button.dataset.suppressClick = "1";
                try { button.releasePointerCapture(pointerId); } catch (error) { /* not captured */ }
                clearDrop();
                updateInspector();
                activeDragCancel = null;
            };
        }
        nudgeScroll(event.clientX, event.clientY);
        showGhost(t("type." + type), event.clientX, event.clientY);
        paintDrop(dropTarget(event.clientX, event.clientY, null));
    });
    function end(event) {
        if (!start || event.pointerId !== pointerId) return;
        const dropped = dragging;
        const gripTap = fromGrip;
        const spot = dropped ? dropTarget(event.clientX, event.clientY, null) : null;
        start = null;
        dragging = false;
        fromGrip = false;
        activeDragCancel = null;
        clearDrop();
        if (dropped || gripTap) button.dataset.suppressClick = "1";
        if (!dropped || !spot) {
            updateInspector();
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        insertBlockAt(type, spot);
    }
    button.addEventListener("pointerup", end);
    button.addEventListener("pointercancel", function (event) {
        start = null;
        dragging = false;
        fromGrip = false;
        activeDragCancel = null;
        clearDrop();
        if (event.pointerId === pointerId) button.dataset.suppressClick = "1";
    });
    button.addEventListener("click", function (event) {
        if (button.dataset.suppressClick) {
            button.dataset.suppressClick = "";
            event.preventDefault();
            event.stopPropagation();
            return;
        }
        addBlock(type);
        if (narrowStudio()) setStudioPane("page");
    });
}

function insertBlockAt(type, spot) {
    const columnName = spot.column.id === "col-sidebar" ? "sidebar" : "main";
    snapshot();
    const item = createBlock(type);
    const list = doc[columnName];
    let index = list.length;
    if (spot.before && spot.before.dataset && spot.before.dataset.id) {
        const found = list.findIndex(function (entry) { return entry.id === spot.before.dataset.id; });
        if (found >= 0) index = found;
    }
    list.splice(index, 0, item);
    selectedId = item.id;
    setAddTarget(columnName);
    render();
    save();
    const node = document.querySelector('.block[data-id="' + item.id + '"]');
    const field = node && node.querySelector(".editable");
    if (field) focusEditable(field);
    else if (node) node.scrollIntoView({ block: "nearest" });
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
