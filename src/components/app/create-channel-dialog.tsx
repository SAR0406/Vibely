'use client';

import { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Wand2, Loader2, XIcon } from 'lucide-react';
import {
  getChannelAssistantSuggestions,
  ChannelAssistantOutput,
} from '@/ai/flows/channel-assistant-suggestions';
import { UserAvatar } from './user-avatar';
import { Channel, User } from '@/lib/types';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, or } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';
import { useDebounce } from '@/hooks/use-debounce';
import { ScrollArea } from '../ui/scroll-area';

const formSchema = z.object({
  name: z.string().optional(),
  members: z.array(z.string()).min(1, 'Select at least one member.'),
});

type CreateChannelDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onCreateChannel: (channel: Omit<Channel, 'id'>) => void;
};

const allAutomationSuggestions = [
    { name: 'Welcome Message', description: 'Sends a welcome message to new members.', defaultContent: 'Welcome, {{user}}!' },
    { name: 'Scheduled Event Invite', description: 'Sends invites for scheduled events.', defaultContent: 'Event reminder: {{eventName}} at {{time}}' },
    { name: 'Ice Breaker', description: 'Prompts users with an ice breaker question.', defaultContent: 'What\'s your favorite weekend activity?' },
];

export function CreateChannelDialog({
  isOpen,
  onOpenChange,
  onCreateChannel,
}: CreateChannelDialogProps) {
  const [suggestions, setSuggestions] = useState<ChannelAssistantOutput | null>(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [enabledAutomations, setEnabledAutomations] = useState<Record<string, boolean>>({});
  const { user } = useUser();
  const firestore = useFirestore();

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      members: user ? [user.uid] : [], 
    },
  });

  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !debouncedSearchTerm) return null;
    const term = debouncedSearchTerm.toLowerCase();
    return query(
      collection(firestore, 'users'),
      or(
        where('username', '>=', term),
        where('username', '<=', term + '\uf8ff')
      )
    );
  }, [firestore, debouncedSearchTerm]);

  const { data: searchedUsers, isLoading: isLoadingUsers } = useCollection<User>(usersQuery);

  const currentUserProfile = useMemo(() => {
    if(!user || !searchedUsers) return null;
    return searchedUsers.find(u => u.id === user.uid);
  }, [user, searchedUsers]);

  useEffect(() => {
    if (user && currentUserProfile && !selectedUsers.some(u => u.id === user.uid)) {
        setSelectedUsers([currentUserProfile]);
    }
   }, [user, currentUserProfile, selectedUsers]);

   useEffect(() => {
    if (isOpen) {
        form.reset({ name: '', members: user ? [user.uid] : []});
        setSuggestions(null);
        setEnabledAutomations({});
        setSelectedUsers(currentUserProfile ? [currentUserProfile] : []);
        setSearchTerm('');
    }
   }, [isOpen, user, form, currentUserProfile]);

   useEffect(() => {
    const memberIds = selectedUsers.map(u => u.id);
    form.setValue('members', memberIds, { shouldValidate: true });
   }, [selectedUsers, form]);

  const channelName = form.watch('name');
  const memberIds = form.watch('members');

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!channelName || channelName.length < 3 || memberIds.length <= 2) {
        setSuggestions(null);
        return;
      }
      setIsLoadingSuggestions(true);
      try {
        const memberNames = selectedUsers.map(u => u.fullName || 'user');
        const result = await getChannelAssistantSuggestions({
          channelTitle: channelName,
          memberList: memberNames,
        });
        setSuggestions(result);
        const initialEnabledState = result.automationSuggestions.reduce((acc, cur) => ({ ...acc, [cur]: true }), {});
        setEnabledAutomations(initialEnabledState);

      } catch (error) {
        console.error('Failed to get suggestions:', error);
      } finally {
        setIsLoadingSuggestions(false);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 500);
    return () => clearTimeout(timeoutId);
  }, [channelName, memberIds, selectedUsers]);

  const toggleMember = (member: User) => {
    if (member.id === user?.uid) return; 
    setSelectedUsers(prev => 
        prev.some(u => u.id === member.id)
            ? prev.filter(u => u.id !== member.id)
            : [...prev, member]
    );
  };
  
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if(!user) return;
    const isDM = values.members.length === 2;

    if (!isDM && (!values.name || values.name.length < 3)) {
        form.setError("name", { type: "manual", message: "Channel name must be at least 3 characters for group chats." });
        return;
    }

    const otherUserForDM = isDM ? selectedUsers.find(u => u.id !== user.uid) : null;

    const newChannel: Omit<Channel, 'id'> = {
        name: isDM ? (otherUserForDM?.fullName || 'Direct Message') : values.name!,
        description: isDM ? `Direct message with ${otherUserForDM?.fullName || 'user'}` : (suggestions?.descriptionSuggestion || `A channel for ${values.name}`),
        members: values.members,
        isPublic: !isDM,
        isDM: isDM,
        ownerId: user.uid,
        automations: allAutomationSuggestions
            .filter(auto => enabledAutomations[auto.name])
            .map(auto => ({
                id: `auto-${Date.now()}-${auto.name.replace(/\s/g, '')}`,
                name: auto.name,
                description: auto.description,
                enabled: true,
                content: auto.defaultContent,
            }))
    };
    onCreateChannel(newChannel);
    onOpenChange(false);
  };

  const displayedSearchResults = useMemo(() => {
    if (!searchedUsers) return [];
    return searchedUsers.filter(u => u.id !== user?.uid);
  }, [searchedUsers, user]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline">Create a New Channel or DM</DialogTitle>
          <DialogDescription>
            Select one person for a direct message, or multiple for a group. Public channels require a name.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Channel Name (for groups)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Q4-Launch-Plan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem>
                <FormLabel>Members</FormLabel>
                <div className="flex flex-wrap items-start gap-2 rounded-md border p-2 min-h-[60px]">
                    {selectedUsers.map(u => (
                        <Badge key={u.id} variant={'default'} className="gap-1">
                            <UserAvatar src={u.avatarUrl} name={u.fullName || 'User'} className="size-4" />
                            {u.id === user?.uid ? 'You' : u.fullName}
                            {u.id !== user?.uid && (
                                <button type="button" onClick={() => toggleMember(u)} className='ml-1 opacity-50 hover:opacity-100'>
                                    <XIcon className='size-3'/>
                                </button>
                            )}
                        </Badge>
                    ))}
                </div>
                
                <Input
                    placeholder="Search to add members..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
                
                <ScrollArea className="h-48 border rounded-md">
                     <div className="p-2">
                        {isLoadingUsers && <Loader2 className="mx-auto my-4 size-5 animate-spin" />}
                        {!isLoadingUsers && debouncedSearchTerm && displayedSearchResults.length === 0 && <p className='text-center text-sm text-muted-foreground p-4'>No users found.</p>}
                        {displayedSearchResults.map(u => (
                            <Button
                                type="button"
                                key={u.id}
                                variant={selectedUsers.some(su => su.id === u.id) ? 'secondary' : 'ghost'}
                                className="w-full justify-start h-auto p-2"
                                onClick={() => toggleMember(u)}
                            >
                                <UserAvatar src={u.avatarUrl} name={u.fullName || 'User'} className="mr-2" />
                                <div>
                                    <p>{u.fullName}</p>
                                    <p className='text-xs text-muted-foreground'>@{u.username}</p>
                                </div>
                            </Button>
                        ))}
                    </div>
                </ScrollArea>
                <FormMessage>{form.formState.errors.members?.message}</FormMessage>
              </FormItem>
            </div>
            
            <div className="space-y-4 rounded-lg bg-accent/50 p-4 border border-dashed">
                <div className="flex items-center gap-2">
                    <Wand2 className="size-5 text-primary"/>
                    <h3 className="font-headline text-lg font-semibold">AI Assistant</h3>
                    {isLoadingSuggestions && <Loader2 className="size-4 animate-spin"/>}
                </div>

                {suggestions && memberIds.length > 2 ? (
                    <div className="space-y-4">
                        <div>
                            <Label>Suggested Description</Label>
                            <p className="text-sm text-muted-foreground p-2 bg-background rounded-md">{suggestions.descriptionSuggestion}</p>
                        </div>
                        <div>
                            <Label>Suggested Automations</Label>
                            <div className="space-y-3 pt-2">
                                {suggestions.automationSuggestions.map(name => (
                                    <div key={name} className="flex items-center justify-between p-2 bg-background rounded-md">
                                        <Label htmlFor={name} className="text-sm font-normal">{name}</Label>
                                        <Switch
                                            id={name}
                                            checked={enabledAutomations[name] ?? false}
                                            onCheckedChange={(checked) => setEnabledAutomations(prev => ({...prev, [name]: checked}))}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                        {memberIds.length <= 2 ? 'AI suggestions available for groups of 3 or more.' : 'Enter a channel name to get AI suggestions.'}
                    </p>
                )}
            </div>

            <DialogFooter className="md:col-span-2 mt-4">
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">Create</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
