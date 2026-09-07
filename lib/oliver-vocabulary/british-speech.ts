/**
 * Keyless British English (en-GB) speech for Oliver Vocabulary Master.
 *
 * Uses the Web Speech API only. OpenMAIC cloud TTS is intentionally not required
 * so Listen works without an API key.
 *
 * Voice preference: standard British English. Australian (en-AU) voices are
 * never preferred, even though the student is in an Australian scholarship path.
 */

import { containsChinese } from '@/Oliver_Vocabulary_System/student-view';

export const BRITISH_ENGLISH_LANG = 'en-GB';
export const BRITISH_SPEECH_RATE = 0.92;

/** Subset of SpeechSynthesisVoice used so selection can be unit-tested in Node. */
export interface BrowserVoiceLike {
  name: string;
  lang: string;
  voiceURI?: string;
  default?: boolean;
  localService?: boolean;
}

const PREFERRED_UK_NAME_PATTERNS: Array<{ pattern: RegExp; score: number }> = [
  { pattern: /google uk english female/i, score: 100 },
  { pattern: /google uk english male/i, score: 95 },
  { pattern: /google uk english/i, score: 90 },
  { pattern: /microsoft hazel/i, score: 88 },
  { pattern: /microsoft daniel/i, score: 86 },
  { pattern: /microsoft libby/i, score: 84 },
  { pattern: /microsoft sonia/i, score: 82 },
  { pattern: /microsoft ryan/i, score: 80 },
  { pattern: /microsoft thomas/i, score: 78 },
  { pattern: /microsoft george/i, score: 76 },
  { pattern: /microsoft susan/i, score: 74 },
  { pattern: /uk english female/i, score: 70 },
  { pattern: /uk english male/i, score: 68 },
  { pattern: /uk english/i, score: 60 },
  { pattern: /\bbritish\b/i, score: 50 },
];

export function normalizeVoiceLang(lang: string): string {
  return lang.replaceAll('_', '-').trim().toLowerCase();
}

export function isBritishEnglishLang(lang: string): boolean {
  return normalizeVoiceLang(lang).startsWith('en-gb');
}

export function isAustralianEnglishLang(lang: string): boolean {
  return normalizeVoiceLang(lang).startsWith('en-au');
}

export function isEnglishLang(lang: string): boolean {
  return normalizeVoiceLang(lang).startsWith('en');
}

export function ukVoiceNameScore(name: string): number {
  for (const { pattern, score } of PREFERRED_UK_NAME_PATTERNS) {
    if (pattern.test(name)) return score;
  }
  return 0;
}

function comparePreferred(a: BrowserVoiceLike, b: BrowserVoiceLike): number {
  const nameDelta = ukVoiceNameScore(b.name) - ukVoiceNameScore(a.name);
  if (nameDelta !== 0) return nameDelta;
  return a.name.localeCompare(b.name);
}

/**
 * Pick a standard British English voice.
 * Order: named UK voices with en-GB → any en-GB → UK-named non-AU English →
 * other non-AU English → en-AU only as a last resort.
 */
export function selectBritishEnglishVoice<T extends BrowserVoiceLike>(voices: T[]): T | null {
  const english = voices.filter((voice) => isEnglishLang(voice.lang));
  if (english.length === 0) return null;

  const british = english.filter((voice) => isBritishEnglishLang(voice.lang));
  if (british.length > 0) {
    return [...british].sort(comparePreferred)[0] ?? null;
  }

  const namedUk = english.filter(
    (voice) => !isAustralianEnglishLang(voice.lang) && ukVoiceNameScore(voice.name) > 0,
  );
  if (namedUk.length > 0) {
    return [...namedUk].sort(comparePreferred)[0] ?? null;
  }

  const otherEnglish = english.filter((voice) => !isAustralianEnglishLang(voice.lang));
  if (otherEnglish.length > 0) {
    return otherEnglish[0] ?? null;
  }

  return english[0] ?? null;
}

/** Student view is English-only. Refuse any utterance that contains Chinese. */
export function speechTextForStudent(text: string): string | null {
  const trimmed = text.replace(/\s+/g, ' ').trim();
  if (!trimmed) return null;
  if (containsChinese(trimmed)) return null;
  return trimmed;
}

export function listenAriaLabel(word: string, speaking: boolean): string {
  return speaking ? `Stop speaking ${word}` : `Listen to ${word} in British English`;
}

export interface BritishUtteranceConfig {
  lang: typeof BRITISH_ENGLISH_LANG;
  rate: number;
  voice: BrowserVoiceLike | null;
  text: string;
}

export function configureBritishEnglishSpeech(
  text: string,
  voices: BrowserVoiceLike[],
): BritishUtteranceConfig | null {
  const spoken = speechTextForStudent(text);
  if (!spoken) return null;
  return {
    lang: BRITISH_ENGLISH_LANG,
    rate: BRITISH_SPEECH_RATE,
    voice: selectBritishEnglishVoice(voices),
    text: spoken,
  };
}

export function applyBritishEnglishUtterance(
  utterance: SpeechSynthesisUtterance,
  config: BritishUtteranceConfig,
  voices: SpeechSynthesisVoice[] = [],
): void {
  utterance.lang = BRITISH_ENGLISH_LANG;
  utterance.rate = config.rate;
  if (!config.voice) return;

  const matched =
    voices.find(
      (voice) =>
        voice.voiceURI === config.voice?.voiceURI ||
        (voice.name === config.voice?.name && voice.lang === config.voice?.lang),
    ) ?? null;
  if (matched) {
    utterance.voice = matched;
  }
}
