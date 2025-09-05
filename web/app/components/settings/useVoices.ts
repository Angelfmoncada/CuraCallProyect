'use client';

import { useState, useEffect } from 'react';

export interface Voice {
  voiceURI: string;
  name: string;
  lang: string;
  localService: boolean;
  default: boolean;
}

export function useVoices() {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVoices = () => {
      if (!('speechSynthesis' in window)) {
        setLoading(false);
        return;
      }

      const synthVoices = speechSynthesis.getVoices();
      const mappedVoices: Voice[] = synthVoices.map(voice => ({
        voiceURI: voice.voiceURI,
        name: voice.name,
        lang: voice.lang,
        localService: voice.localService,
        default: voice.default,
      }));

      setVoices(mappedVoices);
      setLoading(false);
    };

    // Cargar voces inmediatamente
    loadVoices();

    // Escuchar cambios en las voces (algunas veces se cargan de forma asíncrona)
    if ('speechSynthesis' in window) {
      speechSynthesis.addEventListener('voiceschanged', loadVoices);
    }

    return () => {
      if ('speechSynthesis' in window) {
        speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      }
    };
  }, []);

  return { voices, loading };
}