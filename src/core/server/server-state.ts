/**
 * Server State Manager — Controls Public Traffic Gate & Maintenance Mode
 *
 * Thread-safe singleton tracking operational server status (ONLINE vs OFFLINE).
 * In OFFLINE state, public & mobile telemetry APIs are paused (503 Service Unavailable),
 * while administrative control endpoints remain open to allow toggling back ONLINE.
 */

export type ServerStatus = "ONLINE" | "OFFLINE";

interface ServerStateSnapshot {
  status: ServerStatus;
  updatedAt: string;
  updatedBy: string;
}

class ServerStateManager {
  private static instance: ServerStateManager;
  private status: ServerStatus = "ONLINE";
  private updatedAt: string = new Date().toISOString();
  private updatedBy: string = "system-startup";

  private constructor() {}

  public static getInstance(): ServerStateManager {
    if (!ServerStateManager.instance) {
      ServerStateManager.instance = new ServerStateManager();
    }
    return ServerStateManager.instance;
  }

  public isOnline(): boolean {
    return this.status === "ONLINE";
  }

  public setStatus(newStatus: ServerStatus, updatedBy: string = "admin"): ServerStateSnapshot {
    this.status = newStatus;
    this.updatedAt = new Date().toISOString();
    this.updatedBy = updatedBy;
    return this.getSnapshot();
  }

  public getSnapshot(): ServerStateSnapshot {
    return {
      status: this.status,
      updatedAt: this.updatedAt,
      updatedBy: this.updatedBy,
    };
  }
}

export const serverState = ServerStateManager.getInstance();
