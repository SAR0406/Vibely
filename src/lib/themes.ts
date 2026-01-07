export type Theme = {
  name: string;
  id: string;
  lightColors?: {
    primary: string;
    background?: string;
    accent?: string;
  };
};

export const themes: Theme[] = [
  { 
    name: 'Vibey Light', 
    id: 'vibey-light',
    lightColors: { primary: '#8b5cf6' },
  },
  { 
    name: 'Vibely', 
    id: 'vibely',
    lightColors: { primary: '#7c3aed' },
  },
  {
    name: 'Paper',
    id: 'paper',
    lightColors: { primary: '#d946ef' },
  },
  { 
    name: 'Dusk', 
    id: 'dusk',
    lightColors: { primary: '#f43f5e' },
  },
  { 
    name: 'Latte', 
    id: 'latte',
    lightColors: { primary: '#f59e0b' },
  },
  { 
    name: 'Mint', 
    id: 'mint',
    lightColors: { primary: '#10b981' },
  },
  {
    name: 'Forest',
    id: 'forest',
    lightColors: { primary: '#22c55e' },
  },
  {
    name: 'Rose',
    id: 'rose',
    lightColors: { primary: '#f43f5e' },
  },
  { 
    name: 'Sunset', 
    id: 'sunset',
    lightColors: { primary: '#f97316' },
  },
  { 
    name: 'Ocean', 
    id: 'ocean',
    lightColors: { primary: '#3b82f6' },
  },
  { 
    name: 'Custom', 
    id: 'custom',
    lightColors: { primary: '#7c3aed' },
  },
];
