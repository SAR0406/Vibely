'use client';

import { Check, CheckCheck } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Message, User } from '@/lib/types';
import { UserAvatar } from './user-avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type MessageProps = {
  message: Message;
  author: User;
  isSender: boolean;
};

export function ChatMessage({ message, author, isSender }: MessageProps) {
  const ReadStatusIcon =
    message.readStatus === 'read' ? CheckCheck : Check;

  const timestamp = format(new Date(message.timestamp), 'p');

  return (
    <div
      className={cn('group flex items-start gap-3', {
        'flex-row-reverse': isSender,
      })}
    >
      <UserAvatar
        src={author.avatarUrl}
        name={author.name}
        isOnline={author.online}
        className="mt-1"
      />
      <div
        className={cn('flex flex-col max-w-xs md:max-w-md', {
          'items-end': isSender,
        })}
      >
        <div
          className={cn(
            'rounded-lg p-3 text-sm shadow-md',
            isSender
              ? 'rounded-br-none bg-primary text-primary-foreground'
              : 'rounded-bl-none bg-card'
          )}
        >
          <p
            className={cn('font-headline text-xs font-bold mb-1', {
              'text-primary-foreground/80': isSender,
              'text-primary': !isSender,
            })}
          >
            {author.name}
          </p>
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
        <div
          className={cn(
            'mt-1 flex items-center gap-1 text-xs text-muted-foreground',
            { 'flex-row-reverse': isSender }
          )}
        >
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger>
                <span>{timestamp}</span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{format(new Date(message.timestamp), 'PPpp')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {isSender && (
            <ReadStatusIcon
              className={cn('size-4', {
                'text-blue-500': message.readStatus === 'read',
              })}
            />
          )}
        </div>
      </div>
    </div>
  );
}
