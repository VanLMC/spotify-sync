import "dotenv/config";
import { readdirSync, mkdirSync, existsSync } from "fs";
import path from "path";
import { fetchPlaylistTracks } from "./spotdl-fetch.js";
import { searchTopUrl } from "./search.js";
import { downloadMp3 } from "./downloader.js";
import { markDone, markFailed } from "./queue.js";

const DELAY_MS = 2000;

const playlistUrl = process.argv[2];
if (!playlistUrl) {
  console.error("Usage: node run.js <spotify-playlist-url>");
  process.exit(1);
}

console.log(`Fetching playlist: ${playlistUrl}\n`);

const { playlistName, tracks } = await fetchPlaylistTracks(playlistUrl);

// create output folder named after the playlist
const outDir = path.join("./downloads", sanitizeName(playlistName));
if (!existsSync(outDir)) {
  mkdirSync(outDir, { recursive: true });
  console.log(`Created folder: ${outDir}`);
} else {
  console.log(`Using existing folder: ${outDir}`);
}

// get filenames already in the folder (without extension) for dedup check
const existingFiles = new Set(
  readdirSync(outDir).map((f) => path.parse(f).name.toLowerCase())
);

const pending = tracks.filter((t) => !existingFiles.has(t.title.toLowerCase()));
const skipped = tracks.length - pending.length;

console.log(`Found ${tracks.length} tracks — ${pending.length} to download, ${skipped} already exist.\n`);

for (let i = 0; i < pending.length; i++) {
  const track = pending[i];
  console.log(`[${i + 1}/${pending.length}] ${track.query}`);

  try {
    const url = await searchTopUrl(track.query);
    console.log(`  Found: ${url}`);
    const file = await downloadMp3(url, outDir);
    console.log(`  Saved: ${file}`);
    markDone(track.spotify_id, track.title, track.artists);
  } catch (err) {
    console.error(`  Failed: ${err.message}`);
    markFailed(track.spotify_id, track.title, track.artists);
  }

  if (i < pending.length - 1) await sleep(DELAY_MS);
}

console.log("\nDone.");

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function sanitizeName(name) {
  return name.replace(/[<>:"/\\|?*]/g, "").trim();
}
