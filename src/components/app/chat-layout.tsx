'use client';

import { useState, useMemo } from 'react';
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
import { MessageSquare, PlusCircle, Users, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import type { Channel, User as UserType } from '@/lib/types';
import { ChatView } from './chat-view';
import { UserAvatar } from './user-avatar';
import { CreateChannelDialog } from './create-channel-dialog';
import { Button } from '../ui/button';
import { ThemeSwitcher } from './theme-switcher';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuth, useUser, useDoc, useFirestore, useCollection } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';

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

  const channelsQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'channels'),
      where('members', 'array-contains', user.uid)
    );
  }, [firestore, user]);

  return useCollection<Channel>(channelsQuery);
}

export default function ChatLayout() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const auth = useAuth();
  const { user } = useUser();
  const firestore = useFirestore();

  const { data: channels, isLoading: channelsLoading } = useChannels();

  const userDocRef = useMemo(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);

  const { data: currentUserProfile } = useDoc<UserType>(userDocRef);

  const currentUser = useMemo(() => {
    if (!user || !currentUserProfile) return null;
    return {
      id: user.uid,
      name: currentUserProfile.fullName || 'User',
      avatarUrl: currentUserProfile.avatarUrl || '',
      online: true,
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

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/login');
  };

  const publicChannels = useMemo(() => channels?.filter((c) => c.type === 'public') || [], [channels]);
  const privateChannels = useMemo(() => channels?.filter((c) => c.type === 'private') || [], [channels]);


  return (
    <TooltipProvider>
      <SidebarProvider>
        <div className="flex min-h-screen bg-background text-foreground">
          <Sidebar
            variant="inset"
            collapsible="icon"
            className="border-r border-border/20"
          >
            <SidebarHeader className="h-16 items-center justify-center p-0">
              <Link href="/">
                <ChevronsRight className="size-8 text-primary" />
              </Link>
            </SidebarHeader>
            <SidebarContent className="p-2">
              <div className="flex flex-col gap-4">
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
                <div>
                  <p className="px-2 text-xs font-semibold uppercase text-muted-foreground group-data-[collapsible=icon]:hidden">
                    Direct Messages
                  </p>
                  <SidebarMenu>
                    {privateChannels.map((channel) => (
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
                  className="group-data-[collapsible=icon]:block hidden"
                >
                  Create Channel
                </TooltipContent>
              </Tooltip>

              <div className="flex flex-col gap-2 items-center group-data-[collapsible=expanded]:items-stretch">
                <ThemeSwitcher />
                <div className="flex items-center gap-3 rounded-lg p-2 transition-colors duration-200 hover:bg-muted/50 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:justify-center">
                  {currentUser && (
                    <>
                      <UserAvatar
                        src={currentUser.avatarUrl}
                        name={currentUser.name}
                        isOnline
                      />
                      <div className="flex-1 group-data-[collapsible=icon]:hidden">
                        <p className="text-sm font-semibold">
                          {currentUser.name}
                        </p>
                        <p className="text-xs text-muted-foreground">Online</p>
                      </div>
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
                          className="group-data-[collapsible=icon]:block hidden"
                        >
                          Logout
                        </TooltipContent>
                      </Tooltip>
                    </>
                  )}
                </div>
              </div>
            </SidebarFooter>
          </Sidebar>

          <SidebarInset className="max-h-screen overflow-hidden bg-muted/30">
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
      </SidebarProvider>
    </TooltipProvider>
  );
}
