import { HTTPClient } from "../http/index.js";
import { User, APIResponse } from "../types/index.js";

export class AuthModule {
  constructor(private http: HTTPClient) {}

  public async login(credentials: { email: string; password: string }): Promise<APIResponse<{ token: string; user: User }>> {
    const res = await this.http.post<{ token: string; user: User }>("/api/auth/login", credentials);
    if (res.success && res.data.token) {
      this.http.setAccessToken(res.data.token);
    }
    return res;
  }

  public async logout(): Promise<APIResponse<void>> {
    const res = await this.http.post<void>("/api/auth/logout");
    this.http.setAccessToken(undefined);
    return res;
  }

  public async me(): Promise<APIResponse<User>> {
    return this.http.get<User>("/api/auth/me");
  }
}
