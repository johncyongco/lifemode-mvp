import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";
import ffmpegPath from "ffmpeg-static";
import ffprobeStatic from "ffprobe-static";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cliPath = path.join(rootDir, "node_modules", "hyperframes", "dist", "cli.js");
const binDir = path.join(rootDir, "bin");
const rendersDir = path.join(rootDir, "renders");
const output = path.join(rendersDir, "placeholder.mp4");

function ensureBinary(source, target) {
  if (!source) return;
  if (!fs.existsSync(target)) {
    fs.copyFileSync(source, target);
  }
}

fs.mkdirSync(rendersDir, { recursive: true });
fs.mkdirSync(binDir, { recursive: true });

if (!fs.existsSync(cliPath)) {
  throw new Error(`HyperFrames CLI not found at ${cliPath}`);
}

const ffprobePath = typeof ffprobeStatic === "string" ? ffprobeStatic : ffprobeStatic.path;
ensureBinary(ffmpegPath, path.join(binDir, "ffmpeg.exe"));
ensureBinary(ffprobePath, path.join(binDir, "ffprobe.exe"));

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const env = {
  ...process.env,
  HYPERFRAMES_FFMPEG_PATH: path.join(binDir, "ffmpeg.exe"),
  HYPERFRAMES_FFPROBE_PATH: path.join(binDir, "ffprobe.exe"),
  HYPERFRAMES_BROWSER_PATH: chromePath,
  PRODUCER_HEADLESS_SHELL_PATH: chromePath,
  PATH: `${binDir};${process.env.PATH ?? ""}`,
};

const child = spawn(process.execPath, [cliPath, "render", ".", "--output", output], {
  cwd: rootDir,
  stdio: "inherit",
  shell: false,
  env,
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
