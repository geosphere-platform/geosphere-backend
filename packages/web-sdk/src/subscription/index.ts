import { HTTPClient } from "../http/index.js";
import { Subscription, APIResponse } from "../types/index.js";

export class SubscriptionModule {
  constructor(private http: HTTPClient) {}

  public async getSubscription(): Promise<APIResponse<Subscription>> {
    return this.http.get<Subscription>("/api/subscription");
  }
}
