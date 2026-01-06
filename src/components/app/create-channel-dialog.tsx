'use client';

import { useEffect, useState } from 'react';
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
import { Wand2, Loader2 } from 'lucide-react';
import {
  getChannelAssistantSuggestions,
  ChannelAssistantOutput,
} from '@/ai/flows/channel-assistant-suggestions';
import { users } from '@/lib/data';
import { UserAvatar } from './user-avatar';
import { Channel } from '@/lib/types';

const formSchema = z.object({
  name: z.string().min(3, 'Channel name must be at least 3 characters.'),
  members: z.array(z.string()).min(1, 'Select at least one member.'),
});

type CreateChannelDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onCreateChannel: (channel: Channel) => void;
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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      members: ['user-5'], // Default to including 'You'
    },
  });

  const channelName = form.watch('name');
  const selectedMembers = form.watch('members');

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (channelName.length < 3) {
        setSuggestions(null);
        return;
      }
      setIsLoadingSuggestions(true);
      try {
        const result = await getChannelAssistantSuggestions({
          channelTitle: channelName,
          memberList: selectedMembers.map(id => users.find(u => u.id === id)?.name || 'user'),
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
  }, [channelName, selectedMembers]);

  const toggleMember = (memberId: string) => {
    if (memberId === 'user-5') return; // 'You' cannot be removed
    const currentMembers = form.getValues('members');
    const newMembers = currentMembers.includes(memberId)
      ? currentMembers.filter((id) => id !== memberId)
      : [...currentMembers, memberId];
    form.setValue('members', newMembers, { shouldValidate: true });
  };
  
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const newChannel: Channel = {
        id: `channel-${Date.now()}`,
        name: values.name,
        description: suggestions?.descriptionSuggestion || `A channel for ${values.name}`,
        members: values.members,
        type: 'private',
        automations: allAutomationSuggestions
            .filter(auto => enabledAutomations[auto.name])
            .map(auto => ({
                id: `auto-${Date.now()}-${auto.name}`,
                name: auto.name,
                description: auto.description,
                enabled: true,
                content: auto.defaultContent,
            }))
    };
    onCreateChannel(newChannel);
    onOpenChange(false);
    form.reset();
    setSuggestions(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline">Create a New Channel</DialogTitle>
          <DialogDescription>
            Name your channel and invite members to start collaborating.
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
                    <FormLabel>Channel Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Q4-Launch-Plan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem>
                <FormLabel>Members</FormLabel>
                <div className="flex flex-wrap gap-2 rounded-md border p-4">
                  {users.map(user => (
                    <button type="button" key={user.id} onClick={() => toggleMember(user.id)} disabled={user.id === 'user-5'}>
                      <Badge variant={selectedMembers.includes(user.id) ? 'default' : 'secondary'} className="cursor-pointer">
                        <UserAvatar src={user.avatarUrl} name={user.name} className="size-4 mr-2" />
                        {user.name}
                      </Badge>
                    </button>
                  ))}
                </div>
                <FormMessage>{form.formState.errors.members?.message}</FormMessage>
              </FormItem>
            </div>
            
            <div className="space-y-4 rounded-lg bg-accent/50 p-4 border border-dashed">
                <div className="flex items-center gap-2">
                    <Wand2 className="size-5 text-primary"/>
                    <h3 className="font-headline text-lg font-semibold">AI Assistant</h3>
                    {isLoadingSuggestions && <Loader2 className="size-4 animate-spin"/>}
                </div>

                {suggestions ? (
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
                        {channelName.length < 3 ? 'Enter a channel name to get AI suggestions.' : 'Generating suggestions...'}
                    </p>
                )}
            </div>

            <DialogFooter className="col-span-1 md:col-span-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">Create Channel</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
