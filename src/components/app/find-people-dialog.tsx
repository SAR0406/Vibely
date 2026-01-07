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
import { Chat, User } from '@/lib/types';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
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
  name: z.string().optional(),
  members: z.array(z.string()).min(1, 'Select at least one member.'),
});

type FindPeopleDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onCreateChat: (chat: Omit<Chat, 'id'>) => void;
  onSelectUser: (user: User) => void;
  currentUser: User;
};

const allAutomationSuggestions = [
    { name: 'Welcome Message', description: 'Sends a welcome message to new members.', defaultContent: 'Welcome, {{user}}!' },
    { name: 'Scheduled Event Invite', description: 'Sends invites for scheduled events.', defaultContent: 'Event reminder: {{eventName}} at {{time}}' },
    { name: 'Ice Breaker', description: 'Prompts users with an ice breaker question.', defaultContent: 'What\'s your favorite weekend activity?' },
];

export function FindPeopleDialog({
  isOpen,
  onOpenChange,
  onCreateChat,
  onSelectUser,
  currentUser,
}: FindPeopleDialogProps) {
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
      if (!chatName || chatName.length < 3 || memberIds.length <= 2) {
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

  const toggleMember = (member: User) => {
    if (member.id === currentUser?.id) return; 
    setSelectedUsers(prev => 
        prev.some(u => u.id === member.id)
            ? prev.filter(u => u.id !== member.id)
            : [...prev, member]
    );
  };
  
  const handleCreate = () => {
    if(!currentUser) return;
    const values = form.getValues();

    const isDM = values.members.length === 1;

    if (!isDM) {
        form.setError("root", { type: "manual", message: "Group chats are not supported yet. Please select only one person to start a DM." });
        return;
    }

    const otherUser = selectedUsers.find(u => u.id !== currentUser.id);
    if(otherUser) {
        onSelectUser(otherUser);
    }
  };

  const displayedSearchResults = useMemo(() => {
    if (!searchedUsers) return [];
    return searchedUsers.filter(u => u.id !== currentUser?.id);
  }, [searchedUsers, currentUser]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">Find People</DialogTitle>
          <DialogDescription>
            Search for users by their name or user code to start a conversation.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4 py-4">
              <FormItem>
                <FormLabel>Search</FormLabel>
                <Input
                    placeholder="Search by name or user code..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
              </FormItem>

              <FormItem>
                <FormLabel>Results</FormLabel>
                <ScrollArea className="h-64 border rounded-md">
                     <div className="p-2">
                        {isLoadingUsers && <div className="flex justify-center p-4"><Loader2 className="size-5 animate-spin" /></div>}
                        {!isLoadingUsers && debouncedSearchTerm && displayedSearchResults.length === 0 && <p className='text-center text-sm text-muted-foreground p-4'>No users found.</p>}
                        {!isLoadingUsers && !debouncedSearchTerm && (
                            <div className='flex flex-col items-center justify-center text-center text-sm text-muted-foreground p-4 h-full'>
                                <Info className='size-5 mb-2'/>
                                <p>Start typing to search for people you want to chat with.</p>
                            </div>
                        )}
                        {displayedSearchResults.map(u => (
                            <Button
                                type="button"
                                key={u.id}
                                variant={'ghost'}
                                className="w-full justify-start h-auto p-2"
                                onClick={() => onSelectUser(u)}
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
                <FormMessage>{form.formState.errors.members?.message}</FormMessage>
              </FormItem>
            <DialogFooter className="md:col-span-2 mt-4">
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Close</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

    