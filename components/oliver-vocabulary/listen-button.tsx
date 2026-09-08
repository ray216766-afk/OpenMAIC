'use client';

import { Volume2 } from 'lucide-react';

import { listenAriaLabel } from '@/lib/oliver-vocabulary/british-speech';
import { cn } from '@/lib/utils';

interface ListenButtonProps {
  word: string;
  utteranceId: string;
  text: string;
  speakingId: string | null;
  supported: boolean;
  onToggle: (id: string, text: string) => void;
  size?: 'word' | 'example';
  className?: string;
}

export function ListenButton({
  word,
  utteranceId,
  text,
  speakingId,
  supported,
  onToggle,
  size = 'word',
  className,
}: ListenButtonProps) {
  const speaking = speakingId === utteranceId;
  const compact = size === 'example';
  const label = compact
    ? speaking
      ? `Stop speaking the example for ${word}`
      : `Listen to the example for ${word} in British English`
    : listenAriaLabel(word, speaking);

  return (
    <button
      type="button"
      disabled={!supported || !text.trim()}
      aria-label={supported ? label : `Listen to ${word} is unavailable in this browser`}
      aria-pressed={speaking}
      data-speaking={speaking ? 'true' : 'false'}
      title={supported ? label : 'Speech is not available in this browser'}
      onClick={() => onToggle(utteranceId, text)}
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full border font-medium transition-colors',
        compact ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        speaking
          ? 'border-[#1f3a5f] bg-[#1f3a5f] text-[#f6f1e8]'
          : 'border-[#d9cfc0] bg-white text-[#1f3a5f] hover:border-[#1f3a5f] hover:bg-[#eef3f8]',
        (!supported || !text.trim()) &&
          'cursor-not-allowed opacity-50 hover:border-[#d9cfc0] hover:bg-white',
        className,
      )}
    >
      <Volume2
        aria-hidden="true"
        className={cn(compact ? 'size-3' : 'size-3.5', speaking && 'animate-pulse')}
      />
      <span>{speaking ? 'Speaking' : compact ? 'Example' : 'Listen'}</span>
    </button>
  );
}
