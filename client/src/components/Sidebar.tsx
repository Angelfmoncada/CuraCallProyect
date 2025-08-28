import { X, Home, MessageCircle, History, Settings, Lightbulb, Waves, Leaf, Sunset, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const themes = [
  { id: "dark-ocean" as const, name: "Dark Ocean", icon: Waves, gradient: "from-slate-900 to-blue-900" },
  { id: "ocean-breeze" as const, name: "Ocean Breeze", icon: Waves, gradient: "from-sky-600 to-blue-600" },
  { id: "seagrass" as const, name: "Seagrass", icon: Leaf, gradient: "from-emerald-600 to-green-600" },
  { id: "sunset" as const, name: "Sunset", icon: Sunset, gradient: "from-orange-600 to-pink-600" },
  { id: "midnight" as const, name: "Midnight", icon: Moon, gradient: "from-purple-900 to-purple-600" },
];

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Chat", href: "/chat", icon: MessageCircle },
  { name: "History", href: "/history", icon: History },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({ open, onClose }: SidebarProps) {
  const { theme, setTheme } = useTheme();
  const [location, setLocation] = useLocation();

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 h-full w-64 glass-strong transform transition-transform duration-300 z-50",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-semibold">CuraCall</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              data-testid="button-close-sidebar"
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Theme Selector */}
          <div className="mb-8">
            <h3 className="text-sm font-medium mb-4 text-muted-foreground">Themes</h3>
            <div className="space-y-2">
              {themes.map((themeOption) => {
                const Icon = themeOption.icon;
                return (
                  <Button
                    key={themeOption.id}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors",
                      theme === themeOption.id && "bg-white/10"
                    )}
                    onClick={() => {
                      setTheme(themeOption.id);
                      onClose();
                    }}
                    data-testid={`button-theme-${themeOption.id}`}
                  >
                    <div className={cn("w-4 h-4 rounded-full bg-gradient-to-r", themeOption.gradient)} />
                    <span>{themeOption.name}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Navigation */}
          <div className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              
              return (
                <Button
                  key={item.name}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors",
                    isActive && "bg-white/10"
                  )}
                  onClick={() => {
                    setLocation(item.href);
                    onClose();
                  }}
                  data-testid={`button-nav-${item.name.toLowerCase()}`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
