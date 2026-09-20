import { HTTPClient } from "../http/index.js";
import { User, APIResponse } from "../types/index.js";

export class UserModule {
  constructor(private http: HTTPClient) {}

  public async listUsers(): Promise<APIResponse<User[]>> {
    return this.http.get<User[]>("/api/users");
  }

  public async getUser(userId: string): Promise<APIResponse<User>> {
    return this.http.get<User>(`/api/users/${userId}`);
  }

  public async updateUser(userId: string, data: Partial<User>): Promise<APIResponse<User>> {
    return this.http.patch<User>(`/api/users/${userId}`, data);
  }
}
