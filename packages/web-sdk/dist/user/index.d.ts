import { HTTPClient } from "../http/index.js";
import { User, APIResponse } from "../types/index.js";
export declare class UserModule {
    private http;
    constructor(http: HTTPClient);
    listUsers(): Promise<APIResponse<User[]>>;
    getUser(userId: string): Promise<APIResponse<User>>;
    updateUser(userId: string, data: Partial<User>): Promise<APIResponse<User>>;
}
//# sourceMappingURL=index.d.ts.map