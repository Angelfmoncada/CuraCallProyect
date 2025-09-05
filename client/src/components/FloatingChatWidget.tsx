import { AnimatePresence } from 'framer-motion';
import { UniversalChatInterface } from './UniversalChatInterface';
import { useFloatingChat } from '@/hooks/useFloatingChat';

interface FloatingChatWidgetProps {
  /** Si el widget está visible */
  isVisible?: boolean;
  /** Callback para cerrar el widget */
  onClose?: () => void;
  /** Modo inicial */
  defaultMode?: 'voice' | 'chat';
}

/**
 * Widget flotante de chat que se puede usar en cualquier pantalla
 */
export function FloatingChatWidget({
  isVisible = false,
  onClose,
  defaultMode = 'voice'
}: FloatingChatWidgetProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <UniversalChatInterface
          variant="compact"
          isVisible={isVisible}
          onClose={onClose}
          title="CuraCall Assistant"
          defaultMode={defaultMode}
        />
      )}
    </AnimatePresence>
  );
}

/**
 * Hook para usar el widget flotante de chat
 */
export function useFloatingChatWidget() {
  const {
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
  } = useFloatingChat();

  return {
    // Estado
    isVisible,
    mode,
    isExpanded,
    
    // Acciones
    showChat: show,
    hideChat: hide,
    toggleChat: toggle,
    expandChat: expand,
    collapseChat: collapse,
    toggleExpanded,
    switchMode,
    setMode,
    
    // Componente
    FloatingChatWidget: (props: Omit<FloatingChatWidgetProps, 'isVisible' | 'onClose'>) => (
      <FloatingChatWidget
        {...props}
        isVisible={isVisible}
        onClose={hide}
      />
    )
  };
}