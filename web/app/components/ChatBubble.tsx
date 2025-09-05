'use client';
import { motion, MotionProps } from 'framer-motion';
import React from 'react';

type ChatBubbleProps = {
  role: 'user' | 'assistant';
  text: string;
  className?: string;
  children?: React.ReactNode;
} & MotionProps;

export default function ChatBubble({ role, text, className, children, ...motionProps }: ChatBubbleProps) {
  const isUser = role === 'user';

  return (
    <div className={`mb-6 flex ${isUser ? 'justify-end' : 'justify-start'} ${className || ''}`}>
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        {...motionProps}
      >
      <div className={`flex items-start gap-3 max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
          isUser 
            ? 'bg-gradient-to-br from-blue-500 to-purple-600' 
            : 'bg-gradient-to-br from-purple-500 to-blue-600'
        }`}>
          {isUser ? (
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          ) : (
            <span className="text-white font-bold text-sm">C</span>
          )}
        </div>
        
        {/* Message bubble */}
        <div
          className={`px-4 py-3 rounded-2xl backdrop-blur-sm border transition-all duration-200 ${
            isUser
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-transparent shadow-lg shadow-blue-500/20'
              : 'bg-white/10 text-white border-white/20 hover:bg-white/15'
          }`}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{text}</p>
        </div>
      </div>
      </motion.div>
    </div>
  );
}