export class UserModule {
    http;
    constructor(http) {
        this.http = http;
    }
    async listUsers() {
        return this.http.get("/api/users");
    }
    async getUser(userId) {
        return this.http.get(`/api/users/${userId}`);
    }
    async updateUser(userId, data) {
        return this.http.patch(`/api/users/${userId}`, data);
    }
}
//# sourceMappingURL=index.js.map