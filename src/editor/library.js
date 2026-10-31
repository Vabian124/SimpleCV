/* CC0-1.0 — https://creativecommons.org/publicdomain/zero/1.0/ */
/* The block picker and its small previews. */

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
        const grip = h("span", { class: "library-grip", "aria-hidden": "true", title: t("ui.placeBlock"), i18nTitle: "ui.placeBlock" });
        grip.textContent = "\u22ee\u22ee";
        button.append(previewFor(type), h("span", { class: "library-name", text: t("type." + type), i18n: "type." + type }), grip);
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
