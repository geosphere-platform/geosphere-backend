/**
 * GeoSphere Platform Authentication Contracts & Abstractions
 * Supports Web (React/Next.js), Android (Kotlin/Compose), and iOS (Swift/SwiftUI) Target Platforms
 */

import { GeoSphereEvent, GeoSphereEventBus } from "./events.contracts.js";
import { GeoSphereAuthorizationContext } from "./rbac.contracts.js";

export type GeoSphereAuthState =
  | "INITIALIZING"
  | "AUTHENTICATED"
  | "UNAUTHENTICATED"
  | "AUTHENTICATING"
  | "REFRESHING"
  | "EXPIRED"
  | "ERROR";

export interface GeoSphereIdentity {
  userId: string;
  tenantId: string;
  displayName: string;
  email?: string;
  roles: string[];
  permissions: string[];
  metadata?: Record<string, unknown>;
}

export interface GeoSphereSession {
  sessionId: string;
  tenantId: string;
  userId: string;
  state: GeoSphereAuthState;
  expiresAt: string; // ISO 8601 UTC
  authenticatedAt: string;
}

export interface AuthLoginCredentials {
  email: string;
  password?: string;
  tenantId?: string;
  refreshToken?: string;
}

export type AuthStateChangeHandler = (state: GeoSphereAuthState, identity?: GeoSphereIdentity) => void;

export interface GeoSphereAuthProviderContract {
  readonly state: GeoSphereAuthState;
  
  initialize(): Promise<void>;
  login(credentials: AuthLoginCredentials): Promise<GeoSphereIdentity>;
  logout(): Promise<void>;
  refresh(): Promise<GeoSphereSession>;
  getSession(): GeoSphereSession | null;
  getIdentity(): GeoSphereIdentity | null;
  isAuthenticated(): boolean;
  getAuthContext(): GeoSphereAuthorizationContext;
  onAuthStateChanged(handler: AuthStateChangeHandler): () => void;
}

export interface GeoSphereAuthProviderAndroidContract {
  readonly platform: "android";
  initializeEncryptedStore(): Promise<void>;
  getKeystoreAlias(): string;
}

export interface GeoSphereAuthProviderIOSContract {
  readonly platform: "ios";
  initializeKeychainStore(): Promise<void>;
  getKeychainAccessGroup(): string;
}

export class GeoSphereAuthProviderWeb implements GeoSphereAuthProviderContract {
  private currentState: GeoSphereAuthState;
  private currentIdentity: GeoSphereIdentity | null = null;
  private currentSession: GeoSphereSession | null = null;
  private stateHandlers: Set<AuthStateChangeHandler> = new Set();

  constructor(
    private eventBus?: GeoSphereEventBus,
    private tokenStorageKey: string = "geosphere_auth_session"
  ) {
    this.currentState = "UNAUTHENTICATED";
  }

  public get state(): GeoSphereAuthState {
    return this.currentState;
  }

