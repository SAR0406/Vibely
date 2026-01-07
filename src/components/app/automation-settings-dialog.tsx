'use client';

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Channel, Automation, User } from '@/lib/types';
import { enableAdjustAutomations } from '@/ai/flows/enable-adjust-automations';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';


type AutomationSettingsDialogProps = {
  channel: Channel | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAutomationsUpdate: (channelId: string, updatedAutomations: Automation[]) => void;
};

export function AutomationSettingsDialog({
  channel,
  isOpen,
  onOpenChange,
  onAutomationsUpdate,
}: AutomationSettingsDialogProps) {
  const [automations, setAutomations] = useState<Automation[]>(
    channel?.automations || []
  );
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();
  
  const channelUsersQuery = useMemoFirebase(() => {
    // Only run query if we have a channel with members
    if (!firestore || !channel || channel.members.length === 0) return null;
    
    // Fetch documents for users who are members of the channel
    // Firestore 'in' queries are limited to 30 items. 
    // If a channel can have more members, this would need pagination or a different approach.
    return query(collection(firestore, 'users'), where('id', 'in', channel.members));
  }, [firestore, channel]);

  const { data: channelUsers } = useCollection<User>(channelUsersQuery);

  if (!channel) return null;

  const handleSwitchChange = (automationId: string, checked: boolean) => {
    setAutomations((prev) =>
      prev.map((auto) =>
        auto.id === automationId ? { ...auto, enabled: checked } : auto
      )
    );
  };

  const handleContentChange = (automationId: string, content: string) => {
    setAutomations((prev) =>
      prev.map((auto) =>
        auto.id === automationId ? { ...auto, content } : auto
      )
    );
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const automationSettings = automations.reduce((acc, auto) => {
        acc[auto.name] = auto.enabled;
        return acc;
      }, {} as Record<string, boolean>);

      const automationAdjustments = automations.reduce((acc, auto) => {
        acc[auto.name] = auto.content;
        return acc;
      }, {} as Record<string, string>);

      const memberList = channelUsers?.map(u => u.fullName || 'User') || [];

      await enableAdjustAutomations({
        channelName: channel.name,
        channelDescription: channel.description,
        memberList,
        automationSettings,
        automationAdjustments,
      });

      onAutomationsUpdate(channel.id, automations);

      toast({
        title: 'Success!',
        description: 'Automation settings have been saved.',
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save automations:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save automation settings. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">
            Automation Settings for "{channel.name}"
          </DialogTitle>
          <DialogDescription>
            Enable and configure automations for this channel.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {automations.map((automation) => (
            <div key={automation.id} className="space-y-4 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor={`switch-${automation.id}`} className="font-bold">
                    {automation.name}
                  </Label>
                  <p className="text-sm text-muted-foreground">{automation.description}</p>
                </div>
                <Switch
                  id={`switch-${automation.id}`}
                  checked={automation.enabled}
                  onCheckedChange={(checked) => handleSwitchChange(automation.id, checked)}
                />
              </div>
              {automation.enabled && (
                <div className="space-y-2">
                  <Label htmlFor={`content-${automation.id}`}>Content</Label>
                  <Textarea
                    id={`content-${automation.id}`}
                    value={automation.content}
                    onChange={(e) => handleContentChange(automation.id, e.target.value)}
                    placeholder="Enter the automation message..."
                    className="h-24"
                  />
                </div>
              )}
            </div>
          ))}
          {automations.length === 0 && (
            <p className="text-center text-muted-foreground">
              No automations available for this channel yet.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveChanges} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
