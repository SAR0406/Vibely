export type Theme = {
  name: string;
  id: string;
  darkColors?: {
    primary: string;
    background: string;
    accent: string;
  };
};

export const themes: Theme[] = [
  { 
    name: 'Vibely', 
    id: 'vibely',
    darkColors: { primary: '#8b5cf6', background: '#111827', accent: '#1f2937' },
  },
  { 
    name: 'Dusk', 
    id: 'dusk',
    darkColors: { primary: '#f43f5e', background: '#0f172a', accent: '#1e293b' },
  },
  { 
    name: 'Latte', 
    id: 'latte',
    darkColors: { primary: '#f59e0b', background: '#262626', accent: '#404040' },
  },
  { 
    name: 'Mint', 
    id: 'mint',
    darkColors: { primary: '#34d399', background: '#042f2e', accent: '#064e3b' },
  },
  { 
    name: 'Sunset', 
    id: 'sunset',
    darkColors: { primary: '#fb923c', background: '#2c1b18', accent: '#432c22' },
  },
  { 
    name: 'Ocean', 
    id: 'ocean',
    darkColors: { primary: '#60a5fa', background: '#1e293b', accent: '#293548' },
  },
  { 
    name: 'Custom', 
    id: 'custom',
    darkColors: { primary: '#8b5cf6', background: '#111827', accent: '#1f2937' },
  },
];
