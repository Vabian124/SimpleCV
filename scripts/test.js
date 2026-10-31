/* CC0-1.0 — https://creativecommons.org/publicdomain/zero/1.0/ */
"use strict";

const fs = require("fs");
const path = require("path");
const { built } = require("./build.js");

const root = path.join(__dirname, "..");
const editor = fs.readFileSync(path.join(root, "editor.js"), "utf8");
if (built() !== editor) {
    console.error("editor.js does not match src/editor. Run npm run build.");
    process.exit(1);
}

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

pages.forEach(function (page) {
    const html = fs.readFileSync(path.join(root, page[0]), "utf8");
    const h1 = html.match(/<h1[\s>]/g) || [];
    if (h1.length !== 1) {
        console.error(page[0] + " has " + h1.length + " h1 elements");
        process.exit(1);
    }
    if (page[0] === "404.html") {
        if (html.indexOf('name="robots" content="noindex"') === -1) {
            console.error("404.html must stay noindex");
            process.exit(1);
        }
        if (html.indexOf('rel="canonical"') !== -1) {
            console.error("404.html must not canonicalize itself to the homepage");
            process.exit(1);
        }
        return;
    }
    const canonical = 'rel="canonical" href="' + page[1] + '"';
    if (html.indexOf(canonical) === -1) {
        console.error(page[0] + " is missing " + canonical);
        process.exit(1);
    }
});

if (editor.indexOf("function boot()") === -1 || editor.indexOf("\nboot();\n") === -1) {
    console.error("the built editor does not boot");
    process.exit(1);
}

console.log("ok");
