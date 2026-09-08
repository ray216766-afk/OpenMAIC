'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  applyBritishEnglishUtterance,
  configureBritishEnglishSpeech,
  MIN_SPEAKING_VISIBLE_MS,
  shouldClearSpeakingOnSpeechError,
} from '@/lib/oliver-vocabulary/british-speech';

const SPEAK_AFTER_CANCEL_MS = 60;
const SPEAKING_FALLBACK_MS = 2500;

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && typeof window.speechSynthesis !== 'undefined';
}

export function useBritishSpeech() {
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const speakTimerRef = useRef<number | null>(null);
  const clearTimerRef = useRef<number | null>(null);
  const activeIdRef = useRef<string | null>(null);
  const speakingStartedAtRef = useRef<number>(0);

  const clearTimer = useCallback((ref: { current: number | null }) => {
    if (ref.current !== null) {
      window.clearTimeout(ref.current);
      ref.current = null;
    }
  }, []);

  const clearSpeaking = useCallback(
    (id: string, immediate = false) => {
      if (activeIdRef.current !== id) return;
      const finish = () => {
        if (activeIdRef.current !== id) return;
        activeIdRef.current = null;
        setSpeakingId(null);
      };
      if (immediate) {
        clearTimer(clearTimerRef);
        finish();
        return;
      }
      const elapsed = Date.now() - speakingStartedAtRef.current;
      const remaining = MIN_SPEAKING_VISIBLE_MS - elapsed;
      if (remaining <= 0) {
        finish();
        return;
      }
      clearTimer(clearTimerRef);
      clearTimerRef.current = window.setTimeout(finish, remaining);
    },
    [clearTimer],
  );

  useEffect(() => {
    if (!isSpeechSynthesisSupported()) {
      return;
    }

    const loadVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      clearTimer(speakTimerRef);
      clearTimer(clearTimerRef);
      window.speechSynthesis.cancel();
      activeIdRef.current = null;
    };
  }, [clearTimer]);

  const stop = useCallback(() => {
    if (!isSpeechSynthesisSupported()) return;
    clearTimer(speakTimerRef);
    clearTimer(clearTimerRef);
    window.speechSynthesis.cancel();
    activeIdRef.current = null;
    setSpeakingId(null);
  }, [clearTimer]);

  const speak = useCallback(
    (id: string, text: string) => {
      if (!isSpeechSynthesisSupported()) return;

      const config = configureBritishEnglishSpeech(text, voices);
      if (!config) {
        stop();
        return;
      }

      clearTimer(speakTimerRef);
      clearTimer(clearTimerRef);
      window.speechSynthesis.cancel();
      activeIdRef.current = id;
      speakingStartedAtRef.current = Date.now();
      setSpeakingId(id);

      const start = () => {
        if (activeIdRef.current !== id) return;
        const utterance = new SpeechSynthesisUtterance(config.text);
        applyBritishEnglishUtterance(utterance, config, window.speechSynthesis.getVoices());

        utterance.onend = () => {
          clearSpeaking(id);
        };
        utterance.onerror = (event) => {
          if (!shouldClearSpeakingOnSpeechError(event.error)) return;
          clearSpeaking(id);
        };

        window.speechSynthesis.speak(utterance);
        clearTimerRef.current = window.setTimeout(() => {
          clearSpeaking(id);
        }, SPEAKING_FALLBACK_MS);
      };

      // Chromium often drops speak() if it runs in the same turn as cancel().
      speakTimerRef.current = window.setTimeout(start, SPEAK_AFTER_CANCEL_MS);
    },
    [clearSpeaking, clearTimer, stop, voices],
  );

  const toggle = useCallback(
    (id: string, text: string) => {
      if (speakingId === id) {
        stop();
        return;
      }
      speak(id, text);
    },
    [speak, speakingId, stop],
  );

  return {
    supported: true,
    speakingId,
    speak,
    stop,
    toggle,
  };
}
