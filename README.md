# spotify-sync

Downloads a Spotify playlist as MP3s and keeps a CSV log of what's been downloaded.

## How it works

Single nightly job — fetches the playlist, skips already-downloaded tracks, downloads new ones, and logs results to `queue.csv`.

## Prerequisites

### ffmpeg

```bash
sudo apt install ffmpeg
```

### yt-dlp

Don't use `apt` - the Debian package is outdated. Install via pip:

```bash
sudo apt remove yt-dlp
sudo apt install python3-pip
pip3 install -U yt-dlp
```

If `yt-dlp` isn't found after install:

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc && source ~/.bashrc
```

### spotdl

```bash
pip3 install spotdl
```

## Setup

```bash
npm install
```

## Usage

```bash
node run.js "https://open.spotify.com/playlist/..."
```

Downloads are saved to `./downloads/`. Failed tracks are logged to `errors.txt`.

## Scheduling (Windows Task Scheduler)

Create a task to run nightly via WSL:

```
wsl bash -c "cd ~/projetos/spotify-sync && node run.js 'YOUR_PLAYLIST_URL'"
```

## queue.csv

Tracks download history:

```
spotify_id,title,artists,status,downloaded_at
4uLU6hMCjMI75M1A2tKUQC,Just Dance,Dennis Quin,done,2026-10-29T23:00:00Z
```

Statuses: `done`, `failed`
