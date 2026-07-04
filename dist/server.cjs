var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server.ts
var server_exports = {};
__export(server_exports, {
  AI_ENABLED: () => AI_ENABLED
});
module.exports = __toCommonJS(server_exports);
var import_config = require("dotenv/config");
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_os = __toESM(require("os"), 1);
var import_child_process = require("child_process");
var import_stream = require("stream");
var import_vite = require("vite");
var import_ffmpeg_static = __toESM(require("ffmpeg-static"), 1);
var ROOT = process.cwd();
var PORTABLE_PY = import_path.default.join(ROOT, "bin", "python", "bin", "python3");
var YT_DLP_ZIPAPP = import_path.default.join(ROOT, "node_modules", "youtube-dl-exec", "bin", "yt-dlp");
var YT_DLP_STANDALONE = import_path.default.join(ROOT, "bin", "yt-dlp");
var YT_CMD;
var YT_PREFIX;
if (import_fs.default.existsSync(PORTABLE_PY) && import_fs.default.existsSync(YT_DLP_ZIPAPP)) {
  YT_CMD = PORTABLE_PY;
  YT_PREFIX = [YT_DLP_ZIPAPP];
} else if (import_fs.default.existsSync(YT_DLP_STANDALONE)) {
  YT_CMD = YT_DLP_STANDALONE;
  YT_PREFIX = [];
} else {
  YT_CMD = "yt-dlp";
  YT_PREFIX = [];
}
var FFMPEG = import_ffmpeg_static.default || "";
var UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";
var COOKIES_BROWSER = (process.env.COOKIES_FROM_BROWSER || "").trim();
var COOKIES_FILE = (process.env.COOKIES_FILE || "").trim() || (import_fs.default.existsSync(import_path.default.join(ROOT, "cookies.txt")) ? import_path.default.join(ROOT, "cookies.txt") : "");
var COOKIES_ON = !!(COOKIES_FILE || COOKIES_BROWSER);
function cookieArgs() {
  if (COOKIES_FILE) return ["--cookies", COOKIES_FILE];
  if (COOKIES_BROWSER) return ["--cookies-from-browser", COOKIES_BROWSER];
  return [];
}
function isYouTubeTarget(target = "") {
  return /(?:^|\/\/|\.)youtube\.com|youtu\.be|music\.youtube|^ytsearch/i.test(target);
}
function baseArgs(target = "") {
  const args = [
    "--no-check-certificates",
    "--no-warnings",
    "--add-header",
    `user-agent:${UA}`,
    // Speed: download many DASH fragments in parallel; skip .part files.
    "--concurrent-fragments",
    "8",
    "--no-part",
    // Robustness: auto-retry transient 403/timeouts instead of failing.
    "--retries",
    "5",
    "--fragment-retries",
    "10",
    "--extractor-retries",
    "3"
  ];
  const allowCookies = !isYouTubeTarget(target) || process.env.COOKIES_FOR_YOUTUBE === "1";
  if (allowCookies) args.push(...cookieArgs());
  if (FFMPEG) args.push("--ffmpeg-location", FFMPEG);
  return args;
}
function ytDumpJson(url, extra = []) {
  return new Promise((resolve, reject) => {
    (0, import_child_process.execFile)(
      YT_CMD,
      [...YT_PREFIX, url, "--dump-single-json", ...extra, ...baseArgs(url)],
      { maxBuffer: 128 * 1024 * 1024 },
      (err, stdout, stderr) => {
        if (err) return reject(Object.assign(err, { stderr }));
        try {
          resolve(JSON.parse(stdout));
        } catch (e) {
          reject(Object.assign(new Error("Failed to parse yt-dlp output"), { stderr }));
        }
      }
    );
  });
}
function ytGetUrl(url, format) {
  return new Promise((resolve, reject) => {
    (0, import_child_process.execFile)(
      YT_CMD,
      [...YT_PREFIX, url, "-f", format, "--get-url", "--no-warnings", ...baseArgs(url)],
      { maxBuffer: 8 * 1024 * 1024 },
      (err, stdout, stderr) => {
        if (err) return reject(Object.assign(err, { stderr }));
        const first = stdout.split("\n").map((s) => s.trim()).find((s) => /^https?:/.test(s));
        if (first) resolve(first);
        else reject(new Error("No stream URL"));
      }
    );
  });
}
var urlCache = /* @__PURE__ */ new Map();
var URL_TTL = 20 * 60 * 1e3;
async function cachedStreamUrl(pageUrl) {
  const hit = urlCache.get(pageUrl);
  if (hit && Date.now() - hit.at < URL_TTL) return hit.url;
  const direct = await ytGetUrl(
    pageUrl,
    "best[acodec!=none][vcodec!=none][ext=mp4]/best[acodec!=none][vcodec!=none]/best"
  );
  urlCache.set(pageUrl, { url: direct, at: Date.now() });
  return direct;
}
function ytRun(args) {
  return new Promise((resolve, reject) => {
    const child = (0, import_child_process.spawn)(YT_CMD, [...YT_PREFIX, ...args, ...baseArgs(args[0])]);
    let stderr = "";
    child.stderr.on("data", (d) => stderr += d.toString());
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(Object.assign(new Error(`yt-dlp exited with code ${code}`), { stderr }));
    });
  });
}
var COBALT_INSTANCES = (process.env.COBALT_INSTANCES || "https://dwnld.nichind.dev,https://co.eepy.today,https://cobalt-backend.canine.tools,https://cobalt-api.kwiatekmiki.com").split(",").map((s) => s.trim()).filter(Boolean);
async function cobaltResolve(pageUrl, opts = {}) {
  const body = opts.audioOnly ? { url: pageUrl, downloadMode: "audio", audioFormat: "mp3" } : { url: pageUrl, downloadMode: "auto", videoQuality: opts.quality || "1080" };
  for (const base of COBALT_INSTANCES) {
    try {
      const r = await withTimeout(
        fetch(base, {
          method: "POST",
          headers: { Accept: "application/json", "Content-Type": "application/json", "User-Agent": UA },
          body: JSON.stringify(body)
        }),
        9e3,
        null
      );
      if (!r || !r.ok) continue;
      const j = await r.json();
      if ((j.status === "tunnel" || j.status === "redirect") && j.url) return { url: j.url, filename: j.filename };
      if (j.status === "picker" && j.picker?.length) return { url: j.picker[0].url, filename: j.filename };
    } catch {
    }
  }
  return null;
}
async function proxyRemote(res, remoteUrl, filename, isAudio) {
  const upstream = await fetch(remoteUrl, { headers: { "User-Agent": UA } });
  if (!upstream.ok || !upstream.body) throw new Error(`upstream ${upstream.status}`);
  res.setHeader("Content-Type", isAudio ? "audio/mpeg" : "video/mp4");
  const len = upstream.headers.get("content-length");
  if (len) res.setHeader("Content-Length", len);
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  import_stream.Readable.fromWeb(upstream.body).pipe(res);
}
function humanSize(bytes) {
  if (!bytes || bytes <= 0) return "";
  const mb = bytes / (1024 * 1024);
  if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}
