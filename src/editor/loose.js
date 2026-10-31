/* CC0-1.0 — https://creativecommons.org/publicdomain/zero/1.0/ */
/* Turn pasted plain text into CV or letter blocks. */

const SECTION_HEADS = [
    ["work", /^(werkervaring(?:en)?|experience|work experience|employment|loopbaan)$/i],
    ["study", /^(opleiding(?:en)?|education|studies?|scholing)$/i],
    ["skills", /^(vaardigheden|skills|kundigheden)$/i],
    ["strengths", /^(competenties|strengths|kernkwaliteiten)$/i],
    ["projects", /^(projecten|projects)$/i],
    ["profile", /^(profiel|profile|over mij|about(?: me)?|in het kort|samenvatting|summary)$/i],
    ["contact", /^(contact|contactgegevens)$/i]
];

function headingId(line) {
    const clean = String(line || "").trim().replace(/[:.]$/, "");
    for (let i = 0; i < SECTION_HEADS.length; i++) {
        if (SECTION_HEADS[i][1].test(clean)) return SECTION_HEADS[i][0];
    }
    return "";
}

function isBullet(line) {
    return /^([-*•]|\d+[.)])\s+/.test(String(line || "").trim());
}

function bulletText(line) {
    return String(line || "").trim().replace(/^([-*•]|\d+[.)])\s+/, "").trim();
}

function looksLikeDate(line) {
    const value = String(line || "").trim();
    if (!value || value.length > 42) return false;
    return /(\d{4}\s*[–—-]\s*(?:\d{4}|heden|present|nu|now))|((?:jan(?:uari)?|feb(?:ruari)?|mrt|maart|apr(?:il)?|mei|jun(?:i)?|jul(?:i)?|aug(?:ustus)?|sep(?:tember)?|okt(?:ober)?|nov(?:ember)?|dec(?:ember)?|january|february|march|april|may|june|july|august|september|october|november|december)[a-z.]*\s+\d{4})|^(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})$/i.test(value);
}

function buildCvData(data) {
    const next = { version: 1, lang: lang, kind: "cv", theme: doc.theme, sidebar: [], main: [] };
    next.sidebar.push(block("name", { html: textToHtml(data.name || t("ph.name")) }));
    next.sidebar.push(block("role", { html: textToHtml(data.role || t("ph.role")) }));
    const contacts = [
        ["city", data.city],
        ["phone", data.phone],
        ["email", data.email],
        ["born", data.born]
    ].filter(function (row) { return row[1]; });
    if (contacts.length) {
        next.sidebar.push(barHeading("doc.contact"));
        contacts.forEach(function (row) {
            next.sidebar.push(block("contact", { labelKey: row[0], label: "", html: textToHtml(row[1]) }));
        });
    }
    const skills = data.skills || [];
    if (skills.length) {
        next.sidebar.push(barHeading("doc.skills"));
        skills.forEach(function (skill) { next.sidebar.push(block("skill", { html: textToHtml(skill) })); });
    }
    (data.strengths || []).forEach(function (item, index) {
        if (index === 0) next.sidebar.push(barHeading("doc.strengths"));
        next.sidebar.push(block("competence", { title: textToHtml(item.title), body: textToHtml(item.body) }));
    });
    (data.projects || []).forEach(function (item, index) {
        if (index === 0) next.sidebar.push(barHeading("doc.projects"));
        next.sidebar.push(block("project", { title: textToHtml(item.title), body: textToHtml(item.body) }));
    });
    if (data.intro) {
        next.main.push(barHeading("doc.profile"));
        next.main.push(block("intro", { html: textToHtml(data.intro) }));
    }
    if ((data.jobs || []).length) {
        next.main.push(barHeading("doc.work"));
        data.jobs.forEach(function (item) { pushTimeline(next.main, item); });
    }
    if ((data.studies || []).length) {
        next.main.push(barHeading("doc.education"));
        data.studies.forEach(function (item) { pushTimeline(next.main, item); });
    }
    return next;
}

