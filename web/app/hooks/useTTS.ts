'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface TTSVoice {
  id: string;
  name: string;
  lang: string;
  gender: 'female' | 'male';
  voiceURI: string;
}

export interface TTSOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
}

export interface TTSState {
  isSupported: boolean;
  isLoading: boolean;
  isSpeaking: boolean;
  isPaused: boolean;
  currentText: string;
  availableVoices: TTSVoice[];
  selectedVoice: TTSVoice | null;
  error: string | null;
}

export const useTTS = () => {
  const [state, setState] = useState<TTSState>({
    isSupported: false,
    isLoading: true,
    isSpeaking: false,
    isPaused: false,
    currentText: '',
    availableVoices: [],
    selectedVoice: null,
    error: null,
  });

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Inicializar Web Speech API
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
      setState(prev => ({ ...prev, isSupported: true }));
      loadVoices();
    } else {
      setState(prev => ({
        ...prev,
        isSupported: false,
        isLoading: false,
        error: 'Text-to-Speech no está soportado en este navegador'
      }));
    }
  }, []);

  // Cargar voces disponibles
  const loadVoices = useCallback(() => {
    if (!synthRef.current) return;

    const getVoices = () => {
      const voices = synthRef.current!.getVoices();
      if (voices.length === 0) {
        // Algunas veces las voces no están disponibles inmediatamente
        setTimeout(getVoices, 100);
        return;
      }

      const processedVoices: TTSVoice[] = voices
        .filter(voice => voice.lang.startsWith('es') || voice.lang.startsWith('en'))
        .map(voice => ({
          id: voice.voiceURI,
          name: voice.name,
          lang: voice.lang,
          gender: detectGender(voice.name),
          voiceURI: voice.voiceURI,
        }));

      setState(prev => ({
        ...prev,
        availableVoices: processedVoices,
        selectedVoice: processedVoices.find(v => v.gender === 'female') || processedVoices[0] || null,
        isLoading: false,
      }));
    };

    getVoices();

    // Escuchar cambios en las voces
    if (synthRef.current.onvoiceschanged !== undefined) {
      synthRef.current.onvoiceschanged = getVoices;
    }
  }, []);

  // Detectar género de la voz basado en el nombre con mayor precisión
  const detectGender = useCallback((voiceName: string): 'female' | 'male' => {
    const name = voiceName.toLowerCase();
    
    // Enhanced female indicators with more comprehensive patterns
    const femaleKeywords = [
      'female', 'woman', 'girl', 'fem', 'lady', 'miss', 'mrs', 'ms',
      // Spanish female names
      'maria', 'ana', 'carmen', 'lucia', 'sara', 'elena', 'isabel', 'monica', 'patricia', 'laura', 'marta', 'cristina', 'raquel', 'silvia', 'pilar', 'rosa', 'teresa', 'angeles', 'dolores', 'mercedes', 'antonia', 'francisca', 'catalina', 'esperanza', 'inmaculada', 'josefa', 'margarita', 'rosario', 'concepcion', 'amparo', 'soledad', 'gloria', 'victoria', 'emilia', 'aurora', 'remedios', 'encarnacion', 'milagros', 'purificacion',
      // English female names
      'samantha', 'susan', 'karen', 'linda', 'jennifer', 'elizabeth', 'barbara', 'margaret', 'dorothy', 'lisa', 'nancy', 'helen', 'sandra', 'donna', 'carol', 'ruth', 'sharon', 'michelle', 'sarah', 'kimberly', 'deborah', 'jessica', 'shirley', 'cynthia', 'angela', 'melissa', 'brenda', 'emma', 'olivia', 'ava', 'sophia', 'isabella', 'mia', 'charlotte', 'amelia', 'harper', 'evelyn', 'abigail', 'emily', 'ella', 'madison', 'scarlett', 'aria', 'grace', 'chloe', 'camila', 'penelope', 'riley', 'zoe'
    ];
    
    // Enhanced male indicators
    const maleKeywords = [
      'male', 'man', 'boy', 'gentleman', 'sir', 'mr', 'mister',
      // Spanish male names
      'juan', 'carlos', 'miguel', 'antonio', 'francisco', 'manuel', 'david', 'jose', 'rafael', 'pedro', 'alejandro', 'fernando', 'sergio', 'ricardo', 'alberto', 'jorge', 'luis', 'daniel', 'oscar', 'guillermo', 'raul', 'enrique', 'victor', 'pablo', 'ruben', 'mario', 'eduardo', 'roberto', 'ramon', 'jesus', 'javier', 'gonzalo', 'angel', 'diego', 'andres', 'ignacio', 'salvador', 'alfredo', 'lorenzo', 'agustin', 'marcos', 'gabriel', 'adrian', 'alvaro', 'jaime', 'ivan', 'hugo', 'iker', 'nicolas',
      // English male names
      'john', 'william', 'james', 'charles', 'george', 'frank', 'joseph', 'thomas', 'henry', 'robert', 'paul', 'matthew', 'mark', 'donald', 'anthony', 'steven', 'andrew', 'joshua', 'kenneth', 'kevin', 'brian', 'edward', 'ronald', 'timothy', 'jason', 'jeffrey', 'ryan', 'jacob', 'gary', 'nicholas', 'eric', 'jonathan', 'stephen', 'larry', 'justin', 'scott', 'brandon', 'benjamin', 'samuel', 'gregory', 'alexander', 'patrick', 'jack', 'dennis', 'jerry', 'tyler', 'aaron', 'douglas', 'nathan', 'peter', 'zachary', 'kyle', 'noah', 'mason', 'elijah', 'ethan', 'oliver', 'lucas', 'aiden', 'jackson', 'logan', 'owen', 'sebastian', 'carter', 'wyatt', 'jayden', 'luke', 'isaac', 'dylan', 'ezra', 'levi', 'christopher', 'lincoln', 'mateo', 'jaxon', 'isaiah', 'caleb', 'josiah', 'christian', 'hunter', 'eli', 'connor', 'landon', 'adrian', 'asher', 'cameron', 'leo', 'theodore', 'jeremiah', 'hudson', 'easton', 'nolan', 'wesley', 'colton', 'jordan', 'luca', 'brayden', 'evan', 'michael', 'tyler', 'fred', 'alex'
    ];
    
    // Check for explicit gender indicators first
    if (femaleKeywords.some(keyword => name.includes(keyword))) {
      return 'female';
    }
    
    if (maleKeywords.some(keyword => name.includes(keyword))) {
      return 'male';
    }
    
    // Check for language-specific patterns
    if (name.includes('es-') || name.includes('spanish')) {
      // For Spanish voices, check common endings
      if (name.endsWith('a') && !name.endsWith('ia')) {
        return 'female';
      }
      if (name.endsWith('o') || name.endsWith('ez')) {
        return 'male';
      }
    }
    
    // Default based on voice characteristics in name
    if (name.includes('high') || name.includes('soft') || name.includes('light')) {
      return 'female';
    }
    
    if (name.includes('deep') || name.includes('low') || name.includes('bass')) {
      return 'male';
    }
    
    // If no clear indication, default to female (more common in TTS)
    return 'female';
  }, []);

  // Enhanced language detection
  const detectLanguage = useCallback((text: string): string => {
    // Simple language detection based on common patterns
    const spanishPatterns = /[ñáéíóúü]|\b(el|la|los|las|un|una|de|del|en|con|por|para|que|es|son|está|están|tiene|tienen|hace|hizo|será|fue|como|muy|más|pero|sin|hasta|desde|cuando|donde|porque|aunque)\b/i;
    const englishPatterns = /\b(the|and|or|but|in|on|at|to|for|of|with|by|from|up|about|into|over|after|beneath|under|above|through|during|before|without|within|upon|across|behind|beyond|plus|except|but|nor|so|yet|however|therefore|thus|hence|moreover|furthermore|nevertheless|nonetheless|meanwhile|otherwise|instead|rather|still|even|also|too|very|quite|rather|pretty|fairly|really|truly|indeed|certainly|definitely|probably|possibly|maybe|perhaps|likely|unlikely|sure|unsure)\b/i;
    
    if (spanishPatterns.test(text)) {
      return 'es-ES';
    } else if (englishPatterns.test(text)) {
      return 'en-US';
    }
    
    // Default to Spanish for this application
    return 'es-ES';
  }, []);

  // Hablar texto con mejoras de calidad
  const speak = useCallback(async (text: string, options: TTSOptions = {}, voiceGender?: 'female' | 'male') => {
    if (!synthRef.current || !text.trim()) {
      setState(prev => ({ ...prev, error: 'No se puede reproducir el texto' }));
      return;
    }

    try {
      setState(prev => ({ ...prev, error: null }));

      // Smooth transition: fade out current speech before starting new one
      if (synthRef.current.speaking) {
        synthRef.current.pause();
        await new Promise(resolve => setTimeout(resolve, 100)); // Brief pause for smooth transition
        synthRef.current.cancel();
        await new Promise(resolve => setTimeout(resolve, 100)); // Allow cleanup
      }

      // Clean and prepare text for optimal reading
      const cleanText = text
        .replace(/\n+/g, '. ') // Replace line breaks with periods for natural pauses
        .replace(/\s+/g, ' ') // Normalize whitespace
        .replace(/([.!?])\s*([.!?])/g, '$1 ') // Clean up multiple punctuation
        .trim();

      if (!cleanText) {
        setState(prev => ({
          ...prev,
          isSpeaking: false,
          isPaused: false,
          currentText: '',
        }));
        return;
      }
      
      // Select voice based on gender preference or current selection
      const targetGender = voiceGender || state.selectedVoice?.gender || 'female';
      const availableVoices = synthRef.current.getVoices();
      const voice = availableVoices.find(v => {
        const voiceGender = detectGender(v.name);
        return voiceGender === targetGender && (v.lang.startsWith('es') || v.lang.startsWith('en'));
      }) || availableVoices.find(v => v.lang.startsWith('es') || v.lang.startsWith('en')) || availableVoices[0];
      
      // Enhanced language detection and setting
      const detectedLang = detectLanguage(cleanText);

      // Split long text into manageable chunks for complete reading
      const maxChunkLength = 200; // Optimal chunk size for clarity
      const sentences = cleanText.split(/([.!?]+\s*)/).filter(s => s.trim());
      
      let currentChunk = '';
      const chunks: string[] = [];
      
      for (const sentence of sentences) {
        if (currentChunk.length + sentence.length <= maxChunkLength) {
          currentChunk += sentence;
        } else {
          if (currentChunk.trim()) chunks.push(currentChunk.trim());
          currentChunk = sentence;
        }
      }
      if (currentChunk.trim()) chunks.push(currentChunk.trim());

      // Process each chunk to ensure complete reading
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        if (!chunk.trim()) continue;

        await new Promise<void>((resolve, reject) => {
          const utterance = new SpeechSynthesisUtterance(chunk);
          
          if (voice) {
            utterance.voice = voice;
          }

          // Enhanced speech parameters for higher quality
          utterance.rate = options.rate ?? 0.85; // Slightly slower for better clarity
          utterance.pitch = options.pitch ?? (targetGender === 'female' ? 1.1 : 0.9); // Gender-appropriate pitch
          utterance.volume = options.volume ?? 0.95; // Slightly reduced to prevent distortion
          utterance.lang = detectedLang;

          // Set up event listeners for this chunk
          utterance.onstart = () => {
            if (i === 0) { // Only set speaking state on first chunk
              setState(prev => ({
                ...prev,
                isSpeaking: true,
                isPaused: false,
                currentText: text,
                error: null,
              }));
            }
          };

          utterance.onend = () => {
            // Add natural pause between chunks, complete on last chunk
            if (i < chunks.length - 1) {
              setTimeout(resolve, 300); // Natural pause between chunks
            } else {
              setState(prev => ({
                ...prev,
                isSpeaking: false,
                isPaused: false,
                currentText: '',
              }));
              resolve();
            }
          };

          utterance.onpause = () => {
            setState(prev => ({ ...prev, isPaused: true }));
          };

          utterance.onresume = () => {
            setState(prev => ({ ...prev, isPaused: false }));
          };

          utterance.onerror = (event) => {
            console.error('Speech synthesis error in chunk:', event);
            setState(prev => ({
              ...prev,
              isSpeaking: false,
              isPaused: false,
              currentText: '',
              error: `Error en TTS: ${event.error}`,
            }));
            reject(event);
          };

          utteranceRef.current = utterance;
          synthRef.current!.speak(utterance);
        });

        // Check if speech was cancelled during processing
        if (!synthRef.current.speaking && !synthRef.current.pending) {
          setState(prev => ({
            ...prev,
            isSpeaking: false,
            isPaused: false,
            currentText: '',
          }));
          break;
        }
      }
    } catch (err) {
      console.error('TTS Error:', err);
      setState(prev => ({
        ...prev,
        isSpeaking: false,
        isPaused: false,
        currentText: '',
        error: 'Error al inicializar síntesis de voz'
      }));
    }
  }, [state.selectedVoice, detectLanguage, detectGender]);

  // Pausar reproducción
  const pause = useCallback(() => {
    if (synthRef.current && state.isSpeaking && !state.isPaused) {
      synthRef.current.pause();
    }
  }, [state.isSpeaking, state.isPaused]);

  // Reanudar reproducción
  const resume = useCallback(() => {
    if (synthRef.current && state.isSpeaking && state.isPaused) {
      synthRef.current.resume();
    }
  }, [state.isSpeaking, state.isPaused]);

  // Detener reproducción con transición suave
  const stop = useCallback(() => {
    if (synthRef.current) {
      // Smooth stop with fade effect
      if (synthRef.current.speaking) {
        synthRef.current.pause();
        setTimeout(() => {
          synthRef.current!.cancel();
          setState(prev => ({
            ...prev,
            isSpeaking: false,
            isPaused: false,
            currentText: '',
          }));
        }, 50);
      } else {
        synthRef.current.cancel();
        setState(prev => ({
          ...prev,
          isSpeaking: false,
          isPaused: false,
          currentText: '',
        }));
      }
    }
  }, []);

  // Seleccionar voz
  const selectVoice = useCallback((voiceId: string) => {
    const voice = state.availableVoices.find(v => v.id === voiceId);
    if (voice) {
      setState(prev => ({ ...prev, selectedVoice: voice }));
    }
  }, [state.availableVoices]);

  // Obtener voces por género
  const getVoicesByGender = useCallback((gender: 'female' | 'male') => {
    return state.availableVoices.filter(voice => voice.gender === gender);
  }, [state.availableVoices]);

  // Función para convertir markdown a texto plano
  const markdownToText = useCallback((markdown: string): string => {
    return markdown
      // Remover bloques de código
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`[^`]*`/g, '')
      // Remover enlaces pero mantener el texto
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remover imágenes
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
      // Remover encabezados
      .replace(/^#{1,6}\s+/gm, '')
      // Remover énfasis (negrita, cursiva)
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/_([^_]+)_/g, '$1')
      // Remover listas
      .replace(/^\s*[-*+]\s+/gm, '')
      .replace(/^\s*\d+\.\s+/gm, '')
      // Remover citas
      .replace(/^>\s+/gm, '')
      // Remover líneas horizontales
      .replace(/^---+$/gm, '')
      // Limpiar espacios múltiples y saltos de línea
      .replace(/\n\s*\n/g, '\n')
      .replace(/\s+/g, ' ')
      .trim();
  }, []);

  // Función especializada para hablar contenido markdown
  const speakMarkdown = useCallback(async (markdown: string, options: TTSOptions = {}, voiceGender?: 'female' | 'male') => {
    if (!markdown?.trim()) {
      setState(prev => ({ ...prev, error: 'No hay contenido para reproducir' }));
      return;
    }

    try {
      // Convertir markdown a texto plano
      const plainText = markdownToText(markdown);
      
      if (!plainText.trim()) {
        setState(prev => ({ ...prev, error: 'El contenido no contiene texto reproducible' }));
        return;
      }

      // Usar la función speak existente con el texto convertido
      await speak(plainText, options, voiceGender);
    } catch (error) {
      console.error('Error al procesar markdown para TTS:', error);
      setState(prev => ({
        ...prev,
        error: 'Error al procesar el contenido markdown'
      }));
    }
  }, [speak, markdownToText]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  return {
    ...state,
    speak,
    speakMarkdown,
    pause,
    resume,
    stop,
    selectVoice,
    getVoicesByGender,
  };
};

export default useTTS;