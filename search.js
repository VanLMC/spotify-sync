import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

/**
 * Searches YouTube for a track and returns the top results.
 * Appends "Extended Mix" to every query automatically.
 *
 * @param {string} query      - e.g. "Just Dance - Dennis Quin"
 * @param {number} [limit=5]  - number of results to return
 * @returns {Promise<Array<{ title, url, duration, channel }>>}
 */
export async function searchYouTube(query, limit = 5) {
  if (!query || typeof query !== "string") {
    throw new Error("A search query string is required");
  }

  const fullQuery = `${query} Extended Mix`;

  const args = [
    `ytsearch${limit}:${fullQuery}`,
    "--dump-json",
    "--no-playlist",
    "--flat-playlist",
  ];

  let stdout;
  try {
    ({ stdout } = await execFileAsync("yt-dlp", args));
  } catch (err) {
    throw new Error(`yt-dlp search failed: ${err.message}`);
  }

  return stdout
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const entry = JSON.parse(line);
      return {
        title: entry.title,
        url: `https://www.youtube.com/watch?v=${entry.id}`,
        duration: formatDuration(entry.duration),
        channel: entry.channel ?? entry.uploader ?? "unknown",
      };
    });
}

/**
 * Returns the URL of the top search result.
 * @param {string} query
 * @returns {Promise<string>}
 */
export async function searchTopUrl(query) {
  const results = await searchYouTube(query, 1);
  if (!results.length) throw new Error(`No results found for: "${query}"`);
  return results[0].url;
}

function formatDuration(seconds) {
  if (!seconds) return "unknown";
  const m = Math.floor(seconds / 60);
  const s = String(seconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}
