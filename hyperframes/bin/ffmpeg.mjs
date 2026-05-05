import { spawnSync } from "node:child_process";
import process from "node:process";
import ffmpegPath from "ffmpeg-static";

const result = spawnSync(ffmpegPath ?? "ffmpeg", process.argv.slice(2), {
  stdio: "inherit",
});

process.exit(result.status ?? 0);
