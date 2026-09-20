import { HTTPClient } from "../http/index.js";
import { MediaUpload, APIResponse } from "../types/index.js";

export class MediaModule {
  constructor(private http: HTTPClient) {}

  public async uploadMedia(fileMeta: { fileName: string; mimeType: string; sizeBytes: number }): Promise<APIResponse<MediaUpload>> {
    return this.http.post<MediaUpload>("/api/media/upload", fileMeta);
  }
}
