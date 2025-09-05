'use client';

// Event bus para manejar elementos de audio (Coqui TTS)
export interface AudioChangeEvent {
  audio: HTMLAudioElement | null;
}

export type AudioChangeHandler = (event: AudioChangeEvent) => void;

let audioChangeHandlers: AudioChangeHandler[] = [];
let currentAudio: HTMLAudioElement | null = null;

/**
 * Suscribirse a cambios en el elemento de audio actual
 */
export function onAudioChange(handler: AudioChangeHandler): () => void {
  audioChangeHandlers.push(handler);
  
  // Enviar el estado actual inmediatamente
  if (currentAudio) {
    try {
      handler({ audio: currentAudio });
    } catch (error) {
      console.error('Error in audio change handler:', error);
    }
  }
  
  // Retornar función de cleanup
  return () => {
    const index = audioChangeHandlers.indexOf(handler);
    if (index > -1) {
      audioChangeHandlers.splice(index, 1);
    }
  };
}

/**
 * Registrar un nuevo elemento de audio y notificar a todos los suscriptores
 */
export function registerAudioElement(audio: HTMLAudioElement | null): void {
  if (currentAudio !== audio) {
    currentAudio = audio;
    const event: AudioChangeEvent = { audio };
    
    audioChangeHandlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error('Error in audio change handler:', error);
      }
    });
  }
}

/**
 * Obtener el elemento de audio actual
 */
export function getCurrentAudio(): HTMLAudioElement | null {
  return currentAudio;
}

/**
 * Limpiar todos los suscriptores y el audio actual
 */
export function clearAudioHandlers(): void {
  audioChangeHandlers = [];
  currentAudio = null;
}