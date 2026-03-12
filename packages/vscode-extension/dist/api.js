"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OtoInstallAPI = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
class OtoInstallAPI {
    apiKey;
    baseUrl;
    constructor(apiKey, baseUrl) {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl.replace(/\/$/, "");
    }
    async request(method, endpoint) {
        const url = `${this.baseUrl}/api/v1${endpoint}`;
        const res = await fetch(url, {
            method,
            headers: {
                Authorization: `Bearer ${this.apiKey}`,
                Accept: "application/json",
            },
        });
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data?.error?.message ?? `HTTP ${res.status}`);
        }
        return data;
    }
    async deploy(zipPath, options) {
        const fileBuffer = (0, fs_1.readFileSync)(zipPath);
        const form = new FormData();
        form.append("file", new Blob([fileBuffer], { type: "application/zip" }), (0, path_1.basename)(zipPath));
        form.append("credential_id", String(options.credential_id));
        if (options.remote_path) {
            form.append("remote_path", options.remote_path);
        }
        if (options.target_url) {
            form.append("target_url", options.target_url);
        }
        const res = await fetch(`${this.baseUrl}/api/v1/deploy`, {
            method: "POST",
            headers: { Authorization: `Bearer ${this.apiKey}`, Accept: "application/json" },
            body: form,
        });
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data?.error?.message ?? `HTTP ${res.status}`);
        }
        return data;
    }
    async getDeployStatus(deployId) {
        return this.request("GET", `/deploy/${deployId}/status`);
    }
    async getDeployLogs(deployId) {
        return this.request("GET", `/deploy/${deployId}/logs`);
    }
    async listCredentials() {
        return this.request("GET", "/credentials");
    }
    async listProjects() {
        return this.request("GET", "/projects");
    }
    async me() {
        return this.request("GET", "/me");
    }
}
exports.OtoInstallAPI = OtoInstallAPI;
//# sourceMappingURL=api.js.map