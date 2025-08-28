import { useState, useEffect, useCallback } from "react";
import { fetchWikipediaSummary } from "@/lib/wiki";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface WebLLMState {
  ready: boolean;
  loading: boolean;
  loadProgress: number;
  error: string | null;
}

// Mock WebLLM interface - in a real implementation, you would use @mlc-ai/web-llm
let webLLMInstance: any = null;

export function useWebLLM() {
  const [state, setState] = useState<WebLLMState>({
    ready: false,
    loading: false,
    loadProgress: 0,
    error: null,
  });

  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const checkWebGPUSupport = useCallback(async () => {
    if (typeof navigator === 'undefined') return false;
    
    try {
      // @ts-ignore - WebGPU might not be available in all browsers
      const adapter = await navigator.gpu?.requestAdapter();
      return !!adapter;
    } catch {
      return false;
    }
  }, []);

  const initializeWebLLM = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const hasWebGPU = await checkWebGPUSupport();
      
      if (hasWebGPU) {
        // Simulate WebLLM loading
        // In a real implementation, you would use:
        // const { MLCEngine } = await import("@mlc-ai/web-llm");
        // webLLMInstance = new MLCEngine();
        
        // Simulate progress
        for (let i = 0; i <= 100; i += 10) {
          setState(prev => ({ ...prev, loadProgress: i }));
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        // Mock successful initialization
        webLLMInstance = {
          chat: async (messages: ChatMessage[]) => {
            // Simulate AI response
            await new Promise(resolve => setTimeout(resolve, 1000));
            return "This is a simulated AI response using WebLLM. In a real implementation, this would use the actual model.";
          }
        };
        
        setState(prev => ({ 
          ...prev, 
          ready: true, 
          loading: false, 
          loadProgress: 100 
        }));
      } else {
        // Fallback mode - use Wikipedia
        setState(prev => ({ 
          ...prev, 
          ready: true, 
          loading: false, 
          loadProgress: 100,
          error: "WebGPU not available, using Wikipedia fallback"
        }));
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to initialize AI'
      }));
    }
  }, [checkWebGPUSupport]);

  const chat = useCallback(async (messages: ChatMessage[]): Promise<string> => {
    if (!state.ready) {
      throw new Error("AI not ready");
    }

    const controller = new AbortController();
    setAbortController(controller);

    try {
      if (webLLMInstance) {
        // Use WebLLM if available
        return await webLLMInstance.chat(messages);
      } else {
        // Fallback to Wikipedia
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.role === "user") {
          const summary = await fetchWikipediaSummary(lastMessage.content);
          return summary || "I couldn't find relevant information about that topic.";
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request was aborted');
      }
      throw error;
    } finally {
      setAbortController(null);
    }

    return "I'm sorry, I couldn't process your request at the moment.";
  }, [state.ready]);

  const abort = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
  }, [abortController]);

  useEffect(() => {
    initializeWebLLM();
  }, [initializeWebLLM]);

  return {
    ready: state.ready,
    loading: state.loading,
    loadProgress: state.loadProgress,
    error: state.error,
    chat,
    abort,
  };
}
