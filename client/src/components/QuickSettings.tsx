import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Volume2, VolumeX, Mic, MicOff, Palette, Monitor, Brain } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { useSettings } from '@/store/settings';

interface QuickSettingsProps {
  isOpen: boolean;
  onToggle: () => void;
  volume: number;
  onVolumeChange: (value: number) => void;
  rate?: number;
  onRateChange?: (value: number) => void;
  micEnabled: boolean;
  onMicToggle: () => void;
  theme: 'light' | 'dark' | 'system';
  onThemeChange: (theme: 'light' | 'dark' | 'system') => void;
}

export function QuickSettings({
  isOpen,
  onToggle,
  volume,
  onVolumeChange,
  rate = 1.0,
  onRateChange,
  micEnabled,
  onMicToggle,
  theme,
  onThemeChange
}: QuickSettingsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { aiModel } = useSettings();

  return (
    <div className="fixed top-4 right-4 z-50">
      {/* Botón de ajustes */}
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          variant="outline"
          size="icon"
          onClick={onToggle}
          className="rounded-full bg-background/80 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
            <Settings className="h-5 w-5" />
          </motion.div>
        </Button>
      </motion.div>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute top-14 right-0 w-80"
          >
            <Card className="bg-background/95 backdrop-blur-sm border-border/50 shadow-2xl">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">Configuración Rápida</h3>
                  <Badge variant="secondary" className="text-xs">Beta</Badge>
                </div>

                {/* Volumen */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {volume === 0 ? (
                        <VolumeX className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Volume2 className="h-4 w-4 text-foreground" />
                      )}
                      <span className="text-sm font-medium">Volumen</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{Math.round(volume * 100)}%</span>
                  </div>
                  <Slider
                    value={[volume]}
                    onValueChange={(value) => onVolumeChange(value[0])}
                    max={1}
                    min={0}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                {/* Velocidad de voz */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Velocidad de voz</span>
                    <span className="text-xs text-muted-foreground">{rate.toFixed(2)}x</span>
                  </div>
                  <Slider
                    value={[rate]}
                    onValueChange={(value) => onRateChange?.(value[0])}
                    max={1.5}
                    min={0.7}
                    step={0.05}
                    className="w-full"
                  />
                </div>

                {/* Micrófono */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {micEnabled ? (
                      <Mic className="h-4 w-4 text-green-500" />
                    ) : (
                      <MicOff className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm font-medium">Micrófono</span>
                  </div>
                  <Switch checked={micEnabled} onCheckedChange={onMicToggle} />
                </div>

                {/* Tema */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4 text-foreground" />
                    <span className="text-sm font-medium">Tema</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {(['light', 'dark', 'system'] as const).map((themeOption) => (
                      <Button
                        key={themeOption}
                        variant={theme === themeOption ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => onThemeChange(themeOption)}
                        className="text-xs capitalize"
                      >
                        {themeOption === 'system' && <Monitor className="h-3 w-3 mr-1" />}
                        {themeOption === 'system' ? 'Auto' : themeOption}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Más opciones (placeholder) */}
                <div className="pt-2 border-t border-border/50">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full text-xs text-muted-foreground hover:text-foreground"
                  >
                    {isExpanded ? 'Menos opciones' : 'Más opciones'}
                  </Button>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4 pt-2 border-t border-border/50"
                    >
                      {/* Modelo AI actual */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Brain className="h-4 w-4 text-foreground" />
                          <span className="text-sm font-medium">Modelo AI</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {aiModel === 'llama3.1:8b' ? (
                            <span className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              Llama 3.1 (Local)
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              DeepSeek (Cloud)
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Cambia el modelo en Configuración
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

