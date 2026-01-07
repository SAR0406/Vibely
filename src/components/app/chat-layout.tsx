'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { MessageSquare, PlusCircle, Users, LogOut, Search, Bell } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import type { Chat, User as UserType, Message, ChatRequest } from '@/lib/types';
import { ChatView } from './chat-view';
import { UserAvatar } from './user-avatar';
import { CreateChatDialog } from './create-chat-dialog';
import { SidebarSearchDialog } from './sidebar-search-dialog';
import { UserProfileDialog } from './user-profile-dialog';
import { ChatRequestsDialog } from './chat-requests-dialog';
import { Button } from '../ui/button';
import { ThemeSwitcher } from './theme-switcher';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuth, useUser, useDoc, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Skeleton } from '../ui/skeleton';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';

const ChevronsRight = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="m6 17 5-5-5-5" />
    <path d="m13 17 5-5-5-5" />
  </svg>
);

function useChats() {
  const firestore = useFirestore();
  const { user } = useUser();

  const chatsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'chats'),
      where('members', 'array-contains', user.uid)
    );
  }, [firestore, user]);

  return useCollection<Chat>(chatsQuery);
}

const DMMenuItem = ({ chat, isActive, onSelect }: { chat: Chat, isActive: boolean, onSelect: (id: string) => void }) => {
    const { user } = useUser();
    const firestore = useFirestore();

    const otherUserId = useMemo(() => chat.members.find(m => m !== user?.uid), [chat.members, user]);

    const otherUserDocRef = useMemoFirebase(() => {
        if (!firestore || !otherUserId) return null;
        return doc(firestore, 'users', otherUserId);
    }, [firestore, otherUserId]);

    const { data: otherUser } = useDoc<UserType>(otherUserDocRef);

    const messagesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'chats', chat.id, 'messages'));
    }, [firestore, chat.id]);

    const { data: messages } = useCollection<Message>(messagesQuery);
    
    const hasUnread = useMemo(() => {
      if (!messages || !user) return false;
      return messages.some(msg => msg.readStatus !== 'read' && msg.authorId !== user.uid);
    }, [messages, user]);


    if (!otherUser) {
        return (
             <div className="flex h-10 items-center gap-2 rounded-md p-2">
                <Skeleton className="size-6 rounded-full" />
                <Skeleton className="h-4 w-20" />
            </div>
        )
    }

    return (
        <SidebarMenuItem>
            <SidebarMenuButton
                onClick={() => onSelect(chat.id)}
                isActive={isActive}
                tooltip={otherUser.fullName}
            >
                <div className='relative'>
                    <UserAvatar src={otherUser.avatarUrl} name={otherUser.fullName || ''} isOnline={otherUser.online}/>
                    {hasUnread && <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-primary ring-2 ring-background" />}
                </div>
                <span>{otherUser.fullName}</span>
            </SidebarMenuButton>
        </SidebarMenuItem>
    )
}


