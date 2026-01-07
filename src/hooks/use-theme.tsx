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
  customColors: CustomColors;
  setCustomColors: (colors: CustomColors) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

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
  const [customColors, setCustomColorsState] = useState<CustomColors>({
    primary: '#7c3aed',
    background: '#0a0a0a',
    accent: '#1a1a1a',
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const storedTheme = localStorage.getItem('app-theme');
    const storedCustomColors = localStorage.getItem('app-custom-colors');
    
    if (storedTheme && themes.find(t => t.id === storedTheme)) {
      setThemeId(storedTheme);
    }
    if (storedCustomColors) {
      setCustomColorsState(JSON.parse(storedCustomColors));
    }
    setMounted(true);
  }, []);

  const theme = useMemo(() => themes.find(t => t.id === themeId) || themes[0], [themeId]);

  useEffect(() => {
    if (!mounted) return;

    const root = window.document.documentElement;
    
    // Apply light/dark class
    root.classList.remove('light', 'dark');
    root.classList.add(theme.mode);

    // Apply theme class
    const allThemeIds = themes.map(t => t.id);
    root.classList.remove(...allThemeIds);
    root.classList.add(themeId);

    // Apply custom colors if 'custom' theme is selected
    if (themeId === 'custom') {
        root.style.setProperty('--primary', hexToHslString(customColors.primary));
        root.style.setProperty('--background', hexToHslString(customColors.background));
        root.style.setProperty('--accent', hexToHslString(customColors.accent));
    } else {
        root.style.removeProperty('--primary');
        root.style.removeProperty('--background');
        root.style.removeProperty('--accent');
    }

    localStorage.setItem('app-theme', themeId);
  }, [themeId, theme, customColors, mounted]);

  const handleSetTheme = (newThemeId: string) => {
    setThemeId(newThemeId);
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
