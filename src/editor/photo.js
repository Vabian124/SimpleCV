let cropper = null;
let photoTargetId = null;
let cropRatio = 0.75;
let cropHome = null;

function findBlock(id) {
    if (!doc) return null;
    return doc.sidebar.concat(doc.main).find(function (item) { return item.id === id; }) || null;
}

function pickPhoto(id) {
    photoTargetId = id;
    const input = document.getElementById("photo-file");
    if (!input) return;
    input.value = "";
    input.click();
}

function loadImage(url) {
    return new Promise(function (resolve, reject) {
        const image = new Image();
        image.onload = function () { resolve(image); };
        image.onerror = reject;
        image.src = url;
    });
}

function downscaleImage(image, max) {
    const scale = Math.min(1, max / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.9);
}

function aspectNumber(value) {
    if (value === "1 / 1") return 1;
    if (value === "4 / 3") return 4 / 3;
    return 3 / 4;
}

function aspectName(value) {
    if (Math.abs(value - 1) < 0.05) return "1 / 1";
    if (value > 1) return "4 / 3";
    return "3 / 4";
}

function markCropAspect(value) {
    cropRatio = value;
    document.querySelectorAll("#crop-dialog [data-aspect]").forEach(function (button) {
        button.classList.toggle("is-selected", Math.abs(Number(button.dataset.aspect) - value) < 0.05);
    });
    if (cropper) cropper.setAspectRatio(value);
}

function closePhotoCrop() {
    const dialog = document.getElementById("crop-dialog");
    if (!dialog || dialog.hidden) return false;
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
    dialog.hidden = true;
    const back = photoReturnFocus;
    photoReturnFocus = null;
    if (back && typeof back.focus === "function") back.focus();
    return true;
}

function cropScale() {
    if (!cropper) return 1;
    const image = cropper.getImageData();
    if (!image.naturalWidth) return 1;
    return image.width / image.naturalWidth;
}

function syncCropZoom() {
    const input = document.getElementById("crop-zoom");
    const label = document.getElementById("crop-zoom-value");
    if (!input) return;
    const percent = Math.max(10, Math.min(300, Math.round(cropScale() * 100)));
    input.value = String(percent);
    if (label) label.textContent = percent + "%";
}

function placeCrop(scale) {
    if (!cropper) return;
    const box = cropper.getCropBoxData();
    cropper.zoomTo(scale);
    const canvas = cropper.getCanvasData();
    cropper.setCanvasData({
        left: box.left + (box.width - canvas.width) / 2,
        top: box.top + (box.height - canvas.height) / 2
    });
    syncCropZoom();
}

function fitCrop() {
    if (!cropper) return;
    const box = cropper.getCropBoxData();
    const image = cropper.getImageData();
    placeCrop(Math.min(box.width / image.naturalWidth, box.height / image.naturalHeight));
}

function fillCrop() {
    if (!cropper) return;
    const box = cropper.getCropBoxData();
    const image = cropper.getImageData();
    placeCrop(Math.max(box.width / image.naturalWidth, box.height / image.naturalHeight));
}

function resetCrop() {
    if (!cropper || !cropHome) return;
    cropper.setAspectRatio(cropHome.ratio);
    markCropAspect(cropHome.ratio);
    cropper.setCanvasData(cropHome.canvas);
    cropper.setCropBoxData(cropHome.crop);
    syncCropZoom();
}


function loadAsset(src, kind) {
    if (assetLoads[src]) return assetLoads[src];
    assetLoads[src] = new Promise(function (resolve, reject) {
        if (kind === "css") {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = src;
            link.onload = function () { resolve(); };
            link.onerror = function () { assetLoads[src] = null; reject(new Error(src)); };
            document.head.appendChild(link);
            return;
        }
        const script = document.createElement("script");
        script.src = src;
        script.onload = function () { resolve(); };
        script.onerror = function () { assetLoads[src] = null; reject(new Error(src)); };
        document.head.appendChild(script);
    });
    return assetLoads[src];
}

function ensurePdfLibs() {
    if (window.dompdf && window.PDFLib && typeof FONT_DATA !== "undefined") return Promise.resolve();
    if (!pdfLibsPromise) {
        pdfLibsPromise = Promise.all([
            loadAsset("vendor/dompdf.min.js", "js"),
            loadAsset("vendor/pdf-lib.min.js", "js"),
            loadAsset("vendor/fonts.js", "js")
        ]).catch(function (error) {
            pdfLibsPromise = null;
            throw error;
        });
    }
    return pdfLibsPromise;
}

function ensureCropper() {
    if (!document.querySelector('link[data-cropper]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "vendor/cropper.min.css";
        link.setAttribute("data-cropper", "1");
        document.head.appendChild(link);
    }
    if (typeof Cropper !== "undefined") return Promise.resolve();
    if (!cropperPromise) {
        cropperPromise = loadAsset("vendor/cropper.min.js", "js").catch(function (error) {
            cropperPromise = null;
            throw error;
        });
    }
    return cropperPromise;
}

function openPhotoCrop(id) {
    ensureCropper().then(function () {
        openPhotoCropNow(id);
    }).catch(function () {
        showError(t("photo.fail"));
    });
}

function openPhotoCropNow(id) {
    const item = findBlock(id);
    if (!item) return;
    const src = item.fields.original || item.fields.src;
    if (!src) {
        pickPhoto(id);
        return;
    }
    photoTargetId = id;
    const dialog = document.getElementById("crop-dialog");
    const img = document.getElementById("crop-image");
    if (!dialog || !img || typeof Cropper === "undefined") {
        showError(t("photo.fail"));
        return;
    }
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
    photoReturnFocus = document.activeElement;
    dialog.hidden = false;
    paintPhotoWidth(item);
    markCropAspect(aspectNumber(item.fields.aspect));
    const cancel = document.getElementById("crop-cancel");
    if (cancel) cancel.focus();
    img.onload = function () {
        img.onload = null;
        cropHome = null;
        cropper = new Cropper(img, {
            aspectRatio: cropRatio,
            viewMode: 0,
            dragMode: "move",
            autoCropArea: 1,
            background: false,
            responsive: true,
            toggleDragModeOnDblclick: false,
            ready: function () {
                cropHome = {
                    ratio: cropRatio,
                    canvas: cropper.getCanvasData(),
                    crop: cropper.getCropBoxData()
                };
                syncCropZoom();
            },
            zoom: function () {
                syncCropZoom();
            }
        });
    };
    img.src = src;
    if (img.complete && img.naturalWidth) img.onload();
}

function applyPhotoCrop() {
    const item = findBlock(photoTargetId);
    if (!item || !cropper) return;
    const canvas = cropper.getCroppedCanvas({ maxWidth: 900, maxHeight: 1200, fillColor: "#fff", imageSmoothingQuality: "high" });
    if (!canvas) return;
    snapshot();
    item.fields.src = canvas.toDataURL("image/jpeg", 0.86);
    item.fields.aspect = aspectName(cropRatio);
    closePhotoCrop();
    render();
    save();
    select(item.id);
}

function readPhotoFile(file) {
    const reader = new FileReader();
    reader.onload = function () {
        loadImage(String(reader.result || "")).then(function (image) {
            const item = findBlock(photoTargetId);
            if (!item) return;
            snapshot();
            item.fields.original = downscaleImage(image, 1600);
            render();
            save();
            openPhotoCrop(item.id);
        }).catch(function () { showError(t("photo.fail")); });
    };
    reader.onerror = function () { showError(t("photo.fail")); };
    reader.readAsDataURL(file);
}

