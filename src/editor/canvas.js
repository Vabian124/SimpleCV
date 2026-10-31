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
            const weight = String((node.style && node.style.fontWeight) || "").toLowerCase();
            const numeric = parseInt(weight, 10);
            const bold = weight === "bold" || weight === "bolder" || numeric >= 600;
            const italic = String((node.style && node.style.fontStyle) || "").toLowerCase() === "italic";
            const deco = String((node.style && (node.style.textDecorationLine || node.style.textDecoration)) || "").toLowerCase();
            let inner = serialize(node);
            if (deco.indexOf("underline") >= 0) inner = "<u>" + inner + "</u>";
            if (italic) inner = "<em>" + inner + "</em>";
            if (bold) inner = "<strong>" + inner + "</strong>";
            const style = [];
            if (color) style.push("color:" + safeCss(color));
            if (size) style.push("font-size:" + safeCss(size));
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

function fieldIsBlank(node) {
    return !node.textContent.replace(/\u00a0/g, " ").trim();
}

function editable(className, html, write, placeholder) {
    const node = document.createElement("div");
    node.className = "editable" + (className ? " " + className : "");
    node.contentEditable = "true";
    node.lang = spellLocale();
    node.setAttribute("lang", node.lang);
    node.spellcheck = true;
    node.setAttribute("spellcheck", "true");
    if (placeholder) node.dataset.placeholder = placeholder;
    if (className === "date" || placeholder === t("doc.phone") || placeholder === t("doc.email") || placeholder === t("doc.born") || placeholder === t("ph.date")) {
        node.spellcheck = false;
        node.setAttribute("spellcheck", "false");
    }
    node.innerHTML = html || "";
    node.classList.toggle("is-blank", fieldIsBlank(node));
    node.addEventListener("focus", function () {
        activeField = node;
        rememberSnapshot();
    });
    node.addEventListener("input", function () {
        node.classList.toggle("is-blank", fieldIsBlank(node));
        write(serialize(node));
    });
    node.addEventListener("keydown", function (event) {
        if (event.key !== "Enter" || event.shiftKey || event.altKey || event.isComposing || event.keyCode === 229) return;
        if (node.closest(".line")) return;
        const block = node.closest(".block");
        if (!block) return;
        const multiline = block.classList.contains("name")
            || block.classList.contains("paragraph")
            || block.classList.contains("intro")
            || node.classList.contains("body")
            || node.classList.contains("to");
        if (multiline) return;
        event.preventDefault();
        const fields = Array.prototype.slice.call(document.querySelectorAll("#sheet .editable"));
        const next = fields[fields.indexOf(node) + 1];
        if (next) focusEditable(next);
        else node.blur();
    });
    node.addEventListener("paste", function (event) {
        event.preventDefault();
        const text = event.clipboardData ? event.clipboardData.getData("text/plain") : "";
        const before = node.innerHTML;
        let inserted = false;
        try { inserted = document.execCommand("insertText", false, text); } catch (error) { inserted = false; }
        if (!inserted || node.innerHTML === before) {
            const selection = window.getSelection();
            if (!selection || !selection.rangeCount) return;
            const range = selection.getRangeAt(0);
            range.deleteContents();
            const textNode = document.createTextNode(text);
            range.insertNode(textNode);
            range.setStartAfter(textNode);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
            node.dispatchEvent(new Event("input", { bubbles: true }));
        }
    });
    return node;
}

function focusEditable(node) {
    if (!node) return;
    node.focus();
    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    range.selectNodeContents(node);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
}

function focusLine(id, index) {
    const rows = document.querySelectorAll('.block[data-id="' + id + '"] .line .editable');
    focusEditable(rows[index]);
}

function photoWidth(item) {
    const saved = Number(item.fields && item.fields.width);
    if (saved >= 36 && saved <= 100) return saved;
    return defaultPhotoWidth(item);
}

function defaultPhotoWidth(item) {
    if (columnOf(item.id) === "main") return 48;
    if (doc && doc.kind === "letter") return 64;
    return 92;
}

let photoWidthSnapped = false;

function paintPhotoWidth(item) {
    if (!item) return;
    const width = photoWidth(item);
    const sizeInput = document.getElementById("block-size");
    const sizeLabel = document.getElementById("block-size-value");
    if (sizeInput && sizeLabel && selectedBlock() === item) {
        sizeInput.value = String(width);
        sizeLabel.textContent = width + "%";
    }
    const page = document.getElementById("crop-page-size");
    const pageLabel = document.getElementById("crop-page-value");
    if (page) page.value = String(width);
    if (pageLabel) pageLabel.textContent = width + "%";
}

