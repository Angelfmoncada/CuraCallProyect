import { useEffect, useCallback } from 'react';

interface VoiceShortcutsConfig {
  /** Callback para activar el modo voz */
  onVoiceActivate?: () => void;
  /** Callback para activar el modo chat */
  onChatActivate?: () => void;
  /** Callback para alternar entre modos */
  onToggleMode?: () => void;
  /** Callback para mostrar/ocultar el widget flotante */
  onToggleWidget?: () => void;
  /** Si los atajos están habilitados */
  enabled?: boolean;
}

/**
 * Hook para manejar atajos de teclado para funciones de voz y chat
 * 
 * Atajos disponibles:
 * - Ctrl + Shift + V: Activar modo voz
 * - Ctrl + Shift + C: Activar modo chat
 * - Ctrl + Shift + T: Alternar entre modos
 * - Ctrl + Shift + A: Mostrar/ocultar widget flotante
 */
export function useVoiceShortcuts({
  onVoiceActivate,
  onChatActivate,
  onToggleMode,
  onToggleWidget,
  enabled = true
}: VoiceShortcutsConfig = {}) {
  
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;
    
    // Solo procesar si se presiona Ctrl + Shift
    if (!event.ctrlKey || !event.shiftKey) return;
    
    // Prevenir comportamiento por defecto
    event.preventDefault();
    
    switch (event.key.toLowerCase()) {
      case 'v':
        // Ctrl + Shift + V: Activar modo voz
        onVoiceActivate?.();
        break;
        
      case 'c':
        // Ctrl + Shift + C: Activar modo chat
        onChatActivate?.();
        break;
        
      case 't':
        // Ctrl + Shift + T: Alternar entre modos
        onToggleMode?.();
        break;
        
      case 'a':
        // Ctrl + Shift + A: Mostrar/ocultar widget flotante
        onToggleWidget?.();
        break;
        
      default:
        // No hacer nada para otras teclas
        break;
    }
  }, [enabled, onVoiceActivate, onChatActivate, onToggleMode, onToggleWidget]);
  
  useEffect(() => {
    if (!enabled) return;
    
    // Agregar listener
    document.addEventListener('keydown', handleKeyDown);
    
    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);
  
  return {
    shortcuts: {
      voice: 'Ctrl + Shift + V',
      chat: 'Ctrl + Shift + C',
      toggle: 'Ctrl + Shift + T',
      widget: 'Ctrl + Shift + A'
    }
  };
}