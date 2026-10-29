import { readFileSync, writeFileSync, existsSync } from "fs";

const QUEUE_FILE = "./queue.csv";
const HEADERS = "spotify_id,title,artists,status,downloaded_at\n";

function readQueue() {
  if (!existsSync(QUEUE_FILE)) return [];
  return readFileSync(QUEUE_FILE, "utf-8")
    .trim()
    .split("\n")
    .slice(1) // skip header
    .filter(Boolean)
    .map((line) => {
      const [spotify_id, title, artists, status, downloaded_at] = line.split(",");
      return { spotify_id, title, artists, status, downloaded_at };
    });
}

function writeQueue(rows) {
  const body = rows
    .map((r) => `${r.spotify_id},${r.title},${r.artists},${r.status},${r.downloaded_at ?? ""}`)
    .join("\n");
  writeFileSync(QUEUE_FILE, HEADERS + body + "\n", "utf-8");
}

export function getDoneIds() {
  return new Set(readQueue().filter((r) => r.status === "done").map((r) => r.spotify_id));
}

export function markDone(spotifyId, title, artists) {
  const rows = readQueue();
  const existing = rows.find((r) => r.spotify_id === spotifyId);
  if (existing) {
    existing.status = "done";
    existing.downloaded_at = new Date().toISOString();
    writeQueue(rows);
  } else {
    // track wasn't in queue yet, add it as done
    writeQueue([...rows, {
      spotify_id: spotifyId,
      title: title.replace(/,/g, " "),
      artists: artists.replace(/,/g, " "),
      status: "done",
      downloaded_at: new Date().toISOString(),
    }]);
  }
}

export function markFailed(spotifyId, title, artists) {
  const rows = readQueue();
  const existing = rows.find((r) => r.spotify_id === spotifyId);
  if (existing) {
    existing.status = "failed";
    writeQueue(rows);
  } else {
    writeQueue([...rows, {
      spotify_id: spotifyId,
      title: title.replace(/,/g, " "),
      artists: artists.replace(/,/g, " "),
      status: "failed",
      downloaded_at: "",
    }]);
  }
}
