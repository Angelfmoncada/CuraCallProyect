import { useState, useCallback } from 'react';

/**
 * Hook para manejar el estado del widget flotante de chat
 */
export function useFloatingChat() {
  const [isVisible, setIsVisible] = useState(false);
  const [mode, setMode] = useState<'voice' | 'chat'>('voice');
  const [isExpanded, setIsExpanded] = useState(false);

  const show = useCallback(() => {
    setIsVisible(true);
  }, []);

  const hide = useCallback(() => {
    setIsVisible(false);
    setIsExpanded(false);
  }, []);

  const toggle = useCallback(() => {
    setIsVisible(prev => !prev);
  }, []);

  const expand = useCallback(() => {
    setIsExpanded(true);
  }, []);

  const collapse = useCallback(() => {
    setIsExpanded(false);
  }, []);

  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const switchMode = useCallback((newMode: 'voice' | 'chat') => {
    setMode(newMode);
  }, []);

  return {
    isVisible,
    mode,
    isExpanded,
    show,
    hide,
    toggle,
    expand,
    collapse,
    toggleExpanded,
    switchMode,
    setMode
  };
}