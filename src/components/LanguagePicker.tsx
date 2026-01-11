'use client';

import { cn } from '@/lib/utils';

export interface Language {
  id: string;
  name: string;
  isoCode: string;
}

interface LanguagePickerProps {
  value: string;
  onChange: (languageId: string) => void;
  languages: Language[];
  label?: string;
  disabled?: boolean;
}

// Flag emoji mapping for common languages
const flagEmoji: Record<string, string> = {
  de: '\u{1F1E9}\u{1F1EA}', // German flag
  pl: '\u{1F1F5}\u{1F1F1}', // Polish flag
  en: '\u{1F1EC}\u{1F1E7}', // UK flag
  fr: '\u{1F1EB}\u{1F1F7}', // French flag
  es: '\u{1F1EA}\u{1F1F8}', // Spanish flag
  it: '\u{1F1EE}\u{1F1F9}', // Italian flag
  nl: '\u{1F1F3}\u{1F1F1}', // Dutch flag
  pt: '\u{1F1F5}\u{1F1F9}', // Portuguese flag
};

export function LanguagePicker({
  value,
  onChange,
  languages,
  label = 'Jezyk produktu',
  disabled = false,
}: LanguagePickerProps) {
  // Find the currently selected language by ID or isoCode
  const selectedLang = languages.find(
    lang => lang.id === value || lang.isoCode === value
  );

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="flex flex-wrap gap-2">
        {languages.map(lang => {
          const isSelected = lang.id === value || lang.isoCode === value;
          const flag = flagEmoji[lang.isoCode.toLowerCase()] || '\u{1F310}';

          return (
            <button
              key={lang.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(lang.isoCode)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg border transition-all',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                isSelected
                  ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <span className="text-xl">{flag}</span>
              <span className="font-medium">{lang.name}</span>
              <span className="text-xs text-gray-500 uppercase">
                ({lang.isoCode})
              </span>
            </button>
          );
        })}
      </div>
      {selectedLang && (
        <p className="text-xs text-gray-500">
          Tresc produktu zostanie wygenerowana w jezyku: {selectedLang.name}
        </p>
      )}
    </div>
  );
}

// Default languages when API is unavailable
export const DEFAULT_LANGUAGES: Language[] = [
  { id: '1', name: 'Niemiecki', isoCode: 'de' },
  { id: '2', name: 'Polski', isoCode: 'pl' },
];
