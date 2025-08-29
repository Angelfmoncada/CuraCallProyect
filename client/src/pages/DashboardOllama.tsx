import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain } from 'lucide-react';
import { VoiceOrb } from '@/components/VoiceOrb';
import { ModeToggle } from '@/components/ModeToggle';
import { QuickSettings } from '@/components/QuickSettings';
import { InputBar } from '@/components/chat/InputBar';
import { type Msg, useOllamaChat } from '@/hooks/useOllamaChat';
import { cn } from '@/lib/utils';
import { useAudio } from '@/store/audio';
import { useSpeech } from '@/hooks/useSpeech';

export default function DashboardOllama() {
  const [mode, setMode] = useState<'voice' | 'chat'>('voice');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const volume = useAudio((s) => s.volume);
  const setVolume = useAudio((s) => s.setVolume);
  const rate = useAudio((s) => s.rate);
  const setRate = useAudio((s) => s.setRate);
  const micEnabled = useAudio((s) => s.micEnabled);
  const toggleMic = useAudio((s) => s.toggleMic);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');

  const SYSTEM = 'Eres CuraCall Assistant. Responde en español, cálido, claro y breve. Si no sabes, dilo. Formatea listas con viñetas cuando ayude.';
  const { reply, ask, thinking } = useOllamaChat(SYSTEM);
  const { speak, start, speaking } = useSpeech();
  const [listening, setListening] = useState(false);
  const [ack, setAck] = useState<string | null>(null);
  const [history, setHistory] = useState<Msg[]>(() => {
    try { return JSON.parse(localStorage.getItem('curacall-ollama-thread') || '[]'); } catch { return []; }
  });
  const lastUser = [...history].reverse().find((m) => m.role === 'user');
  const lastAssistant = [...history].reverse().find((m) => m.role === 'assistant');

  function persist(newHistory: Msg[]) {
    setHistory(newHistory);
    try { localStorage.setItem('curacall-ollama-thread', JSON.stringify(newHistory)); } catch {}
  }

  async function handleVoice() {
    if (!micEnabled) return;
    setListening(true);
    const stop = await start(async (text: string) => {
      setListening(false);
      if (!text?.trim()) return;
      const newHistory = [...history, { role: 'user' as const, content: text }];
      persist(newHistory);
      setAck('✓ Recibido. Preparando respuesta en voz...');
      try {
        const final = (await ask(newHistory, text)).trim();
        setAck(null);
        if (final) {
          persist([...newHistory, { role: 'assistant' as const, content: final }]);
          speak(final, { volume, rate });
        }
      } catch (e) {
        setAck(null);
        console.error(e);
      }
    });
    return stop;
  }

  async function handleUserText(text: string) {
    if (!text.trim()) return;
    const newHistory = [...history, { role: 'user' as const, content: text }];
    persist(newHistory);
    setAck('✓ Recibido. Preparando respuesta...');
    try {
      const final = (await ask(newHistory, text)).trim();
      setAck(null);
      if (final) {
        persist([...newHistory, { role: 'assistant' as const, content: final }]);
      }
    } catch (e) {
      setAck(null);
      console.error(e);
    }
  }

  const handleVoiceInteraction = () => {
    if (listening || speaking || thinking) return;
    void handleVoice();
  };

  const lastUserInput = lastUser?.content || '';

  return (
    <div className="container mx-auto max-w-4xl px-6 py-8">
      <div className="relative mb-8">
        <div className="flex justify-center">
          <ModeToggle mode={mode} onModeChange={setMode} />
        </div>
        <div className="absolute top-0 right-0">
          <QuickSettings
            isOpen={settingsOpen}
            onToggle={() => setSettingsOpen(!settingsOpen)}
            volume={volume}
            onVolumeChange={setVolume}
            rate={rate}
            onRateChange={setRate}
            micEnabled={micEnabled}
            onMicToggle={toggleMic}
            theme={theme}
            onThemeChange={setTheme}
          />
        </div>
      </div>

      {mode === 'voice' ? (
        <div className="text-center">
          <motion.h1 className="text-4xl font-light mb-4" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            {'Hola, soy CuraCall'}
          </motion.h1>
          <motion.p className="text-xl text-muted-foreground mb-8" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            {'Tu asistente de salud personal'}
          </motion.p>

          <div className="flex justify-center mb-8">
            <div className="relative">
              <div onClick={handleVoiceInteraction} className={cn('cursor-pointer transition-all duration-300', (thinking || speaking) && 'cursor-not-allowed opacity-50')}>
                <VoiceOrb listening={listening} thinking={thinking} speaking={speaking} />
              </div>
              <motion.div className="mt-6 text-center space-y-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <p className="text-lg font-medium text-foreground">
                  {listening ? 'Escuchando...' : thinking ? (ack || 'Pensando...') : speaking ? 'Hablando...' : 'Toca el orbe para comenzar'}
                </p>
              </motion.div>
            </div>
          </div>

          <AnimatePresence>
            {lastUserInput && (
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="max-w-3xl mx-auto mt-12 space-y-6">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-foreground/80 mb-2">Última conversación</h3>
                  <div className="w-16 h-0.5 bg-gradient-to-r from-primary/50 to-accent/50 mx-auto rounded-full" />
                </div>
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-300" />
                      <div className="relative bg-primary text-primary-foreground px-6 py-3 rounded-xl max-w-md shadow-lg">
                        <p className="text-sm leading-relaxed">{lastUserInput}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-muted/20 to-accent/10 rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-300" />
                      <div className="relative bg-card border border-border/50 text-card-foreground px-6 py-3 rounded-xl max-w-md shadow-lg backdrop-blur-sm">
                        <div className="flex items-start gap-2">
                          <Brain className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            {thinking ? <p className="text-sm text-muted-foreground">{reply || 'Pensando...'}</p> : <p className="text-sm leading-relaxed">{lastAssistant?.content || ''}</p>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto mb-16">
          <InputBar 
            onSendMessage={handleUserText} 
            disabled={thinking} 
            placeholder={'Escribe tu mensaje...'} 
            currentLanguage={'es'}
            suggestions={['¿Cómo puedes ayudarme?','Explícame este concepto','¿Cuáles son mis opciones?','Dame un ejemplo']}
          />
        </motion.div>
      )}
    </div>
  );
}

