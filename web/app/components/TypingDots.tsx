'use client';
import { motion } from 'framer-motion';

export default function TypingDots() {
  return (
    <div className="mb-6 flex justify-start">
      <motion.div 
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
      <div className="flex items-start gap-3 max-w-[85%]">
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-600">
          <span className="text-white font-bold text-sm">C</span>
        </div>
        
        {/* Typing bubble */}
        <div className="px-4 py-3 rounded-2xl backdrop-blur-sm border bg-white/10 text-white border-white/20 hover:bg-white/15 transition-all duration-200">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-2 h-2 bg-white/60 rounded-full">
                  <motion.div
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.4, 1, 0.4],
                    }}
                    transition={{
                      duration: 1.4,
                      repeat: Infinity,
                      delay: i * 0.2,
                      ease: 'easeInOut',
                    }}
                    style={{ width: '100%', height: '100%', borderRadius: '9999px', background: 'inherit' }}
                  />
                </div>
              ))}
            </div>
            <span className="text-white/70 text-sm ml-1">Curacall is typing...</span>
          </div>
        </div>
      </div>
      </motion.div>
    </div>
  );
}