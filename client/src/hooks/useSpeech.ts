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
    return new Promise((resolve) => {
      console.log('Starting voice input (demo mode)');
      setIsListening(true);
      
      // Demo messages array
      const demoMessages = [
        "What can you tell me about artificial intelligence?",
        "How does machine learning work?",
        "Tell me about the future of technology",
        "What are the benefits of renewable energy?",
        "Explain quantum computing in simple terms"
      ];
      
      const randomMessage = demoMessages[Math.floor(Math.random() * demoMessages.length)];
      
      // Simulate listening for 2-3 seconds
      setTimeout(() => {
        setIsListening(false);
        console.log('Voice input captured (demo):', randomMessage);
        resolve(randomMessage);
      }, 2500);
    });
  }, []);

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
