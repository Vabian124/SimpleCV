/* CC0-1.0 — https://creativecommons.org/publicdomain/zero/1.0/ */
"use strict";

(function () {
    if (window.LibreCVFeedback) return;

    var COPY = {
        en: {
            title: "Feedback",
            lead: "A private note stays in this site's inbox. A GitHub issue is public.",
            kind: "What is this?",
            choose: "Choose",
            kinds: ["A problem", "An idea", "Something confusing", "Something that worked", "Something else"],
            message: "What should we know?",
            placeholder: "What you expected, and what you saw.",
            email: "Email, if you want a reply",
            page: "Include this page address",
            browser: "Include the browser and window size",
            document: "Include the CV or letter text",
            documentMissing: "There is no document open on this page.",
            documentHint: "The picture file stays on this computer. The text is stored with the note. A GitHub issue would publish it.",
            send: "Send privately",
            github: "Open a GitHub issue",
            close: "Close",
            checking: "Checking…",
            sending: "Sending…",
            thanks: "Sent. Thank you.",
            thanksCut: "Sent. The document text was shortened to fit.",
            fail: "That did not send. Try again in a moment.",
            short: "Write a few words first.",
            emailBad: "That email address does not look right.",
            extra: "An extra field was filled in. Send it again.",
            soon: "Wait a moment, then send it again.",
            work: "The check did not finish. Try again.",
            limit: "Too many notes from this network. Try again later.",
            long: "That is too long.",
            noDocument: "There is no document text to include.",
            githubWarn: "A GitHub issue is public. The document text would be in the issue. Continue?",
            githubLong: "The document is too long for a GitHub link. Open the issue without the document?",
            popup: "The browser blocked the tab.",
            leave: "Leave this empty"
        },
        nl: {
            title: "Feedback",
            lead: "Een privénotitie blijft in de inbox van deze site. Een GitHub-issue is openbaar.",
            kind: "Waar gaat het over?",
            choose: "Kies",
            kinds: ["Een probleem", "Een idee", "Iets onduidelijks", "Iets dat goed werkte", "Iets anders"],
            message: "Wat moeten we weten?",
            placeholder: "Wat je verwachtte, en wat je zag.",
            email: "E-mail, als je een antwoord wilt",
            page: "Dit pagina-adres meesturen",
            browser: "Browser en venstergrootte meesturen",
            document: "De tekst van de CV of brief meesturen",
            documentMissing: "Er staat op deze pagina geen document open.",
            documentHint: "Het fotobestand blijft op deze computer. De tekst gaat mee met de notitie. In een GitHub-issue zou die tekst openbaar worden.",
            send: "Privé versturen",
            github: "GitHub-issue openen",
            close: "Sluiten",
            checking: "Even controleren…",
            sending: "Versturen…",
            thanks: "Verstuurd. Dank je.",
            thanksCut: "Verstuurd. De tekst van het document is ingekort.",
            fail: "Dit ging niet weg. Probeer het zo meteen opnieuw.",
            short: "Schrijf eerst een paar woorden.",
            emailBad: "Dat e-mailadres klopt niet.",
            extra: "Er was een extra veld ingevuld. Verstuur opnieuw.",
            soon: "Wacht een ogenblik en verstuur dan opnieuw.",
            work: "De controle lukte niet. Probeer het opnieuw.",
            limit: "Te veel notities vanaf dit netwerk. Probeer het later opnieuw.",
            long: "Dat is te lang.",
            noDocument: "Er is geen documenttekst om mee te sturen.",
            githubWarn: "Een GitHub-issue is openbaar. De tekst van het document komt in het issue te staan. Doorgaan?",
            githubLong: "Het document is te lang voor een GitHub-link. Het issue openen zonder die tekst?",
            popup: "De browser blokkeerde het tabblad.",
            leave: "Laat dit leeg"
        }
    };

    var KIND_KEYS = ["problem", "idea", "confusion", "praise", "other"];
    var GITHUB_KIND = {
        problem: "A problem",
        idea: "An idea",
        confusion: "Something confusing",
        praise: "Something that worked",
        other: "Something else"
    };

    var dialog = null;
    var work = null;
    var workId = 0;
    var status = null;
    var kindInput = null;
    var messageInput = null;
    var emailInput = null;
    var pageInput = null;
    var browserInput = null;
    var documentInput = null;
    var documentHint = null;
    var documentLabel = null;
    var leaveInput = null;
    var sendButton = null;
    var challenge = null;
    var busy = false;
    var generation = 0;
    var lastFocus = null;

    function uiLang() {
        var query = new URLSearchParams(window.location.search).get("lang");
        if (document.body.hasAttribute("data-feedback-open") && (query === "nl" || query === "en")) return query;
        return document.documentElement.lang === "nl" ? "nl" : "en";
    }

    function copy() {
        return uiLang() === "nl" ? COPY.nl : COPY.en;
    }

    function el(tag, attrs, children) {
        var node = document.createElement(tag);
        Object.keys(attrs || {}).forEach(function (key) {
            if (key === "class") node.className = attrs[key];
            else if (key === "text") node.textContent = attrs[key];
            else node.setAttribute(key, attrs[key]);
        });
        (children || []).forEach(function (child) {
            if (child) node.appendChild(child);
        });
        return node;
    }

    function setStatus(text, bad) {
        status.textContent = text;
        status.classList.toggle("is-bad", !!bad && text !== "");
        status.classList.toggle("is-good", !bad && text !== "");
    }

    function documentText() {
        if (typeof globalThis.exportMarked !== "function") return "";
        try {
            return String(globalThis.exportMarked() || "");
        } catch (error) {
            return "";
        }
    }

    function documentKind(text) {
        if (text.indexOf("@@@LETTER") === 0) return "letter";
        if (text.indexOf("@@@CV") === 0) return "cv";
        return "";
    }

    function pageAddress() {
        var url = new URL(window.location.href);
        url.hash = "";
        return url.toString();
    }

    function hex(buffer) {
        var bytes = new Uint8Array(buffer);
        var out = "";
        for (var i = 0; i < bytes.length; i += 1) {
            out += bytes[i].toString(16).padStart(2, "0");
        }
        return out;
    }

    function solve(task, alive) {
        var max = Number(task.maxnumber);
        var salt = String(task.salt || "");
        var target = String(task.challenge || "");
        var encoder = new TextEncoder();
        return new Promise(function (resolve, reject) {
            if (!window.crypto || !window.crypto.subtle || !max || !alive()) {
                reject(new Error("work"));
                return;
            }
            var n = 0;
            var inflight = 0;
            var settled = false;
            var lastYield = Date.now();
            function finish(value) {
                if (settled) return;
                settled = true;
                if (value === null) reject(new Error("work"));
                else resolve(value);
            }
            function pump() {
                if (settled) return;
                if (!alive()) {
                    if (inflight === 0) finish(null);
                    return;
                }
                while (inflight < 4 && n <= max) {
                    let current = n;
                    n += 1;
                    inflight += 1;
                    window.crypto.subtle.digest("SHA-256", encoder.encode(salt + String(current))).then(function (buffer) {
                        inflight -= 1;
                        if (!settled && hex(buffer) === target) finish(String(current));
                        if (settled) return;
                        if (Date.now() - lastYield > 200) {
                            lastYield = Date.now();
                            window.setTimeout(pump, 0);
                        } else {
                            pump();
                        }
                    }).catch(function () {
                        inflight -= 1;
                        finish(null);
                    });
                }
                if (!settled && inflight === 0 && n > max) finish(null);
            }
            pump();
        });
    }

    function wait(ms) {
        return new Promise(function (resolve) {
            window.setTimeout(resolve, ms);
        });
    }

    function fetchChallenge() {
        return fetch("/feedback/challenge.php", {
            headers: { Accept: "application/json" },
            cache: "no-store",
            credentials: "omit"
        }).then(function (response) {
            return response.json().then(function (data) {
                if (!response.ok || !data || !data.ok) {
                    var error = new Error("work");
                    error.code = data && data.error ? data.error : "work";
                    throw error;
                }
                data.received = Date.now();
                return data;
            });
        });
    }

    function refreshDocument() {
        var text = copy();
        var available = typeof globalThis.exportMarked === "function";
        documentInput.disabled = !available;
        documentLabel.classList.toggle("is-off", !available);
        if (!available) documentInput.checked = false;
        documentHint.textContent = available ? text.documentHint : text.documentMissing;
    }

    function checkedAttach() {
        var attach = [];
        if (pageInput.checked) attach.push("page");
        if (browserInput.checked) attach.push("browser");
        if (documentInput.checked) attach.push("document");
        return attach;
    }

    function chosenDocument() {
        if (!documentInput.checked) return "";
        return documentText();
    }

    function applyCopy() {
        var text = copy();
        dialog.querySelector("h2").textContent = text.title;
        dialog.querySelector(".feedback-lead").textContent = text.lead;
        kindInput.setAttribute("aria-label", text.kind);
        dialog.querySelector("[data-label='kind']").textContent = text.kind;
        messageInput.setAttribute("aria-label", text.message);
        messageInput.placeholder = text.placeholder;
        dialog.querySelector("[data-label='message']").textContent = text.message;
        dialog.querySelector("[data-label='email']").textContent = text.email;
        pageInput.parentNode.lastChild.textContent = text.page;
        browserInput.parentNode.lastChild.textContent = text.browser;
        documentInput.parentNode.lastChild.textContent = text.document;
        sendButton.textContent = text.send;
        dialog.querySelector("[data-github]").textContent = text.github;
        dialog.querySelector("[data-close]").textContent = text.close;
        leaveInput.setAttribute("aria-label", text.leave);
        var labels = kindInput.querySelectorAll("option");
        labels[0].textContent = text.choose;
        text.kinds.forEach(function (label, index) {
            labels[index + 1].textContent = label;
        });
        refreshDocument();
    }

    function build() {
        var text = copy();
        kindInput = el("select", { id: "fb-kind", required: "required" });
        kindInput.appendChild(el("option", { value: "", text: text.choose }));
        KIND_KEYS.forEach(function (key, index) {
            kindInput.appendChild(el("option", { value: key, text: text.kinds[index] }));
        });
        messageInput = el("textarea", { id: "fb-message", required: "required", minlength: "4", maxlength: "8000", rows: "5" });
        emailInput = el("input", { id: "fb-email", type: "email", maxlength: "200", autocomplete: "email" });
        pageInput = el("input", { type: "checkbox", id: "fb-page" });
        pageInput.checked = true;
        browserInput = el("input", { type: "checkbox", id: "fb-browser" });
        documentInput = el("input", { type: "checkbox", id: "fb-document" });
        leaveInput = el("input", { name: "leave", tabindex: "-1", autocomplete: "off" });
        sendButton = el("button", { class: "btn-primary", type: "submit", text: text.send });
        status = el("p", { class: "feedback-status", role: "status" });
        documentHint = el("p", { class: "feedback-hint" });
        var github = el("button", { class: "quiet-link", type: "button", "data-github": "", text: text.github });
        var closeButton = el("button", { class: "btn", type: "button", "data-close": "", text: text.close });
        documentLabel = el("label", {}, [documentInput, document.createTextNode(text.document)]);
        var form = el("form", { autocomplete: "off" }, [
            el("label", { class: "feedback-field" }, [
                el("span", { "data-label": "kind", text: text.kind }),
                kindInput
            ]),
            el("label", { class: "feedback-field" }, [
                el("span", { "data-label": "message", text: text.message }),
                messageInput
            ]),
            el("label", { class: "feedback-field" }, [
                el("span", { "data-label": "email", text: text.email }),
                emailInput
            ]),
            el("div", { class: "feedback-checks" }, [
                el("label", {}, [pageInput, document.createTextNode(text.page)]),
                el("label", {}, [browserInput, document.createTextNode(text.browser)]),
                documentLabel
            ]),
            documentHint,
            el("div", { class: "feedback-trap", "aria-hidden": "true" }, [
                el("label", {}, [document.createTextNode(text.leave), leaveInput])
            ]),
            el("div", { class: "feedback-actions" }, [sendButton, github]),
            status
        ]);
        var card = el("div", { class: "feedback-card" }, [
            el("div", { class: "feedback-head" }, [
                el("div", {}, [
                    el("p", { class: "feedback-kicker", text: "LibreCV" }),
                    el("h2", { id: "fb-title", text: text.title })
                ]),
                closeButton
            ]),
            el("p", { class: "feedback-lead", id: "fb-lead", text: text.lead }),
            form
        ]);
        dialog = el("div", { class: "feedback-dialog", role: "dialog", "aria-modal": "true", "aria-labelledby": "fb-title", "aria-describedby": "fb-lead" }, [card]);
        form.addEventListener("submit", function (event) {
            event.preventDefault();
            sendPrivate();
        });
        github.addEventListener("click", openGithub);
        closeButton.addEventListener("click", close);
        dialog.addEventListener("click", function (event) {
            if (event.target === dialog) close();
        });
        dialog.addEventListener("keydown", trapKeys);
        document.body.appendChild(dialog);
        refreshDocument();
    }

    function focusable() {
        return Array.prototype.filter.call(dialog.querySelectorAll("button, input, select, textarea, a[href]"), function (node) {
            return !node.disabled && node.tabIndex !== -1 && !node.closest(".feedback-trap");
        });
    }

    function trapKeys(event) {
        if (event.key === "Escape") {
            event.preventDefault();
            close();
            return;
        }
        if (event.key !== "Tab") return;
        var nodes = focusable();
        if (!nodes.length) return;
        var first = nodes[0];
        var last = nodes[nodes.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }

    function close() {
        generation += 1;
        busy = false;
        if (!dialog) return;
        dialog.hidden = true;
        if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    function open() {
        if (!dialog) build();
        applyCopy();
        generation += 1;
        var gen = generation;
        lastFocus = document.activeElement;
        dialog.hidden = false;
        setStatus("", false);
        kindInput.focus();
        startWork(gen);
    }

    function startWork(gen) {
        workId += 1;
        var id = workId;
        work = fetchChallenge().then(function (task) {
            if (gen !== generation || id !== workId) return null;
            return solve(task, function () {
                return gen === generation && id === workId;
            }).then(function (number) {
                if (gen !== generation || id !== workId) return null;
                return { task: task, number: number };
            });
        }).catch(function () {
            return null;
        });
        return work;
    }

    function errorText(code) {
        var text = copy();
        if (code === "short") return text.short;
        if (code === "email") return text.emailBad;
        if (code === "extra") return text.extra;
        if (code === "soon") return text.soon;
        if (code === "work") return text.work;
        if (code === "limit") return text.limit;
        if (code === "long") return text.long;
        return text.fail;
    }

    function payload(number, marked) {
        var attach = checkedAttach();
        var body = {
            algorithm: challenge.algorithm,
            challenge: challenge.challenge,
            salt: challenge.salt,
            signature: challenge.signature,
            number: number,
            kind: kindInput.value,
            message: messageInput.value.trim(),
            email: emailInput.value.trim(),
            leave: leaveInput.value,
            attach: attach
        };
        if (attach.indexOf("page") !== -1) {
            body.page = pageAddress();
            body.lang = uiLang();
        }
        if (attach.indexOf("browser") !== -1) {
            body.ua = navigator.userAgent || "";
            body.viewport = String(window.innerWidth) + "x" + String(window.innerHeight);
        }
        if (attach.indexOf("document") !== -1) {
            body.marked = marked;
            body.docKind = documentKind(marked);
        }
        return body;
    }

    function sendPrivate() {
        var text = copy();
        if (busy) return;
        if (!kindInput.value || messageInput.value.trim().length < 4) {
            setStatus(text.short, true);
            return;
        }
        var marked = chosenDocument();
        if (documentInput.checked && !marked) {
            setStatus(text.noDocument, true);
            return;
        }
        var shortened = false;
        if (marked.length > 40000) {
            marked = marked.slice(0, 40000);
            shortened = true;
        }
        busy = true;
        sendButton.disabled = true;
        setStatus(text.checking, false);
        var gen = generation;
        var attempt = 0;

        function finish(message, bad) {
            if (gen !== generation) return;
            busy = false;
            sendButton.disabled = false;
            setStatus(message, bad);
        }

        function post(number) {
            return fetch("/feedback/submit.php", {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                credentials: "omit",
                cache: "no-store",
                body: JSON.stringify(payload(number, marked))
            }).then(function (response) {
                return response.json().catch(function () {
                    return null;
                }).then(function (data) {
                    return { response: response, data: data };
                });
            });
        }

        function run() {
            var pending = work || startWork(gen);
            return pending.then(function (solved) {
                if (gen !== generation) return null;
                if (!solved) return null;
                var age = Date.now() - Number(solved.task.received || 0);
                var delay = age >= 2000 ? 0 : 2000 - age;
                return wait(delay).then(function () {
                    if (gen !== generation) return null;
                    challenge = solved.task;
                    setStatus(text.sending, false);
                    return post(solved.number);
                });
            }).then(function (result) {
                if (gen !== generation) return;
                if (!result) {
                    if (attempt < 1) {
                        attempt += 1;
                        return startWork(gen).then(run);
                    }
                    finish(text.work, true);
                    return;
                }
                if (result.data && result.data.ok) {
                    work = null;
                    messageInput.value = "";
                    finish(shortened ? text.thanksCut : text.thanks, false);
                    return;
                }
                var code = result.data && result.data.error ? result.data.error : "fail";
                if ((code === "work" || code === "soon") && attempt < 1) {
                    attempt += 1;
                    return startWork(gen).then(run);
                }
                finish(errorText(code), true);
            });
        }

        run().catch(function () {
            finish(text.fail, true);
        });
    }

    function githubUrl(body, page, email) {
        var params = new URLSearchParams();
        params.set("template", "feedback.yml");
        params.set("title", "Feedback");
        params.set("kind", GITHUB_KIND[kindInput.value] || "Something else");
        params.set("message", body);
        if (page) params.set("page", page);
        if (email) params.set("contact", email);
        return "https://github.com/Vabian124/LibreCV/issues/new?" + params.toString();
    }

    function openGithub() {
        var text = copy();
        var message = messageInput.value.trim();
        if (!kindInput.value || message.length < 4) {
            setStatus(text.short, true);
            return;
        }
        var marked = chosenDocument();
        if (documentInput.checked && !marked) {
            setStatus(text.noDocument, true);
            return;
        }
        var includeDocument = marked;
        if (includeDocument && includeDocument.length > 1500) {
            if (!window.confirm(text.githubLong)) return;
            includeDocument = "";
        } else if (includeDocument) {
            if (!window.confirm(text.githubWarn)) return;
        }
        var body = message;
        if (browserInput.checked) {
            body += "\n\nBrowser: " + (navigator.userAgent || "");
            body += "\nWindow: " + String(window.innerWidth) + "x" + String(window.innerHeight);
        }
        if (includeDocument) body += "\n\nDocument:\n" + includeDocument;
        var page = pageInput.checked ? pageAddress() : "";
        var email = emailInput.value.trim();
        var url = githubUrl(body, page, email);
        if (url.length > 7500 && includeDocument) {
            if (!window.confirm(text.githubLong)) return;
            body = message;
            if (browserInput.checked) {
                body += "\n\nBrowser: " + (navigator.userAgent || "");
                body += "\nWindow: " + String(window.innerWidth) + "x" + String(window.innerHeight);
            }
            url = githubUrl(body, page, email);
        }
        if (url.length > 7500) {
            setStatus(text.long, true);
            return;
        }
        var opened = window.open(url, "_blank", "noopener,noreferrer");
        if (opened) {
            setStatus("", false);
            return;
        }
        setStatus(text.popup + " ", true);
        var link = el("a", { href: url, target: "_blank", rel: "noopener noreferrer", text: "GitHub" });
        status.appendChild(link);
    }

    window.LibreCVFeedback = { open: open };
}());
