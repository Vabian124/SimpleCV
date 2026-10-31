/* CC0-1.0 — https://creativecommons.org/publicdomain/zero/1.0/ */
"use strict";

(function () {
    var pending = false;

    function show() {
        if (window.LibreCVFeedback) window.LibreCVFeedback.open();
    }

    function load() {
        if (window.LibreCVFeedback) {
            show();
            return;
        }
        if (pending) return;
        pending = true;
        var script = document.createElement("script");
        script.src = "/feedback/form.js?v=2";
        script.onload = function () {
            pending = false;
            show();
        };
        script.onerror = function () {
            pending = false;
        };
        document.head.appendChild(script);
    }

    if (document.body && document.body.hasAttribute("data-feedback-open")) {
        var query = new URLSearchParams(window.location.search).get("lang");
        var lang = query === "nl" || query === "en" ? query : "en";
        document.documentElement.lang = lang;
        document.querySelectorAll("[data-en][data-nl]").forEach(function (node) {
            var text = node.getAttribute("data-" + lang);
            if (text) node.textContent = text;
        });
        document.querySelectorAll(".lang-switch a").forEach(function (link) {
            var href = link.getAttribute("href") || "";
            if (href.indexOf("lang=" + lang) !== -1) link.setAttribute("aria-current", "page");
            else link.removeAttribute("aria-current");
        });
    }

    document.addEventListener("click", function (event) {
        var target = event.target;
        var node = target && target.closest ? target.closest("[data-feedback]") : null;
        if (!node) return;
        event.preventDefault();
        load();
    });

    if (document.body && document.body.hasAttribute("data-feedback-open")) load();
}());
