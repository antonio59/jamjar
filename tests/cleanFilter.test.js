import { describe, it, expect } from 'vitest';
import {
  isExplicitTitle,
  isCleanTitle,
  applyCleanFilter,
} from '../server/cleanFilter.js';

describe('isExplicitTitle', () => {
  it('flags common explicit markers', () => {
    for (const title of [
      'Artist - Song (Explicit)',
      'Song [Dirty]',
      'Song - Uncensored',
      'PARENTAL ADVISORY Song',
      'Song [E]',
    ]) {
      expect(isExplicitTitle(title), title).toBe(true);
    }
  });

  it('leaves ordinary titles alone', () => {
    for (const title of [
      'Happy - Pharrell Williams',
      'Let It Go - Frozen',
      'Explicitly Yours Orchestra',
      '',
    ]) {
      expect(isExplicitTitle(title), title).toBe(false);
    }
  });
});

describe('isCleanTitle', () => {
  it('recognises labelled clean cuts', () => {
    expect(isCleanTitle('Song (Clean Version)')).toBe(true);
    expect(isCleanTitle('Song - Radio Edit')).toBe(true);
    expect(isCleanTitle('Song')).toBe(false);
  });
});

describe('applyCleanFilter', () => {
  const results = [
    { id: '1', title: 'Song (Explicit)' },
    { id: '2', title: 'Song' },
    { id: '3', title: 'Song (Clean)' },
    { id: '4', title: 'Age gated song', ytRating: 'ytAgeRestricted' },
  ];

  it('drops explicit and age-restricted tracks and ranks clean first', () => {
    const filtered = applyCleanFilter(results);
    expect(filtered.map((r) => r.id)).toEqual(['3', '2']);
    expect(filtered[0].isCleanLabelled).toBe(true);
  });

  it('keeps everything when a parent opts in', () => {
    const filtered = applyCleanFilter(results, { allowExplicit: true });
    expect(filtered).toHaveLength(4);
    expect(filtered.find((r) => r.id === '1').isExplicit).toBe(true);
  });
});
