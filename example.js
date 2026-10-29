import "dotenv/config";
import { fetchPlaylistTracks } from "./spotdl-fetch.js";
import { addToQueue, getByStatus } from "./queue.js";
import { runSync } from "./sync.js";

const [,, command, ...rest] = process.argv;

if (command === "queue") {
  // Morning job: fetch playlist and populate the queue
  // node example.js queue "https://open.spotify.com/playlist/..."
  const playlistUrl = rest[0];
  if (!playlistUrl) { console.error("Provide a Spotify playlist URL"); process.exit(1); }

  console.log("Fetching playlist tracks...");
  fetchPlaylistTracks(playlistUrl)
    .then((tracks) => {
      const added = addToQueue(tracks);
      console.log(`Added ${added} new track(s) to the queue. (${tracks.length - added} already queued)`);
    })
    .catch((e) => { console.error(e.message); process.exit(1); });

} else if (command === "sync") {
  // Night job: download all pending tracks
  // node example.js sync
  runSync().catch((e) => { console.error(e.message); process.exit(1); });

} else if (command === "status") {
  // Show queue summary
  const pending = getByStatus("pending");
  const done = getByStatus("done");
  const failed = getByStatus("failed");
  console.log(`Queue status:\n  pending: ${pending.length}\n  done:    ${done.length}\n  failed:  ${failed.length}`);

} else {
  console.log(`Usage:
  node example.js queue "<spotify-playlist-url>"   — fetch playlist and populate queue
  node example.js sync                             — download all pending tracks
  node example.js status                           — show queue summary`);
}
