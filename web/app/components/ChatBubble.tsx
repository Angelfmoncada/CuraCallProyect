'use client';
import { motion } from 'framer-motion';

interface ChatBubbleProps {
  role: 'user' | 'assistant';
  text: string;
}

export default function ChatBubble({ role, text }: ChatBubbleProps) {
  const isUser = role === 'user';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mb-4 flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[80%] px-4 py-3 rounded-2xl ${
          isUser
            ? 'bg-blue-600 text-white ml-auto'
            : 'bg-white/10 text-white border border-white/20'
        }`}
      >
        <div className="flex items-start gap-2">
          {!isUser && (
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p className="text-sm whitespace-pre-wrap break-words">{text}</p>
          </div>
          {isUser && (
            <div className="w-6 h-6 rounded-full bg-white/20 flex-shrink-0 mt-0.5" />
          )}
        </div>
      </div>
    </motion.div>
  );
}