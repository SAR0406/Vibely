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
import {
  MessageSquare,
  PlusCircle,
  Users,
  LogOut,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import type { Channel, Message, Automation, User as UserType } from '@/lib/types';
import {
  channels as initialChannels,
  messages as initialMessages,
  users as staticUsers,
} from '@/lib/data';
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
import { useAuth, useUser, useDoc, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';

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

export default function ChatLayout() {
  const [channels, setChannels] = useState<Channel[]>(initialChannels);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(
    'channel-1'
  );
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const auth = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  const userDocRef = useMemo(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);

  const { data: currentUserProfile } = useDoc<UserType>(userDocRef);

  const currentUser = useMemo(() => {
    if (!user || !currentUserProfile) {
      // Return a default/guest user object or null
      return staticUsers.find(u => u.id === 'user-5');
    }
    return {
      id: user.uid,
      name: currentUserProfile.fullName || 'User',
      avatarUrl: currentUserProfile.avatarUrl || '',
      online: true,
    };
  }, [user, currentUserProfile]);

  const selectedChannel = useMemo(
    () => channels.find((c) => c.id === selectedChannelId),
    [channels, selectedChannelId]
  );

  const channelMessages = useMemo(
    () => messages.filter((m) => m.channelId === selectedChannelId),
    [messages, selectedChannelId]
  );

  const handleCreateChannel = (newChannel: Channel) => {
    setChannels((prev) => [...prev, newChannel]);
    setSelectedChannelId(newChannel.id);
  };

  const handleSendMessage = (content: string) => {
    if (!selectedChannelId || !currentUser) return;
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      channelId: selectedChannelId,
      authorId: currentUser.id,
      content,
      timestamp: new Date().toISOString(),
      readStatus: 'sent',
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const handleUpdateAutomations = (
    channelId: string,
    updatedAutomations: Automation[]
  ) => {
    setChannels((prev) =>
      prev.map((c) =>
        c.id === channelId ? { ...c, automations: updatedAutomations } : c
      )
    );
  };

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/login');
  };

  const publicChannels = channels.filter((c) => c.type === 'public');
  const privateChannels = channels.filter((c) => c.type === 'private');

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
                          onClick={() => setSelectedChannelId(channel.id)}
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
                          onClick={() => setSelectedChannelId(channel.id)}
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
                        <p className="text-sm font-semibold">{currentUser.name}</p>
                        <p className="text-xs text-muted-foreground">Online</p>
                      </div>
                       <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={handleLogout} className="group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10">
                            <LogOut className="size-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="group-data-[collapsible=icon]:block hidden">Logout</TooltipContent>
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
              currentUser={currentUser || null}
              channel={selectedChannel || null}
              messages={channelMessages}
              onSendMessage={handleSendMessage}
              onAutomationsUpdate={handleUpdateAutomations}
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
