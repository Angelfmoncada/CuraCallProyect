import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Archive, Trash2 } from "lucide-react";
import { MessageList } from "@/components/chat/MessageList";
import { InputBar } from "@/components/chat/InputBar";
import { streamChat, type HistoryMsg } from "@/lib/ai/streamChat";
import { useHistory } from "@/store/history";
import { useSpeech } from "@/hooks/useSpeech";
import { useSettings } from "@/store/settings";
import { Button } from "@/components/ui/button";
import type { Message } from "@shared/schema";

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const currentLanguage: 'es' = 'es';
  const { addConversation, currentConversation, setCurrentConversation } = useHistory();
  const { speaking } = useSpeech();
  const { settings } = useSettings();

  useEffect(() => {
    // Check for pending message from dashboard
    const pendingMessage = localStorage.getItem('pendingMessage');
    if (pendingMessage) {
      localStorage.removeItem('pendingMessage');
      handleSendMessage(pendingMessage);
    }

    // Load current conversation if exists
    if (currentConversation) {
      setMessages(currentConversation.messages as Message[]);
    }
  }, [currentConversation]);

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user" as const,
      content,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsTyping(true);

    try {
      // Placeholder para el asistente
      const placeholder: Message = {
        id: crypto.randomUUID(),
        role: "assistant" as const,
        content: "",
        timestamp: Date.now(),
      };
      setMessages([...newMessages, placeholder]);

      // Historial para el servicio (sin el placeholder)
      const historyMsgs: HistoryMsg[] = newMessages.map(m => ({ role: m.role, content: m.content })) as HistoryMsg[];

      let full = "";
      const ctl = streamChat({
        prompt: content,
        history: historyMsgs,
        model: settings.aiModel,
        onToken: (delta) => {
          full += delta;
          setMessages(prev => prev.map(m => m.id === placeholder.id ? { ...m, content: full } : m));
        },
        onDone: (final) => {
          setMessages(prev => prev.map(m => m.id === placeholder.id ? { ...m, content: final } : m));

          const finalMessages = [...newMessages, { ...placeholder, content: final }];
          if (finalMessages.length === 2) {
            const title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
            const conversationId = addConversation(title, finalMessages);
            setCurrentConversation(conversationId);
          } else if (currentConversation) {
            // Aquí podrías persistir actualización si tu store lo requiere
            // console.log("Update conversation:", currentConversation.id, finalMessages);
          }
        },
        onError: (err) => {
          console.error('Chat stream error:', err);
        }
      });
      await ctl.start();
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleArchiveMessage = (messageId: string) => {
    console.log("Archive message:", messageId);
    // Implement message archiving
  };

  const handleDeleteMessage = (messageId: string) => {
    setMessages(messages.filter(m => m.id !== messageId));
  };

  const handleArchiveConversation = () => {
    if (currentConversation) {
      console.log("Archive conversation:", currentConversation.id);
      // Implement conversation archiving
    }
  };

  const handleDeleteConversation = () => {
    if (currentConversation) {
      console.log("Delete conversation:", currentConversation.id);
      setMessages([]);
      setCurrentConversation(null);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl h-full flex flex-col px-6 py-8">
      {/* Chat Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <h1 className="text-2xl font-semibold">Chat Assistant</h1>
        <div className="flex gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={handleArchiveConversation}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            data-testid="button-archive-conversation"
          >
            <Archive className="w-5 h-5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleDeleteConversation}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            data-testid="button-delete-conversation"
          >
            <Trash2 className="w-5 h-5" />
          </Button>
        </div>
      </motion.div>

      {/* Messages */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex-1 mb-6"
      >
        <MessageList
          messages={messages}
          isTyping={isTyping}
          onArchiveMessage={handleArchiveMessage}
          onDeleteMessage={handleDeleteMessage}
          currentLanguage={currentLanguage}
        />
      </motion.div>

      {/* Indicador de síntesis de voz */}
      {speaking && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed bottom-20 right-4 bg-primary/90 text-primary-foreground px-3 py-2 rounded-full shadow-lg flex items-center gap-2"
          data-testid="speaking-indicator"
        >
          <div className="w-2 h-2 bg-current rounded-full animate-pulse" />
          <span className="text-sm font-medium">
            {currentLanguage === 'es' ? 'Reproduciendo...' : 'Speaking...'}
          </span>
        </motion.div>
      )}

      {/* Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <InputBar
          onSendMessage={handleSendMessage}
          disabled={isTyping}
          placeholder={currentLanguage === 'es' ? "Escribe tu mensaje..." : "Type your message..."}
          currentLanguage={currentLanguage}
        />
      </motion.div>
    </div>
  );
}







