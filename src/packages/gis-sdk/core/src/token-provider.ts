import { TokenProvider } from "./types";

export class MemoryTokenProvider implements TokenProvider {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor(initialAccessToken?: string, initialRefreshToken?: string) {
    this.accessToken = initialAccessToken || null;
    this.refreshToken = initialRefreshToken || null;
  }

  public async getAccessToken(): Promise<string | null> {
    return this.accessToken;
  }

  public setAccessToken(token: string | null): void {
    this.accessToken = token;
  }

  public async refreshAccessToken(): Promise<string | null> {
    return this.accessToken;
  }

  public async clearToken(): Promise<void> {
    this.accessToken = null;
    this.refreshToken = null;
  }
}
