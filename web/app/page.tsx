'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import ChatBubble from './components/ChatBubble';
import MicButton from './components/MicButton';
import TypingDots from './components/TypingDots';
import VoiceControls from './components/VoiceControls';
import { speakQueued } from './lib/tts';
import { detectLang2 } from './lib/lang';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

interface Msg { role: 'system'|'user'|'assistant'; content: string }

export default function Page() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'system', content: "You are a helpful assistant. Always reply in the same language as the user's last message." }
  ]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [voice, setVoice] = useState(true);
  const [showVoiceControls, setShowVoiceControls] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { scrollRef.current?.scrollTo({ top: 999999, behavior: 'smooth' }); }, [messages, streaming]);

  const speak = async (text: string) => {
    if (!voice) return;
    if (typeof window === 'undefined') return;
    
    // Fallback to browser's built-in speech synthesis
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'es-ES';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };

  const send = async (prompt: string) => {
    if (!prompt.trim() || streaming) return;
    
    const userLang = detectLang2(prompt);
    const turnRule = {
      role: 'system' as const,
      content: `For this turn, reply strictly in ${userLang === 'es' ? 'Spanish' : 'English'}.`
    };

    // Evitar acumular muchos system anteriores:
    const dialogue = messages.filter(m => m.role !== 'system');
    const nextMsgs = [
      { role: 'system', content: "You are a helpful assistant. Always reply in the same language as the user's last message." },
      turnRule,
      ...dialogue,
      { role: 'user', content: prompt.trim() }
    ];
    
    // Actualiza UI local (user + placeholder assistant)
    setMessages(m => [...m, { role: 'user', content: prompt.trim() }]);
    setInput('');

    // Optimistically append an empty assistant msg we will fill while streaming
    setMessages(m => [...m, { role: 'assistant', content: '' }]);
    setStreaming(true);

    try {
      const res = await fetch(`${API_BASE}/api/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMsgs })
      });
      const reader = res.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      let acc = '';
      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        acc += chunk;
        setMessages(curr => {
          const copy = [...curr];
          // last message is the assistant placeholder
          copy[copy.length - 1] = { role: 'assistant', content: acc };
          return copy;
        });
      }
      // TTS en el idioma detectado (solo al terminar el streaming)
      if (voice && acc.trim()) {
        const refB64 = localStorage.getItem("COQUI_SPK_REF_B64") || undefined;
        const langForTTS = detectLang2(prompt); // idioma del usuario en este turno
        const rate = Number(localStorage.getItem("COQUI_RATE") || 1.35);
        try {
          await speakQueued(acc, { language: langForTTS, speakerWavB64: refB64, rate });
        } catch (error) {
          console.error('Coqui TTS Error, falling back to browser speech:', error);
          await speak(acc);
        }
      }
    } catch (e) {
      setMessages(m => [...m, { role: 'assistant', content: 'Ocurrió un error al conectar con el servidor.' }]);
    } finally {
      setStreaming(false);
    }
  };

  return (
    <main className="bg-animated min-h-screen flex items-center justify-center">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl mx-auto p-4">
        <header className="flex items-center justify-between mb-4">
          <div className="inline-flex items-center gap-2">
            <Image src="/icon.svg" alt="icon" width={24} height={24} className="w-6 h-6" />
            <h1 className="text-lg font-semibold">Gemma3 Voice Chat</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowVoiceControls(!showVoiceControls)}
              className="text-sm px-3 py-1 rounded-md bg-purple-600 hover:bg-purple-700 text-white transition-colors"
            >
              🎛️ TTS Controls
            </button>
            <label className="text-sm inline-flex items-center gap-2 select-none">
              <input type="checkbox" checked={voice} onChange={e => setVoice(e.target.checked)} /> Voz
            </label>
          </div>
        </header>

        <AnimatePresence>
          {showVoiceControls && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ marginBottom: '1rem' }}
            >
              <VoiceControls
                onTextToSpeech={(text) => console.log('TTS Test:', text)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={scrollRef} className="h-[70vh] overflow-y-auto rounded-2xl p-4 border border-white/10 bg-black/30">
          {messages.filter(m => m.role !== 'system').map((m, i) => (
            <ChatBubble key={i} role={m.role as any} text={m.content} />
          ))}
          {streaming && (
            <div className="mb-3 opacity-80"><TypingDots /></div>
          )}
        </div>

        <form onSubmit={e => { e.preventDefault(); send(input); }} className="mt-4 flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Escribe o usa el micrófono…"
            className="flex-1 h-11 px-4 rounded-xl bg-white/10 border border-white/20 outline-none focus:bg-white/15"
          />
          <button type="submit" className="h-11 px-5 rounded-xl bg-blue-600 hover:bg-blue-500">Enviar</button>
          <MicButton onTranscript={(t) => setInput(t)} />
        </form>

        <div className="mt-3 space-y-1">
          <p className="text-xs text-white/50">Consejo: asegúrate de tener <code>ollama serve</code> corriendo y el modelo <code>gemma3:4b</code> descargado.</p>
          <p className="text-xs text-white/40">🎤 TTS: Usa los controles de voz para personalizar la síntesis de texto a voz con mejor calidad.</p>
        </div>
      </motion.div>
    </main>
  );
}