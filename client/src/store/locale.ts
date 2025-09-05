import create from 'zustand';

export type Locale = 'en' | 'es' | 'auto';

const STORAGE_KEY = 'curacall-language';

function load(): Locale {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'en' || v === 'es' || v === 'auto') return v;
  } catch {}
  return 'en';
}

export const useLocale = create<{ language: Locale; setLanguage: (l: Locale) => void }>((set) => ({
  language: typeof window !== 'undefined' ? load() : 'en',
  setLanguage: (l) => {
    try { localStorage.setItem(STORAGE_KEY, l); } catch {}
    set({ language: l });
  },
}));

export function speechLangFor(locale: Locale) {
  if (locale === 'es') return 'es-ES';
  return 'en-US';
}

