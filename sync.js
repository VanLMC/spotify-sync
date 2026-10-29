import { execFile } from "child_process";
import { promisify } from "util";
import { getByStatus, markStatus } from "./queue.js";

const execFileAsync = promisify(execFile);

const DELAY_MS = 3000;      // 3s between downloads
const OUT_DIR = "./downloads";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Downloads a single track via spotdl using its Spotify ID.
 * @param {string} spotifyId
 */
async function downloadTrack(spotifyId) {
  const url = `https://open.spotify.com/track/${spotifyId}`;
  await execFileAsync("spotdl", [
    "download", url,
    "--output", OUT_DIR,
    "--format", "mp3",
    "--bitrate", "320k",
  ]);
}

/**
 * Processes all pending tracks in the queue, one by one with a cooldown.
 */
export async function runSync() {
  const pending = getByStatus("pending");

  if (pending.length === 0) {
    console.log("Nothing pending in the queue.");
    return;
  }

  console.log(`Starting sync — ${pending.length} track(s) to download.\n`);

  for (let i = 0; i < pending.length; i++) {
    const track = pending[i];
    console.log(`[${i + 1}/${pending.length}] ${track.title} - ${track.artists}`);

    try {
      await downloadTrack(track.spotify_id);
      markStatus(track.spotify_id, "done");
      console.log(`  done\n`);
    } catch (err) {
      markStatus(track.spotify_id, "failed");
      console.error(`  failed: ${err.message}\n`);
    }

    // cooldown between tracks, skip after last one
    if (i < pending.length - 1) await sleep(DELAY_MS);
  }

  const failed = getByStatus("failed");
  console.log(`Sync complete. Failed: ${failed.length}`);
}
