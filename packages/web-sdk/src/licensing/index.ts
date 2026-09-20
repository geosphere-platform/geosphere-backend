import { HTTPClient } from "../http/index.js";
import { License, APIResponse } from "../types/index.js";

export class LicensingModule {
  constructor(private http: HTTPClient) {}

  public async getLicense(): Promise<APIResponse<License>> {
    return this.http.get<License>("/api/license");
  }

  public async validateLicenseKey(licenseKey: string): Promise<APIResponse<{ valid: boolean; license?: License }>> {
    return this.http.post<{ valid: boolean; license?: License }>("/api/license/validate", { licenseKey });
  }
}
