'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { Paperclip, Send, Settings, Smile } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { collection, query, orderBy, doc } from 'firebase/firestore';

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
import { useCollection, useDoc, useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';

function useMessages(channelId: string | null) {
  const firestore = useFirestore();

  const messagesQuery = useMemo(() => {
    if (!firestore || !channelId) return null;
    return query(
      collection(firestore, 'channels', channelId, 'messages'),
      orderBy('timestamp', 'asc')
    );
  }, [firestore, channelId]);

  return useCollection<Message>(messagesQuery);
}

function useChannelMembers(memberIds: string[] = []) {
  const firestore = useFirestore();
  const [members, setMembers] = useState<User[]>([]);

  // This is a simplified way to fetch multiple documents.
  // For production, you might want a more optimized approach.
  useEffect(() => {
    if (!firestore || memberIds.length === 0) {
      setMembers([]);
      return;
    }

    const unsubscribes = memberIds.map(id => {
      const docRef = doc(firestore, 'users', id);
      // This is not efficient as it creates multiple listeners.
      // A better approach would be to use a hook that can batch these reads.
      const unsub = useDoc<User>(docRef).data; 
      // This is a placeholder for where you'd aggregate the results.
      // `useDoc` would need to be adapted or a `useDocs` hook created.
      return () => {};
    });

    // In a real app, you would aggregate the results from multiple doc reads.
    // For now, this logic is simplified.
    // This is a known limitation of this quick implementation.

    return () => unsubscribes.forEach(unsub => unsub());
  }, [firestore, memberIds]);

  // Placeholder: this part of the logic is not fully implemented
  // and would require a more complex hook (`useDocs`).
  // Returning an empty array for now.
  return { data: members, isLoading: false };
}


function AvatarGroup({ userIds, allUsers }: { userIds: string[], allUsers: User[] }) {
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

  const { data: allUsers, isLoading: usersLoading } = useCollection<User>(
    useMemo(() => collection(firestore, 'users'), [firestore])
  );
  
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
          {allUsers && <AvatarGroup userIds={channel.members} allUsers={allUsers} />}
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
            {messages && allUsers && messages.map((message, index) => {
              const author = allUsers.find((u) => u.id === message.authorId);
              if (!author) return null; // Or a placeholder
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
                    isSender={message.authorId === currentUser?.id}
                  />
                </motion.div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      <footer className="p-4 border-t bg-background">
        <div className="h-6 px-2 text-sm text-muted-foreground">
          {/* Typing indicator can be added here */}
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
              onChange={(e) => setInputValue(e.target.value)}
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
        onAutomationsUpdate={handleAutomationsUpdate}
      />
    </motion.div>
  );
}
