"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zipDirectory = zipDirectory;
const archiver = require("archiver");
const fs_1 = require("fs");
const os_1 = require("os");
const path_1 = require("path");
function zipDirectory(dirPath) {
    const tempDir = (0, fs_1.mkdtempSync)((0, path_1.join)((0, os_1.tmpdir)(), "otoinstall-"));
    const zipPath = (0, path_1.join)(tempDir, `${(0, path_1.basename)(dirPath)}.zip`);
    return new Promise((resolve, reject) => {
        const output = (0, fs_1.createWriteStream)(zipPath);
        const archive = archiver("zip", { zlib: { level: 6 } });
        output.on("close", () => resolve(zipPath));
        archive.on("error", (err) => reject(err));
        archive.pipe(output);
        archive.glob("**/*", {
            cwd: dirPath,
            dot: true,
            ignore: [
                "node_modules/**", ".git/**", ".svn/**", ".DS_Store",
                "Thumbs.db", "*.log", ".env.local", ".env.*.local",
                "vendor/**", "__pycache__/**", ".next/**", "dist/**",
                "build/**", ".cache/**", "coverage/**", ".idea/**",
                ".vscode/**", "*.swp",
            ],
        });
        archive.finalize();
    });
}
//# sourceMappingURL=zip.js.map