export type Theme = {
  name: string;
  id: string;
  lightColors?: {
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
    lightColors: { primary: '#7c3aed', background: '#ffffff', accent: '#f3f4f6' },
    darkColors: { primary: '#8b5cf6', background: '#111827', accent: '#1f2937' },
  },
  {
    name: 'Paper',
    id: 'paper',
    lightColors: { primary: '#d946ef', background: '#f8fafc', accent: '#e2e8f0' },
    darkColors: { primary: '#e879f9', background: '#020617', accent: '#0f172a' },
  },
  { 
    name: 'Dusk', 
    id: 'dusk',
    lightColors: { primary: '#f43f5e', background: '#ffffff', accent: '#fecdd3' },
    darkColors: { primary: '#f43f5e', background: '#0f172a', accent: '#1e293b' },
  },
  { 
    name: 'Latte', 
    id: 'latte',
    lightColors: { primary: '#f59e0b', background: '#ffffff', accent: '#fef3c7' },
    darkColors: { primary: '#f59e0b', background: '#262626', accent: '#404040' },
  },
  { 
    name: 'Mint', 
    id: 'mint',
    lightColors: { primary: '#10b981', background: '#ffffff', accent: '#d1fae5' },
    darkColors: { primary: '#34d399', background: '#042f2e', accent: '#064e3b' },
  },
  {
    name: 'Forest',
    id: 'forest',
    lightColors: { primary: '#22c55e', background: '#ffffff', accent: '#dcfce7' },
    darkColors: { primary: '#4ade80', background: '#052e16', accent: '#166534' },
  },
  {
    name: 'Rose',
    id: 'rose',
    lightColors: { primary: '#f43f5e', background: '#ffffff', accent: '#ffe4e6' },
    darkColors: { primary: '#fb7185', background: '#4c0519', accent: '#9f1239' },
  },
  { 
    name: 'Sunset', 
    id: 'sunset',
    lightColors: { primary: '#f97316', background: '#ffffff', accent: '#ffedd5' },
    darkColors: { primary: '#fb923c', background: '#2c1b18', accent: '#432c22' },
  },
  { 
    name: 'Ocean', 
    id: 'ocean',
    lightColors: { primary: '#3b82f6', background: '#ffffff', accent: '#dbeafe' },
    darkColors: { primary: '#60a5fa', background: '#1e293b', accent: '#293548' },
  },
  { 
    name: 'Custom', 
    id: 'custom',
    lightColors: { primary: '#7c3aed', background: '#ffffff', accent: '#f3f4f6' },
    darkColors: { primary: '#8b5cf6', background: '#111827', accent: '#1f2937' },
  },
];
