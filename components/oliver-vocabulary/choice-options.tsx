'use client';

import { cn } from '@/lib/utils';

export type ChoiceOptionTone = 'default' | 'correct' | 'incorrect';

interface ChoiceOptionsProps {
  name: string;
  options: string[];
  selected?: string;
  onSelect: (option: string) => void;
  labelledBy?: string;
  disabled?: boolean;
  optionTone?: (option: string) => ChoiceOptionTone;
}

export function ChoiceOptions({
  name,
  options,
  selected,
  onSelect,
  labelledBy,
  disabled = false,
  optionTone,
}: ChoiceOptionsProps) {
  return (
    <div
      className="mt-2 flex flex-col gap-2"
      role="radiogroup"
      aria-labelledby={labelledBy}
      data-choice-group={name}
    >
      {options.map((option, index) => {
        const optionId = `${name}-option-${index}`;
        const isSelected = selected === option;
        const tone = optionTone?.(option) ?? 'default';
        return (
          <label
            key={`${optionId}:${option}`}
            htmlFor={optionId}
            data-option-tone={tone}
            className={cn(
              'flex items-start gap-2 rounded-md border px-3 py-2 text-sm',
              disabled ? 'cursor-default' : 'cursor-pointer',
              tone === 'incorrect' && 'border-red-600 bg-red-50 text-red-900',
              tone === 'correct' && 'border-emerald-700 bg-emerald-50 text-emerald-950',
              tone === 'default' &&
                (isSelected ? 'border-[#1f3a5f] bg-[#eef3f8]' : 'border-[#e4d9c8]'),
            )}
          >
            <input
              id={optionId}
              type="radio"
              className="mt-1"
              name={name}
              value={option}
              checked={isSelected}
              disabled={disabled}
              onChange={() => onSelect(option)}
            />
            <span>{option}</span>
          </label>
        );
      })}
    </div>
  );
}
