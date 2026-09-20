import { HTTPClient } from "../http/index.js";
import { User, APIResponse } from "../types/index.js";
export declare class AuthModule {
    private http;
    constructor(http: HTTPClient);
    login(credentials: {
        email: string;
        password: string;
    }): Promise<APIResponse<{
        token: string;
        user: User;
    }>>;
    logout(): Promise<APIResponse<void>>;
    me(): Promise<APIResponse<User>>;
}
//# sourceMappingURL=index.d.ts.map