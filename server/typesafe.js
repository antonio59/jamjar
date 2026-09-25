// Optional TypeSafe (Jev) layer over the deterministic clean filter. Regexes
// catch labelled explicit/clean cuts; Jev judges the unlabelled middle ground —
// "Song (Official Audio)" by an artist who swears — where syntax alone can't.
// Without TYPESAFE_API_KEY every call no-ops and regex labels stand alone.

import axios from "axios";
import logger from "./logger.js";

const API_URL = "https://api.typesafe.ai/v1/systemone";
const MODEL = "jev-latest";
const TIMEOUT_MS = 8000;

export function typesafeEnabled() {
  return Boolean(process.env.TYPESAFE_API_KEY);
}

// Noul is a probability, not a verdict — below this a track isn't offered to
// kids without a clean label. Tunable per deployment.
export function cleanThreshold() {
  const v = parseFloat(process.env.TYPESAFE_CLEAN_THRESHOLD);
  return Number.isFinite(v) && v > 0 && v < 1 ? v : 0.5;
}

const STATE = {
  task: "Judge whether each YouTube result is a clean, kid-safe version of the song a child asked for. Judge the specific version linked, not whether the song exists in a clean form somewhere.",
};

const CRITERIA = {
  true: "Labelled clean, radio edit, censored, kid-friendly — or an ordinary official release (audio, lyric video, music video) of the song with no indication of explicit lyrics.",
  false: "Explicit/dirty/uncensored markers, an artist or title strongly associated with explicit content, or material plainly aimed at adults.",
};

// One batched System One call — a Noul per result. Returns Map<track.id, p>
// or null when the service can't answer, so callers fall back to labels.
export async function judgeCleanVersions(query, tracks) {
  if (!typesafeEnabled() || tracks.length === 0) return null;

  const questions = {};
  tracks.forEach((t, i) => {
    questions[`t${i}`] = {
      type: "noul",
      instructions: {
        question: "Is `track` a clean, kid-safe version of the requested music?",
        track: { title: t.title, duration: t.duration ?? null },
      },
      criteria: CRITERIA,
    };
  });

  try {
    const res = await axios.post(
      API_URL,
      { state: { ...STATE, query }, model: MODEL, questions },
      {
        headers: { Authorization: `Bearer ${process.env.TYPESAFE_API_KEY}` },
        timeout: TIMEOUT_MS,
      },
    );
    const out = new Map();
    tracks.forEach((t, i) => {
      const a = res.data?.answers?.[`t${i}`];
      if (a?.type === "noul" && typeof a.noul === "number") out.set(t.id ?? i, a.noul);
    });
    return out;
  } catch (err) {
    logger.warn("typesafe judgment failed — label rules stand alone", {
      error: err.message,
    });
    return null;
  }
}

// Single-track variant used when a request is submitted — titles from pasted
// URLs are user-edited, so the server re-judges rather than trusting search.
export async function judgeTitleClean(title) {
  const scores = await judgeCleanVersions(title, [{ id: "one", title }]);
  return scores?.get("one") ?? null;
}
