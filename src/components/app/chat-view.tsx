'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { Paperclip, Send, Settings } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { collection, query, orderBy, doc, where, writeBatch, serverTimestamp } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';

import type { Chat, Message, User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserAvatar } from './user-avatar';
import { ChatMessage } from './message';
import { AutomationSettingsDialog } from './automation-settings-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import Image from 'next/image';
import { useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Skeleton } from '../ui/skeleton';
import { ReactionPicker } from './reaction-picker';


function useMessages(chatId: string | null) {
  const firestore = useFirestore();

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !chatId) return null;
    return query(
      collection(firestore, 'chats', chatId, 'messages'),
      orderBy('timestamp', 'asc')
    );
  }, [firestore, chatId]);

  return useCollection<Message>(messagesQuery);
}

function GroupAvatar({ userIds, allUsers }: { userIds: string[], allUsers: User[] }) {
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

const DMHeaderContent = ({ otherUserId }: { otherUserId: string }) => {
    const firestore = useFirestore();
    const otherUserRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, 'users', otherUserId);
    }, [firestore, otherUserId]);

    const { data: otherUser, isLoading } = useDoc<User>(otherUserRef);

    if (isLoading || !otherUser) {
        return (
             <div className='flex items-center gap-3'>
                <Skeleton className='size-9 rounded-full'/>
                <div className='space-y-1'>
                    <Skeleton className='h-4 w-24' />
                    <Skeleton className='h-3 w-16' />
                </div>
            </div>
        )
    }

    const lastSeenDate = otherUser.lastSeen?.toDate ? otherUser.lastSeen.toDate() : null;

    return (
        <div className='flex items-center gap-3'>
            <UserAvatar src={otherUser.avatarUrl} name={otherUser.name} isOnline={otherUser.online} />
            <div>
                <h2 className="font-headline text-lg font-semibold">{otherUser.name || 'User'}</h2>
                <p className="text-sm text-muted-foreground">
                    {otherUser.online ? 'Online' : (lastSeenDate ? `Last seen ${formatDistanceToNow(lastSeenDate, { addSuffix: true })}` : 'Offline')}
                </p>
            </div>
        </div>
    )
};


type ChatViewProps = {
  chat: Chat | null;
  currentUser: (User & { email: string }) | null;
};

export function ChatView({ chat, currentUser }: ChatViewProps) {
  const [inputValue, setInputValue] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const firestore = useFirestore();

  const { data: messages, isLoading: messagesLoading } = useMessages(chat?.id || null);

  const chatUsersQuery = useMemoFirebase(() => {
    if (!firestore || !chat || !chat.members || chat.members.length === 0) return null;
    const memberIds = chat.members.length > 30 ? chat.members.slice(0, 30) : chat.members;
    return query(collection(firestore, 'userDirectory'), where('id', 'in', memberIds));
  }, [firestore, chat]);

  const { data: chatUsers } = useCollection<User>(chatUsersQuery);

  const isDM = chat?.isDM && chat?.members.length === 2;
  const otherUserIdInDM = isDM && chat?.members.find(id => id !== currentUser?.id);


  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && chat && currentUser && firestore) {
      const messagesColRef = collection(firestore, 'chats', chat.id, 'messages');
      addDocumentNonBlocking(messagesColRef, {
        authorId: currentUser.id,
        content: inputValue.trim(),
        timestamp: serverTimestamp(),
        readStatus: null,
        reactions: [],
      });
      setInputValue('');
    }
  };

  const handleAutomationsUpdate = (chatId: string, updatedAutomations: any) => {
    if (!firestore) return;
    const chatRef = doc(firestore, 'chats', chatId);
    updateDocumentNonBlocking(chatRef, { automations: updatedAutomations });
  };
  
  const markMessagesAsRead = async () => {
    if (!chat || !currentUser || messagesLoading || !messages || !firestore) return;

    const batch = writeBatch(firestore);
    const unreadMessages = messages.filter(
        (msg) => msg.authorId !== currentUser.id && msg.readStatus !== 'read'
    );

    if (unreadMessages.length > 0) {
        unreadMessages.forEach((msg) => {
            if (!msg.id) return;
            const msgRef = doc(firestore, 'chats', chat.id, 'messages', msg.id);
            batch.update(msgRef, { readStatus: 'read' });
        });
        await batch.commit().catch(console.error);
    }
  };

  useEffect(() => {
    if (chat?.id && currentUser?.id) {
        markMessagesAsRead();
    }
  }, [chat?.id, messages, currentUser?.id]);
  
  useEffect(() => {
    if (scrollViewportRef.current) {
      setTimeout(() => {
        scrollViewportRef.current?.scrollTo({
            top: scrollViewportRef.current.scrollHeight,
            behavior: 'smooth',
        });
      }, 100);
    }
  }, [messages, chat?.id]);

  const headerContent = useMemo(() => {
    if (!chat) return null;

    if (isDM && otherUserIdInDM) {
        return <DMHeaderContent otherUserId={otherUserIdInDM} />
    }
    
    if (!isDM && chatUsers) {
        return (
            <>
                <GroupAvatar userIds={chat.members} allUsers={chatUsers} />
                <div>
                    <h2 className="font-headline text-lg font-semibold">{chat.name}</h2>
                    <p className="text-sm text-muted-foreground">
                    {chat.description}
                    </p>
                </div>
            </>
        )
    }

    return (
        <div className='flex items-center gap-3'>
            <Skeleton className='size-9 rounded-full'/>
            <div className='space-y-1'>
                <Skeleton className='h-4 w-32' />
                <Skeleton className='h-3 w-48' />
            </div>
        </div>
    );
  }, [isDM, otherUserIdInDM, chat, chatUsers, currentUser]);

  if (!chat || !currentUser) {
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
              Select a chat to start talking, or create a new one to begin a
              new conversation.
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <motion.div
      key={chat.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex h-full flex-col bg-muted/30"
    >
      <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background/80 p-4 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          {headerContent}
        </div>
        {!isDM && (
            <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)}>
            <Settings className="h-5 w-5" />
            <span className="sr-only">Chat Settings</span>
            </Button>
        )}
      </header>

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full" viewportRef={scrollViewportRef}>
          <div className="space-y-6 p-4 md:p-8">
            {messages && chatUsers && messages.map((message) => {
              const author = chatUsers.find((u) => u.id === message.authorId);
              if (!author) return null;
              return (
                <ChatMessage
                  key={message.id}
                  chatId={chat.id}
                  message={message}
                  author={author}
                  isSender={message.authorId === currentUser?.id}
                  currentUser={currentUser}
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
             <div className="absolute right-1 top-1/2 -translate-y-1/2">
                <ReactionPicker onSelect={(emoji) => setInputValue(prev => prev + emoji)}>
                    <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    className="h-8 w-8 hover:bg-muted/50"
                    >
                    <p className="text-xl">🙂</p>
                    <span className="sr-only">Add emoji</span>
                    </Button>
                </ReactionPicker>
            </div>
          </div>

          <Button type="submit" size="icon" disabled={!inputValue.trim()} className="rounded-full">
            <Send className="h-5 w-5" />
            <span className="sr-only">Send message</span>
          </Button>
        </form>
      </footer>
      {!isDM && <AutomationSettingsDialog 
        channel={chat}
        isOpen={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        onAutomationsUpdate={handleAutomationsUpdate}
      />}
    </motion.div>
  );
}
