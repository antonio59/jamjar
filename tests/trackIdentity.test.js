import { describe, it, expect } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  normalizeTitle,
  trackKey,
  splitArtistTitle,
  cleanBaseName,
  uniqueFileName,
} from '../server/trackIdentity.js';

describe('normalizeTitle', () => {
  it('strips upload-metadata noise but keeps version qualifiers', () => {
    expect(normalizeTitle('Happy (Official Music Video)')).toBe('Happy');
    expect(normalizeTitle('Song [Audio]')).toBe('Song');
    expect(normalizeTitle('Song (Clean)')).toBe('Song (Clean)');
    expect(normalizeTitle('Song (Live)')).toBe('Song (Live)');
  });

  it('falls back for generic or empty titles', () => {
    expect(normalizeTitle('untitled', 'Fallback')).toBe('Fallback');
    expect(normalizeTitle('')).toBe('Untitled track');
  });
});

describe('trackKey', () => {
  it('matches differently-labelled uploads of the same recording', () => {
    const key = trackKey('Pharrell Williams - Happy (Official Video)');
    expect(trackKey('Pharrell Williams - Happy (Clean)')).toBe(key);
    expect(trackKey('Pharrell Williams - Happy')).toBe(key);
    expect(trackKey('pharrell williams — happy')).toBe(key);
  });

  it('ignores feat tags, punctuation, diacritics, and case', () => {
    expect(trackKey('Beyoncé - Halo (feat. Someone)')).toBe(
      trackKey('beyonce - halo'),
    );
    expect(trackKey('AC/DC - T.N.T.')).toBe(trackKey('AC DC - TNT'));
  });

  it('keeps different songs distinct', () => {
    expect(trackKey('Katy Perry - Roar')).not.toBe(trackKey('Katy Perry - Firework'));
  });

  it('returns null for unusable titles', () => {
    expect(trackKey(null)).toBeNull();
    expect(trackKey('')).toBeNull();
  });
});

describe('splitArtistTitle', () => {
  it('splits on " - " and leaves dashless titles alone', () => {
    expect(splitArtistTitle('Katy Perry - Roar')).toMatchObject({
      artist: 'Katy Perry',
      trackTitle: 'Roar',
    });
    expect(splitArtistTitle('Roar')).toMatchObject({ artist: null, trackTitle: 'Roar' });
  });
});

describe('cleanBaseName', () => {
  it('produces "Artist - Title" filesystem-safe names', () => {
    expect(cleanBaseName('Pharrell Williams - Happy (Official Video)')).toBe(
      'Pharrell Williams - Happy',
    );
    expect(cleanBaseName('Artist - Song (Clean)')).toBe('Artist - Song (Clean)');
    expect(cleanBaseName('AC/DC - T.N.T.')).toBe('ACDC - T.N.T');
    expect(cleanBaseName('Happy')).toBe('Happy');
  });

  it('never returns an empty name and caps length', () => {
    expect(cleanBaseName('///')).toBe('track');
    expect(cleanBaseName('x'.repeat(200)).length).toBeLessThanOrEqual(90);
  });
});

describe('uniqueFileName', () => {
  it('numbers collisions', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jamjar-names-'));
    expect(uniqueFileName(dir, 'A - B')).toBe('A - B.mp3');
    fs.writeFileSync(path.join(dir, 'A - B.mp3'), 'x');
    fs.writeFileSync(path.join(dir, 'A - B (2).mp3'), 'x');
    expect(uniqueFileName(dir, 'A - B')).toBe('A - B (3).mp3');
  });
});
