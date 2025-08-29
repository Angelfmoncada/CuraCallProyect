import { useState, useEffect } from "react";
import type { Settings } from "@shared/schema";

const STORAGE_KEY = 'curacall-settings';

const defaultSettings: Omit<Settings, 'id'> = {
  theme: 'dark-ocean',
  voiceSpeed: '1',
  autoPlay: true,
  saveConversations: true,
  // Usar Llama 3.1 8B local por defecto
  aiModel: 'llama3.1:8b',
  responseLength: 'balanced',
};

function loadFromStorage(): Omit<Settings, 'id'> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Failed to load settings from storage:', error);
  }
  return defaultSettings;
}

function saveToStorage(settings: Omit<Settings, 'id'>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings to storage:', error);
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<Omit<Settings, 'id'>>(loadFromStorage);

  useEffect(() => {
    saveToStorage(settings);
  }, [settings]);

  const updateSettings = (updates: Partial<Omit<Settings, 'id'>>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  const clearAllData = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('curacall-history');
    localStorage.removeItem('curacall-theme');
    resetSettings();
  };

  return {
    settings,
    updateSettings,
    resetSettings,
    clearAllData,
  };
}