export default function ChatLayout() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isRequestsOpen, setIsRequestsOpen] = useState(false);
  const [selectedUserForProfile, setSelectedUserForProfile] = useState<UserType | null>(null);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const auth = useAuth();
  const { user } = useUser();
  const firestore = useFirestore();

  const { data: chats, isLoading: chatsLoading } = useChats();

  const userDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);
  
  const { data: currentUserProfile } = useDoc<UserType>(userDocRef);

  const chatRequestsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/chatRequests`), where('status', '==', 'pending'));
  }, [user, firestore]);

  const { data: chatRequests } = useCollection<ChatRequest>(chatRequestsQuery);

  useEffect(() => {
    if (user && firestore) {
      const userStatusRef = doc(firestore, 'users', user.uid);
      
      updateDocumentNonBlocking(userStatusRef, { online: true });

      const handleBeforeUnload = () => {
        updateDoc(userStatusRef, {
          online: false,
          lastSeen: serverTimestamp(),
        });
      };

      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        updateDocumentNonBlocking(userStatusRef, {
          online: false,
          lastSeen: serverTimestamp(),
        });
      };
    }
  }, [user, firestore]);
  

  const currentUser = useMemo(() => {
    if (!user || !currentUserProfile) return null;
    return {
      id: user.uid,
      name: currentUserProfile.fullName || 'User',
      avatarUrl: currentUserProfile.avatarUrl || '',
      online: currentUserProfile.online || false, 
      ...currentUserProfile,
    };
  }, [user, currentUserProfile]);

  const selectedChatId = searchParams.get('id');

  const selectedChat = useMemo(
    () => chats?.find((c) => c.id === selectedChatId),
    [chats, selectedChatId]
  );
  
  const handleSelectChat = (chatId: string) => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('id', chatId);
    router.push(`${pathname}?${newSearchParams.toString()}`);
  }

  const handleCreateChat = (newChatData: Omit<Chat, 'id'>) => {
    const chatId = `chat-${Date.now()}`;
    const chatRef = doc(firestore, 'chats', chatId);
    const chatWithId = { ...newChatData, id: chatId };

    setDocumentNonBlocking(chatRef, chatWithId, {merge: false});

    handleSelectChat(chatId);
  };

  const handleShowUserProfile = (userToShow: UserType) => {
    setSelectedUserForProfile(userToShow);
    setIsProfileOpen(true);
    setIsSearchOpen(false); // Close search dialog when profile opens
  };
  
  const handleStartDirectMessage = (otherUser: UserType) => {
    if (!currentUser) return;
  
    const existingChat = chats?.find(c => 
      c.isDM &&
      c.members.length === 2 &&
      c.members.includes(currentUser.id) &&
      c.members.includes(otherUser.id)
    );
  
    if (existingChat) {
      handleSelectChat(existingChat.id);
    } else {
      const chatId = `dm-${[currentUser.id, otherUser.id].sort().join('-')}`;
      const chatRef = doc(firestore, 'chats', chatId);
      const newChat: Chat = {
        id: chatId,
        name: otherUser.fullName || otherUser.username || 'Direct Message',
        description: `Direct message with ${otherUser.fullName}`,
        members: [currentUser.id, otherUser.id],
        isDM: true,
        isPublic: false,
        ownerId: currentUser.id,
        automations: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
  
      setDocumentNonBlocking(chatRef, newChat, { merge: false });
      handleSelectChat(chatId);
    }
    setIsProfileOpen(false);
    setIsRequestsOpen(false);
  };

  const handleLogout = async () => {
    if (user) {
        const userStatusRef = doc(firestore, 'users', user.uid);
        await updateDoc(userStatusRef, {
            online: false,
            lastSeen: serverTimestamp(),
        });
    }
    await auth.signOut();
    router.push('/login');
  };

  const publicChats = useMemo(() => chats?.filter((c) => c.isPublic && !c.isDM) || [], [chats]);
  const groupDMs = useMemo(() => chats?.filter(c => c.isDM && c.members.length > 2) || [], [chats]);
  const directMessages = useMemo(() => chats?.filter(c => c.isDM && c.members.length === 2) || [], [chats]);


  return (
    <TooltipProvider>
      <SidebarProvider>
        <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
          <Sidebar
            variant="sidebar"
            collapsible="offcanvas"
            className="border-r"
          >
            <SidebarHeader className="h-16 items-center justify-center p-0">
              <Link href="/">
                <ChevronsRight className="size-8 text-primary" />
              </Link>
            </SidebarHeader>
            <SidebarContent className="p-2">
              <div className="flex flex-col gap-4">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                        variant="ghost"
                        className="w-full justify-start gap-2"
                        onClick={() => setIsSearchOpen(true)}
                        >
                        <Search className="size-4" />
                        <span>
                            Search
                        </span>
                        </Button>
                    </TooltipTrigger>
                </Tooltip>

                {chatsLoading ? (
                    <div className="space-y-2 p-2">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                    </div>
                ) : (
                    <>
                        {publicChats.length > 0 && (
                        <div>
                        <p className="px-2 text-xs font-semibold uppercase text-muted-foreground">
                            Chats
                        </p>
                        <SidebarMenu>
                            {publicChats.map((chat) => (
                            <SidebarMenuItem key={chat.id}>
                                <SidebarMenuButton
                                onClick={() => handleSelectChat(chat.id)}
                                isActive={selectedChatId === chat.id}
                                >
                                <MessageSquare />
                                <span>{chat.name}</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                        </div>
                        )}

                        {groupDMs.length > 0 && (
                             <div>
                             <p className="px-2 text-xs font-semibold uppercase text-muted-foreground">
                                 Group DMs
                             </p>
                             <SidebarMenu>
                                 {groupDMs.map((chat) => (
                                 <SidebarMenuItem key={chat.id}>
                                     <SidebarMenuButton
                                     onClick={() => handleSelectChat(chat.id)}
                                     isActive={selectedChatId === chat.id}
                                     >
                                     <Users />
                                     <span>{chat.name}</span>
                                     </SidebarMenuButton>
                                 </SidebarMenuItem>
                                 ))}
                             </SidebarMenu>
                             </div>
                        )}

                        {directMessages.length > 0 && (
                            <div>
                                <p className="px-2 text-xs font-semibold uppercase text-muted-foreground">
                                Direct Messages
                                </p>
                                <SidebarMenu>
                                {directMessages.map((chat) => (
                                    <DMMenuItem 
                                        key={chat.id}
                                        chat={chat}
                                        isActive={selectedChatId === chat.id}
                                        onSelect={handleSelectChat}
                                    />
                                ))}
                                </SidebarMenu>
                            </div>
                        )}
                    </>
                )}

              </div>
            </SidebarContent>
            <SidebarFooter className="p-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-center gap-2"
                    onClick={() => setIsCreateOpen(true)}
                  >
                    <PlusCircle className="size-4" />
                    <span>
                      Create Chat
                    </span>
                  </Button>
                </TooltipTrigger>
              </Tooltip>

              <div className="flex flex-col items-center gap-2 group-data-[collapsible=expanded]:items-stretch">
                <ThemeSwitcher />
                <div className="flex items-center gap-3 rounded-lg p-2 transition-colors duration-200 hover:bg-muted">
                  {currentUser ? (
                    <>
                      <UserAvatar
                        src={currentUser.avatarUrl}
                        name={currentUser.name}
                        isOnline={currentUser.online}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-semibold">
                          {currentUser.name}
                        </p>
                         <div className="flex items-center gap-1.5">
                            <span className={cn("h-2 w-2 rounded-full", currentUser.online ? 'bg-green-500' : 'bg-gray-400')}></span>
                            <p className="text-xs text-muted-foreground">{currentUser.online ? 'Online' : 'Offline'}</p>
                        </div>
                      </div>
                       <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="relative"
                                onClick={() => setIsRequestsOpen(true)}
                            >
                                <Bell className="size-4" />
                                {chatRequests && chatRequests.length > 0 && (
                                    <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 justify-center rounded-full p-0 text-xs">{chatRequests.length}</Badge>
                                )}
                            </Button>
                        </TooltipTrigger>
                       </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleLogout}
                          >
                            <LogOut className="size-4" />
                          </Button>
                        </TooltipTrigger>
                      </Tooltip>
                    </>
                  ) : (
                    <div className='flex items-center gap-2 w-full'>
                        <Skeleton className="size-8 rounded-full" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                  )}
                </div>
              </div>
            </SidebarFooter>
          </Sidebar>

            <header className="absolute left-4 top-4 z-20">
              <SidebarTrigger />
            </header>
            <ChatView
              key={selectedChatId}
              currentUser={currentUser}
              chat={selectedChat || null}
            />
        </div>
        <CreateChatDialog
          isOpen={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          onCreateChat={handleCreateChat}
        />
        {currentUser && (
            <>
                <SidebarSearchDialog
                    isOpen={isSearchOpen}
                    onOpenChange={setIsSearchOpen}
                    currentUser={currentUser}
                    onSelectUser={handleShowUserProfile}
                />
                <ChatRequestsDialog
                    isOpen={isRequestsOpen}
                    onOpenChange={setIsRequestsOpen}
                    onStartChat={handleStartDirectMessage}
                />
            </>
        )}
        {selectedUserForProfile && (
            <UserProfileDialog
                isOpen={isProfileOpen}
                onOpenChange={setIsProfileOpen}
                user={selectedUserForProfile}
                onStartChat={handleStartDirectMessage}
            />
        )}
      </SidebarProvider>
    </TooltipProvider>
  );
}
