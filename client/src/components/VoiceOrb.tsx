import { motion } from "framer-motion";
import { Mic, Volume2, MessageCircle, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceOrbProps {
  listening?: boolean;
  speaking?: boolean;
  thinking?: boolean;
}

export function VoiceOrb({ listening = false, speaking = false, thinking = false }: VoiceOrbProps) {
  const getOrbContent = () => {
    if (listening) {
      return (
        <>
          {/* Base orb with enhanced listening gradient */}
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 via-blue-500 to-purple-600"
            animate={{
              scale: [1, 1.05, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          {/* Enhanced ripple effects */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-blue-400/60"
            animate={{
              scale: [1, 1.4],
              opacity: [0.6, 0]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeOut"
            }}
          />
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-purple-400/60"
            animate={{
              scale: [1, 1.4],
              opacity: [0.6, 0]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeOut",
              delay: 0.5
            }}
          />
          
          <div className="relative z-10 flex items-center justify-center h-full">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <Mic className="w-12 h-12 text-white drop-shadow-lg" />
            </motion.div>
          </div>
        </>
      );
    }

    if (speaking) {
      return (
        <>
          {/* Enhanced speaking orb with dynamic glow */}
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600"
            animate={{
              scale: [1, 1.08, 1.02, 1],
              boxShadow: [
                "0 0 20px rgba(34, 197, 94, 0.4)",
                "0 0 40px rgba(34, 197, 94, 0.6)",
                "0 0 20px rgba(34, 197, 94, 0.4)"
              ]
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          <div className="relative z-10 flex items-center justify-center h-full">
            <motion.div
              animate={{ 
                scale: [1, 1.15, 1],
                rotate: [0, 2, -2, 0]
              }}
              transition={{ duration: 0.6, repeat: Infinity }}
            >
              <Volume2 className="w-12 h-12 text-white drop-shadow-lg" />
            </motion.div>
          </div>
        </>
      );
    }

    if (thinking) {
      return (
        <>
          {/* Enhanced thinking orb with pulsing effect */}
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-red-500"
            animate={{
              scale: [1, 1.03, 1],
              opacity: [0.9, 1, 0.9]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          {/* Thinking particles effect */}
          <motion.div
            className="absolute -inset-3 rounded-full bg-gradient-to-br from-amber-300/20 to-orange-400/20"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          <div className="relative z-10 flex items-center justify-center h-full">
            <motion.div
              animate={{ 
                rotate: [0, 360],
                scale: [1, 1.05, 1]
              }}
              transition={{ 
                rotate: { duration: 4, repeat: Infinity, ease: "linear" },
                scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
              }}
            >
              <Brain className="w-12 h-12 text-white drop-shadow-lg" />
            </motion.div>
          </div>
        </>
      );
    }

    // Enhanced idle state
    return (
      <>
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/90 via-primary/70 to-accent/80"
          whileHover={{ 
            scale: 1.05,
            boxShadow: "0 0 30px rgba(var(--primary), 0.4)"
          }}
          whileTap={{ scale: 0.95 }}
          animate={{
            scale: [1, 1.02, 1],
            opacity: [0.9, 1, 0.9]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Idle glow effect */}
        <motion.div
          className="absolute -inset-2 rounded-full bg-gradient-to-br from-primary/20 to-accent/20"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        <div className="relative z-10 flex items-center justify-center h-full">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <MessageCircle className="w-12 h-12 text-white drop-shadow-lg" />
          </motion.div>
        </div>
      </>
    );
  };

  return (
    <div className="relative inline-block" data-testid="voice-orb-container">
      
      <motion.div
        className={cn(
          "relative w-32 h-32 mx-auto glass rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-105",
          "animate-float", // Base gentle float animation
          speaking && "animate-talk scale-105", // Strong glow when speaking
          thinking && "animate-pulse", // Soft pulse when thinking
        )}
        whileTap={{ scale: 0.95 }}
        data-testid="voice-orb"
      >
        {getOrbContent()}
        
        {/* Base glow effect */}
        <div className="absolute -inset-4">
          <div className="w-full h-full rounded-full bg-gradient-to-r from-primary via-accent to-primary opacity-20 animate-glow blur-md" />
        </div>
        
        {/* Ripple effects when listening */}
        {listening && (
          <>
            <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ripple" />
            <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ripple" style={{ animationDelay: '0.6s' }} />
          </>
        )}
      </motion.div>
    </div>
  );
}
