/* CC0-1.0 — https://creativecommons.org/publicdomain/zero/1.0/ */
/* Read and write the @@@CV / @@@LETTER document format. */

function markedText(html) {
    const holder = document.createElement("div");
    holder.innerHTML = html || "";
    holder.querySelectorAll("br").forEach(function (br) { br.replaceWith("\n"); });
    return holder.textContent.replace(/\u00a0/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function textToHtml(value) {
    return escapeHtml(value || "").replace(/\n/g, "<br>");
}

function nameToHtml(value) {
    return String(value || "")
        .split(/<br\s*\/?>/i)
        .map(function (part) { return escapeHtml(part.trim()); })
        .filter(Boolean)
        .join("<br>");
}

function fieldValue(text, key) {
    const match = String(text || "").match(new RegExp("^" + key + ":\\s*(.*)$", "im"));
    return match ? match[1].trim() : "";
}

function pointBody(line) {
    const trimmed = String(line || "").trim();
    if (trimmed.indexOf("POINT:") === 0) return trimmed.slice(6).trim();
    if (trimmed.indexOf("- ") === 0 || trimmed.indexOf("* ") === 0) return trimmed.slice(2).trim();
    return null;
}

function bulletLines(text) {
    return String(text || "").split(/\r?\n/).map(pointBody).filter(function (line) { return line; });
}

function titledLines(text) {
    return bulletLines(text).map(function (line) {
        const split = line.indexOf(":");
        return split < 0
            ? { title: "", body: line }
            : { title: line.slice(0, split).trim(), body: line.slice(split + 1).trim() };
    });
}

function entryFrom(text) {
    const bullets = [];
    const fields = {};
    String(text || "").split(/\r?\n/).forEach(function (line) {
        const trimmed = line.trim();
        const point = pointBody(trimmed);
        if (point !== null) {
            if (point) bullets.push(point);
            return;
        }
        const match = trimmed.match(/^(TITLE|DATE|ORGANIZATION):\s*(.*)$/i);
        if (match) fields[match[1].toUpperCase()] = match[2].trim();
    });
    return {
        title: fields.TITLE || "",
        date: fields.DATE || "",
        org: fields.ORGANIZATION || "",
        items: bullets
    };
}

function exportMarked() {
    const lines = [doc.kind === "letter" ? "@@@LETTER" : "@@@CV"];
    const name = doc.sidebar.concat(doc.main).find(function (item) { return item.type === "name"; });
    const role = doc.sidebar.concat(doc.main).find(function (item) { return item.type === "role"; });
    lines.push("NAME: " + (name ? markedText(name.fields.html).replace(/\n/g, "<br>") : ""));
    lines.push("ROLE: " + (role ? markedText(role.fields.html) : ""));
    const intro = doc.sidebar.concat(doc.main).find(function (item) { return item.type === "intro"; });
    if (doc.kind === "letter") {
        const letterhead = doc.sidebar.concat(doc.main).find(function (item) { return item.type === "letterhead"; });
        if (letterhead) {
            lines.push("TITLE: " + markedText(letterhead.fields.title || escapeHtml(t("doc.letter"))));
            lines.push("DATE: " + markedText(letterhead.fields.date));
            lines.push("TO: " + markedText(letterhead.fields.to).replace(/\n/g, "<br>"));
            lines.push("SUBJECT: " + markedText(letterhead.fields.subject));
        }
        lines.push("SUMMARY: " + (intro ? markedText(intro.fields.html).replace(/\n/g, " ") : ""));
    }
    lines.push("@@@CONTACT");
    ["city", "phone", "email", "born"].forEach(function (key) {
        const row = doc.sidebar.concat(doc.main).find(function (item) {
            return item.type === "contact" && item.fields.labelKey === key;
        });
        lines.push(key.toUpperCase() + ": " + (row ? markedText(row.fields.html) : ""));
    });
    doc.sidebar.concat(doc.main).forEach(function (item) {
        if (item.type === "contact" && item.fields.labelKey === "custom") {
            lines.push("LABEL: " + markedText(item.fields.label));
            lines.push("VALUE: " + markedText(item.fields.html));
        }
    });
    lines.push("@@@SKILLS");
    doc.sidebar.concat(doc.main).forEach(function (item) {
        if (item.type === "skill") lines.push("POINT: " + markedText(item.fields.html));
    });
    lines.push("@@@STRENGTHS");
    doc.sidebar.concat(doc.main).forEach(function (item) {
        if (item.type === "competence") lines.push("POINT: " + markedText(item.fields.title) + ": " + markedText(item.fields.body));
    });
    lines.push("@@@PROJECTS");
    doc.sidebar.concat(doc.main).forEach(function (item) {
        if (item.type === "project") lines.push("POINT: " + markedText(item.fields.title) + ": " + markedText(item.fields.body));
    });
    if (doc.kind !== "letter") {
        lines.push("@@@PROFILE");
        lines.push(intro ? markedText(intro.fields.html) : "");
    }
    let mode = "job";
    let closing = null;
    let sign = "";
    doc.main.forEach(function (item) {
        if (item.type === "heading") {
            if (item.fields.key === "doc.education") mode = "study";
            else if (item.fields.key === "doc.work") mode = "job";
            else if (!item.fields.key && item.fields.key !== "doc.profile" && item.fields.key !== "doc.letter") {
                lines.push("@@@SECTION");
                lines.push("HEADING: " + markedText(item.fields.html));
            }
            return;
        }
        if (item.type === "timeline") {
            lines.push(mode === "study" ? "@@@STUDY" : "@@@JOB");
            lines.push("TITLE: " + markedText(item.fields.title));
            lines.push("DATE: " + markedText(item.fields.date));
            lines.push("ORGANIZATION: " + markedText(item.fields.org));
            (item.fields.items || []).forEach(function (bullet) { lines.push("POINT: " + markedText(bullet)); });
        } else if (item.type === "paragraph") {
            lines.push("@@@PARAGRAPH");
            lines.push(markedText(item.fields.html));
        } else if (item.type === "letterhead") {
            if (doc.kind === "letter") return;
            lines.push("@@@LETTERHEAD");
            lines.push("DATE: " + markedText(item.fields.date));
            lines.push("TO: " + markedText(item.fields.to).replace(/\n/g, "<br>"));
            lines.push("SUBJECT: " + markedText(item.fields.subject));
        } else if (item.type === "list") {
            lines.push("@@@LIST");
            (item.fields.items || []).forEach(function (bullet) { lines.push("POINT: " + markedText(bullet)); });
        } else if (item.type === "closing") {
            closing = item;
        } else if (item.type === "signature") {
            sign = markedText(item.fields.html);
        } else if (item.type === "spacer") {
            lines.push("@@@SPACER");
            lines.push("SIZE: " + (Number(item.fields.size) || 12));
        }
    });
    doc.sidebar.concat(doc.main).forEach(function (item) {
        if (item.type !== "photo") return;
        lines.push("@@@PHOTO");
        lines.push("CAPTION: " + markedText(item.fields.caption || ""));
    });
    if (closing || sign) {
        lines.push("@@@CLOSING");
        if (closing) lines.push((closing.fields.paragraphs || []).map(markedText).filter(Boolean).join("\n\n"));
        if (sign) lines.push("SIGN: " + sign);
    }
    lines.push("@@@END");
    return lines.join("\n");
}

function stripCodeFence(raw) {
    const text = String(raw || "").replace(/^\uFEFF/, "");
    const re = /```[a-zA-Z0-9_-]*[ \t]*\r?\n?([\s\S]*?)```/g;
    let found = "";
    let match;
    while ((match = re.exec(text))) {
        if (match[1].indexOf("@@@") >= 0) found = match[1];
    }
    return found || text;
}

function markerIndex(source, name, last) {
    const re = new RegExp("@@@" + name + "(?![A-Za-z])", "g");
    let at = -1;
    let match;
    while ((match = re.exec(source))) {
        at = match.index;
        if (!last) break;
    }
    return at;
}

function parseMarked(raw) {
    const source = stripCodeFence(raw);
    const end = markerIndex(source, "END", true);
    const cvAt = markerIndex(source, "CV", false);
    const letterAt = markerIndex(source, "LETTER", false);
    const start = cvAt >= 0 && (letterAt < 0 || cvAt < letterAt) ? cvAt : letterAt;
    if (start < 0 || end < start) throw new Error(t("ui.parseError"));
    const kind = /^@@@LETTER(?![A-Za-z])/.test(source.slice(start)) ? "letter" : "cv";
    const chunks = source.slice(start, end).split(/\n@@@/).map(function (chunk) { return chunk.trim(); }).filter(Boolean);
    return { kind: kind, chunks: chunks };
}

function pushTimeline(target, item) {
    target.push(block("timeline", {
        title: textToHtml(item.title),
        date: textToHtml(item.date),
        org: textToHtml(item.org),
        items: (item.items.length ? item.items : [""]).map(textToHtml)
    }));
}

function hexField(text, key) {
    const value = fieldValue(text, key);
    return /^#[0-9a-fA-F]{6}$/.test(value) ? value : "";
}

function applyChunkPaint(next, sideBefore, mainBefore, rest) {
    const color = hexField(rest, "COLOR");
    const background = hexField(rest, "BACKGROUND");
    const size = Number(fieldValue(rest, "SIZE"));
    const sized = size >= 8 && size <= 28;
    if (!color && !background && !sized) return;
    next.sidebar.slice(sideBefore).concat(next.main.slice(mainBefore)).forEach(function (item) {
        if (item.type === "spacer") return;
        if (color) item.color = color;
        if (background) item.background = background;
        if (sized) item.fontSize = size;
    });
}

function applyThemeFields(theme, rest) {
    const map = {
        SIDEBAR: "sidebar",
        SIDEBARTEXT: "sidebarText",
        ACCENT: "accent",
        ACCENTLIGHT: "accentLight",
        PAGE: "page",
        TEXT: "text"
    };
    Object.keys(map).forEach(function (key) {
        const value = hexField(rest, key);
        if (value) theme[map[key]] = value;
    });
    const size = Number(fieldValue(rest, "SIZE"));
    if (size >= 8 && size <= 14) theme.baseSize = size;
    const column = Number(fieldValue(rest, "COLUMN"));
    if (column >= 24 && column <= 50) theme.sidebarWidth = column;
    const font = fieldValue(rest, "FONT").toLowerCase();
    if (font === "roboto" || font === "merriweather" || font === "lora") theme.font = font;
}

function applyMarked(raw) {
    const parsed = parseMarked(raw);
    const next = { version: 1, lang: lang, kind: parsed.kind, theme: doc.theme, sidebar: [], main: [] };
    const seen = {};
    let useful = false;
    let sign = "";
    function marker(flag, key) {
        if (seen[flag]) return;
        seen[flag] = true;
        next.sidebar.push(barHeading(key));
    }
    parsed.chunks.forEach(function (chunk) {
        const breakAt = chunk.indexOf("\n");
        const head = (breakAt < 0 ? chunk : chunk.slice(0, breakAt)).replace(/^@+/, "").trim().toUpperCase();
        const rest = breakAt < 0 ? "" : chunk.slice(breakAt + 1).trim();
        if (head === "THEME") {
            applyThemeFields(next.theme, rest);
            return;
        }
        const sideBefore = next.sidebar.length;
        const mainBefore = next.main.length;
        if (head === "CV" || head === "LETTER") {
            const person = fieldValue(rest, "NAME");
            const role = fieldValue(rest, "ROLE");
            if (person) {
                next.sidebar.push(block("name", { html: nameToHtml(person) }));
                useful = true;
            }
            if (role) next.sidebar.push(block("role", { html: textToHtml(role) }));
            if (parsed.kind === "letter") {
                next.main.push(makeLetterhead(
                    textToHtml(fieldValue(rest, "DATE")),
                    nameToHtml(fieldValue(rest, "TO")),
                    textToHtml(fieldValue(rest, "SUBJECT")),
                    textToHtml(fieldValue(rest, "TITLE"))
                ));
                useful = true;
            }
            if (fieldValue(rest, "SUMMARY")) {
                next.main.push(block("intro", { html: textToHtml(fieldValue(rest, "SUMMARY")) }));
                useful = true;
            }
        } else if (head === "CONTACT") {
            const rows = ["city", "phone", "email", "born"].filter(function (key) { return fieldValue(rest, key.toUpperCase()); });
            const custom = [];
            rest.split(/\n/).forEach(function (line, index, all) {
                if (!/^LABEL:/i.test(line)) return;
                const valueLine = all[index + 1] || "";
                custom.push({
                    label: line.replace(/^LABEL:\s*/i, "").trim(),
                    value: /^VALUE:/i.test(valueLine) ? valueLine.replace(/^VALUE:\s*/i, "").trim() : ""
                });
            });
            if (rows.length || custom.length) marker("contact", "doc.contact");
            rows.forEach(function (key) {
                next.sidebar.push(block("contact", { labelKey: key, label: "", html: textToHtml(fieldValue(rest, key.toUpperCase())) }));
                useful = true;
            });
            custom.forEach(function (row) {
                next.sidebar.push(block("contact", { labelKey: "custom", label: textToHtml(row.label), html: textToHtml(row.value) }));
            });
        } else if (head === "SKILLS") {
            const skills = bulletLines(rest);
            if (!skills.length) return;
            marker("skills", "doc.skills");
            skills.forEach(function (skill) { next.sidebar.push(block("skill", { html: textToHtml(skill) })); });
            useful = true;
        } else if (head === "STRENGTHS") {
            const items = titledLines(rest);
            if (!items.length) return;
            marker("strengths", "doc.strengths");
            items.forEach(function (item) {
                next.sidebar.push(block("competence", { title: textToHtml(item.title), body: textToHtml(item.body) }));
            });
            useful = true;
        } else if (head === "PROJECTS") {
            const items = titledLines(rest);
            if (!items.length) return;
            marker("projects", "doc.projects");
            items.forEach(function (item) {
                next.sidebar.push(block("project", { title: textToHtml(item.title), body: textToHtml(item.body) }));
            });
            useful = true;
        } else if (head === "PROFILE") {
            if (!rest) return;
            next.main.push(barHeading("doc.profile"));
            next.main.push(block("intro", { html: textToHtml(rest) }));
            useful = true;
        } else if (head === "JOB" || head === "STUDY") {
            const item = entryFrom(rest);
            const flag = head === "STUDY" ? "study" : "work";
            if (!seen[flag]) {
                seen[flag] = true;
                next.main.push(barHeading(flag === "study" ? "doc.education" : "doc.work"));
            }
            pushTimeline(next.main, item);
            useful = true;
        } else if (head === "PARAGRAPH" || head === "OPENING") {
            rest.split(/\n{2,}/).forEach(function (part) {
                if (!part.trim()) return;
                next.main.push(block("paragraph", { html: textToHtml(part.trim()) }));
                useful = true;
            });
        } else if (head === "LIST") {
            const items = bulletLines(rest);
            if (!items.length) return;
            next.main.push(block("list", { items: items.map(textToHtml) }));
            useful = true;
        } else if (head === "LETTERHEAD") {
            next.main.push(makeLetterhead(
                textToHtml(fieldValue(rest, "DATE")),
                nameToHtml(fieldValue(rest, "TO")),
                textToHtml(fieldValue(rest, "SUBJECT")),
                textToHtml(fieldValue(rest, "TITLE"))
            ));
            useful = true;
        } else if (head === "SECTION") {
            const bodyAt = rest.search(/^BODY:\s*/im);
            const body = bodyAt < 0 ? "" : rest.slice(bodyAt).replace(/^BODY:\s*/i, "");
            next.main.push(block("heading", {
                key: "",
                style: parsed.kind === "letter" ? "label" : "bar",
                html: textToHtml(fieldValue(rest, "HEADING"))
            }));
            body.split(/\n{2,}/).forEach(function (part) {
                if (part.trim()) next.main.push(block("paragraph", { html: textToHtml(part.trim()) }));
            });
            useful = true;
        } else if (head === "CLOSING") {
            sign = fieldValue(rest, "SIGN") || sign;
            const paragraphs = rest.replace(/^SIGN:.*$/gim, "").trim().split(/\n{2,}/).map(function (part) {
                return part.trim();
            }).filter(function (part) { return part && !/^SIGN:/i.test(part); });
            if (paragraphs.length) {
                next.main.push(block("closing", { paragraphs: paragraphs.map(textToHtml) }));
                useful = true;
            }
        } else if (head === "HEADING") {
            const style = /^label$/i.test(fieldValue(rest, "STYLE")) ? "label" : "bar";
            next.main.push(block("heading", { key: "", style: style, html: textToHtml(fieldValue(rest, "TEXT")) }));
            useful = true;
        } else if (head === "SPACER") {
            const size = Number(fieldValue(rest, "SIZE")) || 12;
            next.main.push(block("spacer", { size: Math.max(4, Math.min(48, size)) }));
            useful = true;
        } else if (head === "PHOTO") {
            next.sidebar.push(block("photo", {
                src: "",
                original: "",
                caption: textToHtml(fieldValue(rest, "CAPTION")),
                aspect: "3 / 4"
            }));
            useful = true;
        }
        applyChunkPaint(next, sideBefore, mainBefore, rest);
    });
    if (sign) next.main.push(block("signature", { html: textToHtml(sign) }));
    if (!useful) throw new Error(t("ui.parseError"));
    snapshot();
    doc = next;
    normalize(doc);
    selectedId = null;
    const nameInput = document.getElementById("pdf-name");
    nameInput.value = plainName();
    try { localStorage.setItem(STORAGE_NAME, nameInput.value); } catch (error) { /* ignore */ }
    showError("");
    applyLanguage();
    render();
    save();
}