function applyPhotoFrame(item) {
    const frame = document.querySelector('.block[data-id="' + item.id + '"] .photo-frame');
    if (frame) frame.style.width = photoWidth(item) + "%";
    paintPhotoWidth(item);
}

function setPhotoWidth(item, width, snap) {
    if (!item) return;
    if (snap && !photoWidthSnapped) {
        snapshot();
        photoWidthSnapped = true;
    }
    item.fields.width = Math.max(36, Math.min(100, Math.round(Number(width))));
    applyPhotoFrame(item);
    save();
}

function resetPhotoWidth(item) {
    if (!item) return;
    snapshot();
    photoWidthSnapped = true;
    delete item.fields.width;
    applyPhotoFrame(item);
    save();
}

function nudgeScroll(x, y) {
    [document.querySelector(".preview"), document.querySelector(".library")].forEach(function (pane) {
        if (!pane) return;
        const rect = pane.getBoundingClientRect();
        if (x < rect.left - 8 || x > rect.right + 8 || y < rect.top || y > rect.bottom) return;
        const edge = 64;
        if (y < rect.top + edge) pane.scrollTop -= 22;
        else if (y > rect.bottom - edge) pane.scrollTop += 22;
    });
}

function paint(node, item) {
    if (item.type === "spacer") {
        node.style.height = (Number(item.fields.size) || 12) + "px";
        node.style.color = "";
        node.style.background = "";
        node.style.fontSize = "";
        return;
    }
    node.style.color = item.color || "";
    node.style.background = item.background || "";
    node.style.fontSize = item.fontSize ? item.fontSize + "pt" : "";
    if (item.color) node.style.setProperty("--block-color", item.color);
    else node.style.removeProperty("--block-color");
}

