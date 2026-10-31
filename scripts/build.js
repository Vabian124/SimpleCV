/* CC0-1.0 — https://creativecommons.org/publicdomain/zero/1.0/ */
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const order = [
    "constants.js",
    "state.js",
    "i18n-nl.js",
    "i18n-en.js",
    "i18n.js",
    "templates.js",
    "history.js",
    "loose.js",
    "marked.js",
    "drag.js",
    "canvas.js",
    "stage.js",
    "exchange.js",
    "photo.js",
    "pdf.js",
    "theme.js",
    "library.js",
    "language.js",
    "chrome.js",
    "tools.js",
    "guide.js",
    "setup.js",
    "shell.js",
    "routes.js",
    "catalog.js",
    "boot.js"
];
const cssOrder = [
    "base.css",
    "studio.css",
    "sheet.css",
    "blocks.css",
    "setup.css",
    "narrow.css",
    "pages.css"
];

function catalogSource() {
    const dir = path.join(root, "catalog");
    const names = fs.readdirSync(dir).filter(function (name) {
        return name.endsWith(".txt");
    }).sort();
    const lines = names.map(function (name) {
        const id = name.slice(0, -4);
        const text = fs.readFileSync(path.join(dir, name), "utf8").replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\s+$/, "");
        return "    " + JSON.stringify(id) + ": " + JSON.stringify(text);
    });
    return "const CATALOG = {\n" + lines.join(",\n") + "\n};\n";
}

function joined(dir, names) {
    return names.map(function (name) {
        const source = fs.readFileSync(path.join(root, dir, name), "utf8");
        if (name === "catalog.js") return catalogSource() + source;
        return source;
    }).join("");
}

function built() {
    return joined(path.join("src", "editor"), order);
}

function builtCss() {
    return joined(path.join("src", "css"), cssOrder);
}

function write() {
    fs.writeFileSync(path.join(root, "editor.js"), built());
    fs.writeFileSync(path.join(root, "styles.css"), builtCss());
}

if (require.main === module) {
    const check = process.argv.indexOf("--check") !== -1;
    const next = built();
    const nextCss = builtCss();
    const current = fs.readFileSync(path.join(root, "editor.js"), "utf8");
    const currentCss = fs.readFileSync(path.join(root, "styles.css"), "utf8");
    if (check) {
        if (next !== current) {
            console.error("editor.js does not match src/editor. Run npm run build.");
            process.exit(1);
        }
        if (nextCss !== currentCss) {
            console.error("styles.css does not match src/css. Run npm run build.");
            process.exit(1);
        }
        process.exit(0);
    }
    write();
}

module.exports = { built, builtCss, order, cssOrder };
