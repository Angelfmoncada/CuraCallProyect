import { useState } from 'react';

export type VoiceState = {
  listening: boolean;
  speaking: boolean;
  transcript: string;
  error?: string;
};

export function useVoiceEngine(lang = 'es-ES') {
  const [state, setState] = useState<VoiceState>({
    listening: false,
    speaking: false,
    transcript: ''
  });

  const SpeechRecognition: any = typeof window !== 'undefined' && 
    (window.SpeechRecognition || (window as any).webkitSpeechRecognition);
  
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

  const startListening = (onFinal: (transcript: string) => void) => {
    if (!SpeechRecognition) {
      setState(s => ({ ...s, error: 'SpeechRecognition no soportado en este navegador' }));
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setState(s => ({ ...s, listening: true, error: undefined }));
    };

    recognition.onend = () => {
      setState(s => ({ ...s, listening: false }));
    };

    recognition.onerror = (event: any) => {
      setState(s => ({ 
        ...s, 
        listening: false, 
        error: event.error === 'no-speech' ? 'No se detectó voz' : 'Error del micrófono'
      }));
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setState(s => ({ ...s, transcript }));
      onFinal(transcript);
    };

    try {
      recognition.start();
    } catch (error) {
      setState(s => ({ ...s, error: 'Error al iniciar el reconocimiento de voz' }));
    }

    return () => {
      try {
        recognition.stop();
      } catch (error) {
        console.warn('Error al detener el reconocimiento:', error);
      }
    };
  };

  const speak = (text: string) => {
    if (!synth) {
      setState(s => ({ ...s, error: 'Síntesis de voz no disponible' }));
      return;
    }

    // Cancelar cualquier síntesis en curso
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 0.8;

    utterance.onstart = () => {
      setState(s => ({ ...s, speaking: true }));
    };

    utterance.onend = () => {
      setState(s => ({ ...s, speaking: false }));
    };

    utterance.onerror = () => {
      setState(s => ({ ...s, speaking: false, error: 'Error en la síntesis de voz' }));
    };

    synth.speak(utterance);
  };

  const stopSpeaking = () => {
    if (synth) {
      synth.cancel();
      setState(s => ({ ...s, speaking: false }));
    }
  };

  return {
    ...state,
    startListening,
    speak,
    stopSpeaking
  };
}