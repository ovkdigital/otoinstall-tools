/**
 * OtoInstall API Client
 * Handles all HTTP communication with the OtoInstall REST API.
 */
export declare class OtoInstallAPI {
    private apiKey;
    private baseUrl;
    constructor(apiKey: string, baseUrl: string);
    private get headers();
    private request;
    /**
     * Deploy a ZIP file
     */
    deploy(zipPath: string, options: {
        credential_id: number;
        remote_path?: string;
        target_url?: string;
        project_type?: string;
    }): Promise<any>;
    /**
     * Get deployment status
     */
    getDeployStatus(deployId: string): Promise<any>;
    /**
     * Get deployment logs
     */
    getDeployLogs(deployId: string): Promise<any>;
    /**
     * List projects/deployments
     */
    listProjects(status?: string, perPage?: number): Promise<any>;
    /**
     * List server credentials
     */
    listCredentials(): Promise<any>;
    /**
     * Get current user info
     */
    me(): Promise<any>;
}
