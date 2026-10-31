/* CC0-1.0 — https://creativecommons.org/publicdomain/zero/1.0/ */
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { built, builtCss } = require("./build.js");

const root = path.join(__dirname, "..");

function fail(message) {
    console.error(message);
    process.exit(1);
}

const editor = fs.readFileSync(path.join(root, "editor.js"), "utf8");
if (built() !== editor) fail("editor.js does not match src/editor. Run npm run build.");
const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
if (builtCss() !== css) fail("styles.css does not match src/css. Run npm run build.");

const pages = [
    ["index.html", "https://librecv.org/"],
    ["404.html", null],
    ["nl/index.html", "https://librecv.org/nl/"],
    ["nl/motivatiebrief/index.html", "https://librecv.org/nl/motivatiebrief/"],
    ["motivation-letter/index.html", "https://librecv.org/motivation-letter/"],
    ["templates/index.html", "https://librecv.org/templates/"],
    ["templates/software-engineer/index.html", "https://librecv.org/templates/software-engineer/"],
    ["templates/nursing/index.html", "https://librecv.org/templates/nursing/"]
];

const styleQueries = [];
pages.forEach(function (page) {
    const html = fs.readFileSync(path.join(root, page[0]), "utf8");
    const h1 = html.match(/<h1[\s>]/g) || [];
    if (h1.length !== 1) fail(page[0] + " has " + h1.length + " h1 elements");
    const style = html.match(/href="(\/styles\.css\?v=\d+)"/);
    if (!style) fail(page[0] + " does not load /styles.css?v=");
    styleQueries.push(style[1]);
    if (page[0] === "404.html") {
        if (html.indexOf('name="robots" content="noindex"') === -1) fail("404.html must stay noindex");
        if (html.indexOf('rel="canonical"') !== -1) fail("404.html must not canonicalize itself to the homepage");
        return;
    }
    const canonical = 'rel="canonical" href="' + page[1] + '"';
    if (html.indexOf(canonical) === -1) fail(page[0] + " is missing " + canonical);
    if (page[0] !== "index.html" && html.indexOf("editor.js") !== -1) fail(page[0] + " should not load editor.js");
});
if (styleQueries.some(function (query) { return query !== styleQueries[0]; })) {
    fail("stylesheet cache queries do not match");
}

const home = fs.readFileSync(path.join(root, "index.html"), "utf8");
const editorSrc = home.match(/src="(\/editor\.js\?v=\d+)"/);
if (!editorSrc) fail("index.html must load /editor.js?v=");

if (editor.indexOf("function boot()") === -1 || editor.indexOf("\nboot();\n") === -1) {
    fail("the built editor does not boot");
}

if (fs.existsSync(path.join(root, "vendor", "Sortable.min.js"))) fail("vendor/Sortable.min.js is unused");
if (/Sortable/i.test(fs.readFileSync(path.join(root, "NOTICE"), "utf8"))) fail("NOTICE still lists Sortable");

const faqBlock = home.split('id="faq"')[1].split("</details>")[0];
const faqJson = home.match(/<script type="application\/ld\+json" id="faq-ld">([\s\S]*?)<\/script>/);
if (!faqJson) fail("index.html is missing the FAQ schema");
JSON.parse(faqJson[1]).mainEntity.forEach(function (question) {
    if (faqBlock.indexOf(question.name) < 0) fail("FAQ question is not on the page: " + question.name);
    if (faqBlock.indexOf(question.acceptedAnswer.text) < 0) fail("FAQ answer is not on the page: " + question.name);
});

const strings = {};
vm.createContext(strings);
vm.runInContext(
    fs.readFileSync(path.join(root, "src", "editor", "i18n-nl.js"), "utf8") + "\n" +
    fs.readFileSync(path.join(root, "src", "editor", "i18n-en.js"), "utf8") +
    "\nthis.I18N_NL = I18N_NL;\nthis.I18N_EN = I18N_EN;\n",
    strings
);
["I18N_NL", "I18N_EN"].forEach(function (name) {
    const preamble = strings[name].mark.preamble;
    if (/@@@CV(?![A-Za-z])/.test(preamble) || /@@@LETTER(?![A-Za-z])/.test(preamble)) {
        fail(name + " guide preamble names the document tokens");
    }
});

