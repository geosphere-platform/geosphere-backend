export class AuthModule {
    http;
    constructor(http) {
        this.http = http;
    }
    async login(credentials) {
        const res = await this.http.post("/api/auth/login", credentials);
        if (res.success && res.data.token) {
            this.http.setAccessToken(res.data.token);
        }
        return res;
    }
    async logout() {
        const res = await this.http.post("/api/auth/logout");
        this.http.setAccessToken(undefined);
        return res;
    }
    async me() {
        return this.http.get("/api/auth/me");
    }
}
//# sourceMappingURL=index.js.map