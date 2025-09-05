import { motion, AnimatePresence } from "framer-motion";
import { User, Bot, Archive, Trash2, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSpeech } from "@/hooks/useSpeech";
import type { Message } from "@shared/schema";

interface MessageListProps {
  messages: Message[];
  isTyping?: boolean;
  onArchiveMessage?: (messageId: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  currentLanguage?: 'en' | 'es';
}

export function MessageList({ 
  messages, 
  isTyping = false,
  onArchiveMessage,
  onDeleteMessage,
  currentLanguage = 'es'
}: MessageListProps) {
  const { speaking, speak } = useSpeech();

  const handleTTS = (text: string) => {
    const speechLang = currentLanguage === 'es' ? 'es-ES' : 'en-US';
    speak(text, speechLang);
  };
  return (
    <ScrollArea className="flex-1 pr-2" data-testid="messages-container">
      <div className="space-y-4">
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
              className={`flex gap-3 group ${
                message.role === "assistant" ? "justify-end" : ""
              } message-${message.role}`}
              data-testid={`message-${message.role}-${message.id}`}
            >
              {message.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
              
              <div className={`glass rounded-2xl px-4 py-3 max-w-[70%] relative ${
                message.role === "user" ? "rounded-tl-sm" : "rounded-tr-sm bg-primary/10"
              }`}>
                <p className="text-sm leading-relaxed">{message.content}</p>
                
                {/* Message actions */}
                <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  {message.role === "assistant" && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="w-6 h-6 glass"
                      onClick={() => handleTTS(message.content)}
                      data-testid="tts-button"
                      aria-label="Reproducir con síntesis de voz"
                    >
                      <Volume2 className="w-3 h-3" />
                    </Button>
                  )}
                  {onArchiveMessage && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="w-6 h-6 glass"
                      onClick={() => onArchiveMessage(message.id)}
                      data-testid={`button-archive-${message.id}`}
                    >
                      <Archive className="w-3 h-3" />
                    </Button>
                  )}
                  {onDeleteMessage && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="w-6 h-6 glass"
                      onClick={() => onDeleteMessage(message.id)}
                      data-testid={`button-delete-${message.id}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
              
              {message.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-accent-foreground" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex gap-3"
              data-testid="typing-indicator"
            >
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-accent-foreground" />
              </div>
              <div className="glass rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="typing-indicator">
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ScrollArea>
  );
}
