/**
 * ZIP Utilities
 * Creates ZIP archives from directories for deployment.
 */
import archiver from "archiver";
import { createWriteStream, mkdtempSync } from "fs";
import { tmpdir } from "os";
import { join, basename } from "path";
/**
 * Zip a directory and return the path to the temporary ZIP file.
 * Excludes common non-deployable files (node_modules, .git, etc.)
 */
export async function zipDirectory(dirPath) {
    const tempDir = mkdtempSync(join(tmpdir(), "otoinstall-"));
    const zipPath = join(tempDir, `${basename(dirPath)}.zip`);
    return new Promise((resolve, reject) => {
        const output = createWriteStream(zipPath);
        const archive = archiver("zip", { zlib: { level: 6 } });
        output.on("close", () => resolve(zipPath));
        archive.on("error", (err) => reject(err));
        archive.on("warning", (err) => {
            if (err.code !== "ENOENT")
                reject(err);
        });
        archive.pipe(output);
        // Add directory contents, excluding heavy/unnecessary files
        archive.glob("**/*", {
            cwd: dirPath,
            dot: true,
            ignore: [
                "node_modules/**",
                ".git/**",
                ".svn/**",
                ".hg/**",
                ".DS_Store",
                "Thumbs.db",
                "*.log",
                ".env.local",
                ".env.*.local",
                "vendor/**",
                "__pycache__/**",
                "*.pyc",
                ".next/**",
                "dist/**",
                "build/**",
                ".cache/**",
                "coverage/**",
                ".idea/**",
                ".vscode/**",
                "*.swp",
                "*.swo",
            ],
        });
        archive.finalize();
    });
}
//# sourceMappingURL=zip-utils.js.map