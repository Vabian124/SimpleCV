/* CC0-1.0 — https://creativecommons.org/publicdomain/zero/1.0/ */
/* Mutable editor state: the open document, language, and lazy-load promises. */

let lang = "en";
let doc = null;
let selectedId = null;
let addTarget = "main";
let activeDragCancel = null;
let seq = 1;
let past = [];
let future = [];
let snapArmed = false;
let activeField = null;
let fontConfigPromise = null;
let fontConfigKey = "";
let setupState = { step: 1, kind: "", source: "", palette: "", guideIndex: 0, answers: null };
const PALETTES = {
    zakelijk: { sidebar: "#1e293b", sidebarText: "#f8fafc", accent: "#0284c7", accentLight: "#38bdf8", page: "#ffffff", text: "#334155" },
    groen: { sidebar: "#0b1d16", sidebarText: "#ffffff", accent: "#047857", accentLight: "#6ee7b7", page: "#ffffff", text: "#111827" },
    minimal: { sidebar: "#f4f4f5", sidebarText: "#18181b", accent: "#18181b", accentLight: "#18181b", page: "#ffffff", text: "#18181b" }
};
let stageScale = 1;
let zoomTouched = false;
let filenameCustom = false;
let setupReturn = false;
let saveOk = true;
let saveTimer = 0;
let toastTimer = 0;
let photoReturnFocus = null;
let documentLive = false;
let routeLock = false;
let chromeProceed = false;
let chromeAction = null;
let aiBoxSource = "";
let assetLoads = {};
let pdfLibsPromise = null;
let cropperPromise = null;

