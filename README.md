# yt-mp3-downloader

Downloads tracks from YouTube as high-quality MP3s, with Spotify playlist support.

## Prerequisites

### ffmpeg

```bash
sudo apt install ffmpeg
```

### yt-dlp

Don't use `apt` - the Debian package is outdated. Install via pip instead:

```bash
sudo apt remove yt-dlp
sudo apt install python3-pip
pip3 install -U yt-dlp
```

To update later:

```bash
pip3 install -U yt-dlp
```

If `yt-dlp` isn't found after install, add pip's bin dir to your PATH:

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc && source ~/.bashrc
```

## Spotify Setup

The Spotify module uses the Client Credentials flow - no user login needed, works for any public playlist.

1. Go to https://developer.spotify.com/dashboard and create a free app
2. Select "Web API" when asked which API/SDKs you'll use
3. Set the redirect URI to `https://localhost` (required by the form, never actually used)
4. Copy the Client ID and Client Secret from the app settings page
5. Add them to a `.env` file in the project root:

```
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
```

## Setup

```bash
npm install
```

## Usage

```bash
# List top 5 YouTube results for a query
node example.js search "Just Dance - Dennis Quin Remix"

# Download by YouTube URL
node example.js download "https://www.youtube.com/watch?v=..."

# Search YouTube and download the top result
node example.js get "Just Dance - Dennis Quin Remix"

# List all tracks in a Spotify playlist
node example.js playlist "https://open.spotify.com/playlist/..."
```

Downloads are saved to `./downloads/` by default.

## API

### `downloadMp3(url, outDir?)`

Downloads a YouTube URL as MP3 at the highest available quality. Tries multiple player clients automatically if a format isn't available.

- `url` - YouTube video URL
- `outDir` - output directory (default: `./downloads`)
- Returns `Promise<string>` - saved file path

### `searchYouTube(query, limit?)`

Searches YouTube and returns an array of results. Appends "Extended Mix" to every query automatically.

- `query` - search string
- `limit` - number of results (default: `5`)
- Returns `Promise<Array<{ title, url, duration, channel }>>`

### `searchTopUrl(query)`

Returns the URL of the top YouTube search result.

### `getPlaylistTracks(playlistInput, opts?)`

Fetches all tracks from a public Spotify playlist.

- `playlistInput` - playlist URL, URI, or bare ID
- `opts.clientId` / `opts.clientSecret` - override env credentials
- Returns `Promise<Array<{ name, artists, query }>>` where `query` is pre-formatted as `"Track - Artist"` ready for `searchTopUrl`
