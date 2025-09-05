import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark-ocean" | "ocean-breeze" | "seagrass" | "sunset" | "midnight";

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark-ocean");

  useEffect(() => {
    const savedTheme = localStorage.getItem("curacall-theme") as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    
    // Remove all theme classes
    root.classList.remove("theme-ocean-breeze", "theme-seagrass", "theme-sunset", "theme-midnight");
    
    // Add the new theme class (except for dark-ocean which is default)
    if (theme !== "dark-ocean") {
      root.classList.add(`theme-${theme.replace("dark-", "")}`);
    }
    
    // Save to localStorage
    localStorage.setItem("curacall-theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
