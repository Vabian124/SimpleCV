/* CC0-1.0 — https://creativecommons.org/publicdomain/zero/1.0/ */
/* The step-by-step questions and the document they build. */

function blankGuide() {
    return {
        name: "", role: "", city: "", phone: "", email: "", born: "",
        intro: "", skills: "",
        strengths: [], projects: [], jobs: [], studies: [],
        date: "", to: "", subject: "", body: "", closing: "", sign: ""
    };
}

function guidePlan() {
    const letter = setupState.kind === "letter";
    const contactInputs = [["city", "doc.city"], ["phone", "doc.phone"], ["email", "doc.email"]];
    if (!letter) contactInputs.push(["born", "doc.born"]);
    const steps = [
        { id: "name", title: "guide.nameTitle", hint: "guide.nameHint", inputs: [["name", "ph.name"]] },
        { id: "role", title: "guide.roleTitle", hint: "guide.roleHint", inputs: [["role", "ph.role"]] },
        { id: "contact", title: "guide.contactTitle", hint: "guide.contactHint", inputs: contactInputs }
    ];
    if (letter) {
        steps.push(
            { id: "letterhead", title: "guide.letterheadTitle", hint: "guide.letterheadHint", inputs: [["date", "ph.date"], ["subject", "ph.subject"]], area: ["to", "ph.to"] },
            { id: "intro", title: "guide.introTitle", hint: "guide.introHint", area: ["intro", "doc.intro"] },
            { id: "body", title: "guide.bodyTitle", hint: "guide.bodyHint", area: ["body", "guide.bodyTitle"] },
            { id: "close", title: "guide.closeTitle", hint: "guide.closeHint", inputs: [["closing", "guide.greeting"], ["sign", "ph.name"]] }
        );
        return steps;
    }
    steps.push(
        { id: "intro", title: "guide.introTitle", hint: "guide.introHint", area: ["intro", "doc.intro"] },
        { id: "job", title: "guide.workTitle", hint: "guide.workHint", repeat: "jobs", inputs: [["title", "guide.jobTitle"], ["date", "guide.period"], ["org", "ph.org"]], area: ["points", "guide.points"] },
        { id: "study", title: "guide.studyTitle", hint: "guide.studyHint", repeat: "studies", inputs: [["title", "guide.jobTitle"], ["date", "guide.period"], ["org", "ph.org"]], area: ["points", "guide.points"] },
        { id: "skills", title: "guide.skillsTitle", hint: "guide.skillsHint", area: ["skills", "guide.points"] },
        { id: "strength", title: "guide.strengthTitle", hint: "guide.strengthHint", repeat: "strengths", inputs: [["title", "ph.title"], ["body", "ph.text"]] },
        { id: "project", title: "guide.projectTitle", hint: "guide.projectHint", repeat: "projects", inputs: [["title", "ph.title"], ["body", "ph.text"]] }
    );
    return steps;
}

function readGuideInputs() {
    const values = {};
    document.querySelectorAll("#setup-guide [data-guide-key]").forEach(function (input) {
        values[input.dataset.guideKey] = input.value;
    });
    return values;
}

function storeGuideStep() {
    if (setupState.source !== "guided" || !setupState.answers) return;
    const step = guidePlan()[setupState.guideIndex || 0];
    if (!step || step.repeat) return;
    const values = readGuideInputs();
    Object.keys(values).forEach(function (key) { setupState.answers[key] = values[key]; });
}

function commitRepeat(step) {
    const values = readGuideInputs();
    const draft = {
        title: values.title || "",
        body: values.body || "",
        date: values.date || "",
        org: values.org || "",
        points: values.points || ""
    };
    if (!Object.keys(draft).some(function (key) { return String(draft[key]).trim(); })) return;
    setupState.answers[step.repeat].push(draft);
}

