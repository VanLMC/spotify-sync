import "dotenv/config";
import { execFile } from "child_process";
import { promisify } from "util";
import { markDone, markFailed } from "./queue.js";

const execFileAsync = promisify(execFile);
const OUT_DIR = "./downloads";

const playlistUrl = process.argv[2];
if (!playlistUrl) {
  console.error("Usage: node run.js <spotify-playlist-url>");
  process.exit(1);
}

console.log(`Syncing playlist: ${playlistUrl}\n`);

// spotdl --sync skips already-downloaded tracks automatically
// --save-errors logs any failures to a file for review
const args = [
  "download", playlistUrl,
  "--output", OUT_DIR,
  "--format", "mp3",
  "--bitrate", "320k",
  "--save-errors", "errors.txt",
  "--log-level", "INFO",
];

const child = execFile("spotdl", args);

// stream spotdl output line by line so we can log to queue as tracks complete
let trackInfo = null;

child.stdout.on("data", (data) => {
  const line = data.toString().trim();
  console.log(line);

  // spotdl prints "Downloaded <title>" on success
  const doneMatch = line.match(/Downloaded\s+"?(.+?)"?\s+by\s+(.+)/i);
  if (doneMatch) {
    const [, title, artists] = doneMatch;
    const id = slugId(title, artists);
    markDone(id, title, artists);
  }

  // spotdl prints "Failed to download <title>" on error
  const failMatch = line.match(/Failed to download\s+"?(.+?)"?\s+by\s+(.+)/i);
  if (failMatch) {
    const [, title, artists] = failMatch;
    const id = slugId(title, artists);
    markFailed(id, title, artists);
  }
});

child.stderr.on("data", (data) => process.stderr.write(data));

child.on("close", (code) => {
  console.log(`\nspotdl exited with code ${code}`);
  if (code !== 0) {
    console.log("Check errors.txt for failed tracks.");
  }
});

// fallback ID when we don't have a Spotify track ID from the output
function slugId(title, artists) {
  return `${title}-${artists}`.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}
