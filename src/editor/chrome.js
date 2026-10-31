/* CC0-1.0 — https://creativecommons.org/publicdomain/zero/1.0/ */
/* The on-device model, and the warning shown outside Chrome. */

function browserLooksLikeChrome() {
    const ua = navigator.userAgent || "";
    return /Chrome\/\d/.test(ua) && !/Edg\/|OPR\/|Firefox|FxiOS|SamsungBrowser|CriOS/.test(ua);
}

function chromeLimited() {
    return !browserLooksLikeChrome() && !chromeProceed;
}

function markChromeLimits() {
    const limited = chromeLimited();
    document.querySelectorAll("[data-chrome-only]").forEach(function (node) {
        node.classList.toggle("is-limited", limited);
        if (node.tagName === "BUTTON") node.setAttribute("aria-disabled", limited ? "true" : "false");
    });
}

function askChrome(note, action) {
    if (!chromeLimited()) {
        action();
        return;
    }
    chromeAction = action;
    document.querySelectorAll(".chrome-gate").forEach(function (gate) { gate.hidden = true; });
    if (!note) return;
    note.hidden = false;
    const go = note.querySelector("[data-chrome-go]");
    if (go) go.focus();
}

function allowChromeAndRun() {
    const action = chromeAction;
    chromeProceed = true;
    chromeAction = null;
    document.querySelectorAll(".chrome-gate").forEach(function (gate) { gate.hidden = true; });
    markChromeLimits();
    if (action) action();
}

function browserModelApi() {
    if (typeof LanguageModel !== "undefined") return LanguageModel;
    if (window.ai && window.ai.languageModel) return window.ai.languageModel;
    return null;
}

async function formatWithBrowserModel(text) {
    const api = browserModelApi();
    if (!api) throw new Error(t("guide.modelMissing"));
    const options = {
        expectedInputs: [{ type: "text", languages: ["en"] }],
        expectedOutputs: [{ type: "text", languages: ["en"] }]
    };
    let availability = "unavailable";
    try {
        availability = await api.availability(options);
    } catch (error) {
        try { availability = await api.availability(); } catch (again) { availability = "unavailable"; }
    }
    if (!availability || availability === "unavailable") throw new Error(t("guide.modelMissing"));
    const session = await api.create(Object.assign({}, options, {
        initialPrompts: [{
            role: "system",
            content: "Turn the user's CV or motivation letter into marked text. Output only the block from @@@CV or @@@LETTER through @@@END, with no markdown. Keep these English field names: NAME, ROLE, CITY, PHONE, EMAIL, BORN, TITLE, DATE, ORGANIZATION, SUMMARY, SUBJECT, TO, SIGN, HEADING, BODY. A point is a line starting with POINT: . Write the person's own words in the same language as the input. Use @@@CONTACT, @@@SKILLS, @@@STRENGTHS, @@@PROJECTS, @@@PROFILE, @@@JOB, @@@STUDY, @@@PARAGRAPH, @@@OPENING, @@@SECTION and @@@CLOSING where they fit."
        }]
    }));
    try {
        const answer = await session.prompt(text);
        applyMarked(typeof answer === "string" ? answer : String(answer || ""));
    } finally {
        if (session && session.destroy) session.destroy();
    }
}
