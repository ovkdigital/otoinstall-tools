/**
 * ZIP Utilities
 * Creates ZIP archives from directories for deployment.
 */
/**
 * Zip a directory and return the path to the temporary ZIP file.
 * Excludes common non-deployable files (node_modules, .git, etc.)
 */
export declare function zipDirectory(dirPath: string): Promise<string>;