  public async initialize(): Promise<void> {
    this.setState("INITIALIZING");
    this.emitAuthEvent("auth.initializing", {});

    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        const storedSession = window.sessionStorage.getItem(this.tokenStorageKey);
        if (storedSession) {
          const parsed = JSON.parse(storedSession);
          if (new Date(parsed.session.expiresAt).getTime() > Date.now()) {
            this.currentSession = parsed.session;
            this.currentIdentity = parsed.identity;
            this.setState("AUTHENTICATED");
            this.emitAuthEvent("auth.loginSucceeded", { userId: parsed.identity.userId, tenantId: parsed.identity.tenantId });
            return;
          }
        }
      }
      this.setState("UNAUTHENTICATED");
    } catch (err) {
      this.setState("UNAUTHENTICATED");
    }
  }

  public async login(credentials: AuthLoginCredentials): Promise<GeoSphereIdentity> {
    this.setState("AUTHENTICATING");
    this.emitAuthEvent("auth.loginStarted", { email: credentials.email, tenantId: credentials.tenantId });

    if (!credentials.email) {
      this.setState("ERROR");
      this.emitAuthEvent("auth.loginFailed", { reason: "MISSING_CREDENTIALS" });
      throw new Error("[AUTH_ERROR:AUTHENTICATION_FAILED] Email is required.");
    }

    // Mock/Contract authentication logic
    const tenantId = credentials.tenantId || "tenant_default_001";
    const userId = `usr_${Date.now()}`;
    
    this.currentIdentity = {
      userId,
      tenantId,
      displayName: credentials.email.split("@")[0] || "GeoSphere User",
      email: credentials.email,
      roles: ["OPERATOR"],
      permissions: ["VIEW_GIS_MAP", "VIEW_LIVE_TRACKING", "VIEW_FIELD_TASKS"]
    };

    const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();
    this.currentSession = {
      sessionId: `sess_${Date.now()}`,
      tenantId,
      userId,
      state: "AUTHENTICATED" as GeoSphereAuthState,
      expiresAt,
      authenticatedAt: new Date().toISOString()
    };

    if (typeof window !== "undefined" && window.sessionStorage) {
      window.sessionStorage.setItem(this.tokenStorageKey, JSON.stringify({
        session: this.currentSession,
        identity: this.currentIdentity
      }));
    }

    this.setState("AUTHENTICATED");
    this.emitAuthEvent("auth.loginSucceeded", { userId, tenantId });
    return this.currentIdentity;
  }

  public async logout(): Promise<void> {
    const userId = this.currentIdentity?.userId;
    const tenantId = this.currentIdentity?.tenantId;

    this.currentIdentity = null;
    this.currentSession = null;

    if (typeof window !== "undefined" && window.sessionStorage) {
      window.sessionStorage.removeItem(this.tokenStorageKey);
    }

    this.setState("UNAUTHENTICATED");
    this.emitAuthEvent("auth.logout", { userId, tenantId });
  }

  public async refresh(): Promise<GeoSphereSession> {
    if (!this.currentSession || !this.currentIdentity) {
      this.setState("EXPIRED");
      this.emitAuthEvent("auth.sessionExpired", {});
      throw new Error("[AUTH_ERROR:SESSION_EXPIRED] No active session to refresh.");
    }

    this.setState("REFRESHING");
    const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();
    this.currentSession.expiresAt = expiresAt;

    if (typeof window !== "undefined" && window.sessionStorage) {
      window.sessionStorage.setItem(this.tokenStorageKey, JSON.stringify({
        session: this.currentSession,
        identity: this.currentIdentity
      }));
    }

    this.setState("AUTHENTICATED");
    this.emitAuthEvent("auth.sessionRefreshed", { userId: this.currentIdentity.userId });
    return this.currentSession;
  }

  public getSession(): GeoSphereSession | null {
    return this.currentSession;
  }

  public getIdentity(): GeoSphereIdentity | null {
    return this.currentIdentity;
  }

  public isAuthenticated(): boolean {
    return this.currentState === "AUTHENTICATED" && this.currentSession !== null;
  }

  public getAuthContext(): GeoSphereAuthorizationContext {
    return {
      tenantId: this.currentIdentity?.tenantId || "",
      userId: this.currentIdentity?.userId || "",
      roles: this.currentIdentity?.roles || [],
      permissions: this.currentIdentity?.permissions || [],
      isSuperAdmin: this.currentIdentity?.roles.includes("PLATFORM_ADMIN") || false,
      can: (permission: string) => {
        if (!this.currentIdentity) return false;
        return this.currentIdentity.permissions.includes(permission) || this.currentIdentity.permissions.includes("*");
      },
      hasRole: (role: string) => {
        if (!this.currentIdentity) return false;
        return this.currentIdentity.roles.includes(role);
      },
      canAccess: (resource: string) => {
        if (!this.currentIdentity) return false;
        return this.currentIdentity.permissions.some((p) => p.startsWith(resource) || p === "*");
      }
    };
  }

  public onAuthStateChanged(handler: AuthStateChangeHandler): () => void {
    this.stateHandlers.add(handler);
    return () => this.stateHandlers.delete(handler);
  }

  private setState(newState: GeoSphereAuthState): void {
    this.currentState = newState;
    this.stateHandlers.forEach((handler) => {
      try {
        handler(newState, this.currentIdentity || undefined);
      } catch (err) {
        console.error("[AUTH_HANDLER_ERROR] Error executing auth state handler:", err);
      }
    });
  }

  private emitAuthEvent(type: string, payload: Record<string, unknown>): void {
    if (this.eventBus) {
      this.eventBus.emit({
        eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        type,
        category: "LIFECYCLE",
        timestamp: new Date().toISOString(),
        source: "AuthProviderWeb",
        payload
      });
    }
  }
}
