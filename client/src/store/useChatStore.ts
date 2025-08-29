import create from 'zustand';
import { streamChat, type HistoryMsg } from '@/lib/ai/streamChat';
import { speak, startListen } from '@/hooks/useSpeech';
import { useLocale, speechLangFor } from '@/store/locale';
import { useAudio } from '@/store/audio';
import { useSettings } from '@/store/settings';
import { toast } from '@/hooks/use-toast';

type ChatMessage = HistoryMsg;

export type Mode = 'voice' | 'chat';

export interface Conversation {
  id: string;
  title: string;
  mode: Mode;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: string | number;
}

interface ChatState {
  conversations: Conversation[];
  currentId?: string;
  messages: Record<string, Message[]>;
  mode: Mode;
  speaking: boolean;
  listening: boolean;
  thinking: boolean;
  ack?: string | null;
  actions: {
    setMode: (m: Mode) => void;
    load: (id: string) => Promise<void>;
    refreshConversations: () => Promise<void>;
    newConversation: (mode: Mode) => Promise<string>;
    send: (text: string) => Promise<void>;
    archive: (id: string, archived?: boolean) => Promise<void>;
    remove: (id: string) => Promise<void>;
    startListening: (onFinal: (t: string) => void, lang?: string) => Promise<() => void>;
    setAck: (message?: string | null) => void;
  };
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  currentId: undefined,
  messages: {},
  mode: 'voice',
  speaking: false,
  listening: false,
  thinking: false,
  ack: null,
  actions: {
    setMode: (m) => set({ mode: m }),
    async refreshConversations() {
      const res = await fetch('/api/conversations');
      let data: any = [];
      try {
        data = await res.json();
      } catch {
        data = [];
      }
      set({ conversations: data });
    },
    async newConversation(mode) {
      try {
        const res = await fetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode })
        });
        if (res.ok) {
          try {
            const conv: Conversation = await res.json();
            if (conv && conv.id) {
              set((s) => ({ conversations: [conv, ...s.conversations], currentId: conv.id }));
              return conv.id;
            }
          } catch (parseError) {
            console.warn('Error parsing conversation response:', parseError);
            // fall through to local fallback
          }
        } else {
          console.warn('Server returned non-OK status:', res.status, res.statusText);
        }
      } catch (networkError) {
        console.warn('Network error creating conversation:', networkError);
        // fall through to local fallback
      }
      
      // Fallback local conversation to keep UX smooth when API is unavailable
      const id = (globalThis as any).crypto?.randomUUID?.() || `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const conv: Conversation = {
        id,
        title: 'Nueva Conversación',
        mode,
        archived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      set((s) => ({ conversations: [conv, ...s.conversations], currentId: conv.id }));
      console.log('Usando conversación local:', id);
      return id;
    },
    async load(id) {
      const res = await fetch(`/api/messages/${id}`);
      let msgs: Message[] = [];
      try { msgs = await res.json(); } catch { msgs = []; }
      set((s) => ({ currentId: id, messages: { ...s.messages, [id]: msgs } }));
    },
    async send(text) {
      const state = get();
      let convId = state.currentId;
      if (!convId) {
        convId = await get().actions.newConversation(state.mode);
      }
      const userMsg: Message = { role: 'user', content: text, createdAt: Date.now() };
      set((s) => ({
        messages: {
          ...s.messages,
          [convId!]: [...(s.messages[convId!] || []), userMsg]
        }
      }));

      // Prepare history (last ~20)
      const history = (get().messages[convId!] || []).slice(-20) as ChatMessage[];
      const msgs: ChatMessage[] = [...history, { role: 'user', content: text }];

      // Voice-mode confirmation (ChatGPT-style ack)
      if (get().mode === 'voice') {
        const langCode = useLocale.getState().language;
        const ackMsg = langCode === 'es'
          ? '✓ Recibido. Preparando respuesta en voz...'
          : 'Got it. Preparing a spoken reply...';
        set({ ack: ackMsg });
      }

      set({ thinking: true });
      let partial = '';
      let firstDelta = true;
      
      const selectedModel = useSettings.getState().aiModel;
      
      const ctl = streamChat({
        prompt: text,
        history: history,
        model: selectedModel,
        onToken: (delta) => {
          if (firstDelta) {
            firstDelta = false;
            // Clear the ack once streaming begins
            set({ ack: null });
          }
          partial += delta;
          // Update last assistant message incrementally
          set((s) => {
            const list = [...(s.messages[convId!] || [])];
            const last = list[list.length - 1];
            if (!last || last.role !== 'assistant') {
              list.push({ role: 'assistant', content: delta });
            } else {
              last.content += delta;
            }
            return { messages: { ...s.messages, [convId!]: list } };
          });
        },
        onDone: (full) => {
          partial = full;
          // Speak at the end if in voice mode
          if (get().mode === 'voice' && partial.trim()) {
            const lang = speechLangFor(useLocale.getState().language);
            const volume = useAudio.getState().volume;
            speak(
              partial,
              () => set({ speaking: true }),
              () => set({ speaking: false }),
              { lang, volume }
            );
          }
          set({ thinking: false });
        },
        onError: (error) => {
          console.error('Chat error:', error);
          // Manejo específico de errores
          let errorTitle = 'Error de chat';
          let errorDescription = 'Fallo de conexión o respuesta inválida.';
          
          if (error.includes('500')) {
            errorTitle = 'Error del servidor';
            errorDescription = 'El servidor está experimentando problemas. Intenta de nuevo en unos momentos.';
          } else if (error.includes('network') || error.includes('fetch')) {
            errorTitle = 'Error de conexión';
            errorDescription = 'Verifica tu conexión a internet y que el servidor esté ejecutándose.';
          } else {
            errorDescription = error;
          }
          
          // Show error toast for users
          toast({
            title: errorTitle,
            description: errorDescription,
            variant: 'destructive'
          });
          set({ thinking: false, ack: null });
        }
      });
      
      ctl.start();
      await get().actions.refreshConversations();
    },
    async archive(id, archived = true) {
      await fetch(`/api/conversations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived })
      });
      await get().actions.refreshConversations();
    },
    async remove(id) {
      await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
      set((s) => ({
        conversations: s.conversations.filter((c) => c.id !== id),
        currentId: s.currentId === id ? undefined : s.currentId,
      }));
    },
    async startListening(onFinal, lang: string = 'en-US') {
      // Delegate to hook util (returns stop function)
      try {
        set({ listening: true });
        const stop = startListen((text: string) => {
          set({ listening: false });
          onFinal(text);
        }, lang);
        return stop;
      } catch (e) {
        set({ listening: false });
        const message = e instanceof Error ? e.message : 'Error al iniciar el reconocimiento de voz';
        toast({ title: 'Voz no disponible', description: message });
        throw e;
      }
    },
    setAck(message) { set({ ack: message ?? null }); },
  },
}));
