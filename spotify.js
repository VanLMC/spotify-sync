import "dotenv/config";

const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_API_URL = "https://api.spotify.com/v1";

async function getAccessToken(clientId, clientSecret) {
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Spotify auth failed: ${res.status} ${res.statusText} - ${body}`);
  }

  const data = await res.json();
  return data.access_token;
}

function extractPlaylistId(input) {
  const urlMatch = input.match(/playlist\/([A-Za-z0-9]+)/);
  if (urlMatch) return urlMatch[1];
  const uriMatch = input.match(/spotify:playlist:([A-Za-z0-9]+)/);
  if (uriMatch) return uriMatch[1];
  return input;
}

/**
 * Fetches all tracks from a public Spotify playlist.
 *
 * @param {string} playlistInput  - Playlist URL, URI, or bare ID
 * @param {object} [opts]
 * @param {string} [opts.clientId]
 * @param {string} [opts.clientSecret]
 * @returns {Promise<Array<{ id: string, name: string, artists: string[], query: string }>>}
 */
export async function getPlaylistTracks(playlistInput, opts = {}) {
  const clientId = opts.clientId ?? process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = opts.clientSecret ?? process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Spotify credentials missing. Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in your .env file."
    );
  }

  const playlistId = extractPlaylistId(playlistInput);
  const token = await getAccessToken(clientId, clientSecret);

  const tracks = [];
  let url = `${SPOTIFY_API_URL}/playlists/${playlistId}/tracks?limit=100`;

  while (url) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Spotify API error: ${res.status} ${res.statusText} - ${body}`);
    }

    const data = await res.json();

    for (const item of data.items) {
      if (!item.track) continue;

      const { id, name, artists } = item.track;
      const artistNames = artists.map((a) => a.name);

      tracks.push({
        id,
        name,
        artists: artistNames,
        query: `${name} - ${artistNames.join(", ")}`,
      });
    }

    url = data.next ?? null;
  }

  return tracks;
}
