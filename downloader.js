import { execFile } from "child_process";
import { promisify } from "util";
import { existsSync, mkdirSync } from "fs";
import path from "path";

const execFileAsync = promisify(execFile);

const PLAYER_CLIENTS = ["tv_embedded", "web", "ios"];

/**
 * Downloads a YouTube URL as the highest quality MP3.
 *
 * @param {string} url       - YouTube URL
 * @param {string} [outDir]  - Output directory (defaults to ./downloads)
 * @returns {Promise<string>} - Resolves with the saved file path
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
      return stdout.trim().split("\n").pop();
    } catch (err) {
      lastError = err;
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