function buildLetterData(data) {
    const next = { version: 1, lang: lang, kind: "letter", theme: doc.theme, sidebar: [], main: [] };
    next.sidebar.push(block("name", { html: textToHtml(data.name || t("ph.name")) }));
    next.sidebar.push(block("role", { html: textToHtml(data.role || t("ph.role")) }));
    const contacts = [["city", data.city], ["phone", data.phone], ["email", data.email]].filter(function (row) { return row[1]; });
    if (contacts.length) {
        next.sidebar.push(barHeading("doc.contact"));
        contacts.forEach(function (row) {
            next.sidebar.push(block("contact", { labelKey: row[0], label: "", html: textToHtml(row[1]) }));
        });
    }
    const head = data.letter || {};
    next.main.push(makeLetterhead(
        textToHtml(head.date || ""),
        nameToHtml(head.to || ""),
        textToHtml(head.subject || ""),
        ""
    ));
    if (data.intro) next.main.push(block("intro", { html: textToHtml(data.intro) }));
    (head.paragraphs || []).forEach(function (paragraph) {
        next.main.push(block("paragraph", { html: textToHtml(paragraph) }));
    });
    if (head.closing) next.main.push(block("closing", { paragraphs: [textToHtml(head.closing)] }));
    if (head.sign || data.name) next.main.push(block("signature", { html: textToHtml(head.sign || data.name || "") }));
    return next;
}

