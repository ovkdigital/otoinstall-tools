import { readFileSync } from "fs";
import { basename } from "path";

export class OtoInstallAPI {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  private async request(method: string, endpoint: string): Promise<any> {
    const url = `${this.baseUrl}/api/v1${endpoint}`;
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: "application/json",
      },
    });
    const data = await res.json();
    if (!res.ok) { throw new Error(data?.error?.message ?? `HTTP ${res.status}`); }
    return data;
  }

  async deploy(zipPath: string, options: { credential_id: number; remote_path?: string; target_url?: string }): Promise<any> {
    const fileBuffer = readFileSync(zipPath);
    const form = new FormData();
    form.append("file", new Blob([fileBuffer], { type: "application/zip" }), basename(zipPath));
    form.append("credential_id", String(options.credential_id));
    if (options.remote_path) { form.append("remote_path", options.remote_path); }
    if (options.target_url) { form.append("target_url", options.target_url); }

    const res = await fetch(`${this.baseUrl}/api/v1/deploy`, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}`, Accept: "application/json" },
      body: form,
    });
    const data = await res.json();
    if (!res.ok) { throw new Error(data?.error?.message ?? `HTTP ${res.status}`); }
    return data;
  }

  async getDeployStatus(deployId: string): Promise<any> {
    return this.request("GET", `/deploy/${deployId}/status`);
  }

  async getDeployLogs(deployId: string): Promise<any> {
    return this.request("GET", `/deploy/${deployId}/logs`);
  }

  async listCredentials(): Promise<any> {
    return this.request("GET", "/credentials");
  }

  async listProjects(): Promise<any> {
    return this.request("GET", "/projects");
  }

  async me(): Promise<any> {
    return this.request("GET", "/me");
  }
}
