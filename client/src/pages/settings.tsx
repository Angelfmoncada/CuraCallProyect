import { motion } from "framer-motion";
import { useSettings } from "@/store/settings";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { settings, updateSettings, clearAllData } = useSettings();
  const { toast } = useToast();

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
        {/* Voice Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
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
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-6"
        >
          <h3 className="font-medium mb-4">AI Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Model</label>
              <Select
                value={settings.aiModel}
                onValueChange={(value) => updateSettings({ aiModel: value })}
              >
                <SelectTrigger className="w-48" data-testid="select-ai-model">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Llama-3-8B-Instruct">Llama-3-8B-Instruct</SelectItem>
                  <SelectItem value="Qwen2.5-3B-Instruct">Qwen2.5-3B-Instruct</SelectItem>
                </SelectContent>
              </Select>
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
          transition={{ delay: 0.2 }}
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
      </div>
    </div>
  );
}
