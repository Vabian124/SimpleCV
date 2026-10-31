function filePrefix() {
    return doc.kind === "letter" ? t("prefix.letter") : "CV";
}

function pdfFilename() {
    const safe = function (value) {
        return Array.from(String(value || "").replace(/\.pdf$/i, "")).filter(function (char) {
            return char.charCodeAt(0) >= 32 && "<>:\"/\\|?*".indexOf(char) === -1;
        }).join("")
            .trim()
            .replace(/\s+/g, "_")
            .replace(/_+/g, "_")
            .replace(/^_|_$/g, "");
    };
    const parts = [safe(filePrefix())];
    const name = safe(document.getElementById("pdf-name").value);
    if (name) parts.push(name);
    if (document.getElementById("pdf-timestamp").checked) {
        const now = new Date();
        const pad = function (value) { return String(value).padStart(2, "0"); };
        parts.push(now.getFullYear() + pad(now.getMonth() + 1) + pad(now.getDate()) + "-" + pad(now.getHours()) + pad(now.getMinutes()));
    }
    if (document.getElementById("pdf-final").checked) parts.push("final");
    return parts.filter(Boolean).join("_") + ".pdf";
}

function updateFilenamePreview() {
    const preview = document.getElementById("pdf-preview");
    if (preview && document.getElementById("pdf-name")) preview.textContent = pdfFilename();
}

function downloadBlob(bytes, filename) {
    const blob = new Blob([bytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
}

function showError(message) {
    const box = document.getElementById("error");
    if (box) {
        box.hidden = !message;
        box.textContent = message || "";
    }
    if (message) showToast(message, "error");
    else showToast("");
}

