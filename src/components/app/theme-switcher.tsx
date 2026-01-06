'use client';

import { Moon, Sun, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/hooks/use-theme';
import { themes } from '@/lib/themes';

export function ThemeSwitcher() {
  const { theme, setTheme, isDarkMode, toggleDarkMode } = useTheme();

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
        {isDarkMode ? <Sun className="size-4" /> : <Moon className="size-4" />}
        <span className="sr-only">Toggle dark mode</span>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <Palette className="size-4" />
            <span className="sr-only">Select theme</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {themes.map((t) => (
            <DropdownMenuItem key={t.id} onClick={() => setTheme(t.id)}>
              {t.name}
              {theme.id === t.id && (
                <Sun className="ml-auto h-4 w-4" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
