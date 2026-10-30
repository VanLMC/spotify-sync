import "dotenv/config";
import { execFile } from "child_process";
import { markDone, markFailed } from "./queue.js";

const OUT_DIR = "./downloads";

const playlistUrl = process.argv[2];
if (!playlistUrl) {
  console.error("Usage: node run.js <spotify-playlist-url>");
  process.exit(1);
}

console.log(`Syncing playlist: ${playlistUrl}\n`);

const args = [
  "download", playlistUrl,
  "--output", OUT_DIR,
  "--format", "mp3",
  "--audio", "youtube", "youtube-music",
  "--save-errors", "errors.txt",
  "--log-level", "INFO",
];

const child = execFile("spotdl", args);

child.stdout.on("data", (data) => {
  const text = data.toString();
  process.stdout.write(text);

  for (const line of text.split("\n")) {
    const doneMatch = line.match(/Downloaded\s+"?(.+?)"?\s+by\s+(.+)/i);
    if (doneMatch) {
      const [, title, artists] = doneMatch;
      markDone(slugId(title, artists), title, artists.trim());
      continue;
    }

    const skipMatch = line.match(/Skipping\s+"?(.+?)"?\s+by\s+(.+)/i);
    if (skipMatch) {
      const [, title, artists] = skipMatch;
      markDone(slugId(title, artists), title, artists.trim());
      continue;
    }

    const failMatch = line.match(/(?:LookupError|AudioProviderError|Failed).*?(?:song:|for song:)\s*(.+?)\s*-\s*(.+)/i);
    if (failMatch) {
      const [, artists, title] = failMatch;
      markFailed(slugId(title, artists), title.trim(), artists.trim());
    }
  }
});

child.stderr.on("data", (data) => process.stderr.write(data));

child.on("close", (code) => {
  console.log(`\nspotdl exited with code ${code}`);
  if (code !== 0) console.log("Check errors.txt for failed tracks.");
});

function slugId(title, artists) {
  return `${title}-${artists}`.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}
