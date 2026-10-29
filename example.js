import "dotenv/config";
import { downloadMp3 } from "./downloader.js";
import { searchYouTube, searchTopUrl } from "./search.js";
import { getPlaylistTracks } from "./spotify.js";

const [,, command, ...rest] = process.argv;

if (command === "download") {
  // node example.js download <youtube-url>
  const url = rest[0];
  if (!url) { console.error("Provide a YouTube URL"); process.exit(1); }
  console.log(`Downloading: ${url}`);
  downloadMp3(url)
    .then((p) => console.log(`Saved to: ${p}`))
    .catch((e) => { console.error(e.message); process.exit(1); });

} else if (command === "search") {
  // node example.js search "Just Dance - Dennis Quin Remix"
  const query = rest.join(" ");
  if (!query) { console.error("Provide a search query"); process.exit(1); }
  searchYouTube(query)
    .then((results) => results.forEach((r, i) =>
      console.log(`${i + 1}. [${r.duration}] ${r.title}\n   ${r.url}`)
    ))
    .catch((e) => { console.error(e.message); process.exit(1); });

} else if (command === "get") {
  // node example.js get "Just Dance - Dennis Quin Remix"
  const query = rest.join(" ");
  if (!query) { console.error("Provide a search query"); process.exit(1); }
  console.log(`Searching: "${query}"`);
  searchTopUrl(query)
    .then((url) => { console.log(`Found: ${url}`); return downloadMp3(url); })
    .then((p) => console.log(`Saved to: ${p}`))
    .catch((e) => { console.error(e.message); process.exit(1); });

} else if (command === "playlist") {
  // node example.js playlist <spotify-playlist-url-or-id>
  const input = rest[0];
  if (!input) { console.error("Provide a Spotify playlist URL or ID"); process.exit(1); }
  getPlaylistTracks(input)
    .then((tracks) => tracks.forEach((t, i) =>
      console.log(`${i + 1}. ${t.query}`)
    ))
    .catch((e) => { console.error(e.message); process.exit(1); });

} else {
  console.log(`Usage:
  node example.js search "<query>"        — list top 5 YouTube results
  node example.js download "<url>"        — download by YouTube URL
  node example.js get "<query>"           — search + download top result
  node example.js playlist "<spotify>"    — list all tracks in a playlist`);
}