function headingStyle(item) {
    if (item.fields.style === "label" || item.fields.style === "bar") return item.fields.style;
    if (doc.kind === "letter" && columnOf(item.id) === "main" && !item.fields.key) return "label";
    return "bar";
}

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
    button.addEventListener("pointerdown", function (event) {
        if (event.button !== 0) return;
        start = { x: event.clientX, y: event.clientY };
        pointerId = event.pointerId;
        dragging = false;
    });
    button.addEventListener("pointermove", function (event) {
        if (!start || event.pointerId !== pointerId) return;
        const dx = event.clientX - start.x;
        const dy = event.clientY - start.y;
        if (!dragging) {
            if (dx * dx + dy * dy < 36) return;
            dragging = true;
            if (narrowStudio()) setStudioPane("page");
            document.body.classList.add("is-dragging");
            const bar = document.getElementById("floatbar");
            if (bar) bar.hidden = true;
            ensureDragChrome();
            try { button.setPointerCapture(pointerId); } catch (error) { /* already gone */ }
            activeDragCancel = function () {
                dragging = false;
                start = null;
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
        const spot = dropped ? dropTarget(event.clientX, event.clientY, null) : null;
        start = null;
        dragging = false;
        activeDragCancel = null;
        clearDrop();
        if (dropped) button.dataset.suppressClick = "1";
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
        }, t("ph.text"));
        field.title = t("shell.addItem");
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "line-x";
        remove.textContent = "\u00d7";
        remove.setAttribute("aria-label", t("ui.removeLine"));
        remove.title = t("ui.removeLine");
        remove.addEventListener("mousedown", function (event) { event.preventDefault(); });
        remove.addEventListener("click", function () {
            snapshot();
            item.fields[key].splice(index, 1);
            if (!item.fields[key].length) item.fields[key].push(escapeHtml(t("ph.text")));
            render();
            save();
        });
        field.addEventListener("keydown", function (event) {
            if (event.altKey || event.isComposing || event.keyCode === 229) return;
            const empty = !field.textContent.replace(/\u00a0/g, " ").trim();
            if (event.key === "Enter" && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
                event.preventDefault();
                if (empty) {
                    if (item.fields[key].length < 2) {
                        field.blur();
                        return;
                    }
                    snapshot();
                    item.fields[key].splice(index, 1);
                    render();
                    save();
                    focusLine(item.id, Math.max(0, index - 1));
                    return;
                }
                snapshot();
                item.fields[key].splice(index + 1, 0, "");
                render();
                save();
                focusLine(item.id, index + 1);
                return;
            }
            if (event.key === "Backspace" && empty && !event.shiftKey && !event.ctrlKey && !event.metaKey && item.fields[key].length > 1) {
                event.preventDefault();
                snapshot();
                item.fields[key].splice(index, 1);
                render();
                save();
                focusLine(item.id, Math.max(0, index - 1));
            }
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
    handle.setAttribute("aria-label", t("ui.moveBlock"));
    handle.title = t("ui.moveBlock");
    bindDrag(handle, node);
    node.appendChild(handle);
    node.addEventListener("pointerdown", function (event) {
        if (event.target.closest(".drag-handle") || event.target.closest(".line-x")) return;
        select(item.id);
    });

    const fields = item.fields;
    if (item.type === "spacer") {
        node.classList.add("is-spacer");
        node.setAttribute("aria-hidden", "true");
    } else if (item.type === "photo") {
        const frame = document.createElement("button");
        frame.type = "button";
        frame.className = "photo-frame";
        frame.style.aspectRatio = fields.aspect || "3 / 4";
        frame.style.width = photoWidth(item) + "%";
        frame.title = fields.src ? t("photo.edit") : t("photo.pick");
        if (fields.src) {
            const img = document.createElement("img");
            img.alt = "";
            img.src = fields.src;
            const badge = document.createElement("span");
            badge.className = "photo-edit";
            badge.textContent = t("photo.edit");
            frame.append(img, badge);
        } else {
            frame.classList.add("is-empty");
            const mark = document.createElement("span");
            mark.className = "photo-mark";
            mark.textContent = "+";
            const label = document.createElement("span");
            label.className = "photo-label";
            label.textContent = t("photo.pick");
            frame.append(mark, label);
        }
        frame.addEventListener("click", function (event) {
            event.preventDefault();
            event.stopPropagation();
            if (fields.src || fields.original) openPhotoCrop(item.id);
            else pickPhoto(item.id);
        });
        node.appendChild(frame);
    } else if (item.type === "heading") {
        if (headingStyle(item) === "label") node.classList.add("is-label");
        node.appendChild(editable("", fields.key ? escapeHtml(t(fields.key)) : (fields.html || ""), function (html) {
            fields.key = "";
            fields.style = headingStyle(item);
            fields.html = html;
            save();
        }, t("ph.heading")));
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
            }, t("ph.label")));
        }
        const contactPrompt = fields.labelKey && fields.labelKey !== "custom" ? t("doc." + fields.labelKey) : t("ph.text");
        node.append(
            label,
            editable("", fields.html || "", function (html) { fields.html = html; save(); }, contactPrompt)
        );
    } else if (item.type === "competence" || item.type === "project") {
        node.append(
            editable("title", fields.title || "", function (html) { fields.title = html; save(); }, t("ph.title")),
            editable("body", fields.body || "", function (html) { fields.body = html; save(); }, t("ph.text"))
        );
    } else if (item.type === "timeline") {
        const top = document.createElement("div");
        top.className = "timeline-top";
        top.append(
            editable("title", fields.title || "", function (html) { fields.title = html; save(); }, t("ph.title")),
            editable("date", fields.date || "", function (html) { fields.date = html; save(); }, t("ph.date"))
        );
        node.append(
            top,
            editable("org", fields.org || "", function (html) { fields.org = html; save(); }, t("ph.org")),
            lineList(item, "items", true)
        );
    } else if (item.type === "intro") {
        const label = document.createElement("div");
        label.className = "intro-label";
        label.dataset.i18n = "doc.intro";
        label.textContent = t("doc.intro");
        node.append(label, editable("", fields.html || "", function (html) { fields.html = html; save(); }, t("ph.text")));
    } else if (item.type === "list") {
        node.appendChild(lineList(item, "items", true));
    } else if (item.type === "letterhead") {
        const top = document.createElement("div");
        top.className = "letterhead-top";
        top.append(
            editable("doc-title", fields.title || escapeHtml(t("doc.letter")), function (html) {
                fields.title = html;
                save();
            }, t("doc.letter")),
            editable("date", fields.date || "", function (html) { fields.date = html; save(); }, t("ph.date"))
        );
        node.append(
            top,
            editable("to", fields.to || "", function (html) { fields.to = html; save(); }, t("ph.to")),
            editable("subject", fields.subject || "", function (html) { fields.subject = html; save(); }, t("ph.subject"))
        );
    } else if (item.type === "closing") {
        node.appendChild(lineList(item, "paragraphs", false));
    } else {
        const prompts = { name: t("ph.name"), role: t("ph.role"), skill: t("ph.text"), paragraph: t("ph.text"), signature: t("ph.name") };
        node.appendChild(editable("", fields.html || "", function (html) {
            fields.html = html;
            save();
            if (item.type === "name") syncFilenameFromPerson();
        }, prompts[item.type] || t("ph.text")));
    }
    return node;
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

