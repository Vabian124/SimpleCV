/* CC0-1.0 — https://creativecommons.org/publicdomain/zero/1.0/ */
/* The step URLs and the back button. */

function normalizePath(path) {
    let value = path || "/";
    if (value.length > 1 && value.charAt(value.length - 1) === "/") value = value.slice(0, -1);
    if (value === "/index.html") return "/";
    return value;
}

function routePath() {
    if (document.body.dataset.phase === "studio") return "/editor";
    const step = setupState.step < 1 ? 1 : setupState.step;
    if (step === 1) return "/step-1";
    if (step === 2) return "/step-2";
    return "/step-3";
}

function routeState() {
    const sidebar = document.getElementById("setup-sidebar");
    return {
        phase: document.body.dataset.phase || "setup",
        step: setupState.step || 1,
        kind: setupState.kind || "",
        source: setupState.source || "",
        palette: setupState.palette || "",
        guideIndex: setupState.guideIndex || 0,
        colors: sidebar ? {
            sidebar: sidebar.value,
            accent: document.getElementById("setup-accent").value,
            page: document.getElementById("setup-page").value,
            text: document.getElementById("setup-text").value
        } : null
    };
}

function syncRoute(mode) {
    if (routeLock) return;
    try {
        const path = routePath();
        const state = routeState();
        const here = normalizePath(location.pathname);
        if (mode === "push") {
            const prev = history.state;
            if (here === path && prev && prev.phase === state.phase && prev.step === state.step && prev.source === state.source && (prev.guideIndex || 0) === (state.guideIndex || 0) && prev.kind === state.kind) return;
            history.pushState(state, "", path);
            return;
        }
        history.replaceState(state, "", path);
    } catch (error) { /* a file URL has no history to replace */ }
}

function applyRouteColors(colors) {
    if (!colors) return;
    const map = {
        "setup-sidebar": colors.sidebar,
        "setup-accent": colors.accent,
        "setup-page": colors.page,
        "setup-text": colors.text
    };
    Object.keys(map).forEach(function (id) {
        const input = document.getElementById(id);
        if (input && map[id]) input.value = map[id];
    });
}

function applyRouteState(state) {
    routeLock = true;
    try {
        if (!state || state.phase === "studio") {
            if (!documentLive) {
                resetSetup();
                setupReturn = false;
                setPhase("setup");
                history.replaceState(routeState(), "", routePath());
                return;
            }
            setupReturn = false;
            setPhase("studio");
            return;
        }
        let step = state.step || 1;
        const kind = state.kind || "";
        const source = state.source || "";
        if (step > 1 && !kind) step = 1;
        if (step > 2 && !source) step = 2;
        setupState.kind = kind;
        setupState.source = step > 1 ? source : "";
        setupState.palette = state.palette || "";
        setupState.guideIndex = state.guideIndex || 0;
        setupState.step = step;
        applyRouteColors(state.colors);
        setupReturn = documentLive;
        setPhase("setup");
        if (step !== (state.step || 1) || (step > 1 && !kind) || (step > 2 && !source)) {
            history.replaceState(routeState(), "", routePath());
        }
    } finally {
        routeLock = false;
    }
}

