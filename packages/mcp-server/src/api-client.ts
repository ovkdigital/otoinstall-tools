/**
 * OtoInstall API Client
 * Handles all HTTP communication with the OtoInstall REST API.
 */

import { readFileSync, statSync } from "fs";
import { basename } from "path";

export class OtoInstallClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  private get headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      Accept: "application/json",
    };
  }

  private async request(method: string, endpoint: string, body?: any): Promise<any> {
    const url = `${this.baseUrl}/api/v1${endpoint}`;

    const opts: RequestInit = {
      method,
      headers: this.headers,
    };

    if (body && !(body instanceof FormData)) {
      (opts.headers as Record<string, string>)["Content-Type"] = "application/json";
      opts.body = JSON.stringify(body);
    } else if (body instanceof FormData) {
      opts.body = body;
    }

    const response = await fetch(url, opts);
    const data = await response.json();

    if (!response.ok) {
      const msg = data?.error?.message ?? `HTTP ${response.status}`;
      throw new Error(msg);
    }

    return data;
  }

  /**
   * Deploy a ZIP file
   */
  async deploy(zipPath: string, options: {
    credential_id: number;
    remote_path?: string;
    target_url?: string;
    project_type?: string;
  }): Promise<any> {
    const fileBuffer = readFileSync(zipPath);
    const fileName = basename(zipPath);
    const fileBlob = new Blob([fileBuffer], { type: "application/zip" });

    const form = new FormData();
    form.append("file", fileBlob, fileName);
    form.append("credential_id", String(options.credential_id));
    if (options.remote_path) form.append("remote_path", options.remote_path);
    if (options.target_url) form.append("target_url", options.target_url);
    if (options.project_type) form.append("project_type", options.project_type);

    const url = `${this.baseUrl}/api/v1/deploy`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: "application/json",
      },
      body: form,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error?.message ?? `HTTP ${response.status}`);
    }

    return data;
  }

  /**
   * Get deployment status
   */
  async getDeployStatus(deployId: string): Promise<any> {
    return this.request("GET", `/deploy/${deployId}/status`);
  }

  /**
   * Get deployment logs
   */
  async getDeployLogs(deployId: string): Promise<any> {
    return this.request("GET", `/deploy/${deployId}/logs`);
  }

  /**
   * List projects/deployments
   */
  async listProjects(status?: string, perPage: number = 10): Promise<any> {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    params.set("per_page", String(perPage));
    return this.request("GET", `/projects?${params.toString()}`);
  }

  /**
   * List server credentials
   */
  async listCredentials(): Promise<any> {
    return this.request("GET", "/credentials");
  }

  /**
   * Get current user info
   */
  async me(): Promise<any> {
    return this.request("GET", "/me");
  }
}
