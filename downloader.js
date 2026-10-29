import { execFile } from "child_process";
import { promisify } from "util";
import { existsSync, mkdirSync } from "fs";
import path from "path";

const execFileAsync = promisify(execFile);

// Clients to try in order — tv_embedded has the broadest access
const PLAYER_CLIENTS = ["tv_embedded", "web", "ios"];

/**
 * Downloads a YouTube video as the highest quality MP3.
 *
 * Prerequisites:
 *   - yt-dlp installed and on PATH  (https://github.com/yt-dlp/yt-dlp)
 *   - ffmpeg installed and on PATH  (https://ffmpeg.org)
 *
 * @param {string} url       - YouTube URL
 * @param {string} [outDir]  - Output directory (defaults to ./downloads)
 * @returns {Promise<string>} - Resolves with the path of the saved MP3 file
 */
export async function downloadMp3(url, outDir = "./downloads") {
  if (!url || !isValidYouTubeUrl(url)) {
    throw new Error(`Invalid YouTube URL: ${url}`);
  }

  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }

  const outputTemplate = path.join(outDir, "%(title)s.%(ext)s");

  let lastError;
  for (const client of PLAYER_CLIENTS) {
    const args = [
      url,
      "--format", "bestaudio/best",
      "--extract-audio",
      "--audio-format", "mp3",
      "--audio-quality", "0",
      "--embed-thumbnail",
      "--add-metadata",
      "--no-playlist",
      "--extractor-args", `youtube:player_client=${client}`,
      "--output", outputTemplate,
      "--print", "after_move:filepath",
    ];

    try {
      const { stdout } = await execFileAsync("yt-dlp", args);
      const filePath = stdout.trim().split("\n").pop();
      return filePath;
    } catch (err) {
      lastError = err;
      // only retry if the error looks like a format/access issue
      if (!err.message.includes("format is not available") &&
          !err.message.includes("Only images")) {
        break;
      }
    }
  }

  throw new Error(`yt-dlp failed: ${lastError.message}`);
}

function isValidYouTubeUrl(url) {
  return /^https?:\/\/(www\.)?(youtube\.com\/(watch\?.*v=|shorts\/)|youtu\.be\/)/.test(url);
}
