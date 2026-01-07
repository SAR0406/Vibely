'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { themes, type Theme } from '@/lib/themes';

type CustomColors = {
  primary: string;
  background: string;
  accent: string;
};

type ThemeContextType = {
  theme: Theme;
  setTheme: (themeId: string) => void;
  isDarkMode: boolean;
  setIsDarkMode: (isDark: boolean) => void;
  customColors: CustomColors;
  setCustomColors: (colors: CustomColors) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Function to convert hex to HSL string
const hexToHslString = (hex: string): string => {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return `${(h * 360).toFixed(1)} ${(s * 100).toFixed(1)}% ${(l * 100).toFixed(1)}%`;
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [themeId, setThemeId] = useState('vibely');
  const [isDarkMode, setIsDarkModeState] = useState(true);
  const [customColors, setCustomColorsState] = useState<CustomColors>({
    primary: '#7c3aed',
    background: '#030712', // dark default
    accent: '#1e293b', // dark default
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const storedTheme = localStorage.getItem('app-theme');
    const storedMode = localStorage.getItem('app-theme-mode');
    const storedCustomColors = localStorage.getItem('app-custom-colors');
    
    if (storedTheme && themes.find(t => t.id === storedTheme)) {
      setThemeId(storedTheme);
    }
    if (storedMode) {
      setIsDarkModeState(storedMode === 'dark');
    }
    if (storedCustomColors) {
      setCustomColorsState(JSON.parse(storedCustomColors));
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const currentTheme = themes.find(t => t.id === themeId);
    if (!currentTheme) return;

    const root = window.document.documentElement;
    
    const allThemeIds = themes.map(t => t.id);
    root.classList.remove(...allThemeIds, 'dark', 'light');

    root.classList.add(themeId);
    root.classList.add(isDarkMode ? 'dark' : 'light');

    if (themeId === 'custom') {
        const customThemeColors = isDarkMode ? currentTheme.darkColors : currentTheme.lightColors;
        if (customThemeColors) {
            root.style.setProperty('--primary', hexToHslString(customColors.primary));
            root.style.setProperty('--background', hexToHslString(customColors.background));
            root.style.setProperty('--accent', hexToHslString(customColors.accent));
        }
    } else {
        root.style.removeProperty('--primary');
        root.style.removeProperty('--background');
        root.style.removeProperty('--accent');
    }

    localStorage.setItem('app-theme', themeId);
    localStorage.setItem('app-theme-mode', isDarkMode ? 'dark' : 'light');

  }, [themeId, isDarkMode, customColors, mounted]);

  const theme = useMemo(() => themes.find(t => t.id === themeId) || themes[0], [themeId]);

  const handleSetTheme = (newThemeId: string) => {
    setThemeId(newThemeId);
  };

  const handleSetIsDarkMode = (isDark: boolean) => {
    setIsDarkModeState(isDark);
  };
  
  const setCustomColors = useCallback((colors: CustomColors) => {
    setCustomColorsState(colors);
    localStorage.setItem('app-custom-colors', JSON.stringify(colors));
    if (themeId !== 'custom') {
      setThemeId('custom');
    }
  }, [themeId]);

  const value = { 
    theme, 
    setTheme: handleSetTheme, 
    isDarkMode, 
    setIsDarkMode: handleSetIsDarkMode, 
    customColors, 
    setCustomColors 
  };

  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
