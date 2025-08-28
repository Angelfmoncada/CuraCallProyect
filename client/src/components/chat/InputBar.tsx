import { useState, KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { Send, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSpeech } from "@/hooks/useSpeech";

interface InputBarProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  suggestions?: string[];
}

export function InputBar({ 
  onSendMessage, 
  disabled = false, 
  placeholder = "Type your message...",
  suggestions = [
    "Explain this concept",
    "Give me an example", 
    "What's the next step?"
  ]
}: InputBarProps) {
  const [message, setMessage] = useState("");
  const { startListening, isListening } = useSpeech();

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
    if (isListening) return;
    
    const voiceText = await startListening();
    if (voiceText) {
      setMessage(voiceText);
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
        
        <Button
          size="icon"
          variant="ghost"
          onClick={handleVoiceInput}
          disabled={disabled}
          className={`p-2 hover:bg-white/10 rounded-lg transition-colors ${
            isListening ? "bg-primary/20" : ""
          }`}
          data-testid="button-voice-input"
        >
          <Mic className={`w-5 h-5 ${isListening ? "text-primary" : ""}`} />
        </Button>
        
        <Button
          size="icon"
          onClick={handleSend}
          disabled={disabled || !message.trim()}
          className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/80 transition-colors disabled:opacity-50"
          data-testid="button-send"
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>
      
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
