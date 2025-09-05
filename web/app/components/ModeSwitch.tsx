'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getTTSEngine,
  setTTSEngine,
  getVoice,
  setVoice,
  getPitch,
  setPitch,
  getRate,
  setRate,
  getAvailableVoices,
  TTSEngine
} from '../lib/mode';

interface ModeSwitchProps {
  className?: string;
  children?: React.ReactNode;
}

export default function ModeSwitch({ className = '', children }: ModeSwitchProps) {
  const [engine, setEngineState] = useState<TTSEngine>(() => getTTSEngine());
  const [selectedVoice, setSelectedVoiceState] = useState<string>(() => getVoice() || '');
  const [webSpeechRate, setWebSpeechRateState] = useState(() => getRate());
  const [pitch, setPitchState] = useState(() => getPitch());
  const [coquiRate, setCoquiRateState] = useState(() => getRate());
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  // Cargar voces disponibles
  useEffect(() => {
    const loadVoices = () => {
      const voices = getAvailableVoices();
      setAvailableVoices(voices);
      
      // Si no hay voz seleccionada, usar la primera disponible
      if (!selectedVoice && voices.length > 0) {
        const defaultVoice = voices.find(v => v.default) || voices[0];
        setSelectedVoiceState(defaultVoice.name);
        setVoice(defaultVoice.name);
      }
    };

    loadVoices();
    
    // Las voces pueden no estar disponibles inmediatamente
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [selectedVoice]);

  const handleEngineChange = (newEngine: TTSEngine) => {
    setEngineState(newEngine);
    setTTSEngine(newEngine);
  };

  const handleVoiceChange = (voiceName: string) => {
    setSelectedVoiceState(voiceName);
    setVoice(voiceName);
  };

  const handleWebSpeechRateChange = (rate: number) => {
    setWebSpeechRateState(rate);
    setRate(rate);
  };

  const handlePitchChange = (newPitch: number) => {
    setPitchState(newPitch);
    setPitch(newPitch);
  };

  const handleCoquiRateChange = (rate: number) => {
    setCoquiRateState(rate);
    setRate(rate);
  };

  return (
    <div className={`bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-4 space-y-4 ${className}`}>
      {/* Header con toggle */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          🎛️ TTS Settings
        </h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-white/70 hover:text-white transition-colors"
        >
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            ▼
          </motion.div>
        </button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <div className="space-y-4 overflow-hidden">
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
            {/* Selector de Motor TTS */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/90">TTS Engine</label>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEngineChange('coqui')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    engine === 'coqui'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  🎤 Coqui TTS
                </button>
                <button
                  onClick={() => handleEngineChange('webspeech')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    engine === 'webspeech'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  🗣️ Web Speech
                </button>
              </div>
            </div>

            {/* Controles específicos para Web Speech */}
            {engine === 'webspeech' && (
              <>
                {/* Selector de Voz */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/90">Voice</label>
                  <select
                    value={selectedVoice}
                    onChange={(e) => handleVoiceChange(e.target.value)}
                    className="w-full p-2 rounded-md bg-white/10 border border-white/20 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {availableVoices.map((voice) => (
                      <option key={voice.name} value={voice.name} className="bg-gray-800">
                        {voice.name} ({voice.lang})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Control de Velocidad Web Speech */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-white/90">Speed</label>
                    <span className="text-xs text-white/70">{webSpeechRate.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={2.0}
                    step={0.1}
                    value={webSpeechRate}
                    onChange={(e) => handleWebSpeechRateChange(Number(e.target.value))}
                    className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>

                {/* Control de Pitch */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-white/90">Pitch</label>
                    <span className="text-xs text-white/70">{pitch.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={2.0}
                    step={0.1}
                    value={pitch}
                    onChange={(e) => handlePitchChange(Number(e.target.value))}
                    className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
              </>
            )}

            {/* Controles específicos para Coqui */}
            {engine === 'coqui' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-white/90">Speed</label>
                  <span className="text-xs text-white/70">{coquiRate.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min={0.8}
                  max={2.0}
                  step={0.05}
                  value={coquiRate}
                  onChange={(e) => handleCoquiRateChange(Number(e.target.value))}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
            )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {children}

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 18px;
          width: 18px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
        
        .slider::-moz-range-thumb {
          height: 18px;
          width: 18px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  );
}