import { useState, useEffect } from "react";
import type { Conversation, Message } from "@shared/schema";

interface HistoryState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
}

const STORAGE_KEY = 'curacall-history';

function loadFromStorage(): HistoryState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load history from storage:', error);
  }
  return { conversations: [], currentConversation: null };
}

function saveToStorage(state: HistoryState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save history to storage:', error);
  }
}

export function useHistory() {
  const [state, setState] = useState<HistoryState>(loadFromStorage);

  useEffect(() => {
    saveToStorage(state);
  }, [state]);

  const addConversation = (title: string, messages: Message[]): string => {
    const newConversation: Conversation = {
      id: crypto.randomUUID(),
      title,
      messages: messages as any, // Type assertion for JSON compatibility
      archived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setState(prev => ({
      ...prev,
      conversations: [newConversation, ...prev.conversations],
      currentConversation: newConversation,
    }));

    return newConversation.id;
  };

  const updateConversation = (id: string, messages: Message[]) => {
    setState(prev => ({
      ...prev,
      conversations: prev.conversations.map(conv =>
        conv.id === id
          ? { ...conv, messages: messages as any, updatedAt: new Date() }
          : conv
      ),
      currentConversation: prev.currentConversation?.id === id
        ? { ...prev.currentConversation, messages: messages as any, updatedAt: new Date() }
        : prev.currentConversation,
    }));
  };

  const deleteConversation = (id: string) => {
    setState(prev => ({
      ...prev,
      conversations: prev.conversations.filter(conv => conv.id !== id),
      currentConversation: prev.currentConversation?.id === id ? null : prev.currentConversation,
    }));
  };

  const archiveConversation = (id: string) => {
    setState(prev => ({
      ...prev,
      conversations: prev.conversations.map(conv =>
        conv.id === id ? { ...conv, archived: true } : conv
      ),
    }));
  };

  const setCurrentConversation = (id: string | null) => {
    if (id === null) {
      setState(prev => ({ ...prev, currentConversation: null }));
      return;
    }

    const conversation = state.conversations.find(conv => conv.id === id);
    if (conversation) {
      setState(prev => ({ ...prev, currentConversation: conversation }));
    }
  };

  const clearHistory = () => {
    setState({ conversations: [], currentConversation: null });
  };

  return {
    conversations: state.conversations,
    currentConversation: state.currentConversation,
    addConversation,
    updateConversation,
    deleteConversation,
    archiveConversation,
    setCurrentConversation,
    clearHistory,
  };
}
