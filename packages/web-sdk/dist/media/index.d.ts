import { HTTPClient } from "../http/index.js";
import { MediaUpload, APIResponse } from "../types/index.js";
export declare class MediaModule {
    private http;
    constructor(http: HTTPClient);
    uploadMedia(fileMeta: {
        fileName: string;
        mimeType: string;
        sizeBytes: number;
    }): Promise<APIResponse<MediaUpload>>;
}
//# sourceMappingURL=index.d.ts.map