'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import ChatBubble from './components/ChatBubble';
import MicButton from './components/MicButton';
import TypingDots from './components/TypingDots';
import VoiceControls from './components/VoiceControls';
import VoiceSelector from './components/ui/VoiceSelector';
import TTSControls from './components/ui/TTSControls';
import { UIProvider, useUI } from './components/ui-shell/UIProvider';
import AutoReadAssistant, { ChatMessage } from './components/ui/AutoReadAssistant';
import { useTTS } from './hooks/useTTS';
import { speakQueued } from './lib/tts';

// Cargar VoiceOrbThreePro solo en el cliente para evitar problemas de SSR
const VoiceOrb = dynamic(() => import('./components/VoiceOrb'), {
  ssr: false,
  loading: () => <div className="w-80 h-80 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full animate-pulse" />
});
import { detectLang2 } from './lib/lang';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

function PageContent() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      id: 'system-1', 
      role: 'assistant' as const,
      content: "Hello, I am Curacall, your AI assistant for medical care and any other questions you may have. I'm glad to help you.",
      done: true,
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [showVoiceControls, setShowVoiceControls] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // TTS Hook integration
  const { speak: ttsSpeak, isSupported, isLoading, error } = useTTS();
  
  // UI Context for voice mode
  const { voiceMode, setVoiceMode } = useUI();
  
  // Sync local voice state with UI context
  const [voice, setVoice] = useState(voiceMode);

  // Sync local voice state with context changes
  useEffect(() => {
    setVoice(voiceMode);
  }, [voiceMode]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: 999999, behavior: 'smooth' }); }, [messages, streaming]);

  // Check if we're in demo mode
  useEffect(() => {
    const checkDemoMode = () => {
      const isBackendAvailable = API_BASE.includes('localhost') || API_BASE.includes('127.0.0.1') || process.env.NEXT_PUBLIC_API_BASE_URL;
      setIsDemoMode(!isBackendAvailable || API_BASE.includes('localhost'));
    };
    checkDemoMode();
  }, []);

  const speak = async (text: string) => {
    if (!voice || !text?.trim()) return;
    if (typeof window === 'undefined') return;
    
    // Clean and prepare text for optimal reading
    const cleanText = text
      .replace(/\n+/g, '. ') // Replace line breaks with periods for natural pauses
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/([.!?])\s*([.!?])/g, '$1 ') // Clean up multiple punctuation
      .trim();
    
    if (!cleanText) return;
    
    // Use new TTS hook if supported, otherwise fallback
    if (isSupported && !isLoading) {
      try {
        await ttsSpeak(cleanText);
        return;
      } catch (error) {
        console.error('TTS Hook Error, using fallback:', error);
      }
    }
    
    // Enhanced fallback with better text handling for complete reading
    try {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      // Wait a moment to ensure cancellation is processed
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Split long text into manageable chunks for better pronunciation
      const maxChunkLength = 200; // Optimal chunk size for clarity
      const sentences = cleanText.split(/([.!?]+\s*)/).filter(s => s.trim());
      
      let currentChunk = '';
      const chunks: string[] = [];
      
      for (const sentence of sentences) {
        if (currentChunk.length + sentence.length <= maxChunkLength) {
          currentChunk += sentence;
        } else {
          if (currentChunk.trim()) chunks.push(currentChunk.trim());
          currentChunk = sentence;
        }
      }
      if (currentChunk.trim()) chunks.push(currentChunk.trim());
      
      // If text is short enough, speak it all at once
      if (chunks.length <= 1) {
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'es-ES';
        utterance.rate = 0.9; // Slightly slower for clarity
        utterance.pitch = 1.0;
        utterance.volume = 0.95;
        
        return new Promise<void>((resolve, reject) => {
          utterance.onend = () => resolve();
          utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event);
            reject(event);
          };
          window.speechSynthesis.speak(utterance);
        });
      }
      
      // For longer text, speak in chunks with natural pauses
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        if (!chunk.trim()) continue;
        
        await new Promise<void>((resolve, reject) => {
          const utterance = new SpeechSynthesisUtterance(chunk);
          utterance.lang = 'es-ES';
          utterance.rate = 0.9; // Consistent rate for all chunks
          utterance.pitch = 1.0;
          utterance.volume = 0.95;
          
          utterance.onend = () => {
            // Add a small pause between chunks for natural flow
            setTimeout(resolve, i < chunks.length - 1 ? 300 : 0);
          };
          
          utterance.onerror = (event) => {
            console.error('Speech synthesis error in chunk:', event);
            reject(event);
          };
          
          window.speechSynthesis.speak(utterance);
        });
        
        // Check if speech was cancelled during chunk processing
        if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
          break;
        }
      }
    } catch (error) {
      console.error('Enhanced speech synthesis error:', error);
      // Final fallback - simple speech
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'es-ES';
      window.speechSynthesis.speak(utterance);
    }
  };

  const send = async (prompt: string) => {
    if (!prompt.trim() || streaming) return;
    
    const userLang = detectLang2(prompt);
    const turnRule = {
      role: 'system' as const,
      content: `For this turn, reply strictly in ${userLang === 'es' ? 'Spanish' : 'English'}.`
    };

    // Evitar acumular muchos system anteriores:
    const dialogue = messages.filter(m => m.role === 'user' || m.role === 'assistant');
    const nextMsgs = [
      { role: 'system', content: "Hello, I am Curacall, your AI assistant for medical care and any other questions you may have. I'm glad to help you." },
      turnRule,
      ...dialogue.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: prompt.trim() }
    ];
    
    const userMessageId = `user-${Date.now()}`;
    const assistantMessageId = `assistant-${Date.now() + 1}`;
    
    // Actualiza UI local (user + placeholder assistant)
    setMessages(m => [...m, { 
      id: userMessageId,
      role: 'user', 
      content: prompt.trim(),
      done: true,
      timestamp: Date.now()
    }]);
    setInput('');

    // Optimistically append an empty assistant msg we will fill while streaming
    setMessages(m => [...m, { 
      id: assistantMessageId,
      role: 'assistant', 
      content: '',
      done: false,
      timestamp: Date.now()
    }]);
    setStreaming(true);

    try {
      // Check if backend is available, if not use demo mode
      const isBackendAvailable = API_BASE.includes('localhost') || API_BASE.includes('127.0.0.1') || process.env.NEXT_PUBLIC_API_BASE_URL;
      
      if (!isBackendAvailable || API_BASE.includes('localhost')) {
        // Demo mode - simulate AI response
        const demoResponses = [
          "¡Hola! Soy CuraCall AI, tu asistente de salud virtual. Actualmente estoy en modo demostración. Para una experiencia completa, necesitarías conectar el backend.",
          "En modo completo, puedo ayudarte con consultas médicas, análisis de síntomas y recomendaciones de salud personalizadas.",
          "Esta es una respuesta de demostración. El sistema completo incluye procesamiento de voz, análisis de IA y síntesis de voz.",
          "CuraCall AI está diseñado para proporcionar asistencia médica inteligente. Esta demo muestra la interfaz de usuario."
        ];
        
        const demoResponse = demoResponses[Math.floor(Math.random() * demoResponses.length)];
        
        // Simulate streaming response
        let charIndex = 0;
        const streamDemo = () => {
          if (charIndex < demoResponse.length) {
            setMessages(curr => {
              const copy = [...curr];
              copy[copy.length - 1] = {
                id: assistantMessageId,
                role: 'assistant' as const,
                content: demoResponse.substring(0, charIndex + 1)
              };
              return copy;
            });
            charIndex++;
            setTimeout(streamDemo, 50); // Simulate typing speed
          } else {
            setStreaming(false);
          }
        };
        
        setTimeout(streamDemo, 500); // Initial delay
        return;
      }
      
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
          copy[copy.length - 1] = { 
            ...copy[copy.length - 1],
            content: acc,
            done: false // Still streaming
          };
          return copy;
        });
      }
      
      // Mark message as done when streaming finishes
      setMessages(curr => {
        const copy = [...curr];
        if (copy.length > 0 && copy[copy.length - 1].role === 'assistant') {
          copy[copy.length - 1] = {
            ...copy[copy.length - 1],
            done: true // Streaming finished
          };
        }
        return copy;
      });
      
      // TTS en el idioma detectado (solo al terminar el streaming)
      if (voice && acc.trim()) {
        const refB64 = localStorage.getItem("COQUI_SPK_REF_B64") || undefined;
        const langForTTS = detectLang2(prompt); // idioma del usuario en este turno
        const rate = Number(localStorage.getItem("COQUI_RATE") || 1.35);
        try {
          // Intentar primero con Coqui TTS (servidor)
          await speakQueued(acc, { language: langForTTS, speakerWavB64: refB64, rate });
        } catch (error) {
          console.error('Coqui TTS Error, using enhanced browser speech:', error);
          // Usar la función speak mejorada que lee todo el texto completo
          await speak(acc);
        }
      } else if (acc.trim()) {
        // Si voice está deshabilitado pero hay texto, usar la función speak mejorada
        await speak(acc);
      }
    } catch (e) {
      const errorMessageId = `error-${Date.now()}`;
      setMessages(m => [...m, { 
        id: errorMessageId,
        role: 'assistant', 
        content: 'Ocurrió un error al conectar con el servidor.',
        done: true,
        timestamp: Date.now()
      }]);
    } finally {
      setStreaming(false);
    }
  };

  return (
    <main className="bg-animated min-h-screen flex items-center justify-center">
        <AutoReadAssistant 
          messages={messages} 
          enabled={voice} 
          voiceGender="female" 
        />
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          style={{ width: '100%', maxWidth: '48rem', margin: '0 auto', padding: '1rem' }}>
        <header className="flex items-center justify-between mb-8">
          <div className="inline-flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
              C
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Curacall AI</h1>
              <p className="text-sm text-gray-400">Intelligent Voice Assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowVoiceControls(!showVoiceControls)}
              className="text-sm px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all duration-200 border border-white/20 backdrop-blur-sm flex items-center gap-2"
            >
              🎤 Voice Settings
            </button>
            <label className="text-sm inline-flex items-center gap-2 select-none px-3 py-2 rounded-lg bg-white/10 border border-white/20 backdrop-blur-sm">
              <input 
                type="checkbox" 
                checked={voice} 
                onChange={e => {
                  const newVoiceMode = e.target.checked;
                  setVoice(newVoiceMode);
                  setVoiceMode(newVoiceMode);
                }}
                className="w-4 h-4 text-purple-600 bg-transparent border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
              /> 
              <span className="text-white">Voice Mode</span>
            </label>
          </div>
        </header>

        {/* Demo Mode Banner */}
        {isDemoMode && (
          <div className="mb-6 p-4 rounded-lg bg-amber-500/20 border border-amber-500/30 backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-white text-sm font-bold">
                ⚠️
              </div>
              <div>
                <h3 className="text-amber-200 font-medium">Modo Demostración</h3>
                <p className="text-amber-100/80 text-sm">
                  La aplicación está funcionando en modo demo. Para la experiencia completa con IA y síntesis de voz, 
                  necesitas configurar el backend en producción.
                </p>
              </div>
            </div>
          </div>
        )}

        <AnimatePresence>
          {showVoiceControls && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                marginBottom: '1rem',
                padding: '1rem',
                borderRadius: '1rem',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderWidth: '1px',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(4px)'
              }}
            >
              <div className="space-y-4">
                <div>
                  <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                    🎵 Voice Selection
                  </h3>
                  <VoiceSelector />
                </div>
                
                <div>
                  <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                    🎛️ TTS Controls
                  </h3>
                  <TTSControls />
                </div>
                
                <div>
                  <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                    ⚙️ Advanced Settings
                  </h3>
                  <VoiceControls
                    onTextToSpeech={(text) => ttsSpeak(text)}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={scrollRef} className="h-[65vh] overflow-y-auto rounded-2xl p-6 border border-white/10 bg-black/20 backdrop-blur-sm">
          {messages.filter(m => m.role === 'user' || m.role === 'assistant').length === 0 ? (
            <div className="flex items-center justify-center h-full text-center">
              <div className="max-w-md">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Welcome to Curacall AI</h3>
                <p className="text-gray-400 text-sm">Start a conversation by typing a message or using the microphone button below.</p>
              </div>
            </div>
          ) : (
            <>
              {messages.filter(m => m.role === 'user' || m.role === 'assistant').map((m, i) => (
                <ChatBubble key={i} role={m.role as any} text={m.content} />
              ))}
              {streaming && (
                <div className="mb-3 opacity-80"><TypingDots /></div>
              )}
            </>
          )}
        </div>

        <form onSubmit={e => { e.preventDefault(); send(input); }} className="mt-6 relative">
          <div className="relative flex items-center">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type your message or use the microphone..."
              className="w-full h-14 pl-6 pr-24 rounded-2xl bg-white/10 border border-white/20 outline-none focus:bg-white/15 focus:border-purple-500/50 transition-all duration-200 backdrop-blur-sm text-white placeholder-gray-400"
              disabled={streaming}
            />
            <div className="absolute right-3 flex items-center gap-2">
              <button 
                type="submit" 
                disabled={!input.trim() || streaming}
                className="p-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
              <MicButton 
                onTranscript={(transcript) => {
                  // Limpiar y establecer la transcripción final
                  const cleanTranscript = transcript.trim();
                  if (cleanTranscript) {
                    setInput(cleanTranscript);
                  }
                }}
                onInterimTranscript={(interimText) => {
                  // Mostrar transcripción en tiempo real (opcional)
                  console.log('Transcripción intermedia:', interimText);
                }}
                language="es-ES"
                continuous={false}
                interimResults={true}
                disabled={streaming}
              />
            </div>
          </div>
        </form>

        {/* Voice Orb Component - Positioned below chat input */}
        {voiceMode && (
          <AnimatePresence>
            <motion.div 
              style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <VoiceOrb
                size={120}
                unit="px"
                speed={1.2}
                opacity={0.85}
                maxPulseScale={1.1}
                label="AI Voice Assistant"
                micReactive={true}
                showLabel={voice}
              />
            </motion.div>
          </AnimatePresence>
        )}


        </motion.div>
      </main>
  );
}

export default function Page() {
  return (
    <UIProvider>
      <PageContent />
    </UIProvider>
  );
}