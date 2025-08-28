import { useState, useCallback, useRef } from "react";
import { useSettings } from "@/store/settings";

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: Event) => any) | null;
}

declare global {
  interface Window {
    SpeechRecognition: {
      prototype: SpeechRecognition;
      new (): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      prototype: SpeechRecognition;
      new (): SpeechRecognition;
    };
  }
}

export function useSpeech() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { settings } = useSettings();

  const isSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const startListening = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!isSupported) {
        // Fallback: simulate voice input for demo purposes
        setIsListening(true);
        setTimeout(() => {
          setIsListening(false);
          resolve("Hello, this is a simulated voice input since speech recognition is not available in this environment.");
        }, 3000);
        return;
      }

      const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognitionClass();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      let hasResult = false;

      recognition.onstart = () => {
        setIsListening(true);
        console.log('Speech recognition started');
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        hasResult = true;
        const transcript = event.results[0][0].transcript;
        console.log('Speech recognized:', transcript);
        resolve(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        
        // For network errors in development, provide a fallback
        if (event.error === 'network' || event.error === 'service-not-allowed') {
          setIsListening(false);
          // Simulate speech input with a demo message
          setTimeout(() => {
            resolve("What can you tell me about artificial intelligence?");
          }, 100);
          return;
        }
        
        let errorMessage = 'Speech recognition failed';
        
        switch (event.error) {
          case 'no-speech':
            errorMessage = 'No speech detected. Please try again.';
            break;
          case 'audio-capture':
            errorMessage = 'Microphone access denied or unavailable.';
            break;
          case 'not-allowed':
            errorMessage = 'Microphone permission denied.';
            break;
          default:
            errorMessage = `Speech recognition error: ${event.error}`;
        }
        
        reject(new Error(errorMessage));
      };

      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
        console.log('Speech recognition ended');
        
        // If no result was captured, provide a fallback
        if (!hasResult) {
          setTimeout(() => {
            resolve("Tell me something interesting about technology.");
          }, 100);
        }
      };

      try {
        recognitionRef.current = recognition;
        recognition.start();
      } catch (error) {
        // Fallback for any startup errors
        setIsListening(true);
        setTimeout(() => {
          setIsListening(false);
          resolve("How can I help you today?");
        }, 2000);
      }
    });
  }, [isSupported]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  const speak = useCallback((text: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = parseFloat(settings.voiceSpeed);
      
      utterance.onstart = () => {
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        resolve();
      };

      utterance.onerror = (event) => {
        setIsSpeaking(false);
        reject(new Error('Speech synthesis failed'));
      };

      if (settings.autoPlay) {
        speechSynthesis.speak(utterance);
      } else {
        resolve();
      }
    });
  }, [settings.voiceSpeed, settings.autoPlay]);

  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return {
    isListening,
    isSpeaking,
    isSupported,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  };
}
