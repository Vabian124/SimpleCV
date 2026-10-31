/* CC0-1.0 — https://creativecommons.org/publicdomain/zero/1.0/ */
/* Editable text and drawing one block on the page. */

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
