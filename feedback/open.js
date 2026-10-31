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
        script.src = "/feedback/form.js?v=1";
        script.onload = function () {
            pending = false;
            show();
        };
        script.onerror = function () {
            pending = false;
        };
        document.head.appendChild(script);
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
