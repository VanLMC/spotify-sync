import { execFile } from "child_process";
import { promisify } from "util";
import { readFileSync, unlinkSync, existsSync } from "fs";

const execFileAsync = promisify(execFile);

/**
 * Uses `spotdl save` to fetch track metadata from a Spotify playlist
 * without downloading any audio.
 *
 * Returns an array ready to be passed into addToQueue().
 *
 * @param {string} playlistUrl - Spotify playlist URL
 * @returns {Promise<Array<{ spotify_id, title, artists }>>}
 */
export async function fetchPlaylistTracks(playlistUrl) {
  const saveFile = "./playlist-save.spotdl";

  // clean up any leftover save file
  if (existsSync(saveFile)) unlinkSync(saveFile);

  try {
    await execFileAsync("spotdl", ["save", playlistUrl, "--save-file", saveFile]);
  } catch (err) {
    throw new Error(`spotdl fetch failed: ${err.message}`);
  }

  if (!existsSync(saveFile)) {
    throw new Error("spotdl did not produce a save file");
  }

  const raw = JSON.parse(readFileSync(saveFile, "utf-8"));
  unlinkSync(saveFile); // clean up

  // spotdl save file is an array of song objects
  return raw.map((song) => ({
    spotify_id: song.song_id ?? song.url?.split("/track/")[1]?.split("?")[0] ?? song.name,
    title: song.name,
    artists: Array.isArray(song.artists) ? song.artists.join("; ") : song.artist ?? "",
  }));
}
