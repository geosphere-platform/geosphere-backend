/**
 * GeoSphere Platform Authentication Contracts & Abstractions
 * Supports Web (React/Next.js), Android (Kotlin/Compose), and iOS (Swift/SwiftUI) Target Platforms
 */
export class GeoSphereAuthProviderWeb {
    eventBus;
    tokenStorageKey;
    currentState;
    currentIdentity = null;
    currentSession = null;
    stateHandlers = new Set();
    constructor(eventBus, tokenStorageKey = "geosphere_auth_session") {
        this.eventBus = eventBus;
        this.tokenStorageKey = tokenStorageKey;
        this.currentState = "UNAUTHENTICATED";
    }
    get state() {
        return this.currentState;
    }
    async initialize() {
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
        }
        catch (err) {
            this.setState("UNAUTHENTICATED");
        }
    }
    async login(credentials) {
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
            state: "AUTHENTICATED",
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
    async logout() {
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
    async refresh() {
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
    getSession() {
        return this.currentSession;
    }
    getIdentity() {
        return this.currentIdentity;
    }
    isAuthenticated() {
        return this.currentState === "AUTHENTICATED" && this.currentSession !== null;
    }
    getAuthContext() {
        return {
            tenantId: this.currentIdentity?.tenantId || "",
            userId: this.currentIdentity?.userId || "",
            roles: this.currentIdentity?.roles || [],
            permissions: this.currentIdentity?.permissions || [],
            isSuperAdmin: this.currentIdentity?.roles.includes("PLATFORM_ADMIN") || false,
            can: (permission) => {
                if (!this.currentIdentity)
                    return false;
                return this.currentIdentity.permissions.includes(permission) || this.currentIdentity.permissions.includes("*");
            },
            hasRole: (role) => {
                if (!this.currentIdentity)
                    return false;
                return this.currentIdentity.roles.includes(role);
            },
            canAccess: (resource) => {
                if (!this.currentIdentity)
                    return false;
                return this.currentIdentity.permissions.some((p) => p.startsWith(resource) || p === "*");
            }
        };
    }
    onAuthStateChanged(handler) {
        this.stateHandlers.add(handler);
        return () => this.stateHandlers.delete(handler);
    }
    setState(newState) {
        this.currentState = newState;
        this.stateHandlers.forEach((handler) => {
            try {
                handler(newState, this.currentIdentity || undefined);
            }
            catch (err) {
                console.error("[AUTH_HANDLER_ERROR] Error executing auth state handler:", err);
            }
        });
    }
    emitAuthEvent(type, payload) {
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
//# sourceMappingURL=auth.contracts.js.map