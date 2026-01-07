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
import { Wand2, Loader2, XIcon, Info } from 'lucide-react';
import {
  getChannelAssistantSuggestions,
  ChannelAssistantOutput,
} from '@/ai/flows/channel-assistant-suggestions';
import { UserAvatar } from './user-avatar';
import { Chat, User, Automation } from '@/lib/types';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import { useDebounce } from '@/hooks/use-debounce';
import { ScrollArea } from '../ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const formSchema = z.object({
  name: z.string().min(1, 'Channel name is required.'),
  members: z.array(z.string()).min(2, 'Select at least one member.'),
});

type CreateChatDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onCreateChat: (chat: Omit<Chat, 'id'>) => void;
  currentUser: User;
};

const allAutomationSuggestions = [
    { id: 'auto-welcome', name: 'Welcome Message', description: 'Sends a welcome message to new members.', content: 'Welcome, {{user}}!' },
    { id: 'auto-events', name: 'Scheduled Event Invite', description: 'Sends invites for scheduled events.', content: 'Event reminder: {{eventName}} at {{time}}' },
    { id: 'auto-icebreaker', name: 'Ice Breaker', description: 'Prompts users with an ice breaker question.', content: 'What\'s your favorite weekend activity?' },
];

export function CreateChatDialog({
  isOpen,
  onOpenChange,
  onCreateChat,
  currentUser,
}: CreateChatDialogProps) {
  const [suggestions, setSuggestions] = useState<ChannelAssistantOutput | null>(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [enabledAutomations, setEnabledAutomations] = useState<Record<string, boolean>>({});
  const firestore = useFirestore();

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      members: currentUser ? [currentUser.id] : [], 
    },
  });

  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !debouncedSearchTerm) return null;
    return query(
      collection(firestore, 'userDirectory'),
      where('searchableTerms', 'array-contains', debouncedSearchTerm.toLowerCase()),
      limit(10)
    );
  }, [firestore, debouncedSearchTerm]);

  const { data: searchedUsers, isLoading: isLoadingUsers } = useCollection<User>(usersQuery);

  useEffect(() => {
    if (currentUser && selectedUsers.length === 0) {
      setSelectedUsers([currentUser]);
    }
   }, [currentUser, selectedUsers]);

   useEffect(() => {
    if (isOpen) {
        form.reset({ name: '', members: currentUser ? [currentUser.id] : []});
        setSuggestions(null);
        setEnabledAutomations({});
        setSelectedUsers(currentUser ? [currentUser] : []);
        setSearchTerm('');
    }
   }, [isOpen, currentUser, form]);

   useEffect(() => {
    const memberIds = selectedUsers.map(u => u.id);
    form.setValue('members', memberIds, { shouldValidate: true });
   }, [selectedUsers, form]);

  const chatName = form.watch('name');
  const memberIds = form.watch('members');

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!chatName || chatName.length < 3 || memberIds.length < 2) {
        setSuggestions(null);
        return;
      }
      setIsLoadingSuggestions(true);
      try {
        const memberNames = selectedUsers.map(u => u.fullName || 'user');
        const result = await getChannelAssistantSuggestions({
          channelTitle: chatName,
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
  }, [chatName, memberIds.length, selectedUsers]);

  const toggleMember = (user: User) => {
    if (user.id === currentUser?.id) return; 
    setSelectedUsers(prev => 
        prev.some(u => u.id === user.id)
            ? prev.filter(u => u.id !== user.id)
            : [...prev, user]
    );
  };
  
  const handleCreate = () => {
    form.trigger().then(isValid => {
        if (!isValid) return;

        const values = form.getValues();
        const configuredAutomations: Automation[] = allAutomationSuggestions
            .filter(auto => enabledAutomations[auto.name])
            .map(auto => ({ ...auto, enabled: true }));
        
        onCreateChat({
            name: values.name,
            description: suggestions?.descriptionSuggestion || '',
            members: values.members,
            isPublic: true, // For now, all created chats are public groups
            isDM: false,
            ownerId: currentUser.id,
            automations: configuredAutomations,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });
    });
  };

  const displayedSearchResults = useMemo(() => {
    if (!searchedUsers) return [];
    return searchedUsers.filter(u => u.id !== currentUser?.id);
  }, [searchedUsers, currentUser]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline">Create New Chat</DialogTitle>
          <DialogDescription>
            Create a public channel or a private group message.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            {/* Left side: Member selection and chat name */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chat Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. #project-phoenix" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem>
                <FormLabel>Members</FormLabel>
                <div className='flex flex-wrap gap-2 p-2 border rounded-md min-h-12'>
                    {selectedUsers.map(u => (
                        <Badge key={u.id} variant="secondary" className='p-1 pr-2'>
                           <UserAvatar src={u.avatarUrl} name={u.fullName || ''} className='size-5 mr-1'/>
                           {u.fullName}
                           {u.id !== currentUser.id && (
                             <button onClick={() => toggleMember(u)} className='ml-1 rounded-full hover:bg-destructive/20 p-0.5'>
                               <XIcon className='size-3'/>
                             </button>
                           )}
                        </Badge>
                    ))}
                </div>
                <FormMessage>{form.formState.errors.members?.message}</FormMessage>
              </FormItem>

              <FormItem>
                <FormLabel>Add People</FormLabel>
                <Input
                    placeholder="Search by name or user code..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
                <ScrollArea className="h-40 border rounded-md">
                     <div className="p-2">
                        {isLoadingUsers && <div className="flex justify-center p-4"><Loader2 className="size-5 animate-spin" /></div>}
                        {!isLoadingUsers && debouncedSearchTerm && displayedSearchResults.length === 0 && <p className='text-center text-sm text-muted-foreground p-4'>No users found.</p>}
                        {!isLoadingUsers && !debouncedSearchTerm && (
                            <div className='flex flex-col items-center justify-center text-center text-sm text-muted-foreground p-4 h-full'>
                                <Info className='size-5 mb-2'/>
                                <p>Start typing to add people to your chat.</p>
                            </div>
                        )}
                        {displayedSearchResults.map(u => (
                             <Button
                                type="button"
                                key={u.id}
                                variant={selectedUsers.some(su => su.id === u.id) ? 'default' : 'ghost'}
                                className="w-full justify-start h-auto p-2"
                                onClick={() => toggleMember(u)}
                            >
                                <UserAvatar src={u.avatarUrl} name={u.fullName || 'User'} className="mr-2" />
                                <div>
                                    <p>{u.fullName}</p>
                                    <p className='text-xs text-muted-foreground text-left'>{u.userCode}</p>
                                </div>
                            </Button>
                        ))}
                    </div>
                </ScrollArea>
              </FormItem>
            </div>

            {/* Right side: AI suggestions */}
            <div className="space-y-4">
              <FormLabel className='flex items-center gap-2'>
                <Wand2 className="size-4 text-primary" />
                AI Assistant
              </FormLabel>
              <div className='border rounded-lg p-4 space-y-4 min-h-[340px]'>
                {isLoadingSuggestions && <div className="flex justify-center items-center h-full"><Loader2 className="size-6 animate-spin"/></div>}
                {!isLoadingSuggestions && !suggestions && (
                    <div className='flex flex-col items-center justify-center text-center text-sm text-muted-foreground h-full'>
                        <p>Give your chat a name and add some members to get AI-powered suggestions.</p>
                    </div>
                )}
                {suggestions && (
                    <>
                        <div>
                            <Label>Suggested Description</Label>
                            <p className='text-sm text-muted-foreground'>{suggestions.descriptionSuggestion}</p>
                        </div>
                        <div>
                            <Label>Suggested Automations</Label>
                            <div className='space-y-3 mt-2'>
                                {allAutomationSuggestions
                                 .filter(sugg => suggestions.automationSuggestions.includes(sugg.name))
                                 .map(sugg => (
                                    <div key={sugg.id} className='flex items-center justify-between'>
                                        <Label htmlFor={sugg.id} className='text-sm font-normal'>{sugg.name}</Label>
                                        <Switch
                                            id={sugg.id}
                                            checked={enabledAutomations[sugg.name] ?? false}
                                            onCheckedChange={(checked) => setEnabledAutomations(prev => ({...prev, [sugg.name]: checked}))}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
              </div>
            </div>

            <DialogFooter className="md:col-span-2 mt-4">
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="button" onClick={handleCreate}>Create Chat</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}