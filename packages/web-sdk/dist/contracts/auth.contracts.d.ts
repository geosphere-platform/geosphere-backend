/**
 * GeoSphere Platform Authentication Contracts & Abstractions
 * Supports Web (React/Next.js), Android (Kotlin/Compose), and iOS (Swift/SwiftUI) Target Platforms
 */
import { GeoSphereEventBus } from "./events.contracts.js";
import { GeoSphereAuthorizationContext } from "./rbac.contracts.js";
export type GeoSphereAuthState = "INITIALIZING" | "AUTHENTICATED" | "UNAUTHENTICATED" | "AUTHENTICATING" | "REFRESHING" | "EXPIRED" | "ERROR";
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
    expiresAt: string;
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
export declare class GeoSphereAuthProviderWeb implements GeoSphereAuthProviderContract {
    private eventBus?;
    private tokenStorageKey;
    private currentState;
    private currentIdentity;
    private currentSession;
    private stateHandlers;
    constructor(eventBus?: GeoSphereEventBus | undefined, tokenStorageKey?: string);
    get state(): GeoSphereAuthState;
    initialize(): Promise<void>;
    login(credentials: AuthLoginCredentials): Promise<GeoSphereIdentity>;
    logout(): Promise<void>;
    refresh(): Promise<GeoSphereSession>;
    getSession(): GeoSphereSession | null;
    getIdentity(): GeoSphereIdentity | null;
    isAuthenticated(): boolean;
    getAuthContext(): GeoSphereAuthorizationContext;
    onAuthStateChanged(handler: AuthStateChangeHandler): () => void;
    private setState;
    private emitAuthEvent;
}
//# sourceMappingURL=auth.contracts.d.ts.map