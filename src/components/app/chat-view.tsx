'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { Paperclip, Send, Settings, Smile } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { collection, query, orderBy, doc, where } from 'firebase/firestore';

import { cn } from '@/lib/utils';
import type { Channel, Message, User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserAvatar } from './user-avatar';
import { ChatMessage } from './message';
import { AutomationSettingsDialog } from './automation-settings-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import Image from 'next/image';
import { useCollection, useDoc, useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking, useMemoFirebase } from '@/firebase';

function useMessages(channelId: string | null) {
  const firestore = useFirestore();

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !channelId) return null;
    return query(
      collection(firestore, 'channels', channelId, 'messages'),
      orderBy('timestamp', 'asc')
    );
  }, [firestore, channelId]);

  return useCollection<Message>(messagesQuery);
}

function AvatarGroup({ userIds, allUsers }: { userIds: string[], allUsers: User[] }) {
    const displayedUsers = userIds
      .map((id) => allUsers.find((u) => u.id === id))
      .filter(Boolean) as User[];
  
    return (
      <div className="flex -space-x-2 overflow-hidden">
        {displayedUsers.slice(0, 3).map((user) => (
          <Avatar key={user.id} className="inline-block h-8 w-8 border-2 border-background">
            <AvatarImage asChild src={user.avatarUrl}>
               <Image src={user.avatarUrl} alt={user.name} width={32} height={32} className="object-cover" />
            </AvatarImage>
            <AvatarFallback>{user.name[0]}</AvatarFallback>
          </Avatar>
        ))}
        {displayedUsers.length > 3 && (
          <Avatar className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted">
            <span className="text-xs font-medium">+{userIds.length - 3}</span>
          </Avatar>
        )}
      </div>
    );
  }

type ChatViewProps = {
  channel: Channel | null;
  currentUser: (User & { email: string }) | null;
};

export function ChatView({ channel, currentUser }: ChatViewProps) {
  const [inputValue, setInputValue] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const firestore = useFirestore();

  const { data: messages } = useMessages(channel?.id || null);

  const channelUsersQuery = useMemoFirebase(() => {
    if (!firestore || !channel || channel.members.length === 0) return null;
    // Fetch documents for users who are members of the channel
    return query(collection(firestore, 'users'), where('id', 'in', channel.members));
  }, [firestore, channel]);

  const { data: channelUsers } = useCollection<User>(channelUsersQuery);
  
  useEffect(() => {
    if (scrollViewportRef.current) {
      scrollViewportRef.current.scrollTo({
        top: scrollViewportRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && channel && currentUser) {
      const messagesColRef = collection(firestore, 'channels', channel.id, 'messages');
      addDocumentNonBlocking(messagesColRef, {
        authorId: currentUser.id,
        content: inputValue.trim(),
        timestamp: new Date().toISOString(),
        readStatus: 'sent',
      });
      setInputValue('');
    }
  };

  const handleAutomationsUpdate = (channelId: string, updatedAutomations: any) => {
    const channelRef = doc(firestore, 'channels', channelId);
    updateDocumentNonBlocking(channelRef, { automations: updatedAutomations });
  };

  if (!channel) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="flex h-full flex-col items-center justify-center bg-muted/30 text-center"
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

  return (
    <motion.div
      key={channel.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex h-full flex-col bg-muted/30"
    >
      <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background/80 p-4 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          {channelUsers && <AvatarGroup userIds={channel.members} allUsers={channelUsers} />}
          <div>
            <h2 className="font-headline text-lg font-semibold">{channel.name}</h2>
            <p className="text-sm text-muted-foreground">
              {channel.description}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)}>
          <Settings className="h-5 w-5" />
          <span className="sr-only">Channel Settings</span>
        </Button>
      </header>

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full" viewportRef={scrollViewportRef}>
          <div className="space-y-6 p-4 md:p-8">
            {messages && channelUsers && messages.map((message, index) => {
              const author = channelUsers.find((u) => u.id === message.authorId);
              if (!author) return null; // Or a placeholder
              return (
                <ChatMessage
                  key={message.id}
                  message={message}
                  author={author}
                  isSender={message.authorId === currentUser?.id}
                />
              );
            })}
          </div>
        </ScrollArea>
      </div>

      <footer className="border-t bg-background/80 p-4 backdrop-blur-sm">
        <div className="h-6 px-2 text-sm text-muted-foreground">
          {/* Typing indicator can be added here */}
        </div>
        <form
          onSubmit={handleSendMessage}
          className="flex w-full items-center gap-2"
        >
          <Button variant="ghost" size="icon" type="button" className="hover:bg-muted">
            <Paperclip className="h-5 w-5 text-muted-foreground" />
             <span className="sr-only">Attach file</span>
          </Button>
          <div className="relative flex-1">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type a message..."
              className="rounded-full bg-muted pr-10"
            />
            <Button
              variant="ghost"
              size="icon"
              type="button"
              className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 hover:bg-muted/50"
            >
              <Smile className="h-5 w-5 text-muted-foreground" />
              <span className="sr-only">Add emoji</span>
            </Button>
          </div>

          <Button type="submit" size="icon" disabled={!inputValue.trim()} className="rounded-full">
            <Send className="h-5 w-5" />
            <span className="sr-only">Send message</span>
          </Button>
        </form>
      </footer>
      <AutomationSettingsDialog 
        channel={channel}
        isOpen={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        onAutomationsUpdate={handleAutomationsUpdate}
      />
    </motion.div>
  );
}
