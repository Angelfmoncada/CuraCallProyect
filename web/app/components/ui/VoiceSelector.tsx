'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';
import { useTTS, TTSVoice } from '../../hooks/useTTS';

interface VoiceSelectorProps {
  className?: string;
  onVoiceChange?: (voice: TTSVoice) => void;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  className = '',
  onVoiceChange,
}) => {
  const {
    availableVoices,
    selectedVoice,
    selectVoice,
    getVoicesByGender,
    isSupported,
    isLoading,
  } = useTTS();

  const femaleVoices = getVoicesByGender('female');
  const maleVoices = getVoicesByGender('male');

  const handleVoiceSelect = (voiceId: string) => {
    selectVoice(voiceId);
    const voice = availableVoices.find(v => v.id === voiceId);
    if (voice && onVoiceChange) {
      onVoiceChange(voice);
    }
  };

  if (!isSupported) {
    return (
      <div className={`flex items-center gap-2 text-gray-500 ${className}`}>
        <VolumeX className="w-4 h-4" />
        <span className="text-sm">TTS no disponible</span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
        <span className="text-sm text-gray-600 dark:text-gray-400">Cargando voces...</span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
        <Volume2 className="w-4 h-4" />
        <span>Seleccionar Voz</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Voces Femeninas */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
            Voz Femenina
          </h4>
          <div className="space-y-1">
            {femaleVoices.length > 0 ? (
              femaleVoices.slice(0, 3).map((voice) => (
                <div
                  className={`
                    w-full px-3 py-2 text-left text-sm rounded-lg border transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-opacity-50
                    ${
                      selectedVoice?.id === voice.id
                        ? 'bg-pink-50 dark:bg-pink-900/20 border-pink-300 dark:border-pink-700 text-pink-700 dark:text-pink-300'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  <motion.button
                    key={voice.id}
                    onTap={() => handleVoiceSelect(voice.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    aria-label={`Seleccionar voz femenina: ${voice.name}`}
                    style={{ width: '100%', height: '100%' }}
                  >
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate">{voice.name}</span>
                    {selectedVoice?.id === voice.id && (
                      <div className="w-2 h-2 bg-pink-500 rounded-full" />
                    )}
                  </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {voice.lang}
                    </div>
                  </motion.button>
                </div>
              ))
            ) : (
              <div className="text-xs text-gray-500 dark:text-gray-400 italic">
                No hay voces femeninas disponibles
              </div>
            )}
          </div>
        </div>

        {/* Voces Masculinas */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
            Voz Masculina
          </h4>
          <div className="space-y-1">
            {maleVoices.length > 0 ? (
              maleVoices.slice(0, 3).map((voice) => (
                <div
                  className={`
                    w-full px-3 py-2 text-left text-sm rounded-lg border transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
                    ${
                      selectedVoice?.id === voice.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  <motion.button
                    key={voice.id}
                    onTap={() => handleVoiceSelect(voice.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    aria-label={`Seleccionar voz masculina: ${voice.name}`}
                    style={{ width: '100%', height: '100%' }}
                  >
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate">{voice.name}</span>
                    {selectedVoice?.id === voice.id && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    )}
                  </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {voice.lang}
                    </div>
                  </motion.button>
                </div>
              ))
            ) : (
              <div className="text-xs text-gray-500 dark:text-gray-400 italic">
                No hay voces masculinas disponibles
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Información de la voz seleccionada */}
      {selectedVoice && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
          <div className="flex items-center gap-2 text-sm">
            <Volume2 className="w-4 h-4 text-gray-500" />
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Voz seleccionada:
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              {selectedVoice.name} ({selectedVoice.gender === 'female' ? 'Femenina' : 'Masculina'})
            </span>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default VoiceSelector;