function parseLoose(text, kind) {
    const lines = String(text || "").replace(/\r/g, "").split("\n");
    const flat = lines.join("\n");
    const email = (flat.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i) || [""])[0];
    const phoneMatch = flat.match(/(?:\+\d{1,3}[\s().-]*)?(?:\(?0\)?[\s.-]*)?\d(?:[\s().-]*\d){8,12}/);
    const phone = phoneMatch ? phoneMatch[0].replace(/\s+/g, " ").trim() : "";
    const born = (lines.map(function (line) { return line.trim(); }).find(function (line) { return /^\d{2}[-/.]\d{2}[-/.]\d{4}$/.test(line); }) || "");
    const sections = { preamble: [], profile: [], skills: [], strengths: [], projects: [], work: [], study: [], contact: [] };
    let current = "preamble";
    lines.forEach(function (line) {
        const id = headingId(line);
        if (id) {
            current = id;
            return;
        }
        sections[current].push(line);
    });
    function grouped(list) {
        const chunks = [];
        let buf = [];
        function flush() {
            if (buf.some(function (line) { return line.trim(); })) chunks.push(buf);
            buf = [];
        }
        list.forEach(function (line) {
            if (!line.trim()) flush();
            else buf.push(line);
        });
        flush();
        return chunks.map(function (chunk) {
            const bullets = [];
            const heads = [];
            chunk.forEach(function (line) {
                if (isBullet(line)) bullets.push(bulletText(line));
                else heads.push(line.trim());
            });
            const date = heads.find(looksLikeDate) || "";
            const rest = heads.filter(function (line) { return line !== date; });
            return { title: rest[0] || "", org: rest.slice(1).join(", "), date: date, items: bullets };
        }).filter(function (entry) { return entry.title || entry.org || entry.date || entry.items.length; });
    }
    const preamble = sections.preamble.map(function (line) { return line.trim(); }).filter(Boolean);
    const leftovers = preamble.filter(function (line) {
        if (email && line.indexOf(email) >= 0) return false;
        if (phone && line.replace(/\s/g, "").indexOf(phone.replace(/\s/g, "")) >= 0) return false;
        if (born && line === born) return false;
        if (isBullet(line)) return false;
        return true;
    });
    let name = "";
    let role = "";
    if (kind !== "letter") {
        name = leftovers.find(function (line) {
            return line.length < 42 && line.split(/\s+/).length <= 5 && !looksLikeDate(line) && line.indexOf(":") < 0;
        }) || "";
        const after = leftovers.slice(leftovers.indexOf(name) + 1);
        role = after.find(function (line) {
            return line.length < 48 && line.split(/\s+/).length <= 7 && !looksLikeDate(line);
        }) || "";
        if (role.length > 40) role = "";
    }
    const used = {};
    [name, role, email, phone, born].forEach(function (value) { if (value) used[value] = true; });
    const city = leftovers.find(function (line) {
        return !used[line] && line.length < 32 && !looksLikeDate(line) && line.indexOf("@") < 0 && !/\d{3}/.test(line) && line.split(/\s+/).length <= 3;
    }) || "";
    if (city) used[city] = true;
    const introLines = [];
    if (kind !== "letter") {
        leftovers.forEach(function (line) { if (!used[line]) introLines.push(line); });
        sections.profile.forEach(function (line) { if (line.trim()) introLines.push(line.trim()); });
    }
    function titled(list) {
        return list.map(function (line) { return line.trim(); }).filter(Boolean).map(function (line) {
            const value = isBullet(line) ? bulletText(line) : line;
            const split = value.indexOf(":");
            return split < 0
                ? { title: value, body: "" }
                : { title: value.slice(0, split).trim(), body: value.slice(split + 1).trim() };
        });
    }
    const skills = sections.skills.map(function (line) { return line.trim(); }).filter(Boolean).map(function (line) {
        return isBullet(line) ? bulletText(line) : line;
    });
    if (!skills.length && kind !== "letter") {
        preamble.filter(isBullet).forEach(function (line) { skills.push(bulletText(line)); });
    }
    const data = {
        name: name,
        role: role,
        city: city,
        phone: phone,
        email: email,
        born: born,
        intro: introLines.join("\n").trim(),
        skills: skills,
        strengths: titled(sections.strengths),
        projects: titled(sections.projects),
        jobs: grouped(sections.work),
        studies: grouped(sections.study),
        letter: null
    };
    if (kind === "letter") {
        const bodyLines = lines.map(function (line) { return line.trim(); });
        const subjectLine = bodyLines.find(function (line) { return /^(onderwerp|betreft|subject|re)\s*:/i.test(line); }) || "";
        const greetAt = bodyLines.findIndex(function (line) { return /^(beste|geachte|dear|hi|hallo)\b/i.test(line); });
        const closeAt = bodyLines.findIndex(function (line) { return /^(met vriendelijke groet|hoogachtend|kind regards|yours sincerely|sincerely|groeten)\b/i.test(line); });
        const date = bodyLines.find(function (line) { return looksLikeDate(line); }) || "";
        const topEnd = greetAt > 0 ? greetAt : Math.min(bodyLines.length, 8);
        const top = bodyLines.slice(0, topEnd).filter(Boolean).filter(function (line) {
            return line !== date && line !== subjectLine && line.indexOf(email) < 0 && line !== phone && !headingId(line);
        });
        const person = top.length ? top[0] : "";
        const start = greetAt >= 0 ? greetAt + 1 : 0;
        const end = closeAt >= 0 ? closeAt : bodyLines.length;
        const paragraphs = bodyLines.slice(start, end).join("\n").split(/\n{2,}/).map(function (part) { return part.trim(); }).filter(Boolean);
        const after = closeAt >= 0 ? bodyLines.slice(closeAt + 1).filter(Boolean) : [];
        data.name = person || data.name;
        data.letter = {
            date: date,
            to: top.filter(function (line) { return line !== person; }).join("\n"),
            subject: subjectLine.replace(/^(onderwerp|betreft|subject|re)\s*:\s*/i, ""),
            paragraphs: paragraphs,
            closing: closeAt >= 0 ? bodyLines[closeAt] : "",
            sign: after.length ? after[after.length - 1] : person
        };
    }
    return data;
}

function installDocument(next, keepTheme) {
    if (keepTheme && doc) next.theme = doc.theme;
    snapshot();
    doc = next;
    normalize(doc);
    selectedId = null;
    filenameCustom = false;
    syncFilenameFromPerson();
    showError("");
    applyLanguage();
    render();
    documentLive = true;
    save();
}

function describeLoose(data) {
    const bits = [];
    if (data.name) bits.push(data.name);
    if (data.role) bits.push(data.role);
    if (data.skills && data.skills.length) bits.push(t("doc.skills") + " " + data.skills.length);
    if (data.jobs && data.jobs.length) bits.push(t("doc.work") + " " + data.jobs.length);
    if (data.studies && data.studies.length) bits.push(t("doc.education") + " " + data.studies.length);
    if (data.letter && data.letter.paragraphs && data.letter.paragraphs.length) bits.push(t("shell.body"));
    return bits.join(", ");
}

function applyLooseText(text, kind) {
    const data = parseLoose(text, kind);
    if (kind === "letter" && data.letter) installDocument(buildLetterData(data), true);
    else installDocument(buildCvData(data), true);
    return data;
}
