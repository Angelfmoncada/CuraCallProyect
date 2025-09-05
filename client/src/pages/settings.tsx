import { motion } from "framer-motion";
import { useSettings } from "@/store/settings";
import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Waves, Leaf, Sunset, Moon, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { UniversalChatInterface } from "@/components/UniversalChatInterface";
import { useFloatingChatWidget } from "@/components/FloatingChatWidget";
import { useVoiceShortcuts } from "@/hooks/useVoiceShortcuts";

const themes = [
  { id: "dark-ocean" as const, name: "Dark Ocean", icon: Waves, gradient: "from-slate-900 to-blue-900" },
  { id: "ocean-breeze" as const, name: "Ocean Breeze", icon: Waves, gradient: "from-sky-600 to-blue-600" },
  { id: "seagrass" as const, name: "Seagrass", icon: Leaf, gradient: "from-emerald-600 to-green-600" },
  { id: "sunset" as const, name: "Sunset", icon: Sunset, gradient: "from-orange-600 to-pink-600" },
  { id: "midnight" as const, name: "Midnight", icon: Moon, gradient: "from-purple-900 to-purple-600" },
];

export default function Settings() {
  const { settings, updateSettings, clearAllData } = useSettings();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  
  // Chat flotante
  const {
    isVisible: isChatVisible,
    mode: chatMode,
    showChat,
    hideChat,
    toggleChat,
    switchMode,
    setMode,
    FloatingChatWidget
  } = useFloatingChatWidget();
  
  // Atajos de teclado
  useVoiceShortcuts({
    onVoiceActivate: () => {
      setMode('voice');
      showChat();
    },
    onChatActivate: () => {
      setMode('chat');
      showChat();
    },
    onToggleMode: () => {
      if (isChatVisible) {
        switchMode(chatMode === 'voice' ? 'chat' : 'voice');
      } else {
        showChat();
      }
    },
    onToggleWidget: toggleChat
  });

  const handleVoiceSpeedChange = (value: number[]) => {
    updateSettings({ voiceSpeed: value[0].toString() });
  };

  const handleClearData = () => {
    clearAllData();
    toast({
      title: "Data Cleared",
      description: "All conversations and settings have been reset.",
    });
  };

  return (
    <div className="container mx-auto max-w-2xl px-6 py-8">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-semibold mb-6"
      >
        Settings
      </motion.h1>
      
      <div className="space-y-6">
        {/* Themes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6"
        >
          <h3 className="font-medium mb-4">Themes</h3>
          <div className="space-y-3">
            {themes.map((themeOption) => {
              return (
                <Button
                  key={themeOption.id}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors",
                    theme === themeOption.id && "bg-white/10"
                  )}
                  onClick={() => setTheme(themeOption.id)}
                  data-testid={`button-theme-${themeOption.id}`}
                >
                  <div className={cn("w-4 h-4 rounded-full bg-gradient-to-r", themeOption.gradient)} />
                  <span>{themeOption.name}</span>
                </Button>
              );
            })}
          </div>
        </motion.div>

        {/* Voice Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-6"
        >
          <h3 className="font-medium mb-4">Voice Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Voice Speed</label>
              <div className="w-32">
                <Slider
                  value={[parseFloat(settings.voiceSpeed)]}
                  onValueChange={handleVoiceSpeedChange}
                  min={0.5}
                  max={2}
                  step={0.1}
                  data-testid="slider-voice-speed"
                />
                <div className="text-xs text-muted-foreground mt-1 text-center">
                  {settings.voiceSpeed}x
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Auto-play Responses</label>
              <Switch
                checked={settings.autoPlay}
                onCheckedChange={(checked) => updateSettings({ autoPlay: checked })}
                data-testid="switch-autoplay"
              />
            </div>
          </div>
        </motion.div>

        {/* AI Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-6"
        >
          <h3 className="font-medium mb-4">AI Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">AI Model</label>
              <Select
                value={settings.aiModel}
                onValueChange={(value) => updateSettings({ aiModel: value })}
              >
                <SelectTrigger className="w-64" data-testid="select-ai-model">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="llama3.1:8b">Llama 3.1 8B (Local)</SelectItem>
                  <SelectItem value="deepseek/deepseek-chat-v3-0324:free">DeepSeek Chat v3 (Cloud)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-xs text-muted-foreground">
              {settings.aiModel === 'llama3.1:8b' ? (
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Modelo local - Procesamiento privado y rápido
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Modelo en la nube - Requiere conexión a internet
                </span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Response Length</label>
              <Select
                value={settings.responseLength}
                onValueChange={(value) => updateSettings({ responseLength: value })}
              >
                <SelectTrigger className="w-32" data-testid="select-response-length">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="concise">Concise</SelectItem>
                  <SelectItem value="balanced">Balanced</SelectItem>
                  <SelectItem value="detailed">Detailed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </motion.div>

        {/* Privacy Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-6"
        >
          <h3 className="font-medium mb-4">Privacy</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Save Conversations</label>
              <Switch
                checked={settings.saveConversations}
                onCheckedChange={(checked) => updateSettings({ saveConversations: checked })}
                data-testid="switch-save-conversations"
              />
            </div>
            <div className="pt-2">
              <Button
                variant="destructive"
                onClick={handleClearData}
                className="text-sm"
                data-testid="button-clear-data"
              >
                Clear All Data
              </Button>
            </div>
          </div>
        </motion.div>
        
        {/* Sección de Asistente */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-2xl p-6"
        >
          <h3 className="font-medium mb-4">CuraCall Assistant</h3>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Accede al asistente de IA desde cualquier pantalla usando los atajos de teclado:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex justify-between items-center p-2 bg-muted/50 rounded-lg">
                <span>Modo Voz:</span>
                <kbd className="px-2 py-1 bg-background rounded border text-xs">Ctrl+Shift+V</kbd>
              </div>
              <div className="flex justify-between items-center p-2 bg-muted/50 rounded-lg">
                <span>Modo Chat:</span>
                <kbd className="px-2 py-1 bg-background rounded border text-xs">Ctrl+Shift+C</kbd>
              </div>
              <div className="flex justify-between items-center p-2 bg-muted/50 rounded-lg">
                <span>Alternar Modo:</span>
                <kbd className="px-2 py-1 bg-background rounded border text-xs">Ctrl+Shift+T</kbd>
              </div>
              <div className="flex justify-between items-center p-2 bg-muted/50 rounded-lg">
                <span>Mostrar/Ocultar:</span>
                <kbd className="px-2 py-1 bg-background rounded border text-xs">Ctrl+Shift+A</kbd>
              </div>
            </div>
            <Button
              onClick={showChat}
              className="w-full"
              variant="outline"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Abrir Asistente
            </Button>
          </div>
        </motion.div>
      </div>
      
      {/* Botón flotante para activar chat */}
      <motion.div
        className="fixed bottom-6 right-6 z-40"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Button
          size="icon"
          onClick={toggleChat}
          className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300"
          title="Abrir CuraCall Assistant (Ctrl+Shift+A)"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      </motion.div>
      
      {/* Widget flotante de chat */}
      <FloatingChatWidget defaultMode="chat" />
    </div>
  );
}
