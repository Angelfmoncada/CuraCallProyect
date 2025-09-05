'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface UIContextType {
  voiceMode: boolean;
  voiceURI: string;
  setVoiceMode: (enabled: boolean) => void;
  setVoiceURI: (uri: string) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

interface UIProviderProps {
  children: ReactNode;
}

export function UIProvider({ children }: UIProviderProps) {
  const [voiceMode, setVoiceModeState] = useState(false);
  const [voiceURI, setVoiceURIState] = useState('');

  useEffect(() => {
    // Initialize voiceMode from localStorage
    const savedVoiceMode = localStorage.getItem('voiceMode') === 'true';
    setVoiceModeState(savedVoiceMode);
    
    // Initialize voiceURI from localStorage
    const savedVoiceURI = localStorage.getItem('voiceURI') || '';
    setVoiceURIState(savedVoiceURI);
  }, []);

  const setVoiceMode = (enabled: boolean) => {
    setVoiceModeState(enabled);
    localStorage.setItem('voiceMode', enabled.toString());
  };

  const setVoiceURI = (uri: string) => {
    setVoiceURIState(uri);
    localStorage.setItem('voiceURI', uri);
  };

  const value: UIContextType = {
    voiceMode,
    voiceURI,
    setVoiceMode,
    setVoiceURI,
  };

  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI(): UIContextType {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}