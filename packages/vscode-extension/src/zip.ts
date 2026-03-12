import archiver = require("archiver");
import { createWriteStream, mkdtempSync } from "fs";
import { tmpdir } from "os";
import { join, basename } from "path";

export function zipDirectory(dirPath: string): Promise<string> {
  const tempDir = mkdtempSync(join(tmpdir(), "otoinstall-"));
  const zipPath = join(tempDir, `${basename(dirPath)}.zip`);

  return new Promise<string>((resolve, reject) => {
    const output = createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 6 } });

    output.on("close", () => resolve(zipPath));
    archive.on("error", (err: Error) => reject(err));

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
