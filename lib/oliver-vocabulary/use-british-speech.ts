'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  applyBritishEnglishUtterance,
  configureBritishEnglishSpeech,
} from '@/lib/oliver-vocabulary/british-speech';

const SPEAK_AFTER_CANCEL_MS = 60;

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && typeof window.speechSynthesis !== 'undefined';
}

export function useBritishSpeech() {
  const [supported, setSupported] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const speakTimerRef = useRef<number | null>(null);
  const activeIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isSpeechSynthesisSupported()) {
      setSupported(false);
      return;
    }
    setSupported(true);

    const loadVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      if (speakTimerRef.current !== null) {
        window.clearTimeout(speakTimerRef.current);
      }
      window.speechSynthesis.cancel();
      activeIdRef.current = null;
    };
  }, []);

  const clearSpeakTimer = useCallback(() => {
    if (speakTimerRef.current !== null) {
      window.clearTimeout(speakTimerRef.current);
      speakTimerRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    if (!isSpeechSynthesisSupported()) return;
    clearSpeakTimer();
    window.speechSynthesis.cancel();
    activeIdRef.current = null;
    setSpeakingId(null);
  }, [clearSpeakTimer]);

  const speak = useCallback(
    (id: string, text: string) => {
      if (!isSpeechSynthesisSupported()) return;

      const config = configureBritishEnglishSpeech(text, voices);
      if (!config) {
        stop();
        return;
      }

      clearSpeakTimer();
      window.speechSynthesis.cancel();
      activeIdRef.current = id;
      setSpeakingId(id);

      const start = () => {
        if (activeIdRef.current !== id) return;
        const utterance = new SpeechSynthesisUtterance(config.text);
        applyBritishEnglishUtterance(utterance, config, window.speechSynthesis.getVoices());

        utterance.onend = () => {
          if (activeIdRef.current === id) {
            activeIdRef.current = null;
            setSpeakingId(null);
          }
        };
        utterance.onerror = () => {
          if (activeIdRef.current === id) {
            activeIdRef.current = null;
            setSpeakingId(null);
          }
        };

        window.speechSynthesis.speak(utterance);
      };

      // Chromium often drops speak() if it runs in the same turn as cancel().
      speakTimerRef.current = window.setTimeout(start, SPEAK_AFTER_CANCEL_MS);
    },
    [clearSpeakTimer, stop, voices],
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
    supported,
    speakingId,
    speak,
    stop,
    toggle,
  };
}
