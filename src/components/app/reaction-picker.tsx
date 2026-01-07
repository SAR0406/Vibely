'use client';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const frequentEmojis = ['❤️', '😂', '👍', '🙏', '😢', '🔥', '🎉'];

type ReactionPickerProps = {
  children: React.ReactNode;
  onSelect: (emoji: string) => void;
};

export function ReactionPicker({ children, onSelect }: ReactionPickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-auto border-none bg-transparent shadow-none">
        <div className="flex gap-1 rounded-full bg-card p-2 shadow-lg">
          {frequentEmojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onSelect(emoji)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-xl transition-transform hover:scale-125 hover:bg-accent"
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
