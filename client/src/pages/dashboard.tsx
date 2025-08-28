import { useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Lightbulb, Video, BookOpen } from "lucide-react";
import { VoiceOrb } from "@/components/VoiceOrb";
import { ModeToggle } from "@/components/ModeToggle";
import { InputBar } from "@/components/chat/InputBar";
import { useWebLLM } from "@/hooks/useWebLLM";
import { Button } from "@/components/ui/button";

const quickActions = [
  { icon: Lightbulb, text: "Any advice for me?", prompt: "Can you give me some advice for personal growth and development?" },
  { icon: Video, text: "Some youtube video idea", prompt: "Can you suggest some creative YouTube video ideas?" },
  { icon: BookOpen, text: "Life lessons from books", prompt: "What are some important life lessons from famous books?" },
];

export default function Dashboard() {
  const [mode, setMode] = useState<"voice" | "chat">("voice");
  const [, setLocation] = useLocation();
  const { ready } = useWebLLM();

  const handleChatMessage = (message: string) => {
    // Store the message and navigate to chat
    localStorage.setItem('pendingMessage', message);
    setLocation('/chat');
  };

  const handleQuickAction = async (prompt: string) => {
    if (mode === "voice") {
      // For voice mode, trigger speech synthesis to read the question
      try {
        const synth = window.speechSynthesis;
        const utterance = new SpeechSynthesisUtterance(prompt);
        synth.speak(utterance);
        console.log("Voice query:", prompt);
      } catch (error) {
        console.error("Speech synthesis error:", error);
      }
    } else {
      handleChatMessage(prompt);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl px-6 py-8">
      <ModeToggle mode={mode} onModeChange={setMode} />

      {mode === "voice" ? (
        <VoiceOrb />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto mb-16"
        >
          <InputBar
            onSendMessage={handleChatMessage}
            placeholder="Ask anything..."
            suggestions={[]}
          />
        </motion.div>
      )}

      {/* Quick Action Chips */}
      <div className="flex flex-wrap justify-center gap-3 mb-16">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.div
              key={action.text}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <Button
                variant="ghost"
                className="glass px-4 py-2 rounded-full text-sm hover:bg-white/10 transition-all duration-300 hover:scale-105"
                onClick={() => handleQuickAction(action.prompt)}
                data-testid={`button-quick-action-${index}`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {action.text}
              </Button>
            </motion.div>
          );
        })}
      </div>

      {/* WebGPU Status */}
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm"
          data-testid="webgpu-status"
        >
          <div className={`w-2 h-2 rounded-full animate-pulse ${ready ? 'bg-green-500' : 'bg-yellow-500'}`} />
          <span>{ready ? 'WebGPU Available - Using Local AI' : 'Using Wikipedia RAG Mode'}</span>
        </motion.div>
      </div>
    </div>
  );
}
