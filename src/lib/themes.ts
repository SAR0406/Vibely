export type Theme = {
  name: string;
  id: string;
  color: string;
  mode: 'light' | 'dark';
};

export const themes: Theme[] = [
  { 
    name: 'Vibey Light', 
    id: 'vibey-light',
    color: '#8b5cf6',
    mode: 'light',
  },
  { 
    name: 'Vibely', 
    id: 'vibely',
    color: '#7c3aed',
    mode: 'dark',
  },
  {
    name: 'Paper',
    id: 'paper',
    color: '#d946ef',
    mode: 'light',
  },
  { 
    name: 'Dusk', 
    id: 'dusk',
    color: '#f43f5e',
    mode: 'dark',
  },
  { 
    name: 'Latte', 
    id: 'latte',
    color: '#f59e0b',
    mode: 'dark',
  },
  { 
    name: 'Mint', 
    id: 'mint',
    color: '#10b981',
    mode: 'dark',
  },
  {
    name: 'Forest',
    id: 'forest',
    color: '#22c55e',
    mode: 'dark',
  },
  {
    name: 'Rose',
    id: 'rose',
    color: '#f43f5e',
    mode: 'dark',
  },
  { 
    name: 'Sunset', 
    id: 'sunset',
    color: '#f97316',
    mode: 'dark',
  },
  { 
    name: 'Ocean', 
    id: 'ocean',
    color: '#3b82f6',
    mode: 'dark',
  },
  { 
    name: 'Custom', 
    id: 'custom',
    color: '#7c3aed',
    mode: 'dark',
  },
];
