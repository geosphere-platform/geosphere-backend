export class MediaModule {
    http;
    constructor(http) {
        this.http = http;
    }
    async uploadMedia(fileMeta) {
        return this.http.post("/api/media/upload", fileMeta);
    }
}
//# sourceMappingURL=index.js.map