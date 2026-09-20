import { HTTPClient } from "../http/index.js";
import { Subscription, APIResponse } from "../types/index.js";
export declare class SubscriptionModule {
    private http;
    constructor(http: HTTPClient);
    getSubscription(): Promise<APIResponse<Subscription>>;
}
//# sourceMappingURL=index.d.ts.map