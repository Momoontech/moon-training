var MimeType;
(function (MimeType) {
    MimeType["JSON"] = "application/json";
    MimeType["Text"] = "text/plain";
    MimeType["ArrayBuffer"] = "application/octet-stream";
    MimeType["GLB"] = "model/gltf-binary";
    MimeType["GLTF"] = "model/gltf+json";
    MimeType["PNG"] = "image/png";
})(MimeType || (MimeType = {}));
function save(value, filename, mimeType) {
    const link = document.createElement('a');
    link.style.display = 'none';
    document.body.appendChild(link);
    link.href = URL.createObjectURL(new Blob([value], { type: mimeType }));
    link.download = filename;
    link.click();
}

export { MimeType, save };
