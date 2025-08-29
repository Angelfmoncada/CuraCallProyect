import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, X, Maximize2, Minimize2, Archive, Trash2 } from 'lucide-react';
import { VoiceOrb } from '@/components/VoiceOrb';
import { ModeToggle } from '@/components/ModeToggle';
import { InputBar } from '@/components/chat/InputBar';
import { MessageList } from '@/components/chat/MessageList';
import { Button } from '@/components/ui/button';
import { type Msg, useOllamaChat } from '@/hooks/useOllamaChat';
import { streamChat, type HistoryMsg } from '@/lib/ai/streamChat';
import { cn } from '@/lib/utils';
import { useAudio } from '@/store/audio';
import { useSpeech } from '@/hooks/useSpeech';
import { useHistory } from '@/store/history';
import { useChatStore } from '@/store/useChatStore';
import { useSettings } from '@/store/settings';
import type { Message } from '@shared/schema';

interface UniversalChatInterfaceProps {
  /** Modo de visualización: 'compact' para widget flotante, 'full' para pantalla completa */
  variant?: 'compact' | 'full';
  /** Si está visible o no (para modo compact) */
  isVisible?: boolean;
  /** Callback para cerrar el widget */
  onClose?: () => void;
  /** Título personalizado */
  title?: string;
  /** Posición inicial del modo de chat/voz */
  defaultMode?: 'voice' | 'chat';
  /** Clase CSS adicional */
  className?: string;
}

