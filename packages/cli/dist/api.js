/**
 * OtoInstall API Client
 * Handles all HTTP communication with the OtoInstall REST API.
 */
import { readFileSync } from "fs";
import { basename } from "path";
export class OtoInstallAPI {
    apiKey;
    baseUrl;
    constructor(apiKey, baseUrl) {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl.replace(/\/$/, "");
    }
    get headers() {
        return {
            Authorization: `Bearer ${this.apiKey}`,
            Accept: "application/json",
        };
    }
    async request(method, endpoint, body) {
        const url = `${this.baseUrl}/api/v1${endpoint}`;
        const opts = {
            method,
            headers: this.headers,
        };
        if (body && !(body instanceof FormData)) {
            opts.headers["Content-Type"] = "application/json";
            opts.body = JSON.stringify(body);
        }
        else if (body instanceof FormData) {
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
    async deploy(zipPath, options) {
        const fileBuffer = readFileSync(zipPath);
        const fileName = basename(zipPath);
        const fileBlob = new Blob([fileBuffer], { type: "application/zip" });
        const form = new FormData();
        form.append("file", fileBlob, fileName);
        form.append("credential_id", String(options.credential_id));
        if (options.remote_path)
            form.append("remote_path", options.remote_path);
        if (options.target_url)
            form.append("target_url", options.target_url);
        if (options.project_type)
            form.append("project_type", options.project_type);
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
    async getDeployStatus(deployId) {
        return this.request("GET", `/deploy/${deployId}/status`);
    }
    /**
     * Get deployment logs
     */
    async getDeployLogs(deployId) {
        return this.request("GET", `/deploy/${deployId}/logs`);
    }
    /**
     * List projects/deployments
     */
    async listProjects(status, perPage = 10) {
        const params = new URLSearchParams();
        if (status)
            params.set("status", status);
        params.set("per_page", String(perPage));
        return this.request("GET", `/projects?${params.toString()}`);
    }
    /**
     * List server credentials
     */
    async listCredentials() {
        return this.request("GET", "/credentials");
    }
    /**
     * Get current user info
     */
    async me() {
        return this.request("GET", "/me");
    }
}
//# sourceMappingURL=api.js.map