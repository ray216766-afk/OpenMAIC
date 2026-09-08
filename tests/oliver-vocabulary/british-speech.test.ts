import { describe, expect, it } from 'vitest';

import {
  BRITISH_ENGLISH_LANG,
  configureBritishEnglishSpeech,
  isAustralianEnglishLang,
  isBritishEnglishLang,
  listenAriaLabel,
  MIN_SPEAKING_VISIBLE_MS,
  selectBritishEnglishVoice,
  shouldClearSpeakingOnSpeechError,
  speechTextForStudent,
  ukVoiceNameScore,
  type BrowserVoiceLike,
} from '@/lib/oliver-vocabulary/british-speech';

function voice(
  name: string,
  lang: string,
  extras: Partial<BrowserVoiceLike> = {},
): BrowserVoiceLike {
  return { name, lang, voiceURI: `${name}-${lang}`, ...extras };
}

describe('Oliver vocabulary British English speech', () => {
  it('recognises en-GB and never treats en-AU as British', () => {
    expect(isBritishEnglishLang('en-GB')).toBe(true);
    expect(isBritishEnglishLang('en_GB')).toBe(true);
    expect(isBritishEnglishLang('en-AU')).toBe(false);
    expect(isAustralianEnglishLang('en-AU')).toBe(true);
    expect(isAustralianEnglishLang('en-GB')).toBe(false);
  });

  it('prefers Google UK English over Microsoft Australian and US voices', () => {
    const selected = selectBritishEnglishVoice([
      voice('Google US English', 'en-US'),
      voice('Microsoft Catherine', 'en-AU'),
      voice('Google UK English Female', 'en-GB'),
      voice('Google UK English Male', 'en-GB'),
    ]);
    expect(selected?.name).toBe('Google UK English Female');
    expect(selected?.lang).toBe('en-GB');
  });

  it('prefers Microsoft Hazel / Daniel when those are the UK voices', () => {
    const selected = selectBritishEnglishVoice([
      voice('Microsoft David', 'en-US'),
      voice('Microsoft Hazel', 'en-GB'),
      voice('Microsoft James', 'en-AU', { default: true }),
    ]);
    expect(selected?.name).toBe('Microsoft Hazel');
  });

  it('does not prefer en-AU even when it is the default system voice', () => {
    const selected = selectBritishEnglishVoice([
      voice('Karen', 'en-AU', { default: true }),
      voice('Daniel', 'en-GB'),
    ]);
    expect(selected?.lang).toBe('en-GB');
    expect(selected?.name).toBe('Daniel');
  });

  it('skips en-AU in favour of any other English voice', () => {
    const selected = selectBritishEnglishVoice([
      voice('Karen', 'en-AU'),
      voice('Samantha', 'en-US'),
    ]);
    expect(selected?.lang).toBe('en-US');
  });

  it('uses en-AU only when it is the only English voice', () => {
    const selected = selectBritishEnglishVoice([
      voice('Ting-Ting', 'zh-CN'),
      voice('Karen', 'en-AU'),
    ]);
    expect(selected?.name).toBe('Karen');
  });

  it('returns null when no English voice exists', () => {
    expect(selectBritishEnglishVoice([voice('Ting-Ting', 'zh-CN')])).toBeNull();
    expect(selectBritishEnglishVoice([])).toBeNull();
  });

  it('scores well-known UK voice names', () => {
    expect(ukVoiceNameScore('Google UK English Female')).toBeGreaterThan(
      ukVoiceNameScore('Microsoft Hazel'),
    );
    expect(ukVoiceNameScore('Microsoft Daniel')).toBeGreaterThan(ukVoiceNameScore('Samantha'));
    expect(ukVoiceNameScore('Samantha')).toBe(0);
  });

  it('always configures utterance lang as en-GB and refuses Chinese', () => {
    const ok = configureBritishEnglishSpeech('analyse', [
      voice('Google UK English Female', 'en-GB'),
    ]);
    expect(ok).toEqual({
      lang: BRITISH_ENGLISH_LANG,
      rate: 0.92,
      voice: voice('Google UK English Female', 'en-GB'),
      text: 'analyse',
    });
    expect(ok?.lang).toBe('en-GB');

    expect(
      configureBritishEnglishSpeech('分析', [voice('Google UK English Female', 'en-GB')]),
    ).toBeNull();
    expect(speechTextForStudent('analyse')).toBe('analyse');
    expect(speechTextForStudent('分析')).toBeNull();
    expect(speechTextForStudent('analyse 分析')).toBeNull();
    expect(speechTextForStudent('   ')).toBeNull();
  });

  it('uses accessible Listen / Stop labels for the speaker control', () => {
    expect(listenAriaLabel('analyse', false)).toBe('Listen to analyse in British English');
    expect(listenAriaLabel('analyse', true)).toBe('Stop speaking analyse');
  });

  it('keeps speaking state through Chrome cancel/interrupt races', () => {
    expect(shouldClearSpeakingOnSpeechError('canceled')).toBe(false);
    expect(shouldClearSpeakingOnSpeechError('interrupted')).toBe(false);
    expect(shouldClearSpeakingOnSpeechError('synthesis-failed')).toBe(true);
    expect(shouldClearSpeakingOnSpeechError('not-allowed')).toBe(true);
  });

  it('holds Speaking long enough for a single headword to be read', () => {
    expect(MIN_SPEAKING_VISIBLE_MS).toBeGreaterThanOrEqual(800);
  });
});
