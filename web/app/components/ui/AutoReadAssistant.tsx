'use client';

import { useEffect, useRef } from 'react';
import useTTS from '../../hooks/useTTS';
import { useVoices } from '../settings/useVoices';
import { useUI } from '../ui-shell/UIProvider';

// Tipo para los mensajes de chat
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  done?: boolean;
  timestamp?: number;
}

interface AutoReadAssistantProps {
  messages: ChatMessage[];
  enabled?: boolean;
  voiceGender?: 'female' | 'male';
}

export const AutoReadAssistant: React.FC<AutoReadAssistantProps> = ({
  messages,
  enabled = true,
  voiceGender = 'female'
}) => {
  const { speakMarkdown, isSpeaking, stop } = useTTS();
  const { voices, loading: voicesLoading } = useVoices();
  const { voiceMode, voiceURI } = useUI();
  const lastProcessedMessageRef = useRef<string | null>(null);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    // Solo procesar si está habilitado y no estamos ya procesando
    if (!enabled || !voiceMode || isProcessingRef.current || voicesLoading) {
      return;
    }

    // Encontrar el último mensaje del asistente que esté marcado como done
    const lastAssistantMessage = messages
      .filter(msg => msg.role === 'assistant' && msg.done === true)
      .pop();

    // Verificar si hay un nuevo mensaje para procesar
    if (
      lastAssistantMessage &&
      lastAssistantMessage.id !== lastProcessedMessageRef.current &&
      lastAssistantMessage.content?.trim()
    ) {
      // Marcar como procesando para evitar lecturas duplicadas
      isProcessingRef.current = true;
      lastProcessedMessageRef.current = lastAssistantMessage.id;

      // Pequeño delay para asegurar que el streaming ha terminado completamente
      const readTimeout = setTimeout(async () => {
        try {
          // Detener cualquier lectura anterior
          if (isSpeaking) {
            stop();
            // Esperar un momento para que se detenga completamente
            await new Promise(resolve => setTimeout(resolve, 200));
          }

          // Leer el contenido del mensaje usando speakMarkdown
          await speakMarkdown(
            lastAssistantMessage.content,
            {
              rate: 0.85,
              pitch: voiceGender === 'female' ? 1.1 : 0.9,
              volume: 0.95
            },
            voiceGender
          );
        } catch (error) {
          console.error('Error al leer mensaje automáticamente:', error);
        } finally {
          // Liberar el flag de procesamiento
          isProcessingRef.current = false;
        }
      }, 500); // Delay de 500ms para asegurar que el streaming terminó

      // Cleanup del timeout si el componente se desmonta
      return () => {
        clearTimeout(readTimeout);
        isProcessingRef.current = false;
      };
    }
  }, [messages, enabled, voiceMode, voiceURI, voiceGender, speakMarkdown, isSpeaking, stop, voicesLoading]);

  // Cleanup al desmontar el componente
  useEffect(() => {
    return () => {
      if (isSpeaking) {
        stop();
      }
      isProcessingRef.current = false;
    };
  }, [isSpeaking, stop]);

  // Este componente no renderiza nada visible
  return null;
};

export default AutoReadAssistant;