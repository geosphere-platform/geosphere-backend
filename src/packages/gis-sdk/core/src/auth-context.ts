import { TokenProvider } from "./types";
import { MemoryTokenProvider } from "./token-provider";

export type AuthState = "UNAUTHENTICATED" | "AUTHENTICATING" | "AUTHENTICATED";

export class AuthContext {
  private tokenProvider: TokenProvider;
  private state: AuthState = "UNAUTHENTICATED";
  private logoutCallback?: () => void;

  constructor(tokenProvider?: TokenProvider, logoutCallback?: () => void) {
    this.tokenProvider = tokenProvider || new MemoryTokenProvider();
    this.logoutCallback = logoutCallback;
  }

  public getTokenProvider(): TokenProvider {
    return this.tokenProvider;
  }

  public setTokenProvider(tokenProvider: TokenProvider): void {
    this.tokenProvider = tokenProvider;
  }

  public setLogoutCallback(callback: () => void): void {
    this.logoutCallback = callback;
  }

  public getAuthState(): AuthState {
    return this.state;
  }

  public setAuthState(state: AuthState): void {
    this.state = state;
  }

  public async logout(): Promise<void> {
    if (this.tokenProvider.clearToken) {
      await this.tokenProvider.clearToken();
    }
    this.state = "UNAUTHENTICATED";
    if (this.logoutCallback) {
      this.logoutCallback();
    }
  }
}
