'use client';

import React, { useState, useRef } from 'react';
import { speakWithCoqui } from '../lib/tts';

interface VoiceControlsProps {
  onTextToSpeech?: (text: string) => void;
  className?: string;
}

export default function VoiceControls({ onTextToSpeech, className = '' }: VoiceControlsProps) {
  const [testText, setTestText] = useState('Hello! This is a test of the text-to-speech system.');
  const [rate, setRate] = useState(() => Number(localStorage.getItem("COQUI_RATE") || 1.35));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTestTTS = async () => {
    if (!testText.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const refB64 = localStorage.getItem("COQUI_SPK_REF_B64") || undefined;
      await speakWithCoqui(testText, { 
        language: 'en', 
        speakerWavB64: refB64, 
        rate 
      });
      onTextToSpeech?.(testText);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'TTS Error');
      console.error('TTS failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      setError('Please select an audio file');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          // Store base64 without data URL prefix
          const base64 = result.split(',')[1];
          localStorage.setItem('COQUI_SPK_REF_B64', base64);
          setError(null);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Failed to process audio file');
    }
  };

  const clearReferenceVoice = () => {
    localStorage.removeItem('COQUI_SPK_REF_B64');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const hasReferenceVoice = !!localStorage.getItem('COQUI_SPK_REF_B64');

  return (
    <div className={`bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6 space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">
          🎤 Voice Controls
        </h3>
        {isLoading && (
          <div className="flex items-center space-x-1 text-blue-400">
            <div className="w-4 h-4 border-2 border-white/30 border-t-blue-400 rounded-full animate-spin"></div>
            <span className="text-sm">Loading...</span>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-md p-3">
          <div className="flex items-center">
            <div className="text-red-400 mr-2">⚠️</div>
            <div className="text-sm text-red-300">
              <strong>Error:</strong> {error}
            </div>
          </div>
        </div>
      )}

      {/* Custom Text Input */}
      <div className="space-y-3">
        <h4 className="text-md font-medium text-white/90">Test Text</h4>
        <textarea
          value={testText}
          onChange={(e) => setTestText(e.target.value)}
          placeholder="Enter text to convert to speech..."
          className="w-full p-3 border border-white/20 rounded-md bg-white/10 text-white placeholder-white/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          rows={3}
        />
        <button
          onClick={handleTestTTS}
          disabled={isLoading || !testText.trim()}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center space-x-2"
        >
          <span>🎵</span>
          <span>{isLoading ? 'Converting...' : 'Test TTS'}</span>
        </button>
      </div>

      {/* Reference Voice Upload */}
      <div className="space-y-3">
        <h4 className="text-md font-medium text-white/90">Reference Voice (Optional)</h4>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="flex-1 text-sm text-white/70 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-700"
          />
          {hasReferenceVoice && (
            <button
              onClick={clearReferenceVoice}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md"
            >
              Clear
            </button>
          )}
        </div>
        {hasReferenceVoice && (
          <p className="text-xs text-green-400">✓ Reference voice uploaded</p>
        )}
      </div>

      {/* Speed Control */}
      <div className="flex items-center gap-3">
        <label className="text-sm text-white/90 min-w-[50px]">Speed</label>
        <input
          type="range"
          min={0.8}
          max={2.0}
          step={0.05}
          value={rate}
          onChange={(e) => {
            const newRate = Number(e.target.value);
            setRate(newRate);
            localStorage.setItem("COQUI_RATE", newRate.toString());
          }}
          className="flex-1 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
        />
        <span className="text-xs text-white/70 min-w-[45px]">
          {rate.toFixed(2)}x
        </span>
      </div>

      <style jsx>{`
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          height: 18px;
          width: 18px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
        
        input[type="range"]::-moz-range-thumb {
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