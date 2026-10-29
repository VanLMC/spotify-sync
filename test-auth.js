import "dotenv/config";

const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

console.log("Client ID:", clientId ? `${clientId.slice(0, 6)}...` : "MISSING");
console.log("Client Secret:", clientSecret ? `${clientSecret.slice(0, 6)}...` : "MISSING");

const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

const res = await fetch("https://accounts.spotify.com/api/token", {
  method: "POST",
  headers: {
    Authorization: `Basic ${credentials}`,
    "Content-Type": "application/x-www-form-urlencoded",
  },
  body: "grant_type=client_credentials",
});

const body = await res.json();
console.log("Status:", res.status);
console.log("Response:", JSON.stringify(body, null, 2));