const marked = { t: function () { return "parse"; } };
vm.createContext(marked);
vm.runInContext(
    "function placeholderPhoto() { return 'placeholder'; }\n" +
    "function escapeHtml(value) { return String(value); }\n" +
    "function block(type, fields) { return { id: 'x', type: type, fields: fields }; }\n" +
    fs.readFileSync(path.join(root, "src", "editor", "marked.js"), "utf8") +
    "\nthis.stripCodeFence = stripCodeFence;\nthis.parseMarked = parseMarked;\nthis.pointBody = pointBody;\nthis.fieldValue = fieldValue;\nthis.placePhoto = placePhoto;\nthis.photoAddress = photoAddress;\n",
    marked
);
const fenced = "Answer:\n```text\n@@@CV\nNAME: A\nPOINT: one\n@@@END\n```\n";
const unwrapped = marked.stripCodeFence(fenced);
if (unwrapped.indexOf("@@@CV") < 0 || unwrapped.indexOf("```") >= 0) fail("a code fence did not unwrap");
if (marked.parseMarked(fenced).kind !== "cv") fail("a fenced CV did not parse");
if (marked.pointBody("POINT: one") !== "one") fail("POINT: was not accepted");
if (marked.pointBody("- two") !== "two") fail("an old dash point was not accepted");
if (marked.pointBody("* three") !== "three") fail("an old star point was not accepted");
if (marked.pointBody("NAME: A") !== null) fail("a field line was read as a point");
const contact = "CITY: Brussels\nPHONE: \nEMAIL: \nBORN: 14-02-1967";
if (marked.fieldValue(contact, "PHONE") !== "") fail("an empty phone line took the next field");
if (marked.fieldValue(contact, "EMAIL") !== "") fail("an empty email line took the next field");
if (marked.fieldValue(contact, "BORN") !== "14-02-1967") fail("the birth date was not kept");
if (marked.fieldValue(contact, "CITY") !== "Brussels") fail("a filled contact line was lost");
if (marked.fieldValue("PHONE: +31 6 12", "PHONE") !== "+31 6 12") fail("a phone number was cut");
const page = { sidebar: [{ type: "name" }, { type: "role" }], main: [] };
marked.placePhoto(page, "CAPTION: \nASPECT: 1 / 1\nWIDTH: 80\nFILLED: yes\nURL: ");
if (page.sidebar.map(function (item) { return item.type; }).join(",") !== "name,photo,role") fail("the photo frame did not stay under the name");
const frame = page.sidebar[1].fields;
if (frame.aspect !== "1 / 1" || frame.width !== 80 || frame.src !== "placeholder" || frame.url) fail("the photo frame lost its shape");
marked.placePhoto(page, "ASPECT: 4 / 3\nCOLUMN: main\nWIDTH: 48");
if (!page.main.length || page.main[0].type !== "photo" || page.main[0].fields.aspect !== "4 / 3") fail("a main-column photo was moved");
const later = { sidebar: [{ type: "name" }, { type: "role" }, { type: "skill" }], main: [] };
marked.placePhoto(later, "FILLED: yes\nASPECT: 3 / 4\nWIDTH: 92");
if (later.sidebar[1].type !== "photo") fail("the first photo did not stay under the name");
marked.placePhoto(later, "ASPECT: 4 / 3\nWIDTH: 48");
if (later.sidebar[later.sidebar.length - 1].type !== "photo") fail("a later photo was not left where it was written");
if (marked.photoAddress("javascript:alert(1)") || marked.photoAddress("http://example.com/a.jpg")) fail("an unsafe image address was accepted");
if (marked.photoAddress("https://example.com/a.jpg") !== "https://example.com/a.jpg") fail("an https address was dropped");

console.log("ok");
