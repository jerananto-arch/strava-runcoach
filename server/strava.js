const https = require("https");
const fs = require("fs");
const path = require("path");

const ENV_PATH = process.env.ENV_PATH || path.join(__dirname, "../../strava-mcp/.env");

function loadEnv() {
  if (!fs.existsSync(ENV_PATH)) return {};
  const env = {};
  fs.readFileSync(ENV_PATH, "utf8").split("\n").forEach((line) => {
    const [k, ...v] = line.split("=");
    if (k && v.length) env[k.trim()] = v.join("=").trim();
  });
  return env;
}

function saveEnv(env) {
  if (!fs.existsSync(ENV_PATH)) return;
  fs.writeFileSync(ENV_PATH, Object.entries(env).map(([k, v]) => `${k}=${v}`).join("\n") + "\n");
}

function httpRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

function apiGet(path, token) {
  return httpRequest({ hostname: "www.strava.com", path, headers: { Authorization: `Bearer ${token}` } });
}

function apiPost(path, params) {
  const body = new URLSearchParams(params).toString();
  return httpRequest({
    hostname: "www.strava.com", path, method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "Content-Length": Buffer.byteLength(body) },
  }, body);
}

async function getValidToken() {
  const clientId     = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;
  const refreshToken = process.env.STRAVA_REFRESH_TOKEN;
  let   accessToken  = process.env.STRAVA_ACCESS_TOKEN;
  const expiresAt    = parseInt(process.env.STRAVA_TOKEN_EXPIRES_AT || "0");

  if (!clientId || !clientSecret || !refreshToken) throw new Error("Strava credentials not configured");

  if (Math.floor(Date.now() / 1000) < expiresAt - 300) return accessToken;

  console.log("[strava] Refreshing token...");
  const res = await apiPost("/oauth/token", {
    client_id: clientId, client_secret: clientSecret,
    grant_type: "refresh_token", refresh_token: refreshToken,
  });
  if (res.status !== 200) throw new Error(`Token refresh failed: ${JSON.stringify(res.body)}`);

  const { access_token, refresh_token, expires_at } = res.body;
  process.env.STRAVA_ACCESS_TOKEN       = access_token;
  process.env.STRAVA_REFRESH_TOKEN      = refresh_token;
  process.env.STRAVA_TOKEN_EXPIRES_AT   = String(expires_at);

  // Persist to .env file if it exists locally
  const env = loadEnv();
  if (Object.keys(env).length) {
    Object.assign(env, { STRAVA_ACCESS_TOKEN: access_token, STRAVA_REFRESH_TOKEN: refresh_token, STRAVA_TOKEN_EXPIRES_AT: String(expires_at) });
    saveEnv(env);
  }
  return access_token;
}

async function getActivitiesForWeek(after, before) {
  const token = await getValidToken();
  const res = await apiGet(`/api/v3/athlete/activities?per_page=50&after=${after}&before=${before}`, token);
  if (res.status !== 200) throw new Error(`Failed to fetch activities: ${JSON.stringify(res.body)}`);
  return res.body.filter((a) => a.type === "Run" || a.sport_type === "Run");
}

async function getActivityDetail(id) {
  const token = await getValidToken();
  const res = await apiGet(`/api/v3/activities/${id}`, token);
  if (res.status !== 200) throw new Error(`Failed to fetch activity ${id}`);
  return res.body;
}

module.exports = { getActivitiesForWeek, getActivityDetail, getValidToken };
