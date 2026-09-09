'use client';

import { cn } from '@/lib/utils';

interface ChoiceOptionsProps {
  name: string;
  options: string[];
  selected?: string;
  onSelect: (option: string) => void;
  labelledBy?: string;
}

export function ChoiceOptions({
  name,
  options,
  selected,
  onSelect,
  labelledBy,
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
        return (
          <label
            key={`${optionId}:${option}`}
            htmlFor={optionId}
            className={cn(
              'flex cursor-pointer items-start gap-2 rounded-md border px-3 py-2 text-sm',
              isSelected ? 'border-[#1f3a5f] bg-[#eef3f8]' : 'border-[#e4d9c8]',
            )}
          >
            <input
              id={optionId}
              type="radio"
              className="mt-1"
              name={name}
              value={option}
              checked={isSelected}
              onChange={() => onSelect(option)}
            />
            <span>{option}</span>
          </label>
        );
      })}
    </div>
  );
}
