export type Theme = {
  name: string;
  id: string;
  colors?: {
    primary: string;
    background: string;
    accent: string;
  };
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
    colors: { primary: '#7c3aed', background: '#ffffff', accent: '#f3f4f6' },
    darkColors: { primary: '#8b5cf6', background: '#111827', accent: '#1f2937' },
  },
  { 
    name: 'Dusk', 
    id: 'dusk',
    colors: { primary: '#f43f5e', background: '#f8fafc', accent: '#f1f5f9' },
    darkColors: { primary: '#f43f5e', background: '#0f172a', accent: '#1e293b' },
  },
  { 
    name: 'Latte', 
    id: 'latte',
    colors: { primary: '#d97706', background: '#fdfbf6', accent: '#f3f1e9' },
    darkColors: { primary: '#f59e0b', background: '#262626', accent: '#404040' },
  },
  { 
    name: 'Mint', 
    id: 'mint',
    colors: { primary: '#10b981', background: '#fafffa', accent: '#f0fdf4' },
    darkColors: { primary: '#34d399', background: '#042f2e', accent: '#064e3b' },
  },
  { 
    name: 'Sunset', 
    id: 'sunset',
    colors: { primary: '#f97316', background: '#fffbeb', accent: '#fef3c7' },
    darkColors: { primary: '#fb923c', background: '#2c1b18', accent: '#432c22' },
  },
  { 
    name: 'Ocean', 
    id: 'ocean',
    colors: { primary: '#3b82f6', background: '#f5faff', accent: '#eff6ff' },
    darkColors: { primary: '#60a5fa', background: '#1e293b', accent: '#293548' },
  },
  { 
    name: 'Custom', 
    id: 'custom',
    colors: { primary: '#7c3aed', background: '#ffffff', accent: '#f3f4f6' },
    darkColors: { primary: '#8b5cf6', background: '#111827', accent: '#1f2937' },
  },
];