function guideControl(key, labelKey, value, multiline) {
    const input = document.createElement(multiline ? "textarea" : "input");
    if (!multiline) input.type = "text";
    else input.rows = 4;
    input.dataset.guideKey = key;
    input.value = value || "";
    input.placeholder = t(labelKey);
    input.lang = spellLocale();
    input.setAttribute("lang", input.lang);
    input.spellcheck = key !== "phone" && key !== "email" && key !== "born" && key !== "date";
    input.setAttribute("spellcheck", input.spellcheck ? "true" : "false");
    input.autocomplete = "off";
    input.enterKeyHint = multiline ? "enter" : "next";
    return h("label", { class: "field" }, [h("span", { text: t(labelKey) }), input]);
}

function renderGuide() {
    const host = document.getElementById("setup-guide");
    if (!host) return;
    if (!setupState.answers) setupState.answers = blankGuide();
    const steps = guidePlan();
    const index = Math.max(0, Math.min(setupState.guideIndex || 0, steps.length - 1));
    setupState.guideIndex = index;
    const step = steps[index];
    const answers = setupState.answers;
    host.replaceChildren(
        h("p", { class: "kicker", text: t("guide.step").replace("{n}", String(index + 1)).replace("{m}", String(steps.length)) }),
        h("h2", { text: t(step.title) }),
        h("p", { class: "setup-lead", text: t(step.hint) })
    );
    (step.inputs || []).forEach(function (pair) {
        host.appendChild(guideControl(pair[0], pair[1], step.repeat ? "" : answers[pair[0]], false));
    });
    if (step.area) host.appendChild(guideControl(step.area[0], step.area[1], step.repeat ? "" : answers[step.area[0]], true));
    if (step.repeat) {
        host.appendChild(h("p", { class: "note", text: t("guide.added").replace("{n}", String(answers[step.repeat].length)) }));
    }
    const skip = h("button", { type: "button", class: "btn", text: t("guide.leaveEmpty") });
    const another = h("button", { type: "button", class: "btn", text: t("guide.another") });
    const next = h("button", { type: "button", class: "btn-primary", text: index === steps.length - 1 ? t("guide.toColours") : t("guide.next") });
    if (!step.repeat) another.hidden = true;
    function refreshSkip() {
        const values = readGuideInputs();
        const typed = Object.keys(values).some(function (key) { return String(values[key] || "").trim(); });
        skip.textContent = typed ? t("guide.skip") : t("guide.leaveEmpty");
    }
    skip.addEventListener("click", function () {
        if (index >= steps.length - 1) {
            if (step.repeat) commitRepeat(step);
            else storeGuideStep();
            showSetupStep(3);
            syncRoute("push");
            focusPaletteCard();
            return;
        }
        moveGuide(1);
    });
    another.addEventListener("click", function () {
        commitRepeat(step);
        renderGuide();
    });
    next.addEventListener("click", pressGuidePrimary);
    host.appendChild(h("div", { class: "guide-actions" }, [skip, another, next]));
    host.querySelectorAll("input, textarea").forEach(function (input) {
        input.addEventListener("input", refreshSkip);
    });
    refreshSkip();
    const first = host.querySelector("input, textarea");
    if (first) {
        first.focus();
        if (first.setSelectionRange) first.setSelectionRange(first.value.length, first.value.length);
    }
}

function focusPaletteCard() {
    const card = document.querySelector("#view-setup [data-palette].is-selected") || document.querySelector("#view-setup [data-palette]");
    if (card) card.focus();
}

function pressGuidePrimary() {
    const steps = guidePlan();
    const index = Math.max(0, Math.min(setupState.guideIndex || 0, steps.length - 1));
    const step = steps[index];
    if (!step) return;
    if (step.repeat) commitRepeat(step);
    if (index >= steps.length - 1) {
        if (!step.repeat) storeGuideStep();
        showSetupStep(3);
        syncRoute("push");
        focusPaletteCard();
        return;
    }
    moveGuide(1);
}

function moveGuide(delta) {
    storeGuideStep();
    setupState.guideIndex = (setupState.guideIndex || 0) + delta;
    renderGuide();
    if (delta > 0) syncRoute("push");
}

function guideLines(text) {
    return String(text || "").split(/\n/).map(function (line) { return line.trim(); }).filter(Boolean);
}

