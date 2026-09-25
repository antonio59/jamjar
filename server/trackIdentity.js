// Track identity: how a request becomes a canonical key (for duplicate
// detection) and a clean filename. Shared by the API, the database backfill,
// and the downloader so all three agree on what "the same track" means.

import fs from "fs";
import path from "path";

// Bracketed noise stripped from display titles and filenames — upload metadata
// ("Official Video", "4K", "Topic") that isn't part of the song's name.
const TITLE_NOISE =
  /[[(][\s\w]*(official\s*(lyric|music|audio|hd|4k)?(\s*video)?|lyric[s]?|audio|hd|4k|explicit|remaster(ed)?|visuali[sz]er|performance\s*video|topic)[\s\w]*[\])]/gi;

// Generic/placeholder titles that only arrive from older imports or odd
// YouTube metadata — the request UI requires a real title.
const GENERIC_TITLES = new Set([
  "video from url",
  "youtube video",
  "untitled",
  "song",
]);

export function normalizeTitle(title, fallback = null) {
  if (!title || typeof title !== "string") {
    return fallback || "Untitled track";
  }
  let cleaned = title
    .replace(TITLE_NOISE, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  if (cleaned.length > 200) cleaned = cleaned.slice(0, 200).trim();
  if (!cleaned || GENERIC_TITLES.has(cleaned.toLowerCase())) {
    return fallback || cleaned || "Untitled track";
  }
  return cleaned;
}

// "Artist - Title" split used everywhere a display title is parsed. Falls back
// to em/en dashes for audiobook-style "Title — Author" strings.
export function splitArtistTitle(title) {
  const cleaned = normalizeTitle(title, title || "");
  const dashIdx = cleaned.indexOf(" - ");
  if (dashIdx > 0) {
    return {
      artist: cleaned.slice(0, dashIdx).trim(),
      trackTitle: cleaned.slice(dashIdx + 3).trim(),
    };
  }
  const emIdx = cleaned.indexOf(" — ");
  if (emIdx > 0) {
    return {
      artist: null,
      trackTitle: cleaned.slice(0, emIdx).trim(),
      subtitle: cleaned.slice(emIdx + 3).trim(),
    };
  }
  return { artist: null, trackTitle: cleaned };
}

function stripDiacritics(s) {
  return s.normalize("NFKD").replace(/[̀-ͯ]/g, "");
}

// Canonical dedupe key. Version qualifiers in brackets ((Clean), (Radio Edit),
// (Official Video), (Live)…) and featured-artist tags are dropped so the same
// recording matches across differently-labelled uploads. Deliberately coarse:
// in a kids' library "Song" and "Song (Live)" are the same track.
export function trackKey(title) {
  if (!title || typeof title !== "string") return null;
  const key = stripDiacritics(normalizeTitle(title, title))
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[[(][^\])]*[\])]/g, " ")
    .replace(/\b(feat|ft|featuring)\.?\b[^-—–]*/g, " ")
    .replace(/[''`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    // Initialisms: "T.N.T." and "T N T" mean the same thing
    .replace(/\b[a-z](?: [a-z])+\b/g, (m) => m.replace(/ /g, ""))
    .replace(/\s{2,}/g, " ");
  return key || null;
}

// Characters unsafe on FAT/exFAT (iPod) and SMB/network shares, plus controls.
// eslint-disable-next-line no-control-regex -- control chars are the point
const UNSAFE_FILENAME_CHARS = /[/\\?%*:|"<>\x00-\x1f]/g;

// "Artist - Title" display name → filesystem-safe base (no extension). Keeps
// meaningful qualifiers like "(Clean)" or "(Live)" — only noise tags were
// removed by normalizeTitle upstream.
export function cleanBaseName(title) {
  const { artist, trackTitle } = splitArtistTitle(title);
  const base = (artist ? `${artist} - ${trackTitle}` : trackTitle)
    .normalize("NFKC")
    .replace(UNSAFE_FILENAME_CHARS, "")
    .replace(/\s{2,}/g, " ")
    .replace(/[. ]+$/, "")
    .trim()
    .slice(0, 90);
  return base || "track";
}

// First free "<base> (n).ext" in dir, so two downloads never clobber each other.
export function uniqueFileName(dir, base, ext = "mp3") {
  let name = `${base}.${ext}`;
  let n = 2;
  while (fs.existsSync(path.join(dir, name))) {
    name = `${base} (${n}).${ext}`;
    n += 1;
  }
  return name;
}
