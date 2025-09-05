interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export function startListen(onText: (text: string) => void, lang: string = 'es-ES') {
  const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SR) throw new Error("STT no soportado");
  
  const rec = new SR();
  rec.lang = lang;
  rec.interimResults = false;
  rec.continuous = false;
  rec.maxAlternatives = 1;
  
  rec.onresult = (e: any) => {
    const transcript = e.results[0][0].transcript;
    onText(transcript);
  };
  
  rec.onerror = (e: any) => {
    console.error("Speech recognition error:", e.error);
    // Manejo específico de errores de red
    if (e.error === 'network') {
      console.warn('Error de red en reconocimiento de voz. Esto es normal en algunos navegadores.');
      // No intentar reconexión automática para evitar bucles
    } else if (e.error === 'not-allowed') {
      console.warn('Permisos de micrófono denegados');
    } else if (e.error === 'no-speech') {
      console.warn('No se detectó habla');
    }
    // Llamar callback de error si existe
    if (typeof onText === 'function') {
      // Silenciar error de red ya que es común y no crítico
      if (e.error !== 'network') {
        console.warn('Error en reconocimiento de voz:', e.error);
      }
    }
  };
  
  rec.start();
  return () => rec.stop();
}

export function speak(
  text: string,
  onStart?: () => void,
  onEnd?: () => void,
  opts?: { lang?: string; volume?: number; rate?: number; pitch?: number; voiceName?: string }
) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = opts?.lang || 'es-ES';
  utterance.rate = opts?.rate ?? 0.9;
  utterance.pitch = opts?.pitch ?? 1;
  utterance.volume = Math.max(0, Math.min(1, opts?.volume ?? 1));

  try {
    const voices = speechSynthesis.getVoices();
    const pick = opts?.voiceName
      ? voices.find(v => v.name === opts.voiceName)
      : (voices.find(v => /Google.*es/i.test(v.name)) ||
         voices.find(v => /Microsoft.*Natural.*(Spanish|Español|Sabina|Alvaro|Dalia)/i.test(v.name)) ||
         voices.find(v => /es/i.test(v.lang)) ||
         null);
    if (pick) utterance.voice = pick;
  } catch {}

  utterance.onstart = onStart || null;
  utterance.onend = onEnd || null;
  utterance.onerror = (e) => {
    console.error("Speech synthesis error:", e);
    if (onEnd) onEnd();
  };

  try { speechSynthesis.cancel(); } catch {}
  speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  speechSynthesis.cancel();
}

// Hook para usar en componentes React
import { useState, useCallback } from 'react';

// API plana solicitada por integración (sin UI)
export function startSTT(args: { lang?: string; onText: (t: string) => void; onError?: (err: string) => void }) {
  const SRImpl: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SRImpl) throw new Error('STT no disponible en este navegador');
  const rec = new SRImpl();
  rec.lang = args.lang || 'es-ES';
  rec.interimResults = false;
  rec.continuous = false;
  rec.maxAlternatives = 1;
  rec.onresult = (e: any) => {
    try { args.onText?.(e.results[0][0].transcript); } catch {}
  };
  rec.onerror = (e: any) => {
    console.error('STT error', e?.error);
    try { args.onError?.(String(e?.error || 'error')); } catch {}
  };
  rec.start();
  return () => rec.stop();
}

export function speakTTS(args: { text: string; lang?: string; rate?: number; volume?: number; pitch?: number; voiceName?: string }) {
  const { text, lang = 'es-ES', rate = 0.9, volume = 1, pitch = 1, voiceName } = args;
  const onStart = undefined;
  const onEnd = undefined;
  return speak(text, onStart, onEnd, { lang, rate, volume, pitch, voiceName });
}

export function useSpeech() {
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [interim, setInterim] = useState('');

  const start = useCallback(async (onFinalText: (text: string) => void, lang = 'es-ES') => {
    if (!SR) {
      console.error('SpeechRecognition not supported');
      return;
    }

    // Verificar permisos de micrófono
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error) {
      console.error('Microphone permission denied:', error);
      return;
    }

    const recognition = new SR();
    recognition.lang = lang;
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => {
      setListening(true);
      setInterim('');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      setInterim(interimTranscript);
      
      if (finalTranscript) {
        onFinalText(finalTranscript);
        setInterim('');
      }
    };

    recognition.onend = () => {
      setListening(false);
      setInterim('');
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setListening(false);
      setInterim('');
      
      // Manejo específico de errores
      if (event.error === 'network') {
        console.warn('Error de red en reconocimiento de voz. Verificando conectividad...');
        setTimeout(() => {
          if (navigator.onLine) {
            console.log('Conectividad restaurada');
          }
        }, 1000);
      } else if (event.error === 'not-allowed') {
        console.error('Permisos de micrófono denegados');
      } else if (event.error === 'no-speech') {
        console.warn('No se detectó habla');
      }
    };

    recognition.start();

    return () => {
      recognition.stop();
      setListening(false);
      setInterim('');
    };
  }, []);

  const stop = useCallback(() => {
    setListening(false);
    setInterim('');
  }, []);

  const speak = useCallback((text: string, opts?: { lang?: string; volume?: number; rate?: number; pitch?: number; voiceName?: string }) => {
    if (!text.trim()) return;

    speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = opts?.lang || 'es-ES';
    utterance.rate = opts?.rate ?? 0.9;
    utterance.pitch = opts?.pitch ?? 1;
    utterance.volume = Math.max(0, Math.min(1, opts?.volume ?? 1));

    // Elegir mejor voz española disponible
    try {
      const voices = speechSynthesis.getVoices();
      const pick = opts?.voiceName
        ? voices.find(v => v.name === opts.voiceName)
        : (
          voices.find(v => /Google.*es/i.test(v.name)) ||
          voices.find(v => /Microsoft.*Natural.*(Spanish|Español|Sabina|Alvaro|Dalia)/i.test(v.name)) ||
          voices.find(v => /es/i.test(v.lang)) ||
          null
        );
      if (pick) utterance.voice = pick;
    } catch {}

    utterance.onstart = () => {
      setSpeaking(true);
    };

    utterance.onend = () => {
      setSpeaking(false);
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error);
      setSpeaking(false);
    };

    speechSynthesis.speak(utterance);
  }, []);

  return {
    listening,
    speaking,
    interim,
    start,
    stop,
    speak
  };
}
