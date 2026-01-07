'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, CheckCheck, SmilePlus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Message, User, Reaction } from '@/lib/types';
import { UserAvatar } from './user-avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ReactionPicker } from './reaction-picker';
import { useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Badge } from '../ui/badge';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

type MessageProps = {
  message: Message;
  author: User;
  isSender: boolean;
  chatId: string;
  currentUser: User;
};

export function ChatMessage({ message, author, isSender, chatId, currentUser }: MessageProps) {
  const [formattedTimestamp, setFormattedTimestamp] = useState('');
  const [fullTimestamp, setFullTimestamp] = useState('');
  const firestore = useFirestore();

  useEffect(() => {
    if (message.timestamp) {
      const date = message.timestamp.toDate ? message.timestamp.toDate() : new Date(message.timestamp);
      setFormattedTimestamp(format(date, 'p'));
      setFullTimestamp(format(date, 'PPpp'));
    }
  }, [message.timestamp]);
  
  const handleReaction = (emoji: string) => {
    if (!firestore || !message.id) return;
    const messageRef = doc(firestore, 'chats', chatId, 'messages', message.id);

    const existingReactions = message.reactions || [];
    const myReactionIndex = existingReactions.findIndex(r => r.userId === currentUser.id && r.emoji === emoji);
    let newReactions: Reaction[];

    if (myReactionIndex > -1) {
      // User is removing their existing reaction
      newReactions = existingReactions.filter((_, index) => index !== myReactionIndex);
    } else {
      // User is adding a new reaction
      newReactions = [...existingReactions, { emoji, userId: currentUser.id, username: currentUser.name }];
    }
    
    updateDocumentNonBlocking(messageRef, { reactions: newReactions });
  };

  const ReadStatusIcon = message.readStatus === 'read' ? CheckCheck : Check;

  const groupedReactions = (message.reactions || []).reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction.username);
    return acc;
  }, {} as Record<string, string[]>);


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('group flex items-start gap-3 relative', {
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
            'rounded-xl p-3 text-sm relative',
            isSender
              ? 'rounded-br-none bg-primary text-primary-foreground'
              : 'rounded-bl-none bg-card'
          )}
        >
          <p
            className={cn('font-headline text-xs font-bold mb-1', {
              'text-primary-foreground/80': isSender,
              'text-muted-foreground': !isSender,
            })}
          >
            {author.name}
          </p>
          <p className="whitespace-pre-wrap">{message.content}</p>
          
           {Object.keys(groupedReactions).length > 0 && (
             <div className={cn("absolute -bottom-4 flex gap-1", isSender ? "right-2" : "left-2")}>
                {Object.entries(groupedReactions).map(([emoji, users]) => (
                    <TooltipProvider key={emoji} delayDuration={100}>
                        <Tooltip>
                            <TooltipTrigger>
                                 <Badge variant="secondary" className="shadow-sm cursor-pointer" onClick={() => handleReaction(emoji)}>
                                    {emoji} {users.length}
                                </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{users.join(', ')}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ))}
             </div>
           )}
        </div>
        <div
          className={cn(
            'mt-1 flex items-center gap-1 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity',
            { 'flex-row-reverse': isSender, 'mt-5': Object.keys(groupedReactions).length > 0 }
          )}
        >
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger>
                <span>{formattedTimestamp}</span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{fullTimestamp}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {isSender && message.readStatus && (
            <ReadStatusIcon
              className={cn('h-4 w-4', {
                'text-blue-500': message.readStatus === 'read',
              })}
            />
          )}
        </div>
      </div>
      <div className={cn("absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity", isSender ? "left-0 -translate-x-full pr-2" : "right-0 translate-x-full pl-2")}>
        <ReactionPicker onSelect={handleReaction}>
            <button className="p-1.5 rounded-full hover:bg-accent">
                <SmilePlus className="size-4 text-muted-foreground"/>
            </button>
        </ReactionPicker>
      </div>
    </motion.div>
  );
}
