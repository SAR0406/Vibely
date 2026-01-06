'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTheme } from '@/hooks/use-theme';

type ColorPickerDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

const ColorInput = ({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) => (
    <div className="flex items-center justify-between">
      <Label>{label}</Label>
      <div className="relative flex items-center">
        <Input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-8 p-0 border-none cursor-pointer"
        />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-24 ml-2"
        />
      </div>
    </div>
);


export function ColorPickerDialog({
  isOpen,
  onOpenChange,
}: ColorPickerDialogProps) {
  const { customColors, setCustomColors } = useTheme();
  const [localColors, setLocalColors] = useState(customColors);

  useEffect(() => {
    setLocalColors(customColors);
  }, [customColors, isOpen]);

  const handleColorChange = (colorName: keyof typeof localColors, value: string) => {
    const newColors = { ...localColors, [colorName]: value };
    setLocalColors(newColors);
    // Apply changes in real-time
    setCustomColors(newColors);
  };
  
  const handleSaveChanges = () => {
    setCustomColors(localColors);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-headline">Customize Theme</DialogTitle>
          <DialogDescription>
            Adjust the colors to create your own theme. Changes are applied in real-time.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <ColorInput label="Primary" value={localColors.primary} onChange={(v) => handleColorChange('primary', v)} />
            <ColorInput label="Background" value={localColors.background} onChange={(v) => handleColorChange('background', v)} />
            <ColorInput label="Accent" value={localColors.accent} onChange={(v) => handleColorChange('accent', v)} />
        </div>
        <DialogFooter>
          <Button onClick={handleSaveChanges}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
