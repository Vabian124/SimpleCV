function placeSiteFoot(phase) {
    const foot = document.getElementById("site-foot");
    const setup = document.getElementById("view-setup");
    if (!foot || !setup) return;
    if (phase === "studio") document.body.appendChild(foot);
    else setup.appendChild(foot);
}

function setPhase(phase) {
    document.body.dataset.phase = phase;
    const setup = document.getElementById("view-setup");
    const studio = document.getElementById("studio");
    if (setup) setup.hidden = phase !== "setup";
    placeSiteFoot(phase);
    if (studio) {
        studio.hidden = phase !== "studio";
        if (phase === "studio") studio.setAttribute("role", "main");
        else studio.removeAttribute("role");
    }
    const stage = document.getElementById("stage");
    const home = document.getElementById("studio-stage");
    if (stage && home && stage.parentElement !== home) home.appendChild(stage);
    if (phase !== "studio") {
        document.body.classList.remove("has-selection");
        const bar = document.getElementById("floatbar");
        if (bar) bar.hidden = true;
    }
    if (phase === "setup") showSetupStep(setupState.step || 1);
    refreshIdentity();
    requestAnimationFrame(function () {
        if (phase === "studio" && !zoomTouched) fitStage();
        else updatePageGuides();
        positionFloatbar();
    });
}

function narrowStudio() {
    return window.matchMedia("(max-width: 980px)").matches;
}

function setStudioPane(name) {
    const next = name === "library" || name === "settings" ? name : "page";
    document.body.dataset.pane = next;
    document.querySelectorAll("#pane-switch [data-pane]").forEach(function (button) {
        const on = button.dataset.pane === next;
        button.classList.toggle("is-active", on);
        button.setAttribute("aria-pressed", on ? "true" : "false");
    });
    const drawer = document.getElementById("drawer");
    if (drawer && "inert" in drawer && narrowStudio()) drawer.inert = next !== "settings";
    requestAnimationFrame(function () {
        if (document.body.dataset.phase !== "studio") return;
        if (!zoomTouched) fitStage();
        else updatePageGuides();
        positionFloatbar();
    });
}

function toggleDrawer(forceOpen) {
    const drawer = document.getElementById("drawer");
    if (!drawer) return;
    if (narrowStudio()) {
        const open = typeof forceOpen === "boolean" ? forceOpen : document.body.dataset.pane !== "settings";
        setStudioPane(open ? "settings" : "page");
        return;
    }
    const open = typeof forceOpen === "boolean" ? forceOpen : !drawer.classList.contains("is-open");
    drawer.classList.toggle("is-open", open);
    if ("inert" in drawer) drawer.inert = !open;
    requestAnimationFrame(function () {
        if (!zoomTouched) fitStage();
        else updatePageGuides();
        positionFloatbar();
    });
}


