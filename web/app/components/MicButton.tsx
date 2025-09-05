'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MicButtonProps {
  onTranscript: (text: string) => void;
  onInterimTranscript?: (text: string) => void;
  disabled?: boolean;
  className?: string;
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
}

export default function MicButton({ 
  onTranscript, 
  onInterimTranscript,
  disabled = false, 
  className = '',
  language = 'es-ES',
  continuous = false,
  interimResults = true
}: MicButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const recognitionRef = useRef<typeof window.SpeechRecognition | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Inicializar reconocimiento de voz
  const initializeRecognition = useCallback(() => {
    if (typeof window === 'undefined') return false;
    
    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      setError('Reconocimiento de voz no soportado en este navegador');
      return false;
    }

    try {
      const recognition = new SpeechRecognition();
      
      // Configuración optimizada
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.lang = language;
      recognition.maxAlternatives = 3;
      
      // Configuraciones adicionales para mejor precisión
      if ('grammars' in recognition) {
        // SpeechGrammarList no está disponible en todos los navegadores
      if ('SpeechGrammarList' in window) {
        recognition.grammars = new (window as any).SpeechGrammarList();
      }
      }

      // Eventos del reconocimiento
      recognition.onstart = () => {
        setIsListening(true);
        setIsInitializing(false);
        setError(null);
        setCurrentTranscript('');
        console.log('🎤 Reconocimiento de voz iniciado');
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          
          if (result.isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        // Actualizar transcripción en tiempo real
        const currentText = finalTranscript || interimTranscript;
        setCurrentTranscript(currentText);

        // Callbacks
        if (interimTranscript && onInterimTranscript) {
          onInterimTranscript(interimTranscript);
        }
        
        if (finalTranscript) {
          onTranscript(finalTranscript.trim());
          setCurrentTranscript('');
        }
      };

      recognition.onerror = (event: any) => {
        console.error('🚨 Error de reconocimiento:', event.error);
        
        let errorMessage = 'Error de reconocimiento';
        switch (event.error) {
          case 'no-speech':
            errorMessage = 'No se detectó voz. Intenta hablar más cerca del micrófono.';
            break;
          case 'audio-capture':
            errorMessage = 'No se pudo acceder al micrófono. Verifica los permisos.';
            break;
          case 'not-allowed':
            errorMessage = 'Permisos de micrófono denegados. Habilita el acceso al micrófono.';
            break;
          case 'network':
            errorMessage = 'Error de red. Verifica tu conexión a internet.';
            break;
          case 'service-not-allowed':
            errorMessage = 'Servicio de reconocimiento no disponible.';
            break;
          case 'bad-grammar':
            errorMessage = 'Error de configuración de gramática.';
            break;
          case 'language-not-supported':
            errorMessage = `Idioma ${language} no soportado.`;
            break;
          default:
            errorMessage = `Error: ${event.error}`;
        }
        
        setError(errorMessage);
        setIsListening(false);
        setIsInitializing(false);
        setCurrentTranscript('');
        
        // Auto-limpiar error después de 5 segundos
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setError(null), 5000);
      };

      recognition.onend = () => {
        console.log('🎤 Reconocimiento de voz finalizado');
        setIsListening(false);
        setIsInitializing(false);
        setCurrentTranscript('');
      };

      recognition.onspeechstart = () => {
        console.log('🗣️ Voz detectada');
      };

      recognition.onspeechend = () => {
        console.log('🔇 Fin de voz detectado');
      };

      recognition.onsoundstart = () => {
        console.log('🔊 Sonido detectado');
      };

      recognition.onsoundend = () => {
        console.log('🔇 Fin de sonido');
      };

      recognitionRef.current = recognition;
      setIsSupported(true);
      return true;
    } catch (error) {
      console.error('Error inicializando reconocimiento:', error);
      setError('Error al inicializar el reconocimiento de voz');
      setIsSupported(false);
      return false;
    }
  }, [language, continuous, interimResults, onTranscript, onInterimTranscript]);

  // Inicializar al montar el componente
  useEffect(() => {
    initializeRecognition();
    
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.warn('Error deteniendo reconocimiento:', error);
        }
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [initializeRecognition]);

  // Función optimizada para alternar escucha
  const toggleListening = useCallback(async () => {
    if (!isSupported) {
      setError('Reconocimiento de voz no soportado en este navegador');
      return;
    }

    if (!recognitionRef.current) {
      const initialized = initializeRecognition();
      if (!initialized) return;
    }

    try {
      if (isListening || isInitializing) {
        // Detener reconocimiento
        recognitionRef.current?.stop();
        setIsListening(false);
        setIsInitializing(false);
        setCurrentTranscript('');
      } else {
        // Iniciar reconocimiento
        setIsInitializing(true);
        setError(null);
        
        // Solicitar permisos de micrófono explícitamente
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (permissionError) {
          setError('Permisos de micrófono requeridos. Por favor, permite el acceso al micrófono.');
          setIsInitializing(false);
          return;
        }
        
        recognitionRef.current?.start();
      }
    } catch (error) {
      console.error('Error en toggleListening:', error);
      setError('Error al controlar el reconocimiento de voz');
      setIsListening(false);
      setIsInitializing(false);
    }
  }, [isSupported, isListening, isInitializing, initializeRecognition]);

  // Limpiar error manualmente
  const clearError = useCallback(() => {
    setError(null);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return (
    <div className="relative">
      <motion.div
        whileHover={{ scale: (disabled || !isSupported) ? 1 : 1.05 }}
        whileTap={{ scale: (disabled || !isSupported) ? 1 : 0.95 }}
        animate={isListening ? { 
          scale: [1, 1.1, 1],
          boxShadow: [
            '0 0 0 0 rgba(239, 68, 68, 0.7)',
            '0 0 0 15px rgba(239, 68, 68, 0)',
            '0 0 0 0 rgba(239, 68, 68, 0)'
          ]
        } : isInitializing ? {
          rotate: [0, 360],
        } : {}}
        transition={isListening ? { duration: 1.5, repeat: Infinity } : isInitializing ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
      >
        <button
          onClick={toggleListening}
          disabled={disabled || !isSupported}
          className={`
            relative p-3 rounded-xl flex items-center justify-center min-w-[48px] min-h-[48px]
            transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50
            ${isListening 
              ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30 text-white' 
              : isInitializing
              ? 'bg-yellow-500 hover:bg-yellow-600 shadow-lg shadow-yellow-500/30 text-white'
              : 'bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm text-gray-300 hover:text-white'
            }
            ${disabled || !isSupported ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            ${error ? 'ring-2 ring-red-500/50' : ''}
            ${className}
          `}
          title={
            !isSupported ? 'Reconocimiento de voz no soportado' :
            isListening ? 'Detener grabación (Clic para parar)' : 
            isInitializing ? 'Inicializando micrófono...' :
            'Iniciar grabación de voz (Clic para hablar)'
          }
        >
        {isInitializing ? (
           <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg 
            className={`w-5 h-5 transition-colors duration-200`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            {isListening ? (
              // Icono de parar (cuadrado)
              <rect x="6" y="6" width="12" height="12" rx="2" strokeWidth={2} />
            ) : (
              // Icono de micrófono
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            )}
          </svg>
        )}
        </button>
      </motion.div>
      
      {/* Indicador de transcripción en tiempo real */}
      <AnimatePresence>
        {currentTranscript && (
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 p-3 bg-blue-500/90 text-white text-sm rounded-lg backdrop-blur-sm z-20 max-w-xs text-center shadow-lg">
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.9 }}
            >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span className="text-xs opacity-75">Escuchando...</span>
            </div>
            <div className="font-medium">{currentTranscript}</div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Mensaje de error mejorado */}
      <AnimatePresence>
        {error && (
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 p-3 bg-red-500/95 text-white text-sm rounded-lg backdrop-blur-sm z-20 max-w-sm shadow-lg">
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.9 }}
            >
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <div className="font-medium mb-1">Error de Reconocimiento</div>
                <div className="text-xs opacity-90">{error}</div>
                <button
                  onClick={clearError}
                  className="mt-2 text-xs underline hover:no-underline opacity-75 hover:opacity-100"
                >
                  Cerrar
                </button>
              </div>
            </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Indicador de estado del micrófono */}
      {isListening && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse border-2 border-white" />
      )}
    </div>
  );
}

// Declaración de tipos para TypeScript
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}