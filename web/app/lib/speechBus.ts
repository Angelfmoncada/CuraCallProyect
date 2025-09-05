'use client';

// Event bus para manejar el estado de Web Speech API
type SpeakingChangeHandler = (isSpeaking: boolean) => void;

let speakingChangeHandlers: SpeakingChangeHandler[] = [];
let currentlySpeaking = false;

/**
 * Suscribirse a cambios en el estado de habla
 */
export function onSpeakingChange(handler: SpeakingChangeHandler): () => void {
  speakingChangeHandlers.push(handler);
  
  // Retornar función de cleanup
  return () => {
    const index = speakingChangeHandlers.indexOf(handler);
    if (index > -1) {
      speakingChangeHandlers.splice(index, 1);
    }
  };
}

/**
 * Establecer el estado de habla y notificar a todos los suscriptores
 */
export function setSpeaking(isSpeaking: boolean): void {
  if (currentlySpeaking !== isSpeaking) {
    currentlySpeaking = isSpeaking;
    speakingChangeHandlers.forEach(handler => {
      try {
        handler(isSpeaking);
      } catch (error) {
        console.error('Error in speaking change handler:', error);
      }
    });
  }
}

/**
 * Obtener el estado actual de habla
 */
export function isSpeaking(): boolean {
  return currentlySpeaking;
}

/**
 * Limpiar todos los suscriptores (útil para cleanup)
 */
export function clearSpeakingHandlers(): void {
  speakingChangeHandlers = [];
  currentlySpeaking = false;
}