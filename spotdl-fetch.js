import { execFile } from "child_process";
import { promisify } from "util";
import { readFileSync, unlinkSync, existsSync } from "fs";

const execFileAsync = promisify(execFile);

/**
 * Uses `spotdl save` to fetch track metadata from a Spotify playlist.
 *
 * @param {string} playlistUrl
 * @returns {Promise<{ playlistName: string, tracks: Array<{ spotify_id, title, artists, query }> }>}
 */
export async function fetchPlaylistTracks(playlistUrl) {
  const saveFile = "./playlist.spotdl";

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
  unlinkSync(saveFile);

  const playlistName = raw[0]?.list_name ?? "playlist";

  const tracks = raw.map((song) => {
    const artists = Array.isArray(song.artists)
      ? song.artists.join(", ")
      : (song.artist ?? "");
    return {
      spotify_id: song.song_id ?? song.url?.split("/track/")[1]?.split("?")[0] ?? song.name,
      title: song.name,
      artists,
      query: `${song.name} - ${artists}`,
    };
  });

  return { playlistName, tracks };
}
