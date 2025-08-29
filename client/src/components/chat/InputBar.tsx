import { useState, KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { Send, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSpeech } from "@/hooks/useSpeech";

interface InputBarProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  suggestions?: string[];
  currentLanguage?: 'en' | 'es';
}

export function InputBar({ 
  onSendMessage, 
  disabled = false, 
  placeholder = "Type your message...",
  suggestions = [],
  currentLanguage = 'en'
}: InputBarProps) {
  const [message, setMessage] = useState("");
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const { listening, start, stop } = useSpeech();

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVoiceInput = async () => {
    if (listening) {
      stop();
      return;
    }
    
    try {
      // Verificar permisos de micrófono
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setVoiceError(null);
      
      const speechLang = currentLanguage === 'es' ? 'es-ES' : 'en-US';
      start((text: string) => {
        setMessage(text);
      }, speechLang);
    } catch (error) {
      console.error('Voice input error:', error);
      const errorMsg = currentLanguage === 'es' 
        ? 'No se pudo acceder al micrófono. Verifica los permisos.'
        : 'Could not access microphone. Check permissions.';
      setVoiceError(errorMsg);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setMessage(suggestion);
  };

  return (
    <div className="glass rounded-2xl p-4" data-testid="input-bar">
      <div className="flex gap-3 mb-3">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 bg-transparent border-none outline-none text-base placeholder-muted-foreground focus-visible:ring-0"
          data-testid="input-message"
        />
        
        <div className="relative">
          <Button
            size="icon"
            variant="ghost"
            onClick={handleVoiceInput}
            disabled={disabled}
            className={`p-2 hover:bg-white/10 rounded-lg transition-colors ${
              listening ? "bg-red-500/20 text-red-500" : ""
            }`}
            data-testid="voice-input-button"
            aria-label={listening ? "Detener grabación" : "Iniciar grabación de voz"}
          >
            {listening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>
          
          {/* Indicador de grabación */}
          {listening && (
            <div 
              className="absolute -top-2 -right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse"
              data-testid="recording-indicator"
            />
          )}
        </div>
        
        <Button
          size="icon"
          onClick={handleSend}
          disabled={disabled || !message.trim()}
          className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/80 transition-colors disabled:opacity-50"
          data-testid="send-button"
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>
      
      {/* Error de voz */}
      {voiceError && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg"
          data-testid="voice-error"
        >
          <p className="text-sm text-red-500">{voiceError}</p>
        </motion.div>
      )}

      {/* Quick suggestions */}
      {suggestions.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {suggestions.map((suggestion, index) => (
            <motion.button
              key={suggestion}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="glass px-3 py-1 rounded-full text-xs hover:bg-white/10 transition-colors"
              onClick={() => handleSuggestionClick(suggestion)}
              disabled={disabled}
              data-testid={`button-suggestion-${index}`}
            >
              {suggestion}
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
