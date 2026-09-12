// Clean-version filtering: keeps explicit tracks out of kids' search results
// and out of requests, and prefers labelled clean/radio edits when both exist.

const EXPLICIT_PATTERNS = [
  /\bexplicit\b/i,
  /\bdirty\s*(version|mix|edit)?\b/i,
  /\buncensored\b/i,
  /\bunedited\b/i,
  /\bparental\s+advisory\b/i,
  /\bnsfw\b/i,
  /[[(]\s*e\s*[\])]/i,
  /🅴/u,
];

const CLEAN_PATTERNS = [
  /\bclean\s*(version|mix|edit|audio)?\b/i,
  /\bradio\s*(edit|version|mix)\b/i,
  /\bcensored\b/i,
  /\bkid[sz]\s*(bop|version|friendly)\b/i,
  /\bfamily\s*friendly\b/i,
];

export function isExplicitTitle(title) {
  if (!title) return false;
  return EXPLICIT_PATTERNS.some((re) => re.test(title));
}

export function isCleanTitle(title) {
  if (!title) return false;
  return CLEAN_PATTERNS.some((re) => re.test(title));
}

// Age-restricted videos can never be downloaded for a child profile.
export function isAgeRestricted(rating) {
  return rating === "ytAgeRestricted";
}

export function classifyTrack(track) {
  const explicit = isExplicitTitle(track.title) || isAgeRestricted(track.ytRating);
  return {
    ...track,
    isExplicit: explicit,
    isCleanLabelled: !explicit && isCleanTitle(track.title),
  };
}

// Drops explicit results and floats labelled clean versions to the top so the
// "clean" option is what a kid sees first.
export function applyCleanFilter(results, { allowExplicit = false } = {}) {
  const classified = results.map(classifyTrack);
  const filtered = allowExplicit
    ? classified
    : classified.filter((r) => !r.isExplicit);
  return filtered.sort(
    (a, b) => Number(b.isCleanLabelled) - Number(a.isCleanLabelled),
  );
}