export function UniversalChatInterface({
  variant = 'full',
  isVisible = true,
  onClose,
  title = 'CuraCall Assistant',
  defaultMode = 'voice',
  className
}: UniversalChatInterfaceProps) {
  const [mode, setMode] = useState<'voice' | 'chat'>(defaultMode);
  const [isExpanded, setIsExpanded] = useState(variant === 'full');
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  
  // Estados del chat store
  const chatStore = useChatStore();
  
  // Configuración del usuario
  const { aiModel } = useSettings();
  
  // Audio y voz
  const volume = useAudio((s) => s.volume);
  const rate = useAudio((s) => s.rate);
  const micEnabled = useAudio((s) => s.micEnabled);
  
  // Chat con Ollama para modo voz
  const SYSTEM = 'Eres CuraCall Assistant. Responde en español, cálido, claro y breve. Si no sabes, dilo. Formatea listas con viñetas cuando ayude.';
  const { reply, ask, thinking } = useOllamaChat(SYSTEM);
  const { speak, start, speaking } = useSpeech();
  const [listening, setListening] = useState(false);
  const [ack, setAck] = useState<string | null>(null);
  
  // Historial para modo voz
  const [voiceHistory, setVoiceHistory] = useState<Msg[]>(() => {
    try { 
      return JSON.parse(localStorage.getItem('curacall-universal-voice-thread') || '[]'); 
    } catch { 
      return []; 
    }
  });
  
  // Historial para modo chat
  const { 
    addConversation, 
    currentConversation, 
    setCurrentConversation,
    archiveConversation,
    deleteConversation 
  } = useHistory();
  
  // Usar mensajes del store o locales según el contexto
  const messages = mode === 'chat' && chatStore.currentId ? 
    (chatStore.messages[chatStore.currentId] || []) : localMessages;
  const setMessages = mode === 'chat' && chatStore.currentId ? 
    (msgs: Message[]) => {} : setLocalMessages; // El store maneja sus propios mensajes
  
  const lastUser = [...voiceHistory].reverse().find((m) => m.role === 'user');
  const lastAssistant = [...voiceHistory].reverse().find((m) => m.role === 'assistant');
  const currentLanguage: 'es' = 'es';

  // Persistir historial de voz
  function persistVoiceHistory(newHistory: Msg[]) {
    setVoiceHistory(newHistory);
    try { 
      localStorage.setItem('curacall-universal-voice-thread', JSON.stringify(newHistory)); 
    } catch {}
  }

  // Manejar interacción por voz
  async function handleVoice() {
    if (!micEnabled) return;
    setListening(true);
    const stop = await start(async (text: string) => {
      setListening(false);
      if (!text?.trim()) return;
      const newHistory = [...voiceHistory, { role: 'user' as const, content: text }];
      persistVoiceHistory(newHistory);
      setAck('✓ Recibido. Preparando respuesta en voz...');
      try {
        const final = (await ask(newHistory, text)).trim();
        setAck(null);
        if (final) {
          persistVoiceHistory([...newHistory, { role: 'assistant' as const, content: final }]);
          speak(final, { volume, rate });
        }
      } catch (e) {
        setAck(null);
        console.error(e);
      }
    });
    return stop;
  }

  // Manejar texto en modo voz
  async function handleVoiceText(text: string) {
    if (!text.trim()) return;
    const newHistory = [...voiceHistory, { role: 'user' as const, content: text }];
    persistVoiceHistory(newHistory);
    setAck('✓ Recibido. Preparando respuesta...');
    try {
      const final = (await ask(newHistory, text)).trim();
      setAck(null);
      if (final) {
        persistVoiceHistory([...newHistory, { role: 'assistant' as const, content: final }]);
      }
    } catch (e) {
      setAck(null);
      console.error(e);
    }
  }

  // Manejar chat con streaming usando el store
  const handleChatMessage = async (content: string) => {
    if (chatStore.currentId) {
      // Usar el store para conversaciones existentes
      await chatStore.actions.send(content);
    } else {
      // Crear nueva conversación
      const newId = await chatStore.actions.newConversation('chat');
      await chatStore.actions.load(newId);
      await chatStore.actions.send(content);
    }
  };

  const handleVoiceInteraction = () => {
    if (listening || speaking || thinking) return;
    void handleVoice();
  };

  // Cargar conversación actual en modo chat
  useEffect(() => {
    if (variant === 'full') {
      setLocalMessages([]);
    }
    
    // Check for pending message from dashboard (igual que en chat.tsx)
    if (mode === 'chat') {
      const pendingMessage = localStorage.getItem('pendingMessage');
      if (pendingMessage) {
        localStorage.removeItem('pendingMessage');
        handleChatMessage(pendingMessage);
      }
    }
  }, [variant, mode]);
  
  // Cargar conversación actual del store
  useEffect(() => {
    if (mode === 'chat' && chatStore.currentId) {
      chatStore.actions.load(chatStore.currentId);
    }
  }, [mode, chatStore.currentId]);

  // Contenido del modo voz
  const renderVoiceMode = () => (
    <div className="text-center">
      <motion.h1 
        className={cn(
          "font-light mb-4",
          variant === 'compact' ? "text-2xl" : "text-4xl"
        )} 
        initial={{ y: 20, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }}
      >
        {title}
      </motion.h1>
      <motion.p 
        className={cn(
          "text-muted-foreground mb-8",
          variant === 'compact' ? "text-base" : "text-xl"
        )} 
        initial={{ y: 20, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }}
      >
        Tu asistente de salud personal
      </motion.p>

      <div className="flex justify-center mb-8">
        <div className="relative">
          <div 
            onClick={handleVoiceInteraction} 
            className={cn(
              'cursor-pointer transition-all duration-300', 
              (thinking || speaking) && 'cursor-not-allowed opacity-50'
            )}
          >
            <VoiceOrb listening={listening} thinking={thinking} speaking={speaking} />
          </div>
          <motion.div 
            className="mt-6 text-center space-y-2" 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }}
          >
            <p className={cn(
              "font-medium text-foreground",
              variant === 'compact' ? "text-sm" : "text-lg"
            )}>
              {listening ? 'Escuchando...' : 
               thinking ? (ack || 'Pensando...') : 
               speaking ? 'Hablando...' : 
               'Toca el orbe para comenzar'}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Última conversación en modo voz */}
      <AnimatePresence>
        {lastUser?.content && variant === 'full' && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.4 }} 
            className="max-w-3xl mx-auto mt-12 space-y-6"
          >
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-foreground/80 mb-2">Última conversación</h3>
              <div className="w-16 h-0.5 bg-gradient-to-r from-primary/50 to-accent/50 mx-auto rounded-full" />
            </div>
            <div className="space-y-4">
              <div className="flex justify-end">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-300" />
                  <div className="relative bg-primary text-primary-foreground px-6 py-3 rounded-xl max-w-md shadow-lg">
                    <p className="text-sm leading-relaxed">{lastUser.content}</p>
                  </div>
                </div>
              </div>
              <div className="flex justify-start">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-muted/20 to-accent/10 rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-300" />
                  <div className="relative bg-card border border-border/50 text-card-foreground px-6 py-3 rounded-xl max-w-md shadow-lg backdrop-blur-sm">
                    <div className="flex items-start gap-2">
                      <Brain className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        {thinking ? 
                          <p className="text-sm text-muted-foreground">{reply || 'Pensando...'}</p> : 
                          <p className="text-sm leading-relaxed">{lastAssistant?.content || ''}</p>
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input bar para modo voz */}
      {variant === 'full' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="max-w-2xl mx-auto mt-8"
        >
          <InputBar 
            onSendMessage={handleVoiceText} 
            disabled={thinking} 
            placeholder="Escribe tu mensaje..." 
            currentLanguage={currentLanguage}
            suggestions={['¿Cómo puedes ayudarme?','Explícame este concepto','¿Cuáles son mis opciones?','Dame un ejemplo']}
          />
        </motion.div>
      )}
    </div>
  );

  // Contenido del modo chat
  const renderChatMode = () => (
    <div className="h-full flex flex-col">
      {/* Messages */}
      <div className={cn(
        "flex-1 mb-6",
        variant === 'compact' ? "max-h-96 overflow-y-auto" : ""
      )}>
        <MessageList
          messages={messages}
          isTyping={chatStore.thinking || isTyping}
          onArchiveMessage={(messageId) => {
            console.log("Archive message:", messageId);
            // Implement message archiving
          }}
          onDeleteMessage={(messageId) => {
            if (mode === 'chat' && chatStore.currentId) {
              // El store maneja la eliminación de mensajes
              console.log("Delete message from store:", messageId);
            } else {
              setLocalMessages(localMessages.filter(m => m.id !== messageId));
            }
          }}
          currentLanguage={currentLanguage}
        />
      </div>

      {/* Indicador de síntesis de voz */}
      {speaking && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className={cn(
            "bg-primary/90 text-primary-foreground px-3 py-2 rounded-full shadow-lg flex items-center gap-2",
            variant === 'compact' ? "mb-4 w-fit mx-auto" : "fixed bottom-20 right-4"
          )}
          data-testid="speaking-indicator"
        >
          <div className="w-2 h-2 bg-current rounded-full animate-pulse" />
          <span className="text-sm font-medium">Reproduciendo...</span>
        </motion.div>
      )}

      {/* Input */}
      <InputBar
        onSendMessage={handleChatMessage}
        disabled={isTyping}
        placeholder="Escribe tu mensaje..."
        currentLanguage={currentLanguage}
      />
    </div>
  );

  if (!isVisible) return null;

  const containerClasses = cn(
    "bg-background/95 backdrop-blur-sm border border-border/50 rounded-xl shadow-xl",
    variant === 'compact' ? (
      isExpanded ? 
        "fixed bottom-4 right-4 w-96 h-[600px] z-50" :
        "fixed bottom-4 right-4 w-80 h-96 z-50"
    ) : "container mx-auto max-w-4xl px-6 py-8",
    className
  );

  return (
    <motion.div
      className={containerClasses}
      initial={variant === 'compact' ? { opacity: 0, scale: 0.8, y: 20 } : { opacity: 0, y: 20 }}
      animate={variant === 'compact' ? { opacity: 1, scale: 1, y: 0 } : { opacity: 1, y: 0 }}
      exit={variant === 'compact' ? { opacity: 0, scale: 0.8, y: 20 } : { opacity: 0, y: 20 }}
    >
      {/* Header para modo compact */}
      {variant === 'compact' && (
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <h3 className="font-semibold text-sm">{title}</h3>
          <div className="flex items-center gap-2">
            {/* Botones de conversación para modo chat */}
             {mode === 'chat' && chatStore.currentId && (
               <>
                 <Button
                   size="icon"
                   variant="ghost"
                   onClick={async () => {
                     if (chatStore.currentId) {
                       await chatStore.actions.archive(chatStore.currentId);
                       await chatStore.actions.refreshConversations();
                     }
                   }}
                   className="h-6 w-6 text-muted-foreground hover:text-foreground"
                   title="Archivar conversación"
                 >
                   <Archive className="w-3 h-3" />
                 </Button>
                 <Button
                   size="icon"
                   variant="ghost"
                   onClick={async () => {
                     if (chatStore.currentId) {
                       await chatStore.actions.remove(chatStore.currentId);
                       await chatStore.actions.refreshConversations();
                     }
                   }}
                   className="h-6 w-6 text-muted-foreground hover:text-destructive"
                   title="Eliminar conversación"
                 >
                   <Trash2 className="w-3 h-3" />
                 </Button>
               </>
             )}
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6"
            >
              {isExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
            </Button>
            {onClose && (
              <Button
                size="icon"
                variant="ghost"
                onClick={onClose}
                className="h-6 w-6"
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Contenido principal */}
      <div className={cn(
        variant === 'compact' ? "p-4" : "",
        variant === 'compact' && !isExpanded ? "h-80" : "h-full"
      )}>
        {/* Mode Toggle */}
        <div className="flex justify-center mb-6">
          <ModeToggle mode={mode} onModeChange={setMode} />
        </div>

        {/* Contenido según el modo */}
        {mode === 'voice' ? renderVoiceMode() : renderChatMode()}
      </div>
    </motion.div>
  );
}