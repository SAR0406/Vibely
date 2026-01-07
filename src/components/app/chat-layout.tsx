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
  SidebarInset,
} from '@/components/ui/sidebar';
import { MessageSquare, PlusCircle, Users, LogOut, Search, Bell } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import type { Channel, User as UserType, Message, ChatRequest } from '@/lib/types';
import { ChatView } from './chat-view';
import { UserAvatar } from './user-avatar';
import { CreateChannelDialog } from './create-channel-dialog';
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
import { doc, collection, query, where, updateDoc, serverTimestamp } from 'firebase/firestore';
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

function useChannels() {
  const firestore = useFirestore();
  const { user } = useUser();

  const channelsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'channels'),
      where('members', 'array-contains', user.uid)
    );
  }, [firestore, user]);

  return useCollection<Channel>(channelsQuery);
}

const DMMenuItem = ({ channel, isActive, onSelect }: { channel: Channel, isActive: boolean, onSelect: (id: string) => void }) => {
    const { user } = useUser();
    const firestore = useFirestore();

    const otherUserId = useMemo(() => channel.members.find(m => m !== user?.uid), [channel.members, user]);

    const otherUserDocRef = useMemoFirebase(() => {
        if (!firestore || !otherUserId) return null;
        return doc(firestore, 'users', otherUserId);
    }, [firestore, otherUserId]);

    const { data: otherUser } = useDoc<UserType>(otherUserDocRef);

    const messagesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'channels', channel.id, 'messages'));
    }, [firestore, channel.id]);

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
                onClick={() => onSelect(channel.id)}
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

  const { data: channels, isLoading: channelsLoading } = useChannels();

  const userDocRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);
  
  const chatRequestsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/chatRequests`), where('status', '==', 'pending'));
  }, [user, firestore]);

  const { data: currentUserProfile } = useDoc<UserType>(userDocRef);
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

  const selectedChannelId = searchParams.get('id');

  const selectedChannel = useMemo(
    () => channels?.find((c) => c.id === selectedChannelId),
    [channels, selectedChannelId]
  );
  
  const handleSelectChannel = (channelId: string) => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('id', channelId);
    router.push(`${pathname}?${newSearchParams.toString()}`);
  }

  const handleCreateChannel = (newChannelData: Omit<Channel, 'id'>) => {
    const channelId = `channel-${Date.now()}`;
    const channelRef = doc(firestore, 'channels', channelId);
    const channelWithId = { ...newChannelData, id: channelId };

    setDocumentNonBlocking(channelRef, channelWithId, {merge: false});

    handleSelectChannel(channelId);
  };

  const handleShowUserProfile = (userToShow: UserType) => {
    setSelectedUserForProfile(userToShow);
    setIsProfileOpen(true);
    setIsSearchOpen(false); // Close search dialog when profile opens
  };
  
  const handleStartDirectMessage = (otherUser: UserType) => {
    if (!currentUser) return;
  
    const existingChannel = channels?.find(c => 
      c.isDM &&
      c.members.length === 2 &&
      c.members.includes(currentUser.id) &&
      c.members.includes(otherUser.id)
    );
  
    if (existingChannel) {
      handleSelectChannel(existingChannel.id);
    } else {
      const channelId = `dm-${[currentUser.id, otherUser.id].sort().join('-')}`;
      const channelRef = doc(firestore, 'channels', channelId);
      const newChannel: Channel = {
        id: channelId,
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
  
      setDocumentNonBlocking(channelRef, newChannel, { merge: false });
      handleSelectChannel(channelId);
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

  const publicChannels = useMemo(() => channels?.filter((c) => c.isPublic && !c.isDM) || [], [channels]);
  const groupDMs = useMemo(() => channels?.filter(c => c.isDM && c.members.length > 2) || [], [channels]);
  const directMessages = useMemo(() => channels?.filter(c => c.isDM && c.members.length === 2) || [], [channels]);


  return (
    <TooltipProvider>
      <SidebarProvider>
        <div className="flex min-h-screen bg-background text-foreground">
          <Sidebar
            variant="inset"
            collapsible="icon"
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
                        className="w-full justify-start gap-2 group-data-[collapsible=icon]:justify-center"
                        onClick={() => setIsSearchOpen(true)}
                        >
                        <Search className="size-4" />
                        <span className="group-data-[collapsible=icon]:hidden">
                            Search
                        </span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent
                        side="right"
                        className="hidden group-data-[collapsible=icon]:block"
                    >
                        Search users
                    </TooltipContent>
                </Tooltip>

                {channelsLoading ? (
                    <div className="space-y-2 p-2">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                    </div>
                ) : (
                    <>
                        {publicChannels.length > 0 && (
                        <div>
                        <p className="px-2 text-xs font-semibold uppercase text-muted-foreground group-data-[collapsible=icon]:hidden">
                            Channels
                        </p>
                        <SidebarMenu>
                            {publicChannels.map((channel) => (
                            <SidebarMenuItem key={channel.id}>
                                <SidebarMenuButton
                                onClick={() => handleSelectChannel(channel.id)}
                                isActive={selectedChannelId === channel.id}
                                tooltip={channel.name}
                                >
                                <MessageSquare />
                                <span>{channel.name}</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                        </div>
                        )}

                        {groupDMs.length > 0 && (
                             <div>
                             <p className="px-2 text-xs font-semibold uppercase text-muted-foreground group-data-[collapsible=icon]:hidden">
                                 Group DMs
                             </p>
                             <SidebarMenu>
                                 {groupDMs.map((channel) => (
                                 <SidebarMenuItem key={channel.id}>
                                     <SidebarMenuButton
                                     onClick={() => handleSelectChannel(channel.id)}
                                     isActive={selectedChannelId === channel.id}
                                     tooltip={channel.name}
                                     >
                                     <Users />
                                     <span>{channel.name}</span>
                                     </SidebarMenuButton>
                                 </SidebarMenuItem>
                                 ))}
                             </SidebarMenu>
                             </div>
                        )}

                        {directMessages.length > 0 && (
                            <div>
                                <p className="px-2 text-xs font-semibold uppercase text-muted-foreground group-data-[collapsible=icon]:hidden">
                                Direct Messages
                                </p>
                                <SidebarMenu>
                                {directMessages.map((channel) => (
                                    <DMMenuItem 
                                        key={channel.id}
                                        channel={channel}
                                        isActive={selectedChannelId === channel.id}
                                        onSelect={handleSelectChannel}
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
                    className="w-full justify-center gap-2 group-data-[collapsible=icon]:justify-center"
                    onClick={() => setIsCreateOpen(true)}
                  >
                    <PlusCircle className="size-4" />
                    <span className="group-data-[collapsible=icon]:hidden">
                      Create Channel
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="hidden group-data-[collapsible=icon]:block"
                >
                  Create Channel
                </TooltipContent>
              </Tooltip>

              <div className="flex flex-col items-center gap-2 group-data-[collapsible=expanded]:items-stretch">
                <ThemeSwitcher />
                <div className="flex items-center gap-3 rounded-lg p-2 transition-colors duration-200 hover:bg-muted group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0">
                  {currentUser ? (
                    <>
                      <UserAvatar
                        src={currentUser.avatarUrl}
                        name={currentUser.name}
                        isOnline={currentUser.online}
                      />
                      <div className="flex-1 group-data-[collapsible=icon]:hidden">
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
                         <TooltipContent
                          side="right"
                          className="hidden group-data-[collapsible=icon]:block"
                        >
                          Chat Requests
                        </TooltipContent>
                       </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleLogout}
                            className="group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10"
                          >
                            <LogOut className="size-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent
                          side="right"
                          className="hidden group-data-[collapsible=icon]:block"
                        >
                          Logout
                        </TooltipContent>
                      </Tooltip>
                    </>
                  ) : (
                    <div className='flex items-center gap-2 w-full'>
                        <Skeleton className="size-8 rounded-full" />
                        <Skeleton className="h-4 w-24 group-data-[collapsible=icon]:hidden" />
                    </div>
                  )}
                </div>
              </div>
            </SidebarFooter>
          </Sidebar>

          <SidebarInset className="bg-muted/40">
            <header className="absolute left-4 top-4 z-20">
              <SidebarTrigger />
            </header>
            <ChatView
              key={selectedChannelId}
              currentUser={currentUser}
              channel={selectedChannel || null}
            />
          </SidebarInset>
        </div>
        <CreateChannelDialog
          isOpen={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          onCreateChannel={handleCreateChannel}
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