function estBytes(f, durationSec) {
  const kbps = f.tbr || f.vbr || f.abr;
  if (kbps && durationSec) return Math.round(kbps * 1e3 * durationSec / 8);
  return null;
}
function fmtBytes(f, durationSec) {
  return f.filesize || f.filesize_approx || estBytes(f, durationSec) || null;
}
var GROQ_KEY = process.env.GROQ_API_KEY || "";
var GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
var AI_ENABLED = !!(GROQ_KEY || GEMINI_KEY);
var AI_SYSTEM = `You resolve user input for a universal video downloader.
Return STRICT JSON: {"target": string, "kind": "url"|"search", "note": string}.
Rules:
- If the input contains a media link (YouTube, Instagram, TikTok, X/Twitter, Facebook, Vimeo, Reddit, SoundCloud, etc.), return the single cleanest canonical URL in "target" (strip tracking params like utm_*, si, feature; keep the video id; for YouTube prefer https://www.youtube.com/watch?v=ID or https://youtu.be/ID). kind="url".
- If the input is a description/song/phrase with no link, return "target":"ytsearch1:<the phrase>" and kind="search".
- "note": one short human sentence about what you did.`;
async function aiResolveGroq(text) {
  if (!GROQ_KEY) return null;
  const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_KEY}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: AI_SYSTEM },
        { role: "user", content: text }
      ]
    })
  });
  if (!r.ok) throw new Error(`Groq ${r.status}`);
  const j = await r.json();
  return JSON.parse(j.choices[0].message.content);
}
async function aiResolveGemini(text) {
  if (!GEMINI_KEY) return null;
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: AI_SYSTEM }] },
        contents: [{ parts: [{ text }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0 }
      })
    }
  );
  if (!r.ok) throw new Error(`Gemini ${r.status}`);
  const j = await r.json();
  const out = j.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  return JSON.parse(out);
}
async function musicLinkToQuery(url) {
  try {
    const sp = url.match(/open\.spotify\.com\/(track|album|playlist)\/([A-Za-z0-9]+)/);
    if (sp) {
      const [, type, id] = sp;
      const r = await fetch(`https://open.spotify.com/embed/${type}/${id}`, { headers: { "User-Agent": UA } });
      const html = await r.text();
      const nd = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
      if (nd) {
        const j = JSON.parse(nd[1]);
        const e = j?.props?.pageProps?.state?.data?.entity;
        if (e?.name) {
          const artists = (e.artists || []).map((a) => a.name);
          if (type === "track") {
            return {
              query: `${artists.join(" ")} ${e.name}`.trim(),
              note: `Spotify track \u201C${e.name}\u201D${artists.length ? " by " + artists.join(", ") : ""} \u2014 pick a source below to grab the audio.`
            };
          }
          return { query: e.name, note: `Spotify ${type} \u201C${e.name}\u201D \u2014 showing matching results. (Paste a track link for an exact song.)` };
        }
      }
      const o = await (await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`, { headers: { "User-Agent": UA } })).json().catch(() => null);
      if (o?.title) return { query: o.title, note: `Spotify \u201C${o.title}\u201D \u2014 showing matching results to download the audio.` };
    }
    const am = url.match(/music\.apple\.com\//);
    if (am) {
      const r = await fetch(url, { headers: { "User-Agent": UA } });
      const html = await r.text();
      const title = (html.match(/<meta property="og:title" content="([^"]+)"/) || [])[1];
      if (title) return { query: title.replace(/\s*[-–]\s*(Single|EP|Album|Apple Music).*/i, "").trim(), note: `Apple Music \u201C${title}\u201D \u2014 showing matching results to download the audio.` };
    }
  } catch (e) {
    console.error("music link resolve failed:", e?.message);
  }
  return null;
}
async function resolveInput(text) {
  const trimmed = text.trim();
  const urlMatch = trimmed.match(/https?:\/\/[^\s]+/i);
  if (urlMatch && /open\.spotify\.com|music\.apple\.com/i.test(urlMatch[0])) {
    const m = await musicLinkToQuery(urlMatch[0]);
    if (m) return { kind: "search", query: m.query, note: m.note, ai: true };
  }
  if (urlMatch && urlMatch[0].length >= trimmed.length - 2) {
    return { kind: "url", url: cleanUrl(urlMatch[0]), note: "", ai: false };
  }
  if (AI_ENABLED) {
    try {
      const res = await aiResolveGroq(trimmed).catch(() => null) || await aiResolveGemini(trimmed).catch(() => null);
      if (res?.target) {
        const target = String(res.target);
        if (res.kind === "search" || /^ytsearch/i.test(target)) {
          return { kind: "search", query: target.replace(/^ytsearch\d*:/i, ""), note: res.note || "", ai: true };
        }
        return { kind: "url", url: cleanUrl(target), note: res.note || "", ai: true };
      }
    } catch (e) {
      console.error("AI resolve failed, using heuristic:", e?.message);
    }
  }
  if (urlMatch) return { kind: "url", url: cleanUrl(urlMatch[0]), note: "", ai: false };
  return { kind: "search", query: trimmed, note: "", ai: false };
}
function durationText(sec) {
  const s = Number(sec) || 0;
  if (!s) return "";
  const h = Math.floor(s / 3600);
  const m = Math.floor(s % 3600 / 60);
  const ss = Math.floor(s % 60);
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}` : `${m}:${String(ss).padStart(2, "0")}`;
}
function withTimeout(p, ms, fallback) {
  return Promise.race([
    p.catch(() => fallback),
    new Promise((resolve) => setTimeout(() => resolve(fallback), ms))
  ]);
}
async function searchYouTube(query, n = 5) {
  const data = await ytDumpJson(`ytsearch${n}:${query}`, ["--flat-playlist"]);
  return (data.entries || []).filter((e) => e && (e.id || e.url)).map((e) => ({
    url: e.url || `https://www.youtube.com/watch?v=${e.id}`,
    title: e.title || "Untitled",
    thumbnail: (e.thumbnails?.length ? e.thumbnails[e.thumbnails.length - 1].url : e.thumbnail) || (e.id ? `https://i.ytimg.com/vi/${e.id}/hqdefault.jpg` : ""),
    channel: e.channel || e.uploader || "",
    duration: durationText(e.duration)
  })).filter((r) => r.url);
}
async function searchSoundCloud(query, n = 5) {
  const data = await ytDumpJson(`scsearch${n}:${query}`, ["--flat-playlist"]);
  return (data.entries || []).filter((e) => e && (e.url || e.webpage_url)).map((e) => ({
    url: e.url || e.webpage_url,
    title: e.title || "Untitled",
    thumbnail: e.thumbnails?.length ? e.thumbnails[e.thumbnails.length - 1].url : e.thumbnail || "",
    channel: e.uploader || e.channel || "",
    duration: durationText(e.duration)
  })).filter((r) => r.url);
}
async function searchDailymotion(query, n = 5) {
  const url = `https://api.dailymotion.com/videos?search=${encodeURIComponent(query)}&limit=${n}&fields=id,title,duration,thumbnail_360_url,owner.screenname`;
  const r = await fetch(url, { headers: { "User-Agent": UA } });
  if (!r.ok) return [];
  const j = await r.json();
  return (j.list || []).map((v) => ({
    url: `https://www.dailymotion.com/video/${v.id}`,
    title: v.title || "Untitled",
    thumbnail: v.thumbnail_360_url || "",
    channel: v["owner.screenname"] || "",
    duration: durationText(v.duration)
  }));
}
async function multiSearch(query) {
  const [yt, dm, sc] = await Promise.all([
    withTimeout(searchYouTube(query, 5), 15e3, []),
    withTimeout(searchDailymotion(query, 5), 8e3, []),
    withTimeout(searchSoundCloud(query, 5), 15e3, [])
  ]);
  return [
    { platform: "YouTube", kind: "video", results: yt },
    { platform: "Dailymotion", kind: "video", results: dm },
    { platform: "SoundCloud", kind: "audio", results: sc }
  ].filter((g) => g.results.length > 0);
}
function cleanUrl(u) {
  try {
    const url = new URL(u);
    ["utm_source", "utm_medium", "utm_campaign", "si", "feature", "list", "index", "pp"].forEach(
      (p) => url.searchParams.delete(p)
    );
    return url.toString().replace(/[)>\]]+$/, "");
  } catch {
    return u;
  }
}
function buildFormats(info) {
  const durationSec = Number(info.duration) || 0;
  const all = info.formats || [];
  const audioOnly = all.filter((f) => f.acodec && f.acodec !== "none" && (!f.vcodec || f.vcodec === "none")).sort((a, b) => (b.abr || 0) - (a.abr || 0));
  const bestAudio = audioOnly[0];
  const bestAudioBytes = bestAudio ? fmtBytes(bestAudio, durationSec) : 0;
  const byHeight = /* @__PURE__ */ new Map();
  for (const f of all) {
    if (!f.height || !f.vcodec || f.vcodec === "none") continue;
    const prev = byHeight.get(f.height);
    const score = (x) => (String(x.ext) === "mp4" ? 2 : 0) + (String(x.vcodec).startsWith("avc1") ? 1 : 0) + (x.tbr || 0) / 1e5;
    if (!prev || score(f) > score(prev)) byHeight.set(f.height, f);
  }
  const heights = [...byHeight.keys()].sort((a, b) => b - a);
  const maxH = heights[0] || 0;
  const video = heights.map((h) => {
    const f = byHeight.get(h);
    const hasOwnAudio = f.acodec && f.acodec !== "none";
    const vBytes = fmtBytes(f, durationSec) || 0;
    const total = hasOwnAudio ? vBytes : vBytes + (bestAudioBytes || 0);
    return {
      id: `v${h}`,
      height: h,
      label: `${h}p`,
      ext: "mp4",
      size: total || null,
      sizeText: humanSize(total),
      note: h === maxH ? "Best Quality" : ""
    };
  });
  if (video.length === 0 && audioOnly.length === 0) {
    video.push({ id: "best", height: 0, label: "Best Quality", ext: "mp4", size: null, sizeText: "", note: "Auto" });
  }
  const audio = [];
  const seenExt = /* @__PURE__ */ new Set();
  let firstAudio = true;
  for (const f of audioOnly) {
    const ext = String(f.ext || "").toLowerCase();
    if (!ext || seenExt.has(ext)) continue;
    seenExt.add(ext);
    const bytes = fmtBytes(f, durationSec);
    audio.push({
      // Encoded by extension (not raw itag): a raw format_id is client-specific and
      // often 403s; `bestaudio[ext=…]` lets yt-dlp pick a downloadable stream.
      id: `a:${ext}`,
      label: ext.toUpperCase(),
      ext,
      bitrate: f.abr ? Math.round(f.abr) : null,
      size: bytes || null,
      sizeText: humanSize(bytes),
      note: firstAudio ? "Recommended \xB7 fast" : "Original"
    });
    firstAudio = false;
    if (seenExt.size >= 3) break;
  }
  audio.push({
    id: "audio",
    label: "MP3",
    ext: "mp3",
    bitrate: bestAudio?.abr ? Math.round(bestAudio.abr) : null,
    size: bestAudioBytes || null,
    sizeText: bestAudioBytes ? `~${humanSize(bestAudioBytes)}` : "",
    note: "Converts \xB7 slower"
  });
  return { video, audio };
}
function buildMedia(info) {
  const { video, audio } = buildFormats(info);
  const resolvedUrl = info.webpage_url || info.original_url || "";
  const previewUrl = resolvedUrl ? `/api/stream?url=${encodeURIComponent(resolvedUrl)}` : "";
  const seenRes = /* @__PURE__ */ new Set();
  const images = (info.thumbnails || []).filter((t) => t.url && /^https?/.test(t.url)).sort((a, b) => (b.width || b.preference || 0) - (a.width || a.preference || 0)).map((t) => {
    const w = t.width, h = t.height;
    const label = w && h ? `${w}\xD7${h}` : t.id ? String(t.id) : "Image";
    return { url: t.url, label, width: w || 0, height: h || 0 };
  }).filter((im) => {
    const key = im.label;
    if (seenRes.has(key)) return false;
    seenRes.add(key);
    return true;
  }).slice(0, 6);
  if (images.length === 0 && info.thumbnail) images.push({ url: info.thumbnail, label: "Default", width: 0, height: 0 });
  return {
    title: info.title || "Media",
    thumbnail: info.thumbnail || (info.thumbnails?.length ? info.thumbnails[info.thumbnails.length - 1].url : ""),
    duration: info.duration_string || info.duration || "",
    uploader: info.uploader || info.channel || info.extractor_key || "",
    source: info.extractor_key || "",
    resolvedUrl,
    previewUrl,
    images,
    video,
    audio
  };
}
async function fallbackMedia(pageUrl) {
  let title = "Video";
  let thumbnail = "";
  try {
    const o = await withTimeout(
      fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(pageUrl)}&format=json`, {
        headers: { "User-Agent": UA }
      }).then((r) => r.ok ? r.json() : null),
      6e3,
      null
    );
    if (o?.title) title = o.title;
    if (o?.thumbnail_url) thumbnail = o.thumbnail_url;
  } catch {
  }
  const video = [1080, 720, 480, 360].map((hh) => ({
    id: `v${hh}`,
    height: hh,
    label: `${hh}p`,
    ext: "mp4",
    size: null,
    sizeText: "",
    note: hh === 1080 ? "Best Quality" : ""
  }));
  const audio = [{ id: "audio", label: "MP3", ext: "mp3", bitrate: null, size: null, sizeText: "", note: "Audio" }];
  return {
    title,
    thumbnail,
    duration: "",
    uploader: "",
    source: "YouTube",
    resolvedUrl: pageUrl,
    previewUrl: `/api/stream?url=${encodeURIComponent(pageUrl)}`,
    images: thumbnail ? [{ url: thumbnail, label: "Default", width: 0, height: 0 }] : [],
    video,
    audio
  };
}
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = Number(process.env.PORT) || 3e3;
  const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "*";
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", FRONTEND_ORIGIN);
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
  });
  app.use(import_express.default.json());
  app.get("/api/config", (_req, res) => res.json({ ai: AI_ENABLED, cookies: COOKIES_ON }));
  app.get("/api/stream", async (req, res) => {
    const src = req.query.url;
    if (!src || typeof src !== "string") return res.status(400).send("url required");
    try {
      const direct = await cachedStreamUrl(src);
      const range = req.headers.range;
      const upstream = await fetch(direct, {
        headers: { "User-Agent": UA, ...range ? { Range: range } : {} }
      });
      res.status(upstream.status);
      for (const h of ["content-type", "content-length", "content-range", "accept-ranges"]) {
        const v = upstream.headers.get(h);
        if (v) res.setHeader(h, v);
      }
      if (!upstream.headers.get("accept-ranges")) res.setHeader("Accept-Ranges", "bytes");
      if (!upstream.body) return res.end();
      import_stream.Readable.fromWeb(upstream.body).pipe(res);
      res.on("close", () => {
      });
    } catch (e) {
      console.error("Stream error:", e?.stderr || e?.message || e);
      if (!res.headersSent) res.status(502).send("Preview unavailable");
    }
  });
  app.get("/api/image", async (req, res) => {
    const src = req.query.src;
    const format = String(req.query.format || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!src || typeof src !== "string") return res.status(400).send("src required");
    const allowed = ["jpg", "jpeg", "png", "webp", "bmp"];
    const fmt = allowed.includes(format) ? format : "jpg";
    const tmpBase = import_path.default.join(import_os.default.tmpdir(), `img-${Date.now()}-${process.pid}`);
    const inFile = `${tmpBase}.src`;
    const outFile = `${tmpBase}.${fmt === "jpeg" ? "jpg" : fmt}`;
    try {
      const r = await fetch(src, { headers: { "User-Agent": UA } });
      if (!r.ok) throw new Error(`fetch ${r.status}`);
      import_fs.default.writeFileSync(inFile, Buffer.from(await r.arrayBuffer()));
      await new Promise((resolve, reject) => {
        const p = (0, import_child_process.spawn)(FFMPEG, ["-y", "-i", inFile, outFile]);
        let err = "";
        p.stderr.on("data", (d) => err += d);
        p.on("error", reject);
        p.on("close", (c) => c === 0 ? resolve() : reject(new Error(err.slice(-200))));
      });
      const stat = import_fs.default.statSync(outFile);
      const ctype = fmt === "png" ? "image/png" : fmt === "webp" ? "image/webp" : fmt === "bmp" ? "image/bmp" : "image/jpeg";
      res.setHeader("Content-Type", ctype);
      res.setHeader("Content-Length", stat.size.toString());
      res.setHeader("Content-Disposition", `attachment; filename="thumbnail.${fmt === "jpeg" ? "jpg" : fmt}"`);
      const stream = import_fs.default.createReadStream(outFile);
      stream.pipe(res);
      stream.on("close", () => {
        import_fs.default.unlink(inFile, () => {
        });
        import_fs.default.unlink(outFile, () => {
        });
      });
    } catch (e) {
      console.error("Image error:", e?.message || e);
      import_fs.default.unlink(inFile, () => {
      });
      import_fs.default.unlink(outFile, () => {
      });
      if (!res.headersSent) res.status(500).send("Image conversion failed");
    }
  });
  app.get("/api/suggest", async (req, res) => {
    const q = String(req.query.q || "").trim();
    if (q.length < 2 || /^https?:\/\//i.test(q)) return res.json({ suggestions: [] });
    try {
      const r = await fetch(
        `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(q)}`,
        { headers: { "User-Agent": UA } }
      );
      const j = await r.json();
      res.json({ suggestions: (j[1] || []).slice(0, 8) });
    } catch {
      res.json({ suggestions: [] });
    }
  });
  app.post("/api/analyze", async (req, res) => {
    const { url } = req.body || {};
    const text = String(url || "").trim();
    if (!text) return res.status(400).json({ error: "Please enter a link or a search." });
    try {
      const resolved = await resolveInput(text);
      if (resolved.kind === "search") {
        const groups = await multiSearch(resolved.query);
        if (groups.length === 0) return res.status(404).json({ error: "No results found on any platform." });
        return res.json({
          type: "results",
          query: resolved.query,
          aiNote: resolved.ai ? resolved.note : "",
          groups
        });
      }
      try {
        if (process.env.FORCE_COBALT === "1" && isYouTubeTarget(resolved.url)) throw new Error("forced-cobalt");
        const info = await ytDumpJson(resolved.url);
        return res.json({ type: "media", aiNote: resolved.ai ? resolved.note : "", ...buildMedia(info) });
      } catch (ytErr) {
        const media = await fallbackMedia(resolved.url);
        return res.json({ type: "media", aiNote: resolved.ai ? resolved.note : "", ...media });
      }
    } catch (error) {
      console.error("Analyze error:", error?.stderr || error?.message || error);
      res.status(500).json({ error: mapError(error) });
    }
  });
  app.post("/api/info", async (req, res) => {
    const { url } = req.body || {};
    if (!url || !String(url).trim()) return res.status(400).json({ error: "Please enter a link." });
    const clean = cleanUrl(String(url).trim());
    try {
      if (process.env.FORCE_COBALT === "1" && isYouTubeTarget(clean)) throw new Error("forced-cobalt");
      const info = await ytDumpJson(clean);
      res.json({ type: "media", aiNote: "", ...buildMedia(info) });
    } catch (error) {
      console.error("Error fetching info (yt-dlp), using fallback:", error?.message || error);
      try {
        const media = await fallbackMedia(clean);
        res.json({ type: "media", aiNote: "", ...media });
      } catch (e2) {
        res.status(500).json({ error: mapError(error) });
      }
    }
  });
  app.get("/api/download", async (req, res) => {
    const { url, format } = req.query;
    if (!url || typeof url !== "string") return res.status(400).send("URL is required");
    const quality = typeof format === "string" ? format : "best";
    const isMp3 = quality === "audio";
    const isNativeAudio = quality.startsWith("a:");
    const wantAudio = isMp3 || isNativeAudio;
    const cobQuality = quality.startsWith("v") ? quality.slice(1) : "1080";
    if (process.env.FORCE_COBALT === "1" && isYouTubeTarget(url)) {
      try {
        const cob = await cobaltResolve(url, { quality: cobQuality, audioOnly: wantAudio });
        if (cob?.url) return await proxyRemote(res, cob.url, cob.filename || `download.${wantAudio ? "mp3" : "mp4"}`, wantAudio);
        return res.status(502).send("Could not fetch this link right now. Please try again.");
      } catch (e) {
        console.error("Cobalt (forced) failed:", e?.message || e);
        return res.status(502).send("Could not fetch this link right now. Please try again.");
      }
    }
    const tmpBase = import_path.default.join(import_os.default.tmpdir(), `uvd-${Date.now()}-${process.pid}`);
    const outputTemplate = `${tmpBase}.%(ext)s`;
    let producedFile = null;
    try {
      if (isMp3) {
        await ytRun([
          url,
          "-f",
          "bestaudio/best",
          "--extract-audio",
          "--audio-format",
          "mp3",
          "--audio-quality",
          "0",
          "-o",
          outputTemplate
        ]);
      } else if (isNativeAudio) {
        const ext2 = quality.slice(2);
        await ytRun([url, "-f", `bestaudio[ext=${ext2}]/bestaudio/best`, "-o", outputTemplate]);
      } else {
        const h = quality.startsWith("v") ? parseInt(quality.slice(1), 10) : 0;
        const cap = h ? `[height<=${h}]` : "";
        const fmt = [
          `bv*${cap}[vcodec^=avc1]+ba[acodec^=mp4a]`,
          `bv*${cap}[ext=mp4]+ba[ext=m4a]`,
          `bv*${cap}+ba`,
          `b${cap}`,
          "best"
        ].join("/");
        await ytRun([url, "-f", fmt, "--merge-output-format", "mp4", "-o", outputTemplate]);
      }
      const dir = import_path.default.dirname(tmpBase);
      const prefix = import_path.default.basename(tmpBase);
      const match = import_fs.default.readdirSync(dir).find((f) => f.startsWith(prefix));
      if (!match) return res.status(500).send("Download produced no file.");
      producedFile = import_path.default.join(dir, match);
      const stat = import_fs.default.statSync(producedFile);
      const ext = import_path.default.extname(match);
      const audioType = ext === ".mp3" ? "audio/mpeg" : ext === ".m4a" ? "audio/mp4" : "audio/webm";
      res.setHeader("Content-Type", isMp3 || isNativeAudio ? audioType : "video/mp4");
      res.setHeader("Content-Length", stat.size.toString());
      res.setHeader("Content-Disposition", `attachment; filename="download${ext}"`);
      const stream = import_fs.default.createReadStream(producedFile);
      stream.pipe(res);
      const cleanup = () => {
        if (producedFile) {
          import_fs.default.unlink(producedFile, () => {
          });
          producedFile = null;
        }
      };
      stream.on("close", cleanup);
      stream.on("error", (err) => {
        console.error("Stream error:", err);
        cleanup();
        if (!res.headersSent) res.status(500).end();
      });
      res.on("close", () => stream.destroy());
    } catch (error) {
      console.error("Download error (yt-dlp):", error?.stderr || error?.message || error);
      if (producedFile) import_fs.default.unlink(producedFile, () => {
      });
      if (!res.headersSent) {
        try {
          const h = quality.startsWith("v") ? quality.slice(1) : "1080";
          const cob = await cobaltResolve(url, { quality: h, audioOnly: isMp3 || isNativeAudio });
          if (cob?.url) {
            console.log("[download] using Cobalt fallback");
            const ext = isMp3 || isNativeAudio ? "mp3" : "mp4";
            return await proxyRemote(res, cob.url, cob.filename || `download.${ext}`, isMp3 || isNativeAudio);
          }
        } catch (e) {
          console.error("Cobalt fallback failed:", e?.message || e);
        }
        res.status(500).send("Download failed: " + mapError(error));
      }
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (_req, res) => res.sendFile(import_path.default.join(distPath, "index.html")));
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`
  \u2705 Universal Video Downloader running:`);
    console.log(`     \u279C  http://localhost:${PORT}`);
    console.log(`     AI smart-paste: ${AI_ENABLED ? "ON" : "off (add GROQ_API_KEY or GEMINI_API_KEY)"}`);
    console.log(`     Login cookies:  ${COOKIES_ON ? COOKIES_FILE ? "file" : `browser:${COOKIES_BROWSER}` : "off (set COOKIES_FROM_BROWSER for Instagram/FB)"}
`);
  });
}
function mapError(error) {
  const msg = (error?.stderr || error?.message || "").toString();
  if (/empty media response|login required|requires? (?:a )?login|use --cookies|rate.?limit|only available to|account|not granting access|Sign in to confirm|not a bot|age.?restrict/i.test(msg)) {
    return COOKIES_ON ? "This post needs a logged-in session that could not access it. Make sure you are logged in to that site in the browser set as COOKIES_FROM_BROWSER, and that the post is visible there." : "This platform (e.g. Instagram/Facebook) needs you to be logged in. Enable cookies once: put COOKIES_FROM_BROWSER=chrome (or safari) in your .env and restart. Then log in to that site in that browser.";
  }
  if (/Video unavailable|Private video|members-only|This video is private/i.test(msg))
    return "This video is unavailable, private, or region-restricted.";
  if (/Unsupported URL|no video|Unable to extract|Unable to find|nothing to download/i.test(msg))
    return "This link/platform is not supported, or nothing was found at that URL.";
  if (/timed out|Connection reset|getaddrinfo|Temporary failure|Failed to resolve|Network is unreachable/i.test(msg))
    return "Network error reaching the site. Please check your connection and try again.";
  return "Could not process this link. Please check it and try again.";
}
startServer();
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AI_ENABLED
});
//# sourceMappingURL=server.cjs.map
