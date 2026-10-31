"use strict";

const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
    js.configs.recommended,
    {
        files: ["editor.js"],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "script",
            globals: Object.assign({}, globals.browser, {
                Cropper: "readonly",
                FONT_DATA: "readonly",
                dompdf: "readonly",
                PDFLib: "readonly"
            })
        },
        rules: {
            "no-empty": ["error", { allowEmptyCatch: true }],
            "no-unused-vars": ["error", { caughtErrors: "none" }]
        }
    },
    {
        files: ["scripts/**/*.js"],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "script",
            globals: globals.node
        }
    }
];
