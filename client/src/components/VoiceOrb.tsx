import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square } from "lucide-react";
import { useSpeech } from "@/hooks/useSpeech";
import { useWebLLM } from "@/hooks/useWebLLM";
import { cn } from "@/lib/utils";

type OrbState = "idle" | "listening" | "processing" | "speaking" | "error";

export function VoiceOrb() {
  const [orbState, setOrbState] = useState<OrbState>("idle");
  const { startListening, stopListening, speak, isListening } = useSpeech();
  const { chat, ready } = useWebLLM();

  const handleOrbClick = async () => {
    if (!ready) return;

    if (isListening) {
      stopListening();
      setOrbState("idle");
    } else {
      setOrbState("listening");
      const text = await startListening();
      
      if (text) {
        setOrbState("processing");
        
        try {
          const response = await chat([{ role: "user", content: text }]);
          setOrbState("speaking");
          await speak(response);
          setOrbState("idle");
        } catch (error) {
          console.error("Voice chat error:", error);
          setOrbState("error");
          setTimeout(() => setOrbState("idle"), 2000);
        }
      } else {
        setOrbState("idle");
      }
    }
  };

  const getOrbContent = () => {
    switch (orbState) {
      case "listening":
        return <Square className="w-12 h-12 text-primary" />;
      case "processing":
        return (
          <motion.div
            className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        );
      case "speaking":
        return (
          <motion.div
            className="flex gap-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-8 bg-primary rounded-full"
                animate={{
                  scaleY: [1, 2, 1],
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
              />
            ))}
          </motion.div>
        );
      case "error":
        return (
          <motion.div
            animate={{ x: [-2, 2, -2, 2, 0] }}
            transition={{ duration: 0.5 }}
          >
            <Mic className="w-12 h-12 text-destructive" />
          </motion.div>
        );
      default:
        return <Mic className="w-12 h-12 text-primary" />;
    }
  };

  const getStatusText = () => {
    switch (orbState) {
      case "listening":
        return (
          <div className="typing-indicator">
            <span>Listening</span>
            <div className="typing-dot" />
            <div className="typing-dot" />
            <div className="typing-dot" />
          </div>
        );
      case "processing":
        return "Processing...";
      case "speaking":
        return "Speaking...";
      case "error":
        return "Error occurred";
      default:
        return null;
    }
  };

  return (
    <div className="text-center mb-16" data-testid="voice-orb-container">
      <div className="relative inline-block mb-8">
        <motion.div
          className={cn(
            "relative w-32 h-32 mx-auto glass rounded-full flex items-center justify-center cursor-pointer transition-all duration-300",
            ready ? "hover:scale-105" : "opacity-50 cursor-not-allowed",
            orbState === "listening" && "orb-ripple",
            orbState === "idle" && "animate-breathing"
          )}
          whileTap={ready ? { scale: 0.95 } : {}}
          onClick={handleOrbClick}
          data-testid="voice-orb"
        >
          {getOrbContent()}
          
          {/* Pulsing background */}
          <motion.div
            className="absolute inset-0 rounded-full bg-primary/20"
            animate={{
              scale: orbState === "listening" ? [1, 1.1, 1] : 1,
              opacity: orbState === "listening" ? [0.2, 0.4, 0.2] : 0.2,
            }}
            transition={{
              duration: 1.5,
              repeat: orbState === "listening" ? Infinity : 0,
            }}
          />
        </motion.div>
        
        {/* Glow effect */}
        <div className="absolute -inset-4">
          <div className="w-full h-full rounded-full bg-gradient-to-r from-primary via-accent to-primary opacity-20 animate-glow blur-md" />
        </div>
      </div>
      
      <motion.h1
        className="text-4xl font-light mb-4"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        Good to See You!
      </motion.h1>
      
      <motion.p
        className="text-xl text-muted-foreground mb-8"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        How Can I be an Assistance?
      </motion.p>
      
      <motion.p
        className="text-sm text-muted-foreground mb-6"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        I'm available 24/7 for you, ask me anything.
      </motion.p>

      {/* Voice Status */}
      <AnimatePresence>
        {orbState !== "idle" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-sm text-muted-foreground"
            data-testid="voice-status"
          >
            {getStatusText()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
