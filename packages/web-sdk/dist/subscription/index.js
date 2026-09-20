export class SubscriptionModule {
    http;
    constructor(http) {
        this.http = http;
    }
    async getSubscription() {
        return this.http.get("/api/subscription");
    }
}
//# sourceMappingURL=index.js.map