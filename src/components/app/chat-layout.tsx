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
import { MessageSquare, Users, LogOut, Search, Bell, UserPlus, Settings } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import type { Chat, User as UserType, Message, ChatRequest } from '@/lib/types';
import { ChatView } from './chat-view';
import { UserAvatar } from './user-avatar';
import { FindPeopleDialog } from './find-people-dialog';
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
import { useAuth, useUser, useDoc, useFirestore, useCollection, useMemoFirebase, useFirebaseApp } from '@/firebase';
import { doc, collection, query, where, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getDatabase, ref, onValue, onDisconnect, set } from 'firebase/database';
import { setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Skeleton } from '../ui/skeleton';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '../ui/dropdown-menu';

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
        return doc(firestore, 'userDirectory', otherUserId);
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
  const [isFindPeopleOpen, setIsFindPeopleOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isRequestsOpen, setIsRequestsOpen] = useState(false);
  const [selectedUserForProfile, setSelectedUserForProfile] = useState<UserType | null>(null);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const firebaseApp = useFirebaseApp();
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
    if (!user || !firestore || !firebaseApp) return;
  
    const db = getDatabase(firebaseApp);
    const userStatusDatabaseRef = ref(db, `/status/${user.uid}`);
    const userStatusFirestoreRef = doc(firestore, 'users', user.uid);
  
    const isOfflineForFirestore = {
      online: false,
      lastSeen: serverTimestamp(),
    };
  
    const isOnlineForFirestore = {
      online: true,
      lastSeen: serverTimestamp(),
    };
  
    const isOfflineForDatabase = {
      online: false,
      lastSeen: { '.sv': 'timestamp' }, // RTDB server timestamp
    };
  
    const isOnlineForDatabase = {
      online: true,
      lastSeen: { '.sv': 'timestamp' },
    };
  
    const connectedRef = ref(db, '.info/connected');
  
    const unsubscribe = onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        // We're connected.
        onDisconnect(userStatusDatabaseRef).set(isOfflineForDatabase).then(() => {
          set(userStatusDatabaseRef, isOnlineForDatabase);
          updateDocumentNonBlocking(userStatusFirestoreRef, isOnlineForFirestore);
        });
      }
    });
  
    return () => {
      unsubscribe();
      // On unmount, if user is still logged in, set them to offline.
      if (auth.currentUser) {
        updateDocumentNonBlocking(userStatusFirestoreRef, isOfflineForFirestore);
        set(userStatusDatabaseRef, isOfflineForDatabase);
      }
    };
  }, [user, firestore, firebaseApp, auth]);
  

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
    if (!firestore) return;

    const isDM = newChatData.isDM;
    // For DMs, create a consistent ID
    const chatId = isDM 
      ? `dm-${newChatData.members.sort().join('-')}`
      : `chat-${Date.now()}`;
      
    const chatRef = doc(firestore, 'chats', chatId);
    const chatWithId = { ...newChatData, id: chatId };

    setDocumentNonBlocking(chatRef, chatWithId, {merge: false});

    handleSelectChat(chatId);
  };

  const handleShowUserProfile = (userToShow: UserType) => {
    setSelectedUserForProfile(userToShow);
    setIsProfileOpen(true);
    setIsFindPeopleOpen(false); // Close search dialog when profile opens
  };
  
  const handleStartDirectMessage = (otherUser: UserType) => {
    if (!currentUser || !firestore) return;
  
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
    setIsFindPeopleOpen(false);
  };

  const handleLogout = async () => {
    if (user && firestore) {
        const userStatusRef = doc(firestore, 'users', user.uid);
        await updateDoc(userStatusRef, {
            online: false,
            lastSeen: serverTimestamp(),
        });
    }
    if (auth) {
        await auth.signOut();
    }
    router.push('/login');
  };

  const publicChats = useMemo(() => chats?.filter((c) => c.isPublic && !c.isDM) || [], [chats]);
  const groupDMs = useMemo(() => chats?.filter(c => c.isDM && c.members.length > 2) || [], [chats]);
  const directMessages = useMemo(() => chats?.filter(c => c.isDM && c.members.length === 2) || [], [chats]);

  return (
    <div className="flex h-screen w-full flex-col">
      <main className="flex flex-1">
        <TooltipProvider>
          <SidebarProvider>
            <div className="flex h-screen w-full bg-background text-foreground">
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
                        onClick={() => setIsFindPeopleOpen(true)}
                      >
                        <UserPlus className="size-4" />
                        <span>New Chat</span>
                      </Button>
                    </TooltipTrigger>
                  </Tooltip>

                  <div className="flex flex-col items-center gap-2 group-data-[collapsible=expanded]:items-stretch">
                    <ThemeSwitcher />
                     {currentUser ? (
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="flex h-auto w-full justify-start gap-3 rounded-lg p-2 transition-colors duration-200 hover:bg-muted">
                                    <UserAvatar
                                        src={currentUser.avatarUrl}
                                        name={currentUser.name}
                                        isOnline={currentUser.online}
                                    />
                                    <div className="flex-1 text-left">
                                        <p className="text-sm font-semibold">
                                        {currentUser.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {currentUser.userCode}
                                        </p>
                                    </div>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent side="top" align="start" className="w-56">
                                <DropdownMenuItem onClick={() => setIsRequestsOpen(true)}>
                                    <Bell className="mr-2 size-4" />
                                    <span>Chat Requests</span>
                                     {chatRequests && chatRequests.length > 0 && (
                                        <Badge
                                            variant="destructive"
                                            className="ml-auto h-5 w-5 justify-center rounded-full p-0 text-xs"
                                        >
                                            {chatRequests.length}
                                        </Badge>
                                    )}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => currentUser && handleShowUserProfile(currentUser)}>
                                    <UserPlus className="mr-2 size-4" />
                                    <span>Profile</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout}>
                                    <LogOut className="mr-2 size-4" />
                                    <span>Log out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <div className="flex w-full items-center gap-2 rounded-lg p-2">
                          <Skeleton className="size-10 rounded-full" />
                          <div className="flex-1 space-y-1">
                            <Skeleton className="h-4 w-24" />
                             <Skeleton className="h-3 w-16" />
                          </div>
                        </div>
                      )}
                  </div>
                </SidebarFooter>
              </Sidebar>
                <div className="flex-1 flex flex-col">
                    <header className="absolute left-4 top-4 z-20">
                      <SidebarTrigger />
                    </header>
                    <ChatView
                    key={selectedChatId}
                    currentUser={currentUser}
                    chat={selectedChat || null}
                    />
                </div>
            </div>
            {currentUser && (
            <FindPeopleDialog
              isOpen={isFindPeopleOpen}
              onOpenChange={setIsFindPeopleOpen}
              onCreateChat={handleCreateChat}
              onSelectUser={handleShowUserProfile}
              currentUser={currentUser}
            />
            )}
            {currentUser && (
              <>
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
                currentUser={currentUser}
              />
            )}
          </SidebarProvider>
        </TooltipProvider>
      </main>
    </div>
  );
}