function previewLine(className, text) {
    const node = document.createElement("div");
    if (className) node.className = className;
    node.textContent = text;
    return node;
}

function previewFor(type) {
    const frame = document.createElement("div");
    frame.className = "library-frame";
    frame.setAttribute("aria-hidden", "true");
    const sample = document.createElement("div");
    const sideTypes = { name: 1, photo: 1, role: 1, contact: 1, skill: 1, competence: 1, project: 1 };
    const onSide = type === "heading" || type === "spacer" ? addTarget === "sidebar" : !!sideTypes[type];
    sample.className = "library-sample " + (onSide ? "is-side" : "is-main");
    sample.dataset.kind = doc.kind === "letter" ? "letter" : "cv";
    const piece = document.createElement("div");
    piece.className = "block " + type;
    if (type === "spacer") piece.classList.add("is-spacer");
    if (type === "heading" && doc.kind === "letter" && !onSide) piece.classList.add("is-label");
    if (type === "photo") {
        const frame = document.createElement("div");
        frame.className = "photo-frame";
        piece.appendChild(frame);
    } else if (type === "name") {
        piece.append(document.createTextNode(t("preview.nameA")), document.createElement("br"), document.createTextNode(t("preview.nameB")));
    } else if (type === "role") {
        piece.textContent = t("preview.role");
    } else if (type === "contact") {
        piece.append(previewLine("contact-label", t("doc.city")), previewLine("", t("preview.contact")));
    } else if (type === "heading") {
        piece.textContent = t("ph.heading");
    } else if (type === "skill") {
        piece.textContent = t("preview.skill");
    } else if (type === "competence" || type === "project") {
        piece.append(previewLine("title", t("ph.title")), previewLine("body", t("preview.body")));
    } else if (type === "intro") {
        piece.append(previewLine("intro-label", t("doc.intro")), previewLine("", t("preview.body")));
    } else if (type === "timeline") {
        const top = document.createElement("div");
        top.className = "timeline-top";
        top.append(previewLine("title", t("ph.title")), previewLine("date", t("ph.date")));
        const list = document.createElement("ul");
        list.className = "bullets";
        const item = document.createElement("li");
        item.textContent = t("preview.item");
        list.appendChild(item);
        piece.append(top, previewLine("org", t("ph.org")), list);
    } else if (type === "paragraph") {
        piece.textContent = t("preview.paragraph");
    } else if (type === "list") {
        const list = document.createElement("ul");
        list.className = "bullets";
        [t("preview.item"), t("preview.item2")].forEach(function (text) {
            const item = document.createElement("li");
            item.textContent = text;
            list.appendChild(item);
        });
        piece.appendChild(list);
    } else if (type === "letterhead") {
        const top = document.createElement("div");
        top.className = "letterhead-top";
        top.append(previewLine("doc-title", t("doc.letter")), previewLine("date", t("preview.place")));
        piece.append(top, previewLine("to", t("ph.to")), previewLine("subject", t("ph.subject")));
    } else if (type === "closing") {
        const row = document.createElement("div");
        row.className = "closing";
        row.appendChild(previewLine("line", t("preview.greeting")));
        piece.appendChild(row);
    } else if (type === "signature") {
        piece.appendChild(previewLine("editable", t("preview.nameA") + " " + t("preview.nameB")));
    }
    sample.appendChild(piece);
    frame.appendChild(sample);
    return frame;
}

function fillBlockGrid() {
    const grid = document.getElementById("block-grid");
    if (!grid || !doc) return;
    grid.replaceChildren();
    const types = ALL_BLOCKS;
    types.forEach(function (type) {
        const button = keepSelection(h("button", { class: "library-card", type: "button" }));
        button.append(previewFor(type), h("span", { class: "library-name", text: t("type." + type), i18n: "type." + type }));
        bindLibraryCard(button, type);
        grid.appendChild(button);
    });
}

function setAddTarget(next) {
    const target = next === "sidebar" ? "sidebar" : "main";
    const changed = addTarget !== target;
    addTarget = target;
    const radio = document.querySelector('input[name="add-target"][value="' + addTarget + '"]');
    if (radio) radio.checked = true;
    if (changed) fillBlockGrid();
}