function guideHtml(value) {
    const raw = String(value || "").trim();
    return raw ? textToHtml(raw) : "";
}

function guideFilled(value) {
    return String(value || "").trim().length > 0;
}

function buildGuideDocument() {
    const kind = setupState.kind === "letter" ? "letter" : "cv";
    const answers = setupState.answers || blankGuide();
    const side = [
        block("name", { html: guideFilled(answers.name) ? nameToHtml(answers.name.replace(/\n/g, "<br>")) : "" }),
        block("role", { html: guideHtml(answers.role) })
    ];
    const contactKeys = ["city", "phone", "email", "born"];
    const contacts = contactKeys.filter(function (key) { return guideFilled(answers[key]); });
    if (contacts.length) {
        side.push(barHeading("doc.contact"));
        contacts.forEach(function (key) {
            side.push(block("contact", { labelKey: key, label: "", html: guideHtml(answers[key]) }));
        });
    }
    const skills = guideLines(answers.skills);
    if (skills.length) {
        side.push(barHeading("doc.skills"));
        skills.forEach(function (skill) { side.push(block("skill", { html: textToHtml(skill) })); });
    }
    const projects = (answers.projects || []).filter(function (item) {
        return guideFilled(item.title) || guideFilled(item.body);
    });
    if (projects.length) {
        side.push(barHeading("doc.projects"));
        projects.forEach(function (item) {
            side.push(block("project", { title: guideHtml(item.title), body: guideHtml(item.body) }));
        });
    }
    const strengths = (answers.strengths || []).filter(function (item) {
        return guideFilled(item.title) || guideFilled(item.body);
    });
    if (strengths.length) {
        side.push(barHeading("doc.strengths"));
        strengths.forEach(function (item) {
            side.push(block("competence", { title: guideHtml(item.title), body: guideHtml(item.body) }));
        });
    }
    const main = [];
    if (kind === "letter") {
        main.push(makeLetterhead(guideHtml(answers.date), guideHtml(answers.to), guideHtml(answers.subject), ""));
    }
    if (guideFilled(answers.intro)) {
        if (kind !== "letter") main.push(barHeading("doc.profile"));
        main.push(block("intro", { html: guideHtml(answers.intro) }));
    }
    if (kind === "letter") {
        const parts = String(answers.body || "").split(/\n{2,}/).map(function (part) { return part.trim(); }).filter(Boolean);
        if (parts.length) parts.forEach(function (part) { main.push(block("paragraph", { html: textToHtml(part) })); });
        else main.push(block("paragraph", { html: "" }));
    }
    const jobs = (answers.jobs || []).filter(function (item) {
        return guideFilled(item.title) || guideFilled(item.date) || guideFilled(item.org) || guideFilled(item.points);
    });
    if (jobs.length) {
        main.push(barHeading("doc.work"));
        jobs.forEach(function (item) {
            const points = guideLines(item.points);
            main.push(block("timeline", {
                title: guideHtml(item.title),
                date: guideHtml(item.date),
                org: guideHtml(item.org),
                items: (points.length ? points : [""]).map(textToHtml)
            }));
        });
    }
    const studies = (answers.studies || []).filter(function (item) {
        return guideFilled(item.title) || guideFilled(item.date) || guideFilled(item.org) || guideFilled(item.points);
    });
    if (studies.length) {
        main.push(barHeading("doc.education"));
        studies.forEach(function (item) {
            const points = guideLines(item.points);
            main.push(block("timeline", {
                title: guideHtml(item.title),
                date: guideHtml(item.date),
                org: guideHtml(item.org),
                items: (points.length ? points : [""]).map(textToHtml)
            }));
        });
    }
    if (kind === "letter") {
        main.push(block("closing", { paragraphs: [guideHtml(answers.closing)] }));
        main.push(block("signature", { html: guideHtml(answers.sign || answers.name) }));
    }
    return {
        version: 1,
        lang: lang,
        kind: kind,
        theme: kind === "letter" ? letterTheme() : cvTheme(),
        sidebar: side,
        main: main
    };
}
