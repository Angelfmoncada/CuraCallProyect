'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Square, Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { useTTS } from '../../hooks/useTTS';

interface TTSControlsProps {
  text?: string;
  className?: string;
  showVoiceSelector?: boolean;
  onPlayStart?: () => void;
  onPlayEnd?: () => void;
  onError?: (error: string) => void;
}

export const TTSControls: React.FC<TTSControlsProps> = ({
  text = '',
  className = '',
  showVoiceSelector = false,
  onPlayStart,
  onPlayEnd,
  onError,
}) => {
  const {
    isSupported,
    isSpeaking,
    isPaused,
    currentText,
    selectedVoice,
    error,
    speak,
    pause,
    resume,
    stop,
  } = useTTS();

  const [isHovered, setIsHovered] = useState(false);

  const handlePlay = () => {
    if (!text.trim()) return;
    
    onPlayStart?.();
    speak(text, {
      rate: 0.9,
      pitch: 1.0,
      volume: 1.0,
    });
  };

  const handlePause = () => {
    pause();
  };

  const handleResume = () => {
    resume();
  };

  const handleStop = () => {
    stop();
    onPlayEnd?.();
  };

  React.useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  React.useEffect(() => {
    if (!isSpeaking && currentText && onPlayEnd) {
      onPlayEnd();
    }
  }, [isSpeaking, currentText, onPlayEnd]);

  if (!isSupported) {
    return (
      <div className={`flex items-center gap-2 text-gray-500 ${className}`}>
        <VolumeX className="w-4 h-4" />
        <span className="text-sm">TTS no disponible en este navegador</span>
      </div>
    );
  }

  const canPlay = text.trim().length > 0 && !isSpeaking;
  const canPause = isSpeaking && !isPaused;
  const canResume = isSpeaking && isPaused;
  const canStop = isSpeaking;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Botón principal de reproducción/pausa */}
      <div className={`focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${
          canPlay || canPause || canResume
            ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl'
            : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
        }`} style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '2.5rem',
          height: '2.5rem',
          borderRadius: '9999px',
          transition: 'all 200ms',
          outline: 'none',
        }}>
        <motion.button
          onTap={canPlay ? handlePlay : canPause ? handlePause : canResume ? handleResume : undefined}
          animate={!canPlay && !canPause && !canResume ? { opacity: 0.5 } : { opacity: 1 }}
          whileTap={canPlay || canPause || canResume ? { scale: 0.95 } : {}}
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer'
          }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        aria-label={
          canPlay ? 'Reproducir texto' :
          canPause ? 'Pausar reproducción' :
          canResume ? 'Reanudar reproducción' :
          'Reproducción no disponible'
        }
      >
        <AnimatePresence mode="wait">
          {canPlay && (
            <motion.div
              key="play"
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 90 }}
              transition={{ duration: 0.2 }}
            >
              <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
            </motion.div>
          )}
          {canPause && (
            <motion.div
              key="pause"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Pause className="w-5 h-5" fill="currentColor" />
            </motion.div>
          )}
          {canResume && (
            <motion.div
              key="resume"
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 90 }}
              transition={{ duration: 0.2 }}
            >
              <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
      </div>

      {/* Botón de parar */}
      <AnimatePresence>
        {canStop && (
          <motion.button
            onTap={handleStop}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '2rem',
              height: '2rem',
              borderRadius: '9999px',
              backgroundColor: 'rgb(239 68 68)',
              color: 'white',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              transition: 'all 200ms',
              outline: 'none',
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Detener reproducción"
          >
            <Square className="w-4 h-4" fill="currentColor" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Información de estado */}
      <div className="flex flex-col justify-center min-w-0">
        <AnimatePresence mode="wait">
          {isSpeaking && (
            <motion.div
              key="speaking"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <Volume2 className="w-4 h-4 text-blue-500" />
              </motion.div>
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                {isPaused ? 'Pausado' : 'Reproduciendo...'}
              </span>
            </motion.div>
          )}
          {!isSpeaking && text.trim() && (
            <motion.div
              key="ready"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              
            >
              <Volume2 className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Listo para reproducir
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Información de voz seleccionada */}
        {selectedVoice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            
          >
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Voz:
            </span>
            <span className="text-gray-600 dark:text-gray-400 truncate">
              {selectedVoice.name}
            </span>
          </motion.div>
        )}
      </div>

      {/* Error display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              backgroundColor: 'rgb(254 242 242)',
              border: '1px solid rgb(254 202 202)',
              borderRadius: '0.5rem',
            }}
          
          >
            <VolumeX className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-600 dark:text-red-400">
              {error}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TTSControls;