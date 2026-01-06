"use client"

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { themes, type Theme } from '@/lib/themes';

type ThemeContextType = {
  theme: Theme;
  setTheme: (themeId: string) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [themeId, setThemeId] = useState('vibely');
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const storedTheme = localStorage.getItem('app-theme');
    const storedMode = localStorage.getItem('app-theme-mode');
    if (storedTheme && themes.find(t => t.id === storedTheme)) {
      setThemeId(storedTheme);
    }
    if (storedMode) {
      setIsDarkMode(storedMode === 'dark');
    }
  }, []);

  useEffect(() => {
    const currentTheme = themes.find(t => t.id === themeId);
    if (!currentTheme) return;

    const root = window.document.documentElement;
    root.classList.remove(...themes.map(t => t.id));
    root.classList.add(themeId);
    
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    localStorage.setItem('app-theme', themeId);
    localStorage.setItem('app-theme-mode', isDarkMode ? 'dark' : 'light');

  }, [themeId, isDarkMode]);

  const theme = useMemo(() => themes.find(t => t.id === themeId) || themes[0], [themeId]);

  const handleSetTheme = (newThemeId: string) => {
    setThemeId(newThemeId);
  };
  
  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme, isDarkMode, toggleDarkMode }}>
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
