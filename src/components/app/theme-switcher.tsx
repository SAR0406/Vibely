'use client';

import { useState } from 'react';
import { Moon, Sun, Palette, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/hooks/use-theme';
import { themes } from '@/lib/themes';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ColorPickerDialog } from './color-picker-dialog';

export function ThemeSwitcher() {
  const { theme, setTheme, isDarkMode, toggleDarkMode } = useTheme();
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

  return (
    <div className="flex w-full items-center justify-center gap-2 rounded-lg bg-muted p-2 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:bg-transparent">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
            {isDarkMode ? (
              <Sun className="size-4" />
            ) : (
              <Moon className="size-4" />
            )}
            <span className="sr-only">Toggle dark mode</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right" className="group-data-[collapsible=icon]:block hidden">
          Toggle Theme
        </TooltipContent>
      </Tooltip>

      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Palette className="size-4" />
                <span className="sr-only">Select theme</span>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="right" className="group-data-[collapsible=icon]:block hidden">
            Change Color Scheme
          </TooltipContent>
        </Tooltip>
        <DropdownMenuPortal>
          <DropdownMenuContent align="end">
            {themes.map((t) => (
              <DropdownMenuItem
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={t.id === theme.id ? 'bg-accent' : ''}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="size-4 rounded-full border"
                    style={{ backgroundColor: t.colors?.primary || 'hsl(var(--primary))' }}
                  ></div>
                  {t.name}
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setIsColorPickerOpen(true)}>
              <Settings2 className="mr-2 size-4" />
              <span>Customize...</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenuPortal>
      </DropdownMenu>
      <ColorPickerDialog 
        isOpen={isColorPickerOpen}
        onOpenChange={setIsColorPickerOpen}
      />
    </div>
  );
}
