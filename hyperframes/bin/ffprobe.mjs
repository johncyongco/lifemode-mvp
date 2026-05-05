import { spawnSync } from "node:child_process";
import process from "node:process";
import ffprobePath from "ffprobe-static";

const binary = typeof ffprobePath === "string" ? ffprobePath : ffprobePath.path;
const result = spawnSync(binary ?? "ffprobe", process.argv.slice(2), {
  stdio: "inherit",
});

process.exit(result.status ?? 0);
