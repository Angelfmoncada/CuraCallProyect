'use client';

// TTS Engine types
export type TTSEngine = 'webspeech' | 'coqui';

// Storage keys
const TTS_ENGINE_KEY = 'tts_engine';
const VOICE_KEY = 'selected_voice';
const PITCH_KEY = 'voice_pitch';
const RATE_KEY = 'voice_rate';

// Default values
const DEFAULT_ENGINE: TTSEngine = 'webspeech';
const DEFAULT_PITCH = 1;
const DEFAULT_RATE = 1;

/**
 * Get the current TTS engine
 */
export function getTTSEngine(): TTSEngine {
  if (typeof window === 'undefined') return DEFAULT_ENGINE;
  
  try {
    const stored = localStorage.getItem(TTS_ENGINE_KEY);
    return (stored as TTSEngine) || DEFAULT_ENGINE;
  } catch {
    return DEFAULT_ENGINE;
  }
}

/**
 * Set the TTS engine
 */
export function setTTSEngine(engine: TTSEngine): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(TTS_ENGINE_KEY, engine);
  } catch (error) {
    console.warn('Failed to save TTS engine:', error);
  }
}

/**
 * Get the selected voice for Web Speech API
 */
export function getVoice(): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    return localStorage.getItem(VOICE_KEY);
  } catch {
    return null;
  }
}

/**
 * Set the selected voice for Web Speech API
 */
export function setVoice(voiceName: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(VOICE_KEY, voiceName);
  } catch (error) {
    console.warn('Failed to save voice:', error);
  }
}

/**
 * Get the pitch setting for Web Speech API
 */
export function getPitch(): number {
  if (typeof window === 'undefined') return DEFAULT_PITCH;
  
  try {
    const stored = localStorage.getItem(PITCH_KEY);
    return stored ? parseFloat(stored) : DEFAULT_PITCH;
  } catch {
    return DEFAULT_PITCH;
  }
}

/**
 * Set the pitch for Web Speech API
 */
export function setPitch(pitch: number): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(PITCH_KEY, pitch.toString());
  } catch (error) {
    console.warn('Failed to save pitch:', error);
  }
}

/**
 * Get the rate setting for Web Speech API
 */
export function getRate(): number {
  if (typeof window === 'undefined') return DEFAULT_RATE;
  
  try {
    const stored = localStorage.getItem(RATE_KEY);
    return stored ? parseFloat(stored) : DEFAULT_RATE;
  } catch {
    return DEFAULT_RATE;
  }
}

/**
 * Set the rate for Web Speech API
 */
export function setRate(rate: number): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(RATE_KEY, rate.toString());
  } catch (error) {
    console.warn('Failed to save rate:', error);
  }
}

/**
 * Get all available voices for Web Speech API
 */
export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !window.speechSynthesis) return [];
  
  return window.speechSynthesis.getVoices();
}

/**
 * Check if Web Speech API is supported
 */
export function isWebSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/**
 * Reset all settings to defaults
 */
export function resetSettings(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(TTS_ENGINE_KEY);
    localStorage.removeItem(VOICE_KEY);
    localStorage.removeItem(PITCH_KEY);
    localStorage.removeItem(RATE_KEY);
  } catch (error) {
    console.warn('Failed to reset settings:', error);
  }
}