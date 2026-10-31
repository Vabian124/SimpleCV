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
    const match = String(text || "").match(new RegExp("^" + key + ":[^\\S\\n]*(.*)$", "im"));
    return match ? match[1].trim() : "";
}

function photoAspect(value) {
    const text = String(value || "").toLowerCase().replace(/\s+/g, "");
    if (text === "1/1") return "1 / 1";
    if (text === "4/3") return "4 / 3";
    return "3 / 4";
}

function photoAddress(value) {
    const text = String(value || "").trim();
    if (/^https:\/\//i.test(text)) return text;
    if (/^data:image\/[a-z0-9.+-]+;base64,/i.test(text) && text.length <= 8000000) return text;
    return "";
}

function readPhotoFields(rest) {
    const width = Number(fieldValue(rest, "WIDTH"));
    const filled = /^(yes|ja|true|1)$/i.test(fieldValue(rest, "FILLED"));
    const url = photoAddress(fieldValue(rest, "URL"));
    const fields = {
        src: "",
        original: "",
        caption: textToHtml(fieldValue(rest, "CAPTION")),
        aspect: photoAspect(fieldValue(rest, "ASPECT")),
        url: /^data:image\//i.test(url) ? "" : url
    };
    if (width >= 36 && width <= 100) fields.width = Math.round(width);
    if (filled) fields.src = typeof placeholderPhoto === "function" ? placeholderPhoto() : "";
    if (/^data:image\//i.test(url)) fields.pending = url;
    return fields;
}

function placePhoto(next, rest) {
    const fields = readPhotoFields(rest);
    const item = block("photo", fields);
    if (fieldValue(rest, "COLUMN").toLowerCase() === "main") {
        next.main.push(item);
        return item;
    }
    const hasSidebarPhoto = next.sidebar.some(function (entry) { return entry.type === "photo"; });
    if (hasSidebarPhoto) {
        next.sidebar.push(item);
        return item;
    }
    const roleAt = next.sidebar.findIndex(function (entry) { return entry.type === "role"; });
    if (roleAt >= 0) {
        next.sidebar.splice(roleAt, 0, item);
        return item;
    }
    const nameAt = next.sidebar.findIndex(function (entry) { return entry.type === "name"; });
    if (nameAt >= 0) next.sidebar.splice(nameAt + 1, 0, item);
    else next.sidebar.unshift(item);
    return item;
}

function photoMarkedLines(item) {
    const fields = item.fields || {};
    const lines = ["@@@PHOTO", "CAPTION: " + markedText(fields.caption || "")];
    lines.push("ASPECT: " + (fields.aspect || "3 / 4"));
    const width = typeof photoWidth === "function" ? photoWidth(item) : (Number(fields.width) || 92);
    lines.push("WIDTH: " + width);
    if (fields.src) lines.push("FILLED: yes");
    if (/^https:\/\//i.test(String(fields.url || ""))) lines.push("URL: " + String(fields.url).trim());
    if (typeof columnOf === "function" && columnOf(item.id) === "main") lines.push("COLUMN: main");
    return lines;
}

function pointBody(line) {
    const trimmed = String(line || "").trim();
    if (trimmed.indexOf("POINT:") === 0) return trimmed.slice(6).trim();
    if (trimmed.indexOf("- ") === 0 || trimmed.indexOf("* ") === 0) return trimmed.slice(2).trim();
    return null;
}

function profileBody(rest) {
    const text = String(rest || "").trim();
    if (!text) return "";
    const summary = fieldValue(text, "SUMMARY");
    const other = text.replace(/^SUMMARY:[^\S\n]*.*$/gim, "").trim();
    if (summary && !other) return summary;
    return text;
}

function letterheadFilled(rest) {
    return ["TITLE", "DATE", "TO", "SUBJECT"].some(function (key) { return fieldValue(rest, key); });
}

function blankEntry(item) {
    return !item.title && !item.date && !item.org && !(item.items && item.items.length);
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
            lines.push("TITLE: " + markedText(letterhead.fields.title || ""));
            lines.push("DATE: " + markedText(letterhead.fields.date));
            lines.push("TO: " + markedText(letterhead.fields.to).replace(/\n/g, "<br>"));
            lines.push("SUBJECT: " + markedText(letterhead.fields.subject));
        }
        lines.push("SUMMARY: " + (intro ? markedText(intro.fields.html).replace(/\n/g, " ") : ""));
    }
    const sidePhotos = [];
    let leadPhoto = null;
    doc.sidebar.forEach(function (item, index) {
        if (item.type !== "photo") return;
        if (!leadPhoto) leadPhoto = item;
        else sidePhotos.push({ item: item, index: index });
    });
    let photoAt = 0;
    function flushSidebarPhotos(before) {
        while (photoAt < sidePhotos.length && sidePhotos[photoAt].index < before) {
            photoMarkedLines(sidePhotos[photoAt].item).forEach(function (line) { lines.push(line); });
            photoAt += 1;
        }
    }
    function sidebarSection(headingKey, type) {
        const index = doc.sidebar.findIndex(function (item) {
            if (headingKey && item.type === "heading" && item.fields.key === headingKey) return true;
            return item.type === type;
        });
        return index < 0 ? doc.sidebar.length + 1 : index;
    }
    if (leadPhoto) photoMarkedLines(leadPhoto).forEach(function (line) { lines.push(line); });
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
    flushSidebarPhotos(sidebarSection("doc.skills", "skill"));
    lines.push("@@@SKILLS");
    doc.sidebar.concat(doc.main).forEach(function (item) {
        if (item.type === "skill") lines.push("POINT: " + markedText(item.fields.html));
    });
    flushSidebarPhotos(sidebarSection("doc.strengths", "competence"));
    lines.push("@@@STRENGTHS");
    doc.sidebar.concat(doc.main).forEach(function (item) {
        if (item.type === "competence") lines.push("POINT: " + markedText(item.fields.title) + ": " + markedText(item.fields.body));
    });
    flushSidebarPhotos(sidebarSection("doc.projects", "project"));
    lines.push("@@@PROJECTS");
    doc.sidebar.concat(doc.main).forEach(function (item) {
        if (item.type === "project") lines.push("POINT: " + markedText(item.fields.title) + ": " + markedText(item.fields.body));
    });
    flushSidebarPhotos(doc.sidebar.length);
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
            lines.push("TITLE: " + markedText(item.fields.title || ""));
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
        } else if (item.type === "photo") {
            photoMarkedLines(item).forEach(function (line) { lines.push(line); });
        }
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
    photoLoads = [];
    const kind = /^@@@LETTER(?![A-Za-z])/.test(source.slice(start)) ? "letter" : "cv";
    const chunks = source.slice(start, end).split(/\n@@@/).map(function (chunk) { return chunk.trim(); }).filter(Boolean);
    return { kind: kind, chunks: chunks };
}

let photoLoads = [];

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
            const body = profileBody(rest);
            if (!body) return;
            next.main.push(barHeading("doc.profile"));
            next.main.push(block("intro", { html: textToHtml(body) }));
            useful = true;
        } else if (head === "JOB" || head === "STUDY") {
            const item = entryFrom(rest);
            if (blankEntry(item)) return;
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
            if (!letterheadFilled(rest)) return;
            next.main.push(makeLetterhead(
                textToHtml(fieldValue(rest, "DATE")),
                nameToHtml(fieldValue(rest, "TO")),
                textToHtml(fieldValue(rest, "SUBJECT")),
                textToHtml(fieldValue(rest, "TITLE"))
            ));
            useful = true;
        } else if (head === "SECTION") {
            const heading = fieldValue(rest, "HEADING");
            const bodyAt = rest.search(/^BODY:\s*/im);
            const body = bodyAt < 0 ? "" : rest.slice(bodyAt).replace(/^BODY:\s*/i, "");
            if (!heading && !body.trim()) return;
            if (heading) {
                next.main.push(block("heading", {
                    key: "",
                    style: parsed.kind === "letter" ? "label" : "bar",
                    html: textToHtml(heading)
                }));
            }
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
            const text = fieldValue(rest, "TEXT");
            if (!text) return;
            const style = /^label$/i.test(fieldValue(rest, "STYLE")) ? "label" : "bar";
            next.main.push(block("heading", { key: "", style: style, html: textToHtml(text) }));
            useful = true;
        } else if (head === "SPACER") {
            const size = Number(fieldValue(rest, "SIZE")) || 12;
            next.main.push(block("spacer", { size: Math.max(4, Math.min(48, size)) }));
            useful = true;
        } else if (head === "PHOTO") {
            const item = placePhoto(next, rest);
            if (item.fields.pending) {
                photoLoads.push([item, item.fields.pending]);
                delete item.fields.pending;
            }
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
    photoLoads.forEach(function (pair) { importPhotoAddress(pair[0], pair[1]); });
    doc.sidebar.concat(doc.main).forEach(function (item) {
        if (item.type === "photo" && /^https:\/\//i.test(item.fields.url || "")) importPhotoAddress(item, item.fields.url);
    });
}
