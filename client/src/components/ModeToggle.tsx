import { Mic, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ModeToggleProps {
  mode: "voice" | "chat";
  onModeChange: (mode: "voice" | "chat") => void;
}

export function ModeToggle({ mode, onModeChange }: ModeToggleProps) {
  return (
    <div className="flex justify-center mb-12" data-testid="mode-toggle">
      <div className="glass rounded-full p-1 flex">
        <Button
          variant={mode === "voice" ? "default" : "ghost"}
          className="px-6 py-3 rounded-full transition-all duration-300"
          onClick={() => onModeChange("voice")}
          data-testid="button-voice-mode"
        >
          <Mic className="w-4 h-4 mr-2" />
          Voice
        </Button>
        <Button
          variant={mode === "chat" ? "default" : "ghost"}
          className="px-6 py-3 rounded-full transition-all duration-300"
          onClick={() => onModeChange("chat")}
          data-testid="button-chat-mode"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Chat
        </Button>
      </div>
    </div>
  );
}
