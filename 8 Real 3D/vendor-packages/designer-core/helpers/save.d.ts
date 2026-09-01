export declare enum MimeType {
    JSON = "application/json",
    Text = "text/plain",
    ArrayBuffer = "application/octet-stream",
    GLB = "model/gltf-binary",
    GLTF = "model/gltf+json",
    PNG = "image/png"
}
export declare function save(value: string | ArrayBuffer, filename: string, mimeType: MimeType): void;
