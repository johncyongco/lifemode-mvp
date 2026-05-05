import { spawn } from "node:child_process";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import process from "node:process";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cliPath = path.join(rootDir, "node_modules", "hyperframes", "dist", "cli.js");

if (!fs.existsSync(cliPath)) {
  throw new Error(`HyperFrames CLI not found at ${cliPath}`);
}

const child = spawn(process.execPath, [cliPath, "preview", "."], {
  cwd: rootDir,
  stdio: "inherit",
  shell: false,
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
