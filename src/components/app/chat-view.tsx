'use client';

import { useEffect, useRef, useState } from 'react';
import { Paperclip, Send, Settings, Smile } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

import { cn } from '@/lib/utils';
import type { Channel, Message, User } from '@/lib/types';
import { users as allUsers } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserAvatar } from './user-avatar';
import { ChatMessage } from './message';
import { AutomationSettingsDialog } from './automation-settings-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import Image from 'next/image';

type ChatViewProps = {
  channel: Channel | null;
  messages: Message[];
  onSendMessage: (content: string) => void;
  onAutomationsUpdate: (channelId: string, updatedAutomations: any) => void;
};

function AvatarGroup({ userIds }: { userIds: string[] }) {
  const displayedUsers = userIds
    .map((id) => allUsers.find((u) => u.id === id))
    .filter(Boolean) as User[];

  return (
    <div className="flex -space-x-2 overflow-hidden">
      {displayedUsers.slice(0, 3).map((user) => (
        <Avatar key={user.id} className="inline-block size-8 border-2 border-background">
          <AvatarImage asChild src={user.avatarUrl}>
             <Image src={user.avatarUrl} alt={user.name} width={32} height={32} className="object-cover" />
          </AvatarImage>
          <AvatarFallback>{user.name[0]}</AvatarFallback>
        </Avatar>
      ))}
      {displayedUsers.length > 3 && (
        <Avatar className="relative flex size-8 items-center justify-center rounded-full border-2 border-background bg-muted">
          <span className="text-xs font-medium">+{userIds.length - 3}</span>
        </Avatar>
      )}
    </div>
  );
}

export function ChatView({ channel, messages, onSendMessage, onAutomationsUpdate }: ChatViewProps) {
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const scrollViewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollViewportRef.current) {
      scrollViewportRef.current.scrollTo({
        top: scrollViewportRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  useEffect(() => {
    let typingTimeout: NodeJS.Timeout;
    if(isTyping) {
        typingTimeout = setTimeout(() => setIsTyping(false), 2000);
    }
    return () => clearTimeout(typingTimeout);
  }, [inputValue, isTyping]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setIsTyping(true);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue('');
      setIsTyping(false);
    }
  };

  if (!channel) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="flex h-full flex-col items-center justify-center bg-background/50 text-center"
        >
          <div className="p-8">
            <h2 className="font-headline text-2xl font-semibold">
              Welcome to Vibely
            </h2>
            <p className="mt-2 text-muted-foreground">
              Select a channel to start chatting, or create a new one to begin a
              new conversation.
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  const typingUsers = allUsers.filter(u => u.id !== 'user-5' && u.online).slice(0,2);

  return (
    <motion.div
      key={channel.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex h-full flex-col bg-background"
    >
      <header className="flex h-16 shrink-0 items-center justify-between border-b p-4">
        <div className="flex items-center gap-4">
          <AvatarGroup userIds={channel.members} />
          <div>
            <h2 className="font-headline text-lg font-semibold">{channel.name}</h2>
            <p className="text-sm text-muted-foreground">
              {channel.description}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)}>
          <Settings className="size-5" />
          <span className="sr-only">Channel Settings</span>
        </Button>
      </header>

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full" viewportRef={scrollViewportRef}>
          <div className="p-4 md:p-8 space-y-6">
            {messages.map((message, index) => {
              const author = allUsers.find((u) => u.id === message.authorId);
              if (!author) return null;
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <ChatMessage
                    message={message}
                    author={author}
                    isSender={message.authorId === 'user-5'}
                  />
                </motion.div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      <footer className="p-4 border-t bg-background">
        <div className="h-6 px-2 text-sm text-muted-foreground">
          <AnimatePresence>
            {isTyping && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center gap-1"
                >
                    <UserAvatar src={typingUsers[0].avatarUrl} name={typingUsers[0].name} className="size-4" />
                    <span>{typingUsers[0].name} is typing...</span>
                </motion.div>
            )}
           </AnimatePresence>
        </div>
        <form
          onSubmit={handleSendMessage}
          className="flex w-full items-center gap-2"
        >
          <Button variant="ghost" size="icon" type="button" className="hover:bg-muted">
            <Paperclip className="size-5 text-muted-foreground" />
             <span className="sr-only">Attach file</span>
          </Button>
          <div className="relative flex-1">
            <Input
              value={inputValue}
              onChange={handleInputChange}
              placeholder="Type a message..."
              className="rounded-full bg-muted pr-10"
            />
            <Button
              variant="ghost"
              size="icon"
              type="button"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-muted/50"
            >
              <Smile className="size-5 text-muted-foreground" />
              <span className="sr-only">Add emoji</span>
            </Button>
          </div>

          <Button type="submit" size="icon" disabled={!inputValue.trim()} className="rounded-full">
            <Send className="size-5" />
            <span className="sr-only">Send message</span>
          </Button>
        </form>
      </footer>
      <AutomationSettingsDialog 
        channel={channel}
        isOpen={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        onAutomationsUpdate={onAutomationsUpdate}
      />
    </motion.div>
  );
}
