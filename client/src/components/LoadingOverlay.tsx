import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LoadingOverlayProps {
  isLoading?: boolean;
  progress?: number;
  message?: string;
}

export function LoadingOverlay({ 
  isLoading = false, 
  progress = 0, 
  message = "Loading AI Model..." 
}: LoadingOverlayProps) {
  const [visible, setVisible] = useState(isLoading);

  useEffect(() => {
    setVisible(isLoading);
  }, [isLoading]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50"
          data-testid="loading-overlay"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="glass rounded-2xl p-8 text-center animate-slide-up"
          >
            <div className="w-16 h-16 mx-auto mb-4 relative">
              <div className="absolute inset-0 rounded-full border-4 border-primary/30" />
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent"
                animate={{ rotate: 360 }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
            </div>
            <p className="text-sm text-muted-foreground mb-2">{message}</p>
            <div className="bg-muted rounded-full h-2 w-48">
              <motion.div
                className="bg-primary h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
