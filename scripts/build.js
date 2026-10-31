/* CC0-1.0 — https://creativecommons.org/publicdomain/zero/1.0/ */
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const order = [
    "constants.js",
    "i18n.js",
    "state.js",
    "templates.js",
    "history.js",
    "canvas.js",
    "stage.js",
    "exchange.js",
    "photo.js",
    "pdf.js",
    "fields.js",
    "setup.js",
    "shell.js",
    "routes.js",
    "boot.js"
];

function built() {
    return order.map(function (name) {
        return fs.readFileSync(path.join(root, "src", "editor", name), "utf8");
    }).join("");
}

function write() {
    const next = built();
    fs.writeFileSync(path.join(root, "editor.js"), next);
}

if (require.main === module) {
    const check = process.argv.indexOf("--check") !== -1;
    const next = built();
    const current = fs.readFileSync(path.join(root, "editor.js"), "utf8");
    if (check) {
        if (next !== current) {
            console.error("editor.js does not match src/editor. Run npm run build.");
            process.exit(1);
        }
        process.exit(0);
    }
    write();
}

module.exports = { built, order };
