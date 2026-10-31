function adoptRoute(fresh) {
    documentLive = !fresh;
    const path = normalizePath(location.pathname);
    routeLock = true;
    try {
        if (!fresh && (path === "/" || path === "/editor")) {
            setupReturn = false;
            setPhase("studio");
        } else if (!fresh && path === "/step-1") {
            resetSetup();
            setupReturn = true;
            setPhase("setup");
        } else {
            resetSetup();
            setupReturn = !fresh;
            setPhase("setup");
        }
        history.replaceState(routeState(), "", routePath());
    } catch (error) { /* keep the screen even if the URL cannot change */ }
    finally {
        routeLock = false;
    }
}

function boot() {
    try { document.execCommand("styleWithCSS", false, true); } catch (error) { /* ignore */ }
    lang = savedLang();
    let fresh = false;
    try {
        const raw = localStorage.getItem(STORAGE_DOC);
        if (raw) doc = JSON.parse(raw);
        else {
            doc = emptyCv();
            fresh = true;
        }
    } catch (error) {
        doc = emptyCv();
        fresh = true;
    }
    if (!doc || doc.version !== 1 || !Array.isArray(doc.sidebar) || !Array.isArray(doc.main)) doc = emptyCv();
    normalize(doc);
    if (doc.lang === "en" || doc.lang === "nl") lang = doc.lang;
    const requested = requestedLang();
    if (requested) {
        lang = requested;
        doc.lang = requested;
        try { localStorage.setItem(STORAGE_LANG, requested); } catch (error) { /* ignore */ }
    }
    mountTools();
    const name = document.getElementById("pdf-name");
    let storedName = "";
    try { storedName = localStorage.getItem(STORAGE_NAME) || ""; } catch (error) { storedName = ""; }
    const person = plainName().replace(/\s+/g, " ").trim();
    const follow = !person || person === t("ph.name") ? "" : person;
    filenameCustom = !!(storedName && storedName !== follow);
    name.value = filenameCustom ? storedName : follow;
    applyLanguage();
    adoptRoute(fresh);
    if (requested && document.body.dataset.phase === "studio") save();
    toggleDrawer(false);
    render();
    document.querySelectorAll("#view-setup [data-lang]").forEach(function (button) {
        button.addEventListener("click", function () { setLanguage(button.dataset.lang); });
    });
    document.querySelectorAll("#view-setup [data-kind]").forEach(function (button) {
        button.addEventListener("click", function () { chooseKind(button.dataset.kind); });
    });
    document.querySelectorAll("#view-setup [data-source]").forEach(function (button) {
        button.addEventListener("click", function () { chooseSource(button.dataset.source); });
    });
    document.querySelectorAll("#view-setup [data-palette]").forEach(function (button) {
        button.addEventListener("click", function () { choosePalette(button.dataset.palette); });
    });
    document.getElementById("setup-return").addEventListener("click", function () {
        setupReturn = false;
        setPhase("studio");
        syncRoute("push");
    });
    document.getElementById("setup-import").addEventListener("click", function () {
        const input = document.getElementById("pdf-file");
        if (input) input.click();
    });
    document.getElementById("zoom-fit").addEventListener("click", function () {
        zoomTouched = false;
        fitStage();
    });
    document.getElementById("setup-back").addEventListener("click", function () {
        history.back();
    });
    document.querySelectorAll("[data-copy]").forEach(function (button) {
        button.addEventListener("click", function () { copyModelText(button.dataset.copy, false); });
    });
    document.querySelectorAll("#crop-dialog [data-aspect]").forEach(function (button) {
        button.addEventListener("click", function () { markCropAspect(Number(button.dataset.aspect)); });
    });
    document.getElementById("crop-cancel").addEventListener("click", closePhotoCrop);
    document.getElementById("crop-apply").addEventListener("click", applyPhotoCrop);
    document.getElementById("crop-change").addEventListener("click", function () {
        if (photoTargetId) pickPhoto(photoTargetId);
    });
    const pageSize = document.getElementById("crop-page-size");
    pageSize.addEventListener("pointerdown", function () { photoWidthSnapped = false; });
    pageSize.addEventListener("input", function () {
        setPhotoWidth(findBlock(photoTargetId), pageSize.value, true);
    });
    pageSize.addEventListener("change", function () { photoWidthSnapped = false; });
    document.getElementById("crop-page-max").addEventListener("click", function () {
        photoWidthSnapped = false;
        setPhotoWidth(findBlock(photoTargetId), 100, true);
        photoWidthSnapped = false;
    });
    document.getElementById("crop-page-reset").addEventListener("click", function () {
        photoWidthSnapped = false;
        resetPhotoWidth(findBlock(photoTargetId));
        photoWidthSnapped = false;
    });
    const cropZoom = document.getElementById("crop-zoom");
    cropZoom.addEventListener("input", function () {
        if (!cropper) return;
        cropper.zoomTo(Number(cropZoom.value) / 100);
        syncCropZoom();
    });
    document.getElementById("crop-fit").addEventListener("click", fitCrop);
    document.getElementById("crop-fill").addEventListener("click", fillCrop);
    document.getElementById("crop-reset").addEventListener("click", resetCrop);
    const photoFile = document.getElementById("photo-file");
    photoFile.addEventListener("change", function () {
        const picked = photoFile.files && photoFile.files[0];
        photoFile.value = "";
        if (picked) readPhotoFile(picked);
    });
    document.getElementById("crop-dialog").addEventListener("click", function (event) {
        if (event.target.id === "crop-dialog") closePhotoCrop();
    });
    document.querySelectorAll("[data-chrome-go]").forEach(function (button) {
        button.addEventListener("click", allowChromeAndRun);
    });
    document.getElementById("setup-model-run").addEventListener("click", function () {
        askChrome(document.getElementById("setup-chrome-note"), function () {
            const text = document.getElementById("setup-model-text").value;
            setupMessage(t("guide.modelWorking"), false);
            const theme = Object.assign({}, setupState.kind === "letter" ? letterTheme() : cvTheme(), activePalette());
            doc.theme = theme;
            formatWithBrowserModel(text).then(function () {
                doc.theme = theme;
                applyTheme();
                setupReturn = false;
                setPhase("studio");
                save();
                toggleDrawer(false);
                syncRoute("push");
            }).catch(function () {
                try {
                    openFromText(text);
                    showStatus(t("guide.modelMissing"));
                } catch (error) {
                    setupMessage(error && error.message ? error.message : t("guide.modelMissing"), true);
                }
            });
        });
    });
    markChromeLimits();
    document.getElementById("setup-continue").addEventListener("click", function () {
        showSetupStep(3);
        syncRoute("push");
    });
    document.getElementById("setup-generate").addEventListener("click", generateDocument);
    ["setup-sidebar", "setup-accent", "setup-page", "setup-text"].forEach(function (id) {
        document.getElementById(id).addEventListener("input", function () {
            setupState.palette = "custom";
            showSetupStep(3);
            syncRoute("replace");
        });
    });
    document.getElementById("preview").addEventListener("scroll", positionFloatbar, { passive: true });
    document.addEventListener("pointerdown", function (event) {
        if (document.body.dataset.phase !== "studio") return;
        const target = event.target;
        if (!target || !target.closest) return;
        if (target.closest(".editable, #floatbar, .library-card, .topbar, .drawer, .crop-dialog, button, input, textarea, select, a, .drag-handle, .line-x")) return;
        if (target.closest(".block")) {
            blurField();
            return;
        }
        clearFocus();
    }, true);
    document.addEventListener("focusout", function (event) {
        if (event.target && event.target.isContentEditable) snapArmed = false;
    });
    document.addEventListener("keydown", function (event) {
        if (document.body.dataset.phase !== "setup" || event.key !== "Enter" || event.altKey || event.isComposing || event.keyCode === 229) return;
        const target = event.target;
        if (!target || !target.closest) return;
        const palette = target.closest("[data-palette]");
        if (palette && setupState.step === 3) {
            event.preventDefault();
            if (palette.dataset.palette === setupState.palette) generateDocument();
            else choosePalette(palette.dataset.palette);
            return;
        }
        const guide = target.closest("#setup-guide");
        if (guide && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
            const command = event.ctrlKey || event.metaKey;
            if (target.tagName === "TEXTAREA" && !command) return;
            event.preventDefault();
            const fields = Array.prototype.slice.call(guide.querySelectorAll("input, textarea"));
            const nextField = fields[fields.indexOf(target) + 1];
            if (nextField && !command) {
                nextField.focus();
                if (nextField.setSelectionRange) nextField.setSelectionRange(nextField.value.length, nextField.value.length);
                return;
            }
            if (guide.querySelector(".btn-primary")) pressGuidePrimary();
            return;
        }
        if (target.tagName === "TEXTAREA" && (event.ctrlKey || event.metaKey)) {
            const cont = document.getElementById("setup-continue");
            if (cont && !cont.hidden) {
                event.preventDefault();
                cont.click();
            }
        }
    }, true);
    document.addEventListener("keydown", function (event) {
        if (event.key !== "Escape") return;
        if (closePhotoCrop()) {
            event.preventDefault();
            return;
        }
        if (document.body.dataset.phase === "setup") return;
        if (cancelDrag()) {
            event.preventDefault();
            event.stopPropagation();
            return;
        }
        const menu = document.querySelector(".more-menu");
        if (menu && menu.open) {
            menu.open = false;
            event.preventDefault();
            return;
        }
        const target = event.target;
        if (target && (target.isContentEditable || target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT")) {
            target.blur();
            event.preventDefault();
            return;
        }
        if (selectedId) {
            clearFocus();
            event.preventDefault();
            return;
        }
        if (narrowStudio() && document.body.dataset.pane === "settings") {
            setStudioPane("page");
            event.preventDefault();
            return;
        }
        const drawer = document.getElementById("drawer");
        if (drawer && drawer.classList.contains("is-open")) {
            toggleDrawer(false);
            event.preventDefault();
        }
    }, true);
    document.addEventListener("keydown", function (event) {
        if (document.body.dataset.phase !== "studio") return;
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
            event.preventDefault();
            downloadPdf();
            return;
        }
        const tag = event.target && event.target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
        if (event.target && event.target.isContentEditable) return;
        if (event.ctrlKey || event.metaKey) {
            const key = event.key.toLowerCase();
            if (key === "z") {
                event.preventDefault();
                if (event.shiftKey) redo();
                else undo();
            } else if (key === "y") {
                event.preventDefault();
                redo();
            }
            return;
        }
        if (!selectedId) return;
        if (event.key === "Delete" || event.key === "Backspace") {
            event.preventDefault();
            deleteBlock();
            return;
        }
        if (event.key === "ArrowUp" || event.key === "ArrowDown") {
            event.preventDefault();
            moveBlock(event.key === "ArrowUp" ? -1 : 1);
        }
    });
    document.addEventListener("selectionchange", function () {
        ["bold", "italic", "underline"].forEach(function (command) {
            const button = document.querySelector('#floatbar [data-command="' + command + '"]');
            if (!button) return;
            let on = false;
            try { on = document.queryCommandState(command); } catch (error) { on = false; }
            button.classList.toggle("is-on", on);
        });
    });
    document.addEventListener("pointerdown", function (event) {
        const menu = document.querySelector(".more-menu");
        if (!menu || !menu.open || menu.contains(event.target)) return;
        menu.open = false;
    }, true);
    document.querySelectorAll("#pane-switch [data-pane]").forEach(function (button) {
        button.addEventListener("click", function () { setStudioPane(button.dataset.pane); });
    });
    window.addEventListener("popstate", function () {
        if (document.body.dataset.phase === "setup" && setupState.source === "guided") storeGuideStep();
        applyRouteState(history.state);
    });
    window.addEventListener("resize", function () {
        const drawer = document.getElementById("drawer");
        if (drawer && "inert" in drawer) {
            if (narrowStudio()) drawer.inert = document.body.dataset.pane !== "settings";
            else drawer.inert = !drawer.classList.contains("is-open");
        }
        if (!zoomTouched) fitStage();
        else updatePageGuides();
        positionFloatbar();
    });
    setStudioPane("page");
}

boot();
