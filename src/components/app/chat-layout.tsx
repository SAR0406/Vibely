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
  ChevronsRight,
  MessageSquare,
  PlusCircle,
  Users,
  Sun,
  Moon,
} from 'lucide-react';

import type { Channel, Message, User, Automation } from '@/lib/types';
import {
  channels as initialChannels,
  messages as initialMessages,
  users,
} from '@/lib/data';
import { ChatView } from './chat-view';
import { UserAvatar } from './user-avatar';
import { CreateChannelDialog } from './create-channel-dialog';
import { Button } from '../ui/button';

export default function ChatLayout() {
  const [channels, setChannels] = useState<Channel[]>(initialChannels);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(
    'channel-1'
  );
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  const currentUser = users.find((u) => u.id === 'user-5') as User;
  
  useEffect(() => {
    if (isDarkTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkTheme]);

  const selectedChannel = useMemo(
    () => channels.find((c) => c.id === selectedChannelId),
    [channels, selectedChannelId]
  );

  const channelMessages = useMemo(
    () => messages.filter((m) => m.channelId === selectedChannelId),
    [messages, selectedChannelId]
  );
  
  const handleCreateChannel = (newChannel: Channel) => {
    setChannels(prev => [...prev, newChannel]);
    setSelectedChannelId(newChannel.id);
  }

  const handleSendMessage = (content: string) => {
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      channelId: selectedChannelId!,
      authorId: 'user-5',
      content,
      timestamp: new Date().toISOString(),
      readStatus: 'sent',
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const handleUpdateAutomations = (channelId: string, updatedAutomations: Automation[]) => {
    setChannels(prev => prev.map(c => c.id === channelId ? {...c, automations: updatedAutomations} : c))
  }

  const publicChannels = channels.filter(c => c.type === 'public');
  const privateChannels = channels.filter(c => c.type === 'private');

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar variant="inset" collapsible="icon">
          <SidebarHeader className="items-center justify-center">
            <ChevronsRight className="size-8 text-primary" />
            <h1 className="font-headline text-2xl font-bold text-center group-data-[collapsible=icon]:hidden">
              Vibely
            </h1>
          </SidebarHeader>
          <SidebarContent className="p-2">
            <div className="flex flex-col gap-4">
              <div>
                <p className="px-2 text-xs text-muted-foreground font-semibold uppercase group-data-[collapsible=icon]:hidden">
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
                <p className="px-2 text-xs text-muted-foreground font-semibold uppercase group-data-[collapsible=icon]:hidden">
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
             <Button
                variant="ghost"
                className="w-full justify-start gap-2"
                onClick={() => setIsCreateOpen(true)}
              >
                <PlusCircle className="size-4" />
                <span className="group-data-[collapsible=icon]:hidden">Create Channel</span>
              </Button>
            <div className="flex items-center gap-3 rounded-lg p-2 bg-muted/50 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:justify-center">
              <UserAvatar
                src={currentUser.avatarUrl}
                name={currentUser.name}
                isOnline
              />
              <div className="flex-1 group-data-[collapsible=icon]:hidden">
                <p className="text-sm font-semibold">{currentUser.name}</p>
                <p className="text-xs text-muted-foreground">Online</p>
              </div>
               <Button variant="ghost" size="icon" onClick={() => setIsDarkTheme(!isDarkTheme)} className="group-data-[collapsible=icon]:hidden">
                {isDarkTheme ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="max-h-screen overflow-hidden">
          <header className="absolute left-4 top-4 z-20">
            <SidebarTrigger />
          </header>
          <ChatView
            channel={selectedChannel || null}
            messages={channelMessages}
            onSendMessage={handleSendMessage}
            onAutomationsUpdate={handleUpdateAutomations}
          />
        </SidebarInset>
      </div>
      <CreateChannelDialog isOpen={isCreateOpen} onOpenChange={setIsCreateOpen} onCreateChannel={handleCreateChannel}/>
    </SidebarProvider>
  );
}
