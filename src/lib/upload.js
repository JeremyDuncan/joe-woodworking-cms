// Upload a file via XMLHttpRequest so we can report progress (fetch can't observe upload
// progress). `onProgress` receives a fraction 0..1; pass an AbortSignal to allow cancelling.
// Resolves with the parsed JSON response, rejects with an Error on failure.
export function uploadWithProgress(url, file, {onProgress, signal} = {}) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', url);
        if (xhr.upload) {
            xhr.upload.onprogress = e => {
                if (e.lengthComputable) onProgress?.(e.loaded / e.total);
            };
        }
        xhr.onload = () => {
            let body = {};
            try {
                body = JSON.parse(xhr.responseText);
            } catch {
                // non-JSON response
            }
            if (xhr.status >= 200 && xhr.status < 300) resolve(body);
            else reject(new Error(body.error || `Upload failed (${xhr.status})`));
        };
        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.onabort = () => reject(new Error('Upload cancelled'));
        if (signal) {
            if (signal.aborted) return xhr.abort();
            signal.addEventListener('abort', () => xhr.abort(), {once: true});
        }
        const fd = new FormData();
        fd.append('file', file);
        xhr.send(fd);
    });
}